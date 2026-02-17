# Cloudflare Worker - Prompt Dispatcher

## Overview

This Cloudflare Worker provides runtime verification for prompt integrity in the AI Portfolio Builder system. It validates SHA-256 hashes against the canonical lock file before allowing agent dispatch.

## Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

Install dependencies:

```bash
npm install
```

This will install Wrangler CLI and other required dependencies.

### Verify Installation

Check that Wrangler is installed:

```bash
npx wrangler --version
```

## Development

### Local Development

Run the worker locally:

```bash
npm run dev
```

This starts a local server for testing the worker.

### Testing

Test the worker with a sample request:

```bash
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "domain-01-content",
    "prompt_hash": "5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413"
  }'
```

## Deployment

### Configure Cloudflare Account

1. Edit `wrangler.toml` and set your account ID:

```toml
account_id = "your-account-id-here"
```

2. Authenticate with Cloudflare:

```bash
npx wrangler login
```

### Deploy to Production

Deploy the worker:

```bash
npm run deploy
```

Or deploy to a specific environment:

```bash
npx wrangler deploy --env production
npx wrangler deploy --env staging
```

### View Logs

Stream live logs:

```bash
npm run tail
```

## Files

- `index.js` - Worker implementation with hash verification logic
- `wrangler.toml` - Worker configuration
- `prompt-lock.json` - Lock file copy for hash verification
- `dispatcher.contract.md` - API contract and documentation
- `package.json` - Node.js dependencies (includes Wrangler)

## Lock File Synchronization

Before deploying, always ensure the lock file is up to date:

```bash
cp ../versions/prompt-lock.json ./prompt-lock.json
```

Then deploy:

```bash
npm run deploy
```

## Documentation

For detailed API documentation, see [dispatcher.contract.md](dispatcher.contract.md).

## Support

For issues or questions:
- Check the main repository README
- Review the dispatcher contract
- Open an issue on GitHub
