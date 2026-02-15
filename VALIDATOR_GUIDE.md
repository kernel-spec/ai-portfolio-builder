# Git Diff Validator Guide

## Overview

The `git-diff-validator.js` script validates changes to the governed prompt files in the AI Portfolio Builder repository. It ensures that any modifications to domain atoms or archetypes are properly synchronized with version control files and maintain system integrity.

## Purpose

This validator enforces the governance model by:

1. **Hash Verification**: Ensures that changed prompt files have matching SHA-256 hashes in `versions/prompt-lock.json`
2. **Version Consistency**: Validates synchronization between manifest and lock files
3. **Composition Validation**: Verifies archetype compositions sum to exactly 100%
4. **Change Tracking**: Provides detailed reports of all changes to governed directories

## Usage

### Basic Usage

```bash
# Validate working tree changes against HEAD
node git-diff-validator.js

# Or use npm script (if configured)
npm run validate:diff
```

### Advanced Usage

```bash
# Compare two commits
node git-diff-validator.js HEAD~1 HEAD

# Compare branch to main
node git-diff-validator.js main HEAD

# Compare specific commit to working tree
node git-diff-validator.js abc1234
```

## What It Validates

### 1. Hash Synchronization

For each changed domain or archetype file:
- Calculates current SHA-256 hash
- Compares against `versions/prompt-lock.json`
- Reports mismatches with expected vs. actual hashes

### 2. Manifest Consistency

- Domain count matches between manifest and lock file
- Archetype count matches between manifest and lock file
- Version numbers are synchronized

### 3. Archetype Compositions

- Each archetype's domain percentages sum to exactly 100%
- Reports any composition errors

## Output Examples

### No Changes

```
======================================================================
GIT DIFF VALIDATOR
======================================================================

Comparing: HEAD → working tree

No changes detected in versions/, domains/, or archetypes/

✓ No validation needed - no changes detected
```

### Hash Mismatch Detected

```
======================================================================
CHANGE REPORT
======================================================================

Domain Changes:
  M	domains/domain-01-content.system.prompt.md

Validating changed files...

Checking: domains/domain-01-content.system.prompt.md (M)
  ✗ Hash mismatch for domain-01-content
    Expected: 5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413
    Actual:   17a4996d7960e9db1bf4e0faf2a846c1c57b1b288d5d60ead926060ce5b601c8

======================================================================
VALIDATION SUMMARY
======================================================================

✗ 1 error(s), 0 warning(s) - VALIDATION FAILED
```

## Fixing Hash Mismatches

When the validator reports hash mismatches, follow these steps:

### 1. Review the Changes

```bash
# See what changed in the file
git diff domains/domain-01-content.system.prompt.md
```

### 2. Recalculate Hash

```bash
# Calculate new SHA-256 hash
sha256sum domains/domain-01-content.system.prompt.md

# On macOS
shasum -a 256 domains/domain-01-content.system.prompt.md
```

### 3. Update Lock File

Edit `versions/prompt-lock.json` and update the hash:

```json
{
  "domain-01-content": {
    "file": "domains/domain-01-content.system.prompt.md",
    "hash": "NEW_HASH_HERE",
    "type": "domain",
    "version": "1.0.0"
  }
}
```

### 4. Update Manifest (If Needed)

If this is a significant change, increment the version in `versions/prompt-manifest.json`:

```json
{
  "domain-01-content": {
    "name": "Content Creation",
    "file": "domains/domain-01-content.system.prompt.md",
    "canonical_id": "domain-01-content",
    "version": "1.0.1",  // Increment version
    "scope": "..."
  }
}
```

### 5. Re-validate

```bash
node git-diff-validator.js
```

## Integration with CI/CD

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
node git-diff-validator.js
if [ $? -ne 0 ]; then
  echo "Git diff validation failed. Please fix errors before committing."
  exit 1
fi
```

### GitHub Actions Workflow

Create `.github/workflows/validate-diff.yml`:

```yaml
name: Validate Git Diff

on:
  pull_request:
    paths:
      - 'versions/**'
      - 'domains/**'
      - 'archetypes/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run git diff validator
        run: node git-diff-validator.js origin/main HEAD
```

## Exit Codes

- `0`: All validations passed
- `1`: Validation errors found

## Complementary Tools

Use this validator alongside:

- **validate-system.js**: Validates overall system integrity
- **meta-validation.js**: Meta-validation of the test suite
- **GitHub Actions**: Automated CI validation

## Best Practices

1. **Run Before Committing**: Always validate changes before committing
2. **Review Changes**: Understand what changed and why before updating hashes
3. **Update Documentation**: Keep CHANGELOG.md updated with governance changes
4. **Incremental Changes**: Make small, focused changes to single files
5. **Version Bumps**: Follow semantic versioning for prompt changes

## Troubleshooting

### "Git diff failed" Error

- Ensure you're in the repository root directory
- Verify git is installed and repository is initialized
- Check that specified commits/branches exist

### "Failed to load prompt-lock.json" Error

- Ensure `versions/prompt-lock.json` exists
- Verify JSON syntax is valid
- Check file permissions

### False Positives

- Line endings: Ensure consistent line endings (LF vs CRLF)
- Trailing whitespace: Check for unintended whitespace changes
- File encoding: Verify UTF-8 encoding

## Architecture

The validator is built on:

- **Node.js**: Cross-platform execution
- **crypto module**: SHA-256 hash calculation
- **child_process**: Git command execution
- **fs module**: File system operations

No external dependencies required - uses only Node.js built-in modules.

## Contributing

When modifying the validator:

1. Maintain backward compatibility
2. Add tests for new validation logic
3. Update this documentation
4. Follow existing code style
5. Test with real repository changes

## See Also

- [README.md](README.md) - Main repository documentation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing documentation
- [SECURITY.md](SECURITY.md) - Security policies
- [CHANGELOG.md](CHANGELOG.md) - Version history
