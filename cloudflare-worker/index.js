/**
 * Cloudflare Worker: Prompt Dispatcher with Hash Verification
 * 
 * This worker enforces governance by verifying prompt integrity before dispatch.
 * All requests must include valid agent IDs and prompt hashes that match the lock file.
 */

import promptLock from './prompt-lock.json';

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // CORS headers for browser requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json();
      
      // Validate request structure
      const validation = validateRequest(body);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid request', 
            details: validation.errors 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify prompt hash
      const hashCheck = verifyPromptHash(body.agent_id, body.prompt_hash);
      if (!hashCheck.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Hash verification failed', 
            details: hashCheck.error,
            security_flag: true
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log dispatch for audit trail
      const dispatchLog = {
        timestamp: new Date().toISOString(),
        agent_id: body.agent_id,
        prompt_hash: body.prompt_hash,
        verified: true,
        request_id: body.request_id || crypto.randomUUID(),
      };

      console.log('Prompt dispatch verified:', JSON.stringify(dispatchLog));

      // Return successful verification response
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          agent: {
            agent_id: body.agent_id,
            type: hashCheck.agent.type,
            version: hashCheck.agent.version,
            hash: body.prompt_hash,
          },
          dispatch_id: dispatchLog.request_id,
          timestamp: dispatchLog.timestamp,
          message: 'Prompt integrity verified. Ready for dispatch.',
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      console.error('Dispatch error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

/**
 * Validate request structure
 */
function validateRequest(body) {
  const errors = [];

  if (!body.agent_id) {
    errors.push('Missing required field: agent_id');
  }

  if (!body.prompt_hash) {
    errors.push('Missing required field: prompt_hash');
  }

  if (body.prompt_hash && !/^[a-f0-9]{64}$/.test(body.prompt_hash)) {
    errors.push('Invalid prompt_hash format. Must be SHA-256 hex string (64 characters).');
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
  // Check if agent exists in lock file
  const agent = promptLock.prompts[agentId];
  
  if (!agent) {
    return {
      valid: false,
      error: `Agent ID '${agentId}' not found in prompt lock file. Valid agents must be defined in the canonical manifest.`,
    };
  }

  // Verify hash matches
  if (agent.hash !== promptHash) {
    return {
      valid: false,
      error: `Hash mismatch for agent '${agentId}'. Expected: ${agent.hash}, Received: ${promptHash}. This indicates potential tampering or outdated prompt.`,
      expected_hash: agent.hash,
      received_hash: promptHash,
    };
  }

  // Hash verified successfully
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
 * Health check endpoint (for monitoring)
 */
export async function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'prompt-dispatcher',
      version: '1.0.0',
      lock_file_version: promptLock.version,
      prompts_count: Object.keys(promptLock.prompts).length,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
