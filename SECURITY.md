# Security Policy

## Overview

The AI Portfolio Builder governed prompt system implements enterprise-grade security through cryptographic hash verification, immutable governance, and comprehensive audit logging. This document defines security requirements, vulnerability reporting, and incident response procedures.

## Version
**Security Policy Version:** 1.0.0  
**Last Updated:** 2026-02-11  
**Effective Date:** 2026-02-11

## Security Model

### Core Security Principles

#### 1. Cryptographic Integrity
- **Hash Algorithm**: SHA-256 for all prompt content
- **Verification**: Mandatory before every agent dispatch
- **Immutability**: Hashes ensure prompts cannot be tampered with
- **Traceability**: Hash changes are visible and auditable

#### 2. Immutability by Default
- **Domain Definitions**: Cannot be modified without version increment
- **Lock File**: Append-only for new entries, update-only for versions
- **Governance Rules**: Require major version change to modify
- **Protocols**: Changes require security review

#### 3. Fail Closed
- **Hash Mismatch**: Hard stop, no execution
- **Invalid Agent**: Refuse, no approximation
- **Boundary Violation**: Reject, no compromise
- **Unknown State**: Halt and request clarification

#### 4. Audit Everything
- **All Dispatches**: Logged with full context
- **All Handoffs**: Logged with governance attestation
- **All Failures**: Logged with reason and impact
- **All Changes**: Tracked through version control

## Supported Versions

| Version | Supported          | Security Updates |
| ------- | ------------------ | ---------------- |
| 1.0.x   | ✅ Yes             | Active           |
| < 1.0   | ❌ No              | Upgrade Required |

**Support Duration**: 
- Latest major version: Full support with active security updates
- Previous major version: Security fixes only for 6 months after new major release
- Older versions: Not supported, immediate upgrade recommended

## Security Features

### 1. Hash Verification System

**Purpose**: Ensure prompt integrity and prevent tampering

**Implementation**:
- SHA-256 hash calculated for every prompt file
- Hashes stored in immutable `versions/prompt-lock.json`
- Verification required before dispatch (Cloudflare Worker)
- CI enforcement prevents hash mismatches in PRs

**Threat Model Protects Against**:
- Unauthorized prompt modifications
- Accidental prompt changes without versioning
- Man-in-the-middle prompt tampering
- Stale or outdated prompt usage

**Security Properties**:
- **Integrity**: Prompts cannot be modified without detection
- **Non-repudiation**: Changes are traceable through git history
- **Freshness**: Only current-version prompts pass verification

### 2. CI/CD Enforcement

**Purpose**: Automate governance and security checks

**Workflows**:
1. **Schema Validation**: Validates manifest/lock structure
2. **Hash Enforcement**: Blocks PRs with hash mismatches
3. **Protected Files**: Prevents unauthorized modifications
4. **Composition Validation**: Enforces archetype rules

**Threat Model Protects Against**:
- Governance rule violations
- Accidental breaking changes
- Invalid archetype compositions
- Unauthorized domain modifications

**Security Properties**:
- **Preventive**: Blocks bad changes before merge
- **Automated**: No human error in enforcement
- **Transparent**: All checks visible in PR status
- **Auditable**: All checks logged in CI history

### 3. Cloudflare Worker Verification

**Purpose**: Runtime hash verification before dispatch

**Implementation**:
- Worker receives agent_id and prompt_hash
- Verifies against embedded prompt-lock.json
- Returns 403 Forbidden on mismatch
- Logs all verification attempts

**Threat Model Protects Against**:
- Runtime prompt injection
- Bypass of repository governance
- Stale prompt usage
- Unauthorized prompt substitution

**Security Properties**:
- **Defense in Depth**: Second verification layer after CI
- **Runtime Protection**: Active verification at dispatch time
- **Fail Secure**: Rejects on any verification failure
- **Observable**: All attempts logged for monitoring

### 4. Immutable Lock File

**Purpose**: Prevent unauthorized hash changes

**Implementation**:
- Lock file tracked in version control
- Changes require corresponding prompt updates
- CI validates lock file modifications
- Git history provides audit trail

**Threat Model Protects Against**:
- Direct hash manipulation
- Unauthorized version changes
- Lock file tampering
- Rollback of security fixes

**Security Properties**:
- **Tamper-Evident**: All changes visible in git
- **Verified Changes**: CI ensures legitimacy
- **History Preserved**: Full audit trail in git log
- **Rollback Safe**: Can revert to any previous state

## Vulnerability Reporting

### Scope

**In Scope**:
- Hash verification bypass
- CI workflow security issues
- Cloudflare Worker vulnerabilities
- Governance rule bypass
- Unauthorized prompt modification
- Lock file manipulation
- Protocol security flaws
- Authentication/authorization issues (if added)

**Out of Scope**:
- Issues with OpenAI platform itself
- Third-party library vulnerabilities (report to maintainers)
- Social engineering attacks
- Physical security
- Denial of service (intentional, not accidental)

### How to Report

**For Security Issues**: Do NOT open a public GitHub issue.

**Private Reporting**:
1. Email security contact: [Configure your security email]
2. Use GitHub Security Advisories (preferred)
3. Include detailed description and reproduction steps
4. Provide proof of concept if possible
5. Suggest remediation if you have ideas

**Information to Include**:
- Description of vulnerability
- Affected components/versions
- Reproduction steps
- Impact assessment
- Suggested mitigation
- Your contact information

