import lock from './prompt-lock.json';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        service: "prompt-dispatcher",
        version: "1.1.0",
        prompts_count: Object.keys(lock.prompts).length
      });
    }

    if (url.pathname === "/dispatch" && request.method === "POST") {
      const body = await request.json();
      const { agent_id, request_payload } = body;

      if (!agent_id || !request_payload) {
        return new Response("Invalid request", { status: 400 });
      }

      const agent = lock.prompts[agent_id];

      if (!agent) {
        return new Response("unknown_agent", { status: 403 });
      }

      // Runtime attestation
      const hash = agent.hash;
      if (!hash) {
        return new Response("verification_failed", { status: 403 });
      }

      // Simulated dispatch result (replace with real dispatch logic)
      return Response.json({
        status: "ok",
        agent_id,
        response: `Agent ${agent_id} executed successfully.`
      });
    }

    return new Response("Not found", { status: 404 });
  }
};