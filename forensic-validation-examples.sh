#!/bin/bash
# Example Usage Scenarios for Forensic Validation Output Script

echo "==============================================="
echo "FORENSIC VALIDATION OUTPUT - USAGE EXAMPLES"
echo "==============================================="
echo ""

# Scenario 1: Basic output to console
echo "📋 Scenario 1: Basic output to console"
echo "Command: ./forensic-validation-output.sh"
echo "Use case: Quick verification during development"
echo ""

# Scenario 2: Save to timestamped file
echo "📋 Scenario 2: Save to timestamped file"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "Command: ./forensic-validation-output.sh > forensic-validation-$TIMESTAMP.txt"
echo "Use case: Pre-deployment verification with audit trail"
echo ""

# Scenario 3: Verify specific file is included
echo "📋 Scenario 3: Verify specific file is included"
echo "Command: ./forensic-validation-output.sh | grep -q 'FILE: versions/prompt-lock.json' && echo 'Lock file found' || echo 'Lock file missing'"
echo "Use case: CI/CD validation checks"
echo ""

# Scenario 4: Count total files output
echo "📋 Scenario 4: Count total files output"
echo "Command: ./forensic-validation-output.sh | grep -c '===== FILE:'"
echo "Use case: Verify all expected files are present"
echo "Expected: 41 files"
echo ""

# Scenario 5: Extract specific file content
echo "📋 Scenario 5: Extract specific file content"
echo "Command: ./forensic-validation-output.sh | sed -n '/===== FILE: versions\/prompt-manifest.json/,/===== FILE:/p' | head -n -1"
echo "Use case: Extract single file for inspection"
echo ""

# Scenario 6: Compare two outputs
echo "📋 Scenario 6: Compare two validation outputs"
echo "Commands:"
echo "  ./forensic-validation-output.sh > validation-before.txt"
echo "  # ... make changes ..."
echo "  ./forensic-validation-output.sh > validation-after.txt"
echo "  diff validation-before.txt validation-after.txt"
echo "Use case: Track changes between versions"
echo ""

# Scenario 7: Verify hash integrity
echo "📋 Scenario 7: Verify hash integrity in output"
echo "Command: ./forensic-validation-output.sh | grep -A 20 '\"prompts\":' | grep '\"hash\":'"
echo "Use case: Quick hash verification"
echo ""

# Scenario 8: Generate compressed archive
echo "📋 Scenario 8: Generate compressed archive"
echo "Command: ./forensic-validation-output.sh | gzip > forensic-validation-$TIMESTAMP.txt.gz"
echo "Use case: Long-term audit storage"
echo ""

# Scenario 9: Check for errors
echo "📋 Scenario 9: Check for errors during execution"
echo "Command: ./forensic-validation-output.sh 2>&1 | grep -i 'error\\|fail\\|no such file'"
echo "Use case: Validate script execution"
echo ""

# Scenario 10: CI/CD Integration
echo "📋 Scenario 10: CI/CD Integration Example"
cat << 'EOF'
Command: 
  #!/bin/bash
  OUTPUT=$(./forensic-validation-output.sh 2>&1)
  FILE_COUNT=$(echo "$OUTPUT" | grep -c "===== FILE:")
  
  if [ "$FILE_COUNT" -eq 41 ]; then
    echo "✅ All 41 critical files output successfully"
    exit 0
  else
    echo "❌ Expected 41 files, got $FILE_COUNT"
    exit 1
  fi
EOF
echo "Use case: Automated validation in CI/CD pipeline"
echo ""

echo "==============================================="
echo "For more information, see FORENSIC_VALIDATION_OUTPUT.md"
echo "==============================================="
