# Pull Request

## Type of Change
- [ ] Prompt content update (domain/archetype)
- [ ] Governance system change
- [ ] Worker runtime change
- [ ] CI/CD configuration
- [ ] Documentation
- [ ] Security fix

## Version Impact
- [ ] Requires version bump (prompt changes, breaking changes)
- [ ] No version bump needed (docs, CI, non-breaking fixes)

**New Version** (if applicable): `x.x.x`

## Changes Made
<!-- Describe what was changed and why -->

## Governance Checklist
- [ ] Prompt changes reflected in `prompt-manifest.json`
- [ ] Hashes regenerated in `prompt-lock.json`
- [ ] Worker lockfile synchronized (`cloudflare-worker/prompt-lock.json`)
- [ ] Version consistency verified
- [ ] CI validation passes
- [ ] No duplicate lockfiles introduced

## Testing
- [ ] Local validation executed (`node validate-system.js`)
- [ ] Worker runtime tested (if applicable)
- [ ] CI workflow passes

## Security
- [ ] No secrets committed
- [ ] No hardcoded API keys
- [ ] No eval() or dynamic code execution
- [ ] Lockfile integrity maintained

## Documentation
- [ ] README updated (if needed)
- [ ] CHANGELOG updated with version entry
- [ ] Governance docs reflect changes

## Reviewer Notes
<!-- Any specific areas requiring review attention -->
