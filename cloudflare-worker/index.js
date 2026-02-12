/**
 * Cloudflare Worker: Prompt Dispatcher with Strict Fail-Closed Enforcement
 */

import promptLock from './prompt-lock.json';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health endpoint
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return handleHealthCheck();
    }

    // Enforce POST only
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
          error: 'Hash verification failed.',
          security_flag: true,
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
        dispatch_id: dispatchId,
        agent: {
          agent_id: body.agent_id,
          type: hashCheck.agent.type,
          version: hashCheck.agent.version,
        },
        timestamp: new Date().toISOString(),
      },
      200
    );
  },
};

/**
 * Strict JSON response helper
 */
function jsonResponse(payload, status) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    }
  );
}

/**
 * Validate request schema
 */
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

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify prompt hash against lock file
 */
function verifyPromptHash(agentId, promptHash) {
  const agent = promptLock.prompts?.[agentId];

  if (!agent) {
    return { valid: false };
  }

  if (agent.hash !== promptHash) {
    return { valid: false };
  }

  return {
    valid: true,
    agent: {
      type: agent.type,
      version: agent.version,
      file: agent.file,
    },
  };
}

/**
 * Health endpoint
 */
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'prompt-dispatcher',
      version: '1.0.0',
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