**Response Timeline**:
- **Initial Response**: Within 48 hours
- **Severity Assessment**: Within 5 business days
- **Patch Development**: Based on severity (see below)
- **Public Disclosure**: After patch available + 30 days

### Severity Levels

#### Critical (Fix within 24-48 hours)
- Hash verification bypass
- Arbitrary prompt execution
- Complete governance bypass
- Authentication bypass (if added)
- Remote code execution

#### High (Fix within 1 week)
- Partial hash verification bypass
- Unauthorized domain modification
- Lock file manipulation
- Privilege escalation
- Data leakage

#### Medium (Fix within 2 weeks)
- CI workflow bypass (non-security)
- Minor governance violations
- Information disclosure (limited)
- Denial of service (accidental)

#### Low (Fix within 1 month)
- Documentation issues
- Non-security CI improvements
- Minor protocol ambiguities

### Disclosure Policy

**Responsible Disclosure**:
- We follow coordinated vulnerability disclosure
- Public disclosure after patch is available
- 30-day grace period for users to update
- Credit given to reporter (if desired)

**Public Disclosure Includes**:
- Vulnerability description
- Affected versions
- Fixed versions
- Mitigation steps
- Credit to reporter
- CVE ID (if applicable)

## Security Best Practices

### For Developers

#### 1. Prompt Modifications
- **Always** update hash in lock file
- **Always** increment version appropriately
- **Never** modify prompts directly in production
- **Always** test hash verification after changes

#### 2. Lock File Updates
- **Never** modify hashes manually without prompt changes
- **Always** use `sha256sum` to calculate hashes
- **Always** commit prompt and lock file together
- **Verify** CI passes before merging

#### 3. CI Workflow Changes
- **Review** security implications of workflow changes
- **Test** workflows in fork before PR
- **Document** security-related changes
- **Get** security review for critical workflows

#### 4. Cloudflare Worker
- **Keep** lock file synchronized with repository
- **Never** disable hash verification
- **Monitor** worker logs for anomalies
- **Update** worker when lock file changes

### For Users

#### 1. Custom GPT Creation
- **Always** use exact instructions from repository
- **Never** modify instructions manually
- **Verify** hash matches lock file
- **Update** Custom GPTs when prompts change

#### 2. Integration
- **Always** verify hashes before dispatch
- **Use** Cloudflare Worker for verification
- **Log** all verification failures
- **Monitor** for hash mismatches

#### 3. Monitoring
- **Set up** alerts for hash verification failures
- **Review** audit logs regularly
- **Investigate** all security flags immediately
- **Report** suspicious activity

## Incident Response

### Detection

**Security Incidents Include**:
- Hash verification failures
- Unauthorized prompt modifications
- Lock file tampering
- CI workflow bypass
- Governance violations
- Suspicious access patterns

**Detection Methods**:
- CI workflow failures
- Cloudflare Worker rejection logs
- Manual audit review
- User reports
- Automated monitoring

### Response Process

#### 1. Identification (0-2 hours)
- Confirm incident is security-related
- Assess initial severity
- Identify affected components
- Begin incident log

#### 2. Containment (2-6 hours)
- Stop use of affected prompts
- Roll back to known-good version
- Block further compromises
- Preserve evidence

#### 3. Investigation (6-24 hours)
- Determine root cause
- Identify attack vector
- Assess full impact
- Document findings

#### 4. Remediation (24-48 hours)
- Develop fix for vulnerability
- Test fix thoroughly
- Deploy fix to production
- Verify remediation

#### 5. Recovery (48-72 hours)
- Restore normal operations
- Verify system integrity
- Update monitoring
- Document incident

#### 6. Post-Incident (1 week)
- Complete incident report
- Identify lessons learned
- Update security measures
- Communicate to stakeholders

### Communication

**Internal**:
- Immediate notification to security team
- Regular updates to development team
- Executive briefing for critical incidents

**External**:
- User notification if data affected
- Public disclosure per policy
- CVE publication if applicable
- Security advisory release

## Compliance

### Standards Alignment
- **NIST Cybersecurity Framework**: Aligned with core functions
- **OWASP Top 10**: Mitigations for relevant risks
- **Supply Chain Security**: Hash verification, version control
- **Secure SDLC**: CI/CD enforcement, code review

### Audit Trail
- **Git History**: All changes tracked
- **CI Logs**: All checks recorded
- **Worker Logs**: All verifications logged
- **Lock File**: All hashes preserved

### Verification
- **Automated**: CI workflows
- **Manual**: Code review process
- **Continuous**: Cloudflare Worker
- **Periodic**: Security audits

## Security Contacts

**Primary Contact**: [Configure security email]  
**GitHub Security**: Use GitHub Security Advisories  
**Emergency**: [Configure emergency contact]

**Response Hours**: 
- Critical: 24/7
- High: Business hours + on-call
- Medium/Low: Business hours

## Updates to This Policy

This security policy is versioned and follows the same governance as the prompt system:
- Changes require security review
- Major changes increment policy version
- All changes documented in CHANGELOG.md
- Git history provides audit trail

**Last Review Date**: 2026-02-11  
**Next Review Date**: 2027-02-11 (annual review)

## Acknowledgments

We thank the security research community for responsible vulnerability disclosure and appreciate all reports that help improve the security of this system.

---

**Remember**: Security is everyone's responsibility. When in doubt, fail closed and ask for guidance.
