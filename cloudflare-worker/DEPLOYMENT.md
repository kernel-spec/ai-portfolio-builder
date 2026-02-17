# Cloudflare Worker Deployment Guide (v1.1.1)

## Breaking Changes from v1.0.0

⚠️ **API Changes:**
- Health endpoint field renamed: `lock_version` → `lock_file_version`
- Update any clients consuming the `/health` endpoint

## Production Requirements

### Environment Variables

Configure the following in your Cloudflare Worker dashboard:

#### 1. OPENAI_MODEL (Set in wrangler.toml)
```toml
[vars]
OPENAI_MODEL = "gpt-4o-mini"
```

#### 2. OPENAI_API_KEY (Secret - Configure in Dashboard)

**IMPORTANT:** This is a secret and must NEVER be committed to the repository.

To set this up:

1. Go to Cloudflare Dashboard
2. Navigate to: Workers → Your Worker → Settings → Variables
3. Click "Add Variable"
4. Add secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - **Check "Encrypt"** to make it a secret

Alternatively, use Wrangler CLI:
```bash
wrangler secret put OPENAI_API_KEY
# Enter your API key when prompted
```

### Deployment

```bash
cd cloudflare-worker
wrangler deploy
```

### API Endpoints

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "prompt-dispatcher",
  "version": "1.1.1",
  "lock_file_version": "1.1.0",
  "prompts_count": 14,
  "immutable": true
}
```

#### POST /dispatch
Dispatch an agent with OpenAI execution

**Request:**
```json
{
  "agent_id": "domain-01-content",
  "request_payload": {
    "task": "Your task description"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "dispatch_id": "uuid",
  "agent": {
    "agent_id": "domain-01-content",
    "version": "1.0.0",
    "hash": "5b469f18...",
    "type": "domain"
  },
  "ai_execution": {
    "model": "gpt-4o-mini",
    "usage": {
      "prompt_tokens": 123,
      "completion_tokens": 456,
      "total_tokens": 579
    },
    "output": "AI response..."
  },
  "governance": {
    "lock_version": "1.1.0",
    "immutable": true
  },
  "timestamp": "2026-02-17T14:42:00Z"
}
```

**Error Responses:**
- `400` - Malformed request, invalid Content-Type, missing fields
- `403` - Unknown agent_id (security flag raised)
- `500` - Missing canonical hash, failed to load prompt, or OpenAI failure

### Security Features

- ✅ Strict Content-Type validation (must be application/json)
- ✅ Fail-closed validation (rejects non-object JSON)
- ✅ Unknown agent detection (403 with security_flag)
- ✅ Canonical hash verification (500 if missing)
- ✅ Deterministic /health endpoint
- ✅ No console.log, eval, or dynamic fetch
- ✅ Structured error responses

### Governance

The worker enforces immutable prompt integrity:
- All prompts loaded from canonical lockfile
- Hash verification on every dispatch
- CI validates hash integrity before deployment
- No runtime modifications possible

## Testing

```bash
npm test
```

Note: Tests require Node.js with native test support (v18+).
