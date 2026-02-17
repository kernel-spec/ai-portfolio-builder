import lockfile from "./prompt-lock.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

      // 🔐 SERVER-SIDE LOCK AUTHORITY
      const agent = lockfile.prompts[agent_id];

      if (!agent) {
        return new Response("Unknown agent", { status: 403 });
      }

      const systemPrompt = agent.system_prompt;

      // 🚫 No client hash usage
      // 🚫 No runtime prompt mutation
      // 🚫 No dynamic fetch

      try {
        const response = await callOpenAI(
          systemPrompt,
          request_payload,
          env
        );

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            dispatch_id: crypto.randomUUID(),
            agent: {
              id: agent_id,
              version: agent.version,
              hash: agent.hash
            },
            governance: {
              lock_version: lockfile.version,
              lockfileVersion: lockfile.lockfileVersion,
              algorithm: lockfile.algorithm
            },
            response,
            timestamp: new Date().toISOString()
          }),
          { headers: { "Content-Type": "application/json" } }
        );

      } catch (err) {
        return new Response("Upstream model failure", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
