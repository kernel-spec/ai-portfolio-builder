import lock from "./prompt-lock.json" with { type: "json" };

const OPENAI_API_KEY = globalThis.OPENAI_API_KEY;
const SERVICE_VERSION = "1.2.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    // HEALTH
    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        status: "healthy",
        service: "governance-gateway",
        version: SERVICE_VERSION,
        lock_version: lock.version,
        immutable: lock.integrity?.immutable === true,
        prompts_count: Object.keys(lock.prompts).length
      });
    }

    // DISPATCH
    if (url.pathname === "/dispatch") {
      if (request.method !== "POST") {
        return error(405, "Method not allowed");
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return error(400, "Invalid JSON");
      }

      const { agent_id, request_payload } = body;

      if (!agent_id || typeof agent_id !== "string") {
        return error(400, "Invalid agent_id");
      }

      if (!request_payload || typeof request_payload !== "string") {
        return error(400, "request_payload must be string");
      }

      const agent = lock.prompts[agent_id];
      if (!agent) {
        return json(
          {
            error: "Unknown agent",
            security_flag: true
          },
          403
        );
      }

      if (!lock.integrity?.immutable) {
        return json(
          {
            error: "Lockfile integrity violation",
            security_flag: true
          },
          500
        );
      }

      const dispatchId = crypto.randomUUID();

      // 🔐 Canonical system prompt injection
      const systemPrompt = agent.system_prompt;

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: agent.model || "gpt-4o-mini",
            temperature: agent.temperature ?? 0.2,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: request_payload }
            ]
          })
        }
      );

      if (!openaiResponse.ok) {
        return error(502, "Upstream model error");
      }

      const result = await openaiResponse.json();

      return json({
        success: true,
        dispatch_id: dispatchId,
        agent_id,
        model: result.model,
        usage: result.usage,
        response: result.choices?.[0]?.message?.content,
        timestamp: new Date().toISOString()
      });
    }

    return error(404, "Not found");
  }
};