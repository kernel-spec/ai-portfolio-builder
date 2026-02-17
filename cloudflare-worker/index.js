import lock from './prompt-lock.json' with { type: 'json' };

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Helper to create JSON response with CORS headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

// Validate SHA-256 hash format
function isValidSHA256(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
}

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Get ISO 8601 timestamp
function getTimestamp() {
  return new Date().toISOString();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle OPTIONS for CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      return jsonResponse({
        status: 'healthy',
        service: 'prompt-dispatcher',
        version: lock.version,
        lock_file_version: lock.version,
        prompts_count: Object.keys(lock.prompts).length
      });
    }

    // Only allow POST to root path
    if (url.pathname === '/' && method === 'POST') {
      let body;

      // Parse JSON body
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({
          error: 'Invalid JSON body',
          details: ['Request body must be valid JSON']
        }, 400);
      }

      // Validate body is an object (not array or primitive)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return jsonResponse({
          error: 'Invalid request body structure',
          details: ['Request body must be a JSON object']
        }, 400);
      }

      // Validate required fields
      const validationErrors = [];
      if (!body.agent_id) {
        validationErrors.push('Missing required field: agent_id');
      }
      if (!body.prompt_hash) {
        validationErrors.push('Missing required field: prompt_hash');
      }

      if (validationErrors.length > 0) {
        return jsonResponse({
          error: 'Invalid request',
          details: validationErrors
        }, 400);
      }

      // Validate hash format
      if (!isValidSHA256(body.prompt_hash)) {
        return jsonResponse({
          error: 'Invalid hash format',
          details: ['prompt_hash must be a valid SHA-256 hash (64 lowercase hexadecimal characters)']
        }, 400);
      }

      const { agent_id, prompt_hash } = body;

      // Check if agent exists
      const agent = lock.prompts[agent_id];
      if (!agent) {
        return jsonResponse({
          error: `Hash verification failed for agent_id ${agent_id}`,
          security_flag: true,
          details: {
            reason: 'unknown_agent'
          }
        }, 403);
      }

      // Verify hash matches
      if (agent.hash !== prompt_hash) {
        return jsonResponse({
          error: `Hash verification failed for agent_id ${agent_id}`,
          security_flag: true,
          details: {
            reason: 'hash_mismatch',
            expected_hash: agent.hash,
            received_hash: prompt_hash
          }
        }, 403);
      }

      // Success - hash verified
      return jsonResponse({
        success: true,
        verified: true,
        message: 'Prompt integrity verified. Ready for dispatch.',
        dispatch_id: generateUUID(),
        agent: {
          agent_id: agent_id,
          type: agent.type,
          version: agent.version,
          hash: agent.hash
        },
        timestamp: getTimestamp()
      }, 200);
    }

    // Method not allowed for root path
    if (url.pathname === '/') {
      return jsonResponse({
        error: 'Method not allowed'
      }, 405);
    }

    // Not found for other paths
    return jsonResponse({
      error: 'Not found'
    }, 404);
  }
};