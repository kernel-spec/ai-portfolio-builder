import lockfile from "./prompt-lock.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        service: "prompt-dispatcher",
        version: "1.1.0",
        lock_file_version: lockfile.version,
        prompts_count: Object.keys(lockfile.prompts).length,
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/dispatch") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      const { agent_id, request_payload } = body;

      if (!agent_id || !request_payload) {
        return new Response("Missing required fields", { status: 400 });
      }

      const agent = lockfile.prompts[agent_id];

      if (!agent) {
        return new Response("Unknown agent", { status: 403 });
      }

      const systemPrompt = agent.system_prompt;

      const openaiResponse = await callOpenAI(systemPrompt, request_payload, env);

      return new Response(JSON.stringify({
        response: openaiResponse
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};