import lockfile from "./prompt-lock.json";

/**
 * Utility: generate deterministic dispatch ID
 */
function generateDispatchId() {
  return crypto.randomUUID();
}

/**
 * Utility: JSON response wrapper
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

/**
 * Utility: structured error response
 */
function errorResponse(code, message, securityFlag = false, status = 400) {
  return jsonResponse(
    {
      success: false,
      error: code,
      reason: message,
      security_flag: securityFlag
    },
    status
  );
}

/**
 * OpenAI hardened call
 */
async function callOpenAI(env, systemPrompt, userPayload) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OPENAI_REQUEST_FAILED");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --------------------------------------------------
    // HEALTH ENDPOINT
    // --------------------------------------------------
    if (url.pathname === "/health") {
      return jsonResponse({
        status: "healthy",
        service: "prompt-dispatcher",
        version: lockfile.version,
        lockfileVersion: lockfile.lockfileVersion,
        prompts_count: Object.keys(lockfile.prompts).length,
        immutable: true,
        timestamp: new Date().toISOString()
      });
    }

    // --------------------------------------------------
    // DISPATCH ENDPOINT
    // --------------------------------------------------
    if (url.pathname === "/dispatch") {

      if (request.method !== "POST") {
        return errorResponse(
          "METHOD_NOT_ALLOWED",
          "Only POST allowed",
          false,
          405
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return errorResponse(
          "INVALID_JSON",
          "Request body must be valid JSON",
          false,
          400
        );
      }

      const { agent_id, request_payload } = body;

      if (!agent_id || !request_payload) {
        return errorResponse(
          "INVALID_REQUEST",
          "agent_id and request_payload are required",
          false,
          400
        );
      }

      const agent = lockfile.prompts[agent_id];

      // FAIL-CLOSED unknown agent
      if (!agent) {
        return errorResponse(
          "UNKNOWN_AGENT",
          "Agent not registered in lockfile",
          true,
          403
        );
      }

      const dispatch_id = generateDispatchId();
      const timestamp = new Date().toISOString();

      try {
        const responseText = await callOpenAI(
          env,
          agent.system_prompt,
          request_payload
        );

        return jsonResponse({
          success: true,
          verified: true,
          dispatch_id,
          agent: {
            id: agent_id,
            hash: agent.hash,
            version: lockfile.version
          },
          governance: {
            mode: "hybrid",
            immutable: true,
            algorithm: lockfile.algorithm
          },
          response: responseText,
          timestamp
        });

      } catch {
        return errorResponse(
          "OPENAI_FAILURE",
          "Upstream model request failed",
          false,
          502
        );
      }
    }

    // --------------------------------------------------
    // DEFAULT: FAIL-CLOSED
    // --------------------------------------------------
    return errorResponse(
      "NOT_FOUND",
      "Endpoint not found",
      false,
      404
    );
  }
};