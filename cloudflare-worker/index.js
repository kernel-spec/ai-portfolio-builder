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

function error(status, message) {
  return json({ error: message }, status);
}

async function callOpenAI(systemPrompt, userInput, env) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI call failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
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
        lock_version: lock.version,
        prompts_count: Object.keys(lock.prompts).length,
        immutable: lock.integrity?.immutable === true
      });
    }

    if (url.pathname !== "/dispatch") {
      return error(404, "Not found");
    }

    if (request.method !== "POST") {
      return error(405, "Method not allowed");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error(400, "Malformed JSON");
    }

    const { agent_id, request_payload } = body;

    if (!agent_id || !request_payload) {
      return error(400, "agent_id and request_payload required");
    }

    const agent = lock.prompts[agent_id];

    if (!agent) {
      return json({
        error: "Unknown agent_id",
        security_flag: true
      }, 403);
    }

    // Load canonical prompt from repo path
    const promptResponse = await fetch(
      new URL(`../${agent.file}`, import.meta.url)
    );

    const systemPrompt = await promptResponse.text();

    let aiOutput;

    try {
      aiOutput = await callOpenAI(systemPrompt, request_payload, env);
    } catch {
      return error(500, "Upstream AI failure");
    }

    return json({
      success: true,
      verified: true,
      dispatch_id: crypto.randomUUID(),
      agent: {
        agent_id,
        version: agent.version,
        hash: agent.hash,
        type: agent.type
      },
      output: aiOutput,
      governance: {
        lock_version: lock.version,
        immutable: lock.integrity?.immutable
      },
      timestamp: new Date().toISOString()
    });
  }
};