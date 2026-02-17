import lock from './prompt-lock.json' with { type: 'json' };

const SERVICE_VERSION = "2.0.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function error(status, message, details = null) {
  const response = { error: message };
  if (details) {
    response.details = details;
  }
  return json(response, status);
}

function isValidSHA256(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    if (url.pathname === "/health") {
      return json({
        status: "healthy",
        service: "prompt-dispatcher",
        version: SERVICE_VERSION,
        lock_file_version: lock.version,
        lockfile_version: lock.lockfileVersion,
        prompts_count: Object.keys(lock.prompts).length,
        immutable: lock.integrity?.immutable === true
      });
    }

    if (url.pathname !== "/" && url.pathname !== "/dispatch") {
      return error(404, "Not found");
    }

    if (request.method !== "POST") {
      return error(405, "Method not allowed");
    }

    // Strict content-type validation
    const contentType = request.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return error(400, "Content-Type must be application/json");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error(400, "Invalid JSON body");
    }

    // Fail on non-object request bodies
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return error(400, "Invalid request body structure");
    }

    const { agent_id, prompt_hash } = body;

    // Validate required fields
    const validationErrors = [];
    if (!agent_id) {
      validationErrors.push("Missing required field: agent_id");
    }
    if (!prompt_hash) {
      validationErrors.push("Missing required field: prompt_hash");
    }

    if (validationErrors.length > 0) {
      return error(400, "Invalid request", validationErrors);
    }

    // Validate hash format
    if (!isValidSHA256(prompt_hash)) {
      return error(400, "Invalid request", [
        "Invalid prompt_hash format. Must be SHA-256 hex string (64 characters)."
      ]);
    }

    const agent = lock.prompts[agent_id];

    // Reject unknown agent_id (403)
    if (!agent) {
      return json({
        error: `Hash verification failed for agent '${agent_id}'`,
        details: {
          reason: "unknown_agent"
        },
        security_flag: true
      }, 403);
    }

    // Reject missing canonical hash (500)
    if (!agent.hash) {
      return error(500, "Canonical hash missing for agent");
    }

    // Verify hash matches
    if (agent.hash !== prompt_hash) {
      return json({
        error: `Hash verification failed for agent '${agent_id}'`,
        details: {
          reason: "hash_mismatch",
          expected_hash: agent.hash,
          received_hash: prompt_hash
        },
        security_flag: true
      }, 403);
    }

    // Success response with exact structure
    return json({
      success: true,
      verified: true,
      message: "Prompt integrity verified. Ready for dispatch.",
      dispatch_id: crypto.randomUUID(),
      agent: {
        agent_id,
        type: agent.type,
        version: agent.version,
        hash: agent.hash
      },
      governance: {
        lock_version: lock.version,
        immutable: lock.integrity?.immutable === true
      },
      timestamp: new Date().toISOString()
    });
  }
};