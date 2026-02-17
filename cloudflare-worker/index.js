import lock from './prompt-lock.json' with { type: 'json' };

const SERVICE_VERSION = "1.1.1";

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

async function callOpenAI(systemPrompt, userPayload, env) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI call failed");
  }

  const data = await response.json();

  return {
    model: data.model,
    usage: data.usage,
    output: data.choices?.[0]?.message?.content || null
  };
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

    // Strict Content-Type validation
    const contentType = request.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return error(400, "Content-Type must be application/json");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error(400, "Malformed JSON");
    }

    // Reject non-object JSON
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return error(400, "Request body must be a JSON object");
    }

    const { agent_id, request_payload } = body;

    if (!agent_id || !request_payload) {
      return error(400, "agent_id and request_payload required");
    }

    const agent = lock.prompts[agent_id];

    // Reject unknown agent_id → 403
    if (!agent) {
      return json({
        error: `Unknown agent_id: ${agent_id}`,
        security_flag: true
      }, 403);
    }

    // Reject missing canonical hash → 500
    if (!agent.hash) {
      return error(500, "Missing canonical hash in lock file");
    }

    // Load canonical prompt from repo path
    const promptResponse = await fetch(
      new URL(`../${agent.file}`, import.meta.url)
    );

    if (!promptResponse.ok) {
      return error(500, "Failed to load canonical prompt");
    }

    const systemPrompt = await promptResponse.text();

    let aiExecution;

    try {
      aiExecution = await callOpenAI(systemPrompt, request_payload, env);
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
      ai_execution: {
        model: aiExecution.model,
        usage: aiExecution.usage,
        output: aiExecution.output
      },
      governance: {
        lock_version: lock.version,
        immutable: lock.integrity?.immutable
      },
      timestamp: new Date().toISOString()
    });
  }
};