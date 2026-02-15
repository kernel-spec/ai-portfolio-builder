/**
 * Cloudflare Worker: Prompt Dispatcher with Strict Fail-Closed Enforcement
 */

import promptLock from './prompt-lock.json';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ---------------------------
    // HEALTH ENDPOINT
    // ---------------------------
    if (request.method === 'GET' && url.pathname === '/health') {
      return handleHealthCheck();
    }

    // ---------------------------
    // MANIFEST ENDPOINT (NEW)
    // ---------------------------
    if (request.method === 'GET' && url.pathname === '/manifest') {
      return jsonResponse({
        version: promptLock.version,
        lockfileVersion: promptLock.lockfileVersion,
        algorithm: promptLock.algorithm,
        prompts: promptLock.prompts,
        integrity: promptLock.integrity,
        timestamp: new Date().toISOString(),
      }, 200);
    }

    // ---------------------------
    // ENFORCE POST FOR DISPATCH
    // ---------------------------
    if (request.method !== 'POST') {
      return jsonResponse(
        { error: 'Method not allowed. Use POST.' },
        405
      );
    }

    // -------- STRICT JSON PARSING --------
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: 'Invalid JSON body.' },
        400
      );
    }

    // Ensure body is object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse(
        { error: 'Invalid request body structure.' },
        400
      );
    }

    // -------- VALIDATION --------
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

    // -------- HASH VERIFICATION --------
    const hashCheck = verifyPromptHash(body.agent_id, body.prompt_hash);
    if (!hashCheck.valid) {
      return jsonResponse(
        {
          error: `Hash verification failed for agent_id: ${body.agent_id}`,
          security_flag: true,
          details: hashCheck.details || {},
        },
        403
      );
    }

    // -------- SUCCESS --------
    const dispatchId = body.request_id || crypto.randomUUID();

    console.log(
      JSON.stringify({
        event: 'dispatch_verified',
        agent_id: body.agent_id,
        dispatch_id: dispatchId,
        timestamp: new Date().toISOString(),
      })
    );

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
        timestamp: new Date().toISOString(),
      },
      200
    );
  },
};

// ---------------------------
// HELPERS
// ---------------------------

function jsonResponse(payload, status) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    }
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
      details: { reason: 'unknown_agent' }
    };
  }

  if (agent.hash !== promptHash) {
    return {
      valid: false,
      details: {
        reason: 'hash_mismatch',
        expected_hash: agent.hash,
        received_hash: promptHash
      }
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

function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'prompt-dispatcher',
      version: '1.1.0',
      lock_file_version: promptLock.version,
      prompts_count: Object.keys(promptLock.prompts || {}).length,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: JSON_HEADERS,
    }
  );
}