import lockfile from "../prompt-lock.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/dispatch") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { agent_id, request_payload } = await request.json();

    if (!agent_id || !request_payload) {
      return new Response("Missing required fields", { status: 400 });
    }

    // 🔐 SERVER-SIDE AUTHORITY
    const agent = lockfile.prompts[agent_id];

    if (!agent) {
      return new Response("Unknown agent", { status: 403 });
    }

    try {
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: agent.system_prompt },
              { role: "user", content: JSON.stringify(request_payload) }
            ]
          })
        }
      );

      const data = await openaiResponse.json();

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
          output: data.choices?.[0]?.message?.content,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (err) {
      return new Response("Model execution failed", { status: 500 });
    }
  }
};
