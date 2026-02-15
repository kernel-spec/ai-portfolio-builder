/**
 * Cloudflare Worker: Governed Prompt Dispatcher
 * Enterprise-grade runtime hash verification (fail-closed)
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
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health endpoint
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return handleHealthCheck();
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
    }

    // Strict JSON parsing
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return jsonResponse(
        { error: 'Invalid request.', details: validation.errors },
        400
      );
    }

    // -------- LOCK REGISTRY CHECK --------
    const lockEntry = promptLock.prompts?.[body.agent_id];
    if (!lockEntry) {
      return jsonResponse(
        {
          error: `Unknown agent_id: ${body.agent_id}`,
          security_flag: true,
        },
        403
      );
    }

    if (lockEntry.hash !== body.prompt_hash) {
      return jsonResponse(
        {
          error: 'Hash mismatch against lock registry.',
          security_flag: true,
        },
        403
      );
    }

    // -------- RUNTIME FILE LOAD --------
    const promptText = await loadPromptFile(lockEntry.file);
    if (!promptText) {
      return jsonResponse(
        {
          error: 'Prompt file missing.',
          security_flag: true,
        },
        500
      );
    }

    // -------- RUNTIME HASH VERIFICATION --------
    const runtimeHash = await sha256(promptText);
    if (runtimeHash !== lockEntry.hash) {
      return jsonResponse(
        {
          error: 'Runtime hash mismatch. File integrity compromised.',
          security_flag: true,
        },
        403
      );
    }

    // -------- OPENAI CALL --------
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: promptText },
          { role: 'user', content: body.user_input },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      return jsonResponse(
        { error: 'OpenAI request failed.' },
        502
      );
    }

    const result = await openaiResponse.json();

    return jsonResponse(
      {
        success: true,
        agent: {
          id: body.agent_id,
          type: lockEntry.type,
          version: lockEntry.version,
        },
        output: result.choices?.[0]?.message?.content ?? null,
        timestamp: new Date().toISOString(),
      },
      200
    );
  },
};

// =============================
// HELPERS
// =============================

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

  if (!body.user_input || typeof body.user_input !== 'string') {
    errors.push('Missing or invalid user_input.');
  }

  if (body.prompt_hash && !/^[a-f0-9]{64}$/.test(body.prompt_hash)) {
    errors.push('prompt_hash must be SHA-256 hex (64 chars).');
  }

  return { valid: errors.length === 0, errors };
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadPromptFile(path) {
  try {
    const url = new URL(path, import.meta.url);
    const response = await fetch(url);
    return await response.text();
  } catch {
    return null;
  }
}

function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'governed-prompt-dispatcher',
      version: '2.0.0',
      lock_version: promptLock.version,
      prompts_registered: Object.keys(promptLock.prompts || {}).length,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: JSON_HEADERS,
    }
  );
}