import lockfile from "./prompt-lock.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ===============================
    // HEALTH ENDPOINT
    // ===============================
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

    // ===============================
    // DISPATCH ENDPOINT
    // ===============================
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

      try {
        const openaiResponse = await callOpenAI(
          systemPrompt,
          request_payload,
          env
        );

        return new Response(JSON.stringify({
          response: openaiResponse
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch {
        return new Response("Integrity failure", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};


// =====================================
// Hardened OpenAI Call
// =====================================

async function callOpenAI(systemPrompt, userPayload, env) {

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) }
      ],
      temperature: 0
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error("Malformed OpenAI response");
  }

  return data.choices[0].message.content;
}