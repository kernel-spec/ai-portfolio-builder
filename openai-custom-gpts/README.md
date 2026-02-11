# OpenAI Custom GPT Configurations

This directory contains configuration files for creating Custom GPTs in the OpenAI interface for each domain atom, archetype, and the orchestrator.

## Overview

These configurations are **governance-only** and **read-only**. They define how to configure Custom GPTs that align with the canonical 10-domain taxonomy and enforce the governed prompt system.

## Structure

```
openai-custom-gpts/
├── atoms/              # Domain atom configurations (10 files)
├── archetypes/         # Archetype configurations (4 files)
├── orchestrator/       # Orchestrator configuration (1 file)
└── README.md          # This file
```

## File Format

Each `.gpt.json` file contains:
- **name**: Display name for the Custom GPT
- **description**: Brief description of capabilities
- **instructions_file**: Path to the canonical system prompt
- **model**: OpenAI model to use (default: gpt-4-turbo)
- **capabilities**: Browser, DALL-E, Code Interpreter settings
- **governance**: Identity, version, hash, composition rules
- **metadata**: Creation date, source, taxonomy reference

## Creating Custom GPTs

### For Domain Atoms

1. Open OpenAI ChatGPT interface
2. Navigate to "My GPTs" → "Create a GPT"
3. Use configuration from `atoms/domain-XX-name.gpt.json`:
   - **Name**: Use the `name` field
   - **Description**: Use the `description` field
   - **Instructions**: Copy content from `instructions_file` path
   - **Capabilities**: Set according to `capabilities` field (usually all disabled)
4. Save the Custom GPT
5. **Important**: Do NOT modify the instructions from the canonical prompt

### For Archetypes

1. Follow same process as domain atoms
2. Use configuration from `archetypes/archetype-name.gpt.json`
3. Instructions come from the archetype system prompt file
4. Note the composition in governance metadata

### For Orchestrator

1. Use configuration from `orchestrator/orchestrator.gpt.json`
2. Instructions are embedded in the JSON file
3. This GPT coordinates all other agents
4. Critical for governance enforcement

## Governance Rules

### 1. Read-Only Instructions
- Custom GPT instructions MUST match canonical system prompts exactly
- Do not modify, paraphrase, or adapt the instructions
- Any changes require updating the source prompt file and manifest

### 2. Hash Verification
- Each configuration includes `prompt_hash` in governance section
- This hash must match the entry in `versions/prompt-lock.json`
- Mismatches indicate the Custom GPT is out of sync with repository

### 3. Immutability
- Custom GPT configurations are immutable by design
- Updates require:
  1. Update canonical prompt file
  2. Update hash in lock file
  3. Update version in manifest
  4. Re-create Custom GPT with new instructions

### 4. Source of Truth
- **GitHub repository** is the source of truth
- **OpenAI UI** is NOT authoritative
- Always sync Custom GPTs from repository, not vice versa

## Verification Checklist

Before creating a Custom GPT, verify:

- [ ] Configuration file exists in this directory
- [ ] `instructions_file` path is correct
- [ ] Prompt hash matches `versions/prompt-lock.json`
- [ ] Version matches `versions/prompt-manifest.json`
- [ ] Capabilities are set correctly (usually all disabled)
- [ ] Description accurately reflects domain/archetype scope

## Updating Custom GPTs

When a prompt is updated in the repository:

1. **Repository Update**
   - Modify prompt file
   - Update hash in `prompt-lock.json`
   - Update version in `prompt-manifest.json`
   - Update `CHANGELOG.md`

2. **Custom GPT Update**
   - Navigate to the Custom GPT in OpenAI UI
   - Copy new instructions from updated prompt file
   - Paste into Custom GPT instructions
   - Update name/description if changed
   - Save the Custom GPT

3. **Verification**
   - Calculate hash of Custom GPT instructions
   - Verify it matches new lock file hash
   - Test Custom GPT behavior
   - Document update

