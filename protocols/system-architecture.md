# AI Portfolio Builder — System Architecture

## Layers

1. GitHub Repository (Source of Truth)
   - Domain atoms
   - Archetypes
   - Manifest
   - Lock file
   - Governance rules

2. Cloudflare Worker
   - Runtime hash verification
   - Manifest endpoint
   - Fail-closed enforcement

3. OpenAI Custom GPT (Orchestrator)
   - Intent classification
   - Agent selection
   - Dynamic manifest retrieval
   - Dispatch verification
   - Final governed response

## Security Model

- SHA-256 immutable registry
- Fail-closed enforcement
- No dispatch without verification
- GitHub as canonical authority

## Runtime Flow

User → Orchestrator → Manifest → Dispatch Verification → Governed Response
