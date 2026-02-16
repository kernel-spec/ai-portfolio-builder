/**
 * Cloudflare Worker: Prompt Dispatcher
 * Version: 1.2.0
 * Mode: Strict Fail-Closed Governance Enforcement
 */

import promptLock from './prompt-lock.json';

// --------------------------------------------------
// HEADERS
// --------------------------------------------------

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --------------------------------------------------
// ENTRYPOINT
// --------------------------------------------------

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;
    const { method } = request;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Route handling
    switch (pathname) {
      case '/health':
        return method === 'GET'
          ? handleHealth()
          : methodNotAllowed();

      case '/manifest':
        return method === 'GET'
          ? handleManifest()
          : methodNotAllowed();

      case '/':
        return method === 'POST'
          ? handleDispatch(request)
          : methodNotAllowed();

      default:
        return jsonResponse(
          { error: 'Not found.' },
          404
        );
    }
  },
};

// --------------------------------------------------
// ROUTE HANDLERS
// --------------------------------------------------

async function handleDispatch(request) {

  // Enforce JSON content-type
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonResponse(
      { error: 'Content-Type must be application/json.' },
      415
    );
  }

  let body;

  // Strict JSON parsing
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: 'Invalid JSON body.' },
      400
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse(
      { error: 'Invalid request body structure.' },
      400
    );
  }

  // Validate schema
  const validation = validateRequest(body);
  if (!validation.valid) {
    return jsonResponse(
      {
        error: 'Invalid request.',
        details: validation.errors,
      },
      400
    );
  }

  // Hash verification
  const hashCheck = verifyPromptHash(body.agent_id, body.prompt_hash);
  if (!hashCheck.valid) {
    return jsonResponse(
      {
        error: `Hash verification failed for agent_id: ${body.agent_id}`,
        security_flag: true,
        details: hashCheck.details,
      },
      403
    );
  }

  const dispatchId = body.request_id || crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Audit log
  console.log(JSON.stringify({
    event: 'dispatch_verified',
    agent_id: body.agent_id,
    dispatch_id: dispatchId,
    timestamp,
  }));

  return jsonResponse(
    {
      success: true,
      verified: true,
      message: 'Prompt integrity verified. Ready for dispatch.',
      dispatch_id: dispatchId,
      agent: {
        agent_id: body.agent_id,
        type: hashCheck.agent.type,
        version: hashCheck.agent.version,
        hash: hashCheck.agent.hash,
      },
      timestamp,
    },
    200
  );
}

function handleManifest() {
  return jsonResponse(
    {
      version: promptLock.version,
      lockfileVersion: promptLock.lockfileVersion,
      algorithm: promptLock.algorithm,
      prompts: promptLock.prompts,
      integrity: promptLock.integrity,
      timestamp: new Date().toISOString(),
    },
    200
  );
}

function handleHealth() {
  return jsonResponse(
    {
      status: 'healthy',
      service: 'prompt-dispatcher',
      version: '1.2.0',
      lock_file_version: promptLock.version,
      prompts_count: Object.keys(promptLock.prompts || {}).length,
      timestamp: new Date().toISOString(),
    },
    200
  );
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS,
    },
  });
}

function methodNotAllowed() {
  return jsonResponse(
    { error: 'Method not allowed.' },
    405
  );
}

function validateRequest(body) {
  const errors = [];

  if (!body.agent_id || typeof body.agent_id !== 'string') {
    errors.push('Missing or invalid agent_id.');
  }

  if (!body.prompt_hash || typeof body.prompt_hash !== 'string') {
    errors.push('Missing or invalid prompt_hash.');
  }

  if (
    body.prompt_hash &&
    !/^[a-f0-9]{64}$/.test(body.prompt_hash)
  ) {
    errors.push('prompt_hash must be SHA-256 hex (64 chars).');
  }

  if (
    body.request_id &&
    typeof body.request_id !== 'string'
  ) {
    errors.push('request_id must be string (UUID recommended).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function verifyPromptHash(agentId, promptHash) {
  const agent = promptLock.prompts?.[agentId];

  if (!agent) {
    return {
      valid: false,
      details: { reason: 'unknown_agent' },
    };
  }

  if (agent.hash !== promptHash) {
    return {
      valid: false,
      details: {
        reason: 'hash_mismatch',
        expected_hash: agent.hash,
        received_hash: promptHash,
      },
    };
  }

  return {
    valid: true,
    agent: {
      type: agent.type,
      version: agent.version,
      file: agent.file,
      hash: agent.hash,
    },
  };
}

// --------------------------------------------------
// NAMED EXPORTS FOR TESTING
// --------------------------------------------------

export {
  handleDispatch,
  verifyPromptHash,
  validateRequest,
  methodNotAllowed
};