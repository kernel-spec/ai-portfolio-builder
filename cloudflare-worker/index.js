/**
 * AI Portfolio Builder — Enterprise Dispatch Worker
 * Compatible with lockfile v1.0.0 structure
 * Hybrid Governance — Hard Attestation
 */

import lockFile from "./prompt-lock.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // -------------------------
    // HEALTH
    // -------------------------
    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        status: "healthy",
        service: "prompt-dispatcher",
        version: "1.1.0",
        lock_file_version: lockFile.version,
        prompts_count: Object.keys(lockFile.prompts).length,
        timestamp: new Date().toISOString()
      });
    }

    // -------------------------
    // DISPATCH
    // -------------------------
    if (url.pathname === "/dispatch" && request.method === "POST") {
      try {
        const body = await request.json();
        const { agent_id, prompt_hash } = body;

        if (!agent_id || !prompt_hash) {
          return error("Missing agent_id or prompt_hash", 400);
        }

        // 1️⃣ Agent existence check
        const agent = lockFile.prompts[agent_id];

        if (!agent) {
          logSecurity("UNKNOWN_AGENT", agent_id);
          return error("unknown_agent", 403);
        }

        // 2️⃣ Hash format validation
        if (!/^[a-f0-9]{64}$/i.test(prompt_hash)) {
          logSecurity("INVALID_HASH_FORMAT", agent_id);
          return error("invalid_hash_format", 400);
        }

        // 3️⃣ Hash comparison (hard enforcement)
        if (agent.hash !== prompt_hash) {
          logSecurity("HASH_MISMATCH", agent_id);
          return error("hash_verification_failed", 403);
        }

        // 4️⃣ Success
        return json({
          success: true,
          attestation: {
            verified: true,
            agent_id,
            version: agent.version,
            timestamp: new Date().toISOString()
          }
        });

      } catch (err) {
        logSecurity("RUNTIME_ERROR", err.message);
        return error("dispatch_failed", 500);
      }
    }

    return error("not_found", 404);
  }
};

// -------------------------
// Helpers
// -------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function error(message, status) {
  return json({ success: false, error: message }, status);
}

function logSecurity(type, detail) {
  console.log(JSON.stringify({
    level: "SECURITY",
    type,
    detail,
    timestamp: new Date().toISOString()
  }));
}