## Common Issues

### Issue: Custom GPT instructions don't match hash

**Cause**: Instructions were modified outside of governance process

**Fix**: 
1. Copy instructions from canonical prompt file
2. Paste into Custom GPT (overwriting existing)
3. Verify hash matches lock file

### Issue: Custom GPT references outdated composition

**Cause**: Archetype composition changed but Custom GPT not updated

**Fix**:
1. Check latest composition in manifest
2. Update archetype prompt file
3. Update lock file hash
4. Re-create Custom GPT with new instructions

### Issue: Custom GPT can't access other domains

**Cause**: Custom GPTs operate independently, no direct handoff mechanism

**Fix**:
- This is expected behavior
- Use orchestrator Custom GPT for multi-domain coordination
- Orchestrator manages handoffs between agents

## Security Considerations

### Prompt Injection Risks
- Custom GPTs with web browsing enabled are vulnerable to prompt injection
- All domain/archetype GPTs have web browsing DISABLED
- Only enable if absolutely necessary and with extreme caution

### Data Privacy
- Custom GPTs may send data to OpenAI servers
- Do not include sensitive data in prompts
- Follow your organization's data handling policies

### Access Control
- Limit who can create/modify Custom GPTs
- Custom GPTs can be shared publicly or kept private
- Enforce least privilege principles

## Best Practices

### 1. Naming Convention
- Use exact names from manifest
- Don't add suffixes like "v1" or "production"
- Keep names canonical

### 2. Description Clarity
- Use exact description from manifest
- Don't add marketing language
- Keep descriptions functional

### 3. Instruction Integrity
- Never manually edit instructions in OpenAI UI
- Always copy from canonical prompt files
- Verify with hash check

### 4. Regular Synchronization
- Periodically verify Custom GPTs match repository
- Check for drift quarterly
- Update immediately when prompts change

### 5. Version Tracking
- Note which repository version each Custom GPT corresponds to
- Keep internal documentation of Custom GPT → Repository mapping
- Track when Custom GPTs were last synchronized

## Limitations

### What Custom GPTs CAN Do
- Execute their domain's capabilities
- Follow their system prompt instructions
- Maintain quality standards
- Refuse out-of-scope requests

### What Custom GPTs CANNOT Do
- Directly hand off to other Custom GPTs
- Verify prompt hashes (manual process)
- Access governance protocols dynamically
- Self-update when prompts change

### Workarounds
- Use orchestrator for coordination
- Manual hash verification process
- Embed governance rules in instructions
- Manual Custom GPT updates

## Testing Custom GPTs

Before deploying:

1. **Scope Test**: Verify GPT stays in scope
   - Ask in-scope questions → Should answer
   - Ask out-of-scope questions → Should refuse

2. **Quality Test**: Check quality standards
   - Review output against domain quality criteria
   - Ensure standards are maintained

3. **Boundary Test**: Check boundary enforcement
   - Request cross-domain work → Should refuse or suggest handoff
   - Validate collaboration patterns work

4. **Composition Test** (Archetypes only):
   - Verify all constituent domains are active
   - Check emphasis matches percentages
   - Validate integration patterns

## Support

### Questions About Configurations
- Check `versions/prompt-manifest.json` for metadata
- Review domain/archetype prompt files
- Consult `protocols/` directory for governance rules

### Issues with Custom GPTs
- Verify against canonical prompt files
- Check hash in lock file
- Review governance attestation
- Consult SECURITY.md for security issues

### Proposing Changes
- Changes to prompts require governance approval
- Follow contribution guidelines in main README
- All changes require manifest/lock updates

## Changelog

Tracking Custom GPT configuration changes:

### 1.0.0 (2026-02-11)
- Initial configurations for all 10 domains
- Initial configurations for all 4 archetypes  
- Orchestrator configuration
- Governance rules integration
- Hash verification support
