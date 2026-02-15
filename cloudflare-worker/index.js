/**
 * Cloudflare Worker
 * - Prompt Lock Verification (fail-closed)
 * - Secure OpenAI Proxy (/api/chat)
 * - Health endpoint
 */

import promptLock from './prompt-lock.json';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // ---------------- CORS ----------------
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ---------------- HEALTH ----------------
    if (request.method === 'GET' && url.pathname === '/health') {
      return handleHealthCheck();
    }

    // ---------------- CHAT PROXY ----------------
    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleChatProxy(request, env);
    }

    // ---------------- PROMPT DISPATCH ----------------
    if (request.method === 'POST' && url.pathname === '/api/dispatch') {
      return handlePromptDispatch(request);
    }

    return jsonResponse({ error: 'Not found.' }, 404);
  },
};

/* ============================================================
   CHAT PROXY (Custom GPT → Worker → OpenAI)
============================================================ */

async function handleChatProxy(request, env) {
  if (!env.OPENAI_API_KEY) {
    return jsonResponse(
      { error: 'OPENAI_API_KEY not configured.' },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return jsonResponse(
      { error: 'messages array required.' },
      400
    );
  }

  try {
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: body.messages,
          temperature: 0.3,
        }),
      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return jsonResponse(
        {
          error: 'OpenAI request failed.',
          details: data,
        },
        openaiResponse.status
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });

  } catch (err) {
    return jsonResponse(
      { error: 'OpenAI proxy error.' },
      500
    );
  }
}

/* ============================================================
   PROMPT LOCK DISPATCH (Fail-Closed Governance)
============================================================ */

async function handlePromptDispatch(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse(
      { error: 'Invalid request body structure.' },
      400
    );
  }

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
      agent: hashCheck.agent,
      timestamp: new Date().toISOString(),
    },
    200
  );
}

/* ============================================================
   HELPERS
============================================================ */

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });
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

function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'ai-portfolio-backend',
      version: '2.0.0',
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