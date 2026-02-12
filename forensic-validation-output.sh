#!/bin/bash
# Forensic Governance Validation Output Script
# Outputs full content of all critical files for runtime integrity and deployment verification

echo "============================================"
echo "FORENSIC GOVERNANCE VALIDATION OUTPUT"
echo "Repository: kernel-spec/ai-portfolio-builder"
echo "Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "============================================"
echo ""

# Function to output file content
output_file() {
    local filepath="$1"
    echo "===== FILE: $filepath"
    cat "$filepath"
    echo ""
}

# 1. Governance Documentation
echo "## GOVERNANCE DOCUMENTATION ##"
echo ""
output_file "GOVERNANCE_AUDIT_REPORT.md"
output_file "SECURITY.md"
output_file "CHANGELOG.md"
output_file "README.md"

# 2. Version Control and Lock Files (Cryptographic Hashes)
echo "## VERSION CONTROL AND CRYPTOGRAPHIC LOCK FILES ##"
echo ""
output_file "versions/prompt-manifest.json"
output_file "versions/prompt-lock.json"
output_file "cloudflare-worker/prompt-lock.json"

# 3. Protocol Definitions
echo "## PROTOCOL DEFINITIONS ##"
echo ""
output_file "protocols/handoff.schema.md"
output_file "protocols/orchestration.rules.md"
output_file "protocols/refusal.rules.md"
output_file "protocols/response.schema.md"

# 4. Domain Prompt Atoms (All 10)
echo "## DOMAIN PROMPT ATOMS ##"
echo ""
output_file "domains/domain-01-content.system.prompt.md"
output_file "domains/domain-02-analysis.system.prompt.md"
output_file "domains/domain-03-project-management.system.prompt.md"
output_file "domains/domain-04-marketing.system.prompt.md"
output_file "domains/domain-05-product.system.prompt.md"
output_file "domains/domain-06-education.system.prompt.md"
output_file "domains/domain-07-personal.system.prompt.md"
output_file "domains/domain-08-business.system.prompt.md"
output_file "domains/domain-09-technical.system.prompt.md"
output_file "domains/domain-10-communication.system.prompt.md"

# 5. Archetype Compositions (All 4)
echo "## ARCHETYPE COMPOSITIONS ##"
echo ""
output_file "archetypes/delivery-planner.system.prompt.md"
output_file "archetypes/growth-operator.system.prompt.md"
output_file "archetypes/learning-designer.system.prompt.md"
output_file "archetypes/product-thinker.system.prompt.md"

# 6. Cloudflare Worker Contract
echo "## CLOUDFLARE WORKER CONTRACT ##"
echo ""
output_file "cloudflare-worker/dispatcher.contract.md"

# 7. OpenAI Custom GPT Configurations
echo "## OPENAI CUSTOM GPT CONFIGURATIONS ##"
echo ""
echo "### Orchestrator ###"
output_file "openai-custom-gpts/orchestrator/orchestrator.gpt.json"

echo "### Archetypes ###"
output_file "openai-custom-gpts/archetypes/delivery-planner.gpt.json"
output_file "openai-custom-gpts/archetypes/growth-operator.gpt.json"
output_file "openai-custom-gpts/archetypes/learning-designer.gpt.json"
output_file "openai-custom-gpts/archetypes/product-thinker.gpt.json"

echo "### Domain Atoms ###"
output_file "openai-custom-gpts/atoms/domain-01-content.gpt.json"
output_file "openai-custom-gpts/atoms/domain-02-analysis.gpt.json"
output_file "openai-custom-gpts/atoms/domain-03-project-management.gpt.json"
output_file "openai-custom-gpts/atoms/domain-04-marketing.gpt.json"
output_file "openai-custom-gpts/atoms/domain-05-product.gpt.json"
output_file "openai-custom-gpts/atoms/domain-06-education.gpt.json"
output_file "openai-custom-gpts/atoms/domain-07-personal.gpt.json"
output_file "openai-custom-gpts/atoms/domain-08-business.gpt.json"
output_file "openai-custom-gpts/atoms/domain-09-technical.gpt.json"
output_file "openai-custom-gpts/atoms/domain-10-communication.gpt.json"

echo "============================================"
echo "FORENSIC VALIDATION OUTPUT COMPLETE"
echo "Total Files Output: 38"
echo "============================================"
