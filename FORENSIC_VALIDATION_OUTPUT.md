# Forensic Governance Validation Output

## Purpose

This document describes the forensic governance validation output system for the AI Portfolio Builder repository.

## Overview

The `forensic-validation-output.sh` script provides complete, untruncated output of all critical files required for runtime integrity and deployment verification. This is essential for:

- **Cryptographic Hash Verification**: Ensuring all SHA-256 hashes are intact
- **Governance Audit Trail**: Documenting complete system state
- **Deployment Integrity**: Verifying configurations before deployment
- **Security Compliance**: Maintaining audit logs for forensic analysis
- **Runtime Verification**: Confirming system integrity at any point in time

## What Files Are Output

The script outputs **41 critical governance files** organized into the following categories:

### 1. Governance Documentation (4 files)
- `GOVERNANCE_AUDIT_REPORT.md` - Complete forensic audit report
- `SECURITY.md` - Security policy and procedures
- `CHANGELOG.md` - Version history
- `README.md` - Repository documentation

### 2. Version Control and Cryptographic Lock Files (3 files)
- `versions/prompt-manifest.json` - System manifest with taxonomy
- `versions/prompt-lock.json` - SHA-256 hashes for all prompts
- `cloudflare-worker/prompt-lock.json` - Deployment lock file

### 3. Protocol Definitions (4 files)
- `protocols/handoff.schema.md` - Agent handoff protocol
- `protocols/orchestration.rules.md` - Orchestration rules
- `protocols/refusal.rules.md` - Refusal protocols
- `protocols/response.schema.md` - Response format schema

### 4. Domain Prompt Atoms (10 files)
All 10 canonical domain system prompts:
- `domain-01-content.system.prompt.md`
- `domain-02-analysis.system.prompt.md`
- `domain-03-project-management.system.prompt.md`
- `domain-04-marketing.system.prompt.md`
- `domain-05-product.system.prompt.md`
- `domain-06-education.system.prompt.md`
- `domain-07-personal.system.prompt.md`
- `domain-08-business.system.prompt.md`
- `domain-09-technical.system.prompt.md`
- `domain-10-communication.system.prompt.md`

### 5. Archetype Compositions (4 files)
All 4 archetype system prompts:
- `archetypes/delivery-planner.system.prompt.md`
- `archetypes/growth-operator.system.prompt.md`
- `archetypes/learning-designer.system.prompt.md`
- `archetypes/product-thinker.system.prompt.md`

### 6. Cloudflare Worker Contract (1 file)
- `cloudflare-worker/dispatcher.contract.md` - API contract specification

### 7. OpenAI Custom GPT Configurations (15 files)
- 1 Orchestrator configuration
- 4 Archetype configurations
- 10 Domain atom configurations

## Output Format

Each file is output in the following format:

```
===== FILE: <relative-path-to-file>
<full-content-of-file>

```

This format ensures:
- Clear file boundaries
- Full content preservation (no truncation or summarization)
- Easy parsing for automated validation
- Human-readable structure

## Usage

### Running the Script

```bash
./forensic-validation-output.sh
```

### Capturing Output to File

```bash
./forensic-validation-output.sh > forensic-validation-$(date +%Y%m%d-%H%M%S).txt
```

### Verifying Output

```bash
# Count files output
./forensic-validation-output.sh | grep -c "===== FILE:"

# Check for specific file
./forensic-validation-output.sh | grep "===== FILE: versions/prompt-lock.json"
```

## Use Cases

### 1. Pre-Deployment Verification
Before deploying to production, run the script to capture the complete system state for verification.

### 2. Security Audits
Generate a complete snapshot of all governed files for security review.

### 3. Compliance Documentation
Provide auditors with comprehensive evidence of system integrity.

### 4. Incident Response
Capture current state during security incidents for forensic analysis.

### 5. Version Comparison
Generate outputs at different points in time to track changes.

### 6. Integration Testing
Verify all files are present and correctly formatted in CI/CD pipelines.

## Security Considerations

### What This Does NOT Do

- **Does NOT modify any files** - Read-only operation
- **Does NOT execute code** - Only outputs file contents
- **Does NOT validate hashes** - Use governance audit tools for validation
- **Does NOT compress or encrypt** - Outputs plain text

### What This DOES Ensure

- **Complete transparency** - All critical files visible
- **No truncation** - Full content preserved
- **Audit trail** - Captures exact file state
- **Forensic integrity** - Unmodified content output

## Integration with Governance System

This script complements the existing governance infrastructure:

1. **CI/CD Workflows** - Can be integrated into validation pipelines
2. **Hash Verification** - Outputs include lock files for verification
3. **Audit Reports** - Includes complete GOVERNANCE_AUDIT_REPORT.md
4. **Security Policy** - Outputs SECURITY.md for reference
5. **Deployment Contract** - Includes Cloudflare Worker contract

## Maintenance

### Adding New Files

To add files to the output, edit `forensic-validation-output.sh`:

1. Add the file path to the appropriate section
2. Use the `output_file` function: `output_file "path/to/file.ext"`
3. Update the total file count in the final summary
4. Test the script to ensure the file is output correctly

### Version History

- **1.0.0** (2026-02-12) - Initial implementation
  - Outputs all 41 critical governance files
  - Organized into 7 major categories
  - Formatted for human readability and automated parsing

## Support

For issues with the forensic validation output script:

1. Verify all files exist in the repository
2. Check file permissions (script must be executable)
3. Review script output for error messages
4. Check repository integrity with governance audit

## Related Documentation

- `GOVERNANCE_AUDIT_REPORT.md` - Complete forensic audit
- `SECURITY.md` - Security policy and procedures
- `README.md` - Repository overview and structure
- `cloudflare-worker/dispatcher.contract.md` - Runtime verification contract

---

**Script Version**: 1.0.0  
**Last Updated**: 2026-02-12  
**Maintained By**: AI Portfolio Builder Governance Team
