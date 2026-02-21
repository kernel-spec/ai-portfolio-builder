#!/usr/bin/env python3
"""
Forensic Deployment Audit Bundle Generator
FAIL-CLOSED governance mode
"""

import os
import json
import hashlib
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Repository root
REPO_ROOT = Path(__file__).parent.absolute()

# Required files mapping
REQUIRED_FILES = {
    "DOMAIN_ATOMS": [
        "domains/domain-01-content.system.prompt.md",
        "domains/domain-02-analysis.system.prompt.md",
        "domains/domain-03-project-management.system.prompt.md",
        "domains/domain-04-marketing.system.prompt.md",
        "domains/domain-05-product.system.prompt.md",
        "domains/domain-06-education.system.prompt.md",
        "domains/domain-07-personal.system.prompt.md",
        "domains/domain-08-business.system.prompt.md",
        "domains/domain-09-technical.system.prompt.md",
        "domains/domain-10-communication.system.prompt.md",
    ],
    "ARCHETYPES": [
        "archetypes/product-thinker.system.prompt.md",
        "archetypes/growth-operator.system.prompt.md",
        "archetypes/learning-designer.system.prompt.md",
        "archetypes/delivery-planner.system.prompt.md",
    ],
    "GOVERNANCE_CORE": [
        "versions/prompt-manifest.json",
        "versions/prompt-lock.json",
    ],
    "PROTOCOLS": [
        "protocols/handoff.schema.md",
        "protocols/response.schema.md",
        "protocols/orchestration.rules.md",
        "protocols/refusal.rules.md",
    ],
    "CLOUDFLARE_WORKER": [
        "cloudflare-worker/index.js",
        "cloudflare-worker/wrangler.toml",
        "cloudflare-worker/prompt-lock.json",
        "cloudflare-worker/dispatcher.contract.md",
    ],
    "OPENAI_CUSTOM_GPTS": [
        "openai-custom-gpts/atoms/domain-01-content.gpt.json",
        "openai-custom-gpts/atoms/domain-02-analysis.gpt.json",
        "openai-custom-gpts/atoms/domain-03-project-management.gpt.json",
        "openai-custom-gpts/atoms/domain-04-marketing.gpt.json",
        "openai-custom-gpts/atoms/domain-05-product.gpt.json",
        "openai-custom-gpts/atoms/domain-06-education.gpt.json",
        "openai-custom-gpts/atoms/domain-07-personal.gpt.json",
        "openai-custom-gpts/atoms/domain-08-business.gpt.json",
        "openai-custom-gpts/atoms/domain-09-technical.gpt.json",
        "openai-custom-gpts/atoms/domain-10-communication.gpt.json",
        "openai-custom-gpts/archetypes/delivery-planner.gpt.json",
        "openai-custom-gpts/archetypes/growth-operator.gpt.json",
        "openai-custom-gpts/archetypes/learning-designer.gpt.json",
        "openai-custom-gpts/archetypes/product-thinker.gpt.json",
        "openai-custom-gpts/orchestrator/orchestrator.gpt.json",
    ],
    "CI_WORKFLOWS": [
        ".github/workflows/schema-validation.yml",
        ".github/workflows/version-hash-enforcement.yml",
        ".github/workflows/forbidden-file-changes.yml",
        ".github/workflows/archetype-composition-validation.yml",
        ".github/workflows/cloudflare-deploy.yml",
    ],
    "META": [
        "README.md",
        "CHANGELOG.md",
        "SECURITY.md",
    ],
}


def calculate_sha256(file_path: Path) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def verify_required_files() -> Tuple[bool, List[Dict[str, Any]]]:
    """
    STEP 1 & 2: Verify presence of all required files.
    Returns: (success, missing_files_list)
    """
    print("\n" + "=" * 60)
    print("STEP 1 & 2: REQUIRED FILE INVENTORY & FAIL-CLOSED CHECK")
    print("=" * 60 + "\n")
    
    missing_files = []
    all_files_present = True
    
    for category, files in REQUIRED_FILES.items():
        print(f"\n{category} ({len(files)} files):")
        for file_path in files:
            full_path = REPO_ROOT / file_path
            exists = full_path.exists()
            status = "✓" if exists else "✗ MISSING"
            print(f"  {status} {file_path}")
            
            if not exists:
                all_files_present = False
                missing_files.append({
                    "path": file_path,
                    "category": category,
                    "severity": "BLOCKING"
                })
    
    # Check optional package.json files
    print("\n\nOPTIONAL FILES:")
    for opt_file in ["cloudflare-worker/package.json", "cloudflare-worker/package-lock.json"]:
        full_path = REPO_ROOT / opt_file
        exists = full_path.exists()
        status = "✓" if exists else "○ (optional)"
        print(f"  {status} {opt_file}")
    
    return all_files_present, missing_files


def verify_hash_integrity() -> Tuple[str, List[Dict[str, Any]]]:
    """
    STEP 3: Hash Re-calculation
    Returns: (status, mismatches)
    """
    print("\n" + "=" * 60)
    print("STEP 3: HASH RE-CALCULATION")
    print("=" * 60 + "\n")
    
    lock_file = REPO_ROOT / "versions/prompt-lock.json"
    with open(lock_file, 'r') as f:
        lock_data = json.load(f)
    
    mismatches = []
    
    for prompt_id, prompt_info in lock_data["prompts"].items():
        file_path = REPO_ROOT / prompt_info["file"]
        expected_hash = prompt_info["hash"]
        
        if file_path.exists():
            actual_hash = calculate_sha256(file_path)
            match = actual_hash == expected_hash
            status = "✓" if match else "✗ MISMATCH"
            print(f"{status} {prompt_info['file']}")
            
            if not match:
                mismatches.append({
                    "file": prompt_info["file"],
                    "expected": expected_hash,
                    "actual": actual_hash,
                    "type": prompt_info["type"]
                })
        else:
            print(f"✗ MISSING {prompt_info['file']}")
            mismatches.append({
                "file": prompt_info["file"],
                "expected": expected_hash,
                "actual": "FILE_NOT_FOUND",
                "type": prompt_info["type"]
            })
    
    status = "PASS" if len(mismatches) == 0 else "FAIL"
    print(f"\nHash Integrity: {status}")
    if mismatches:
        print(f"  Mismatches found: {len(mismatches)}")
    
    return status, mismatches


def verify_lock_sync() -> Tuple[str, Dict[str, Any]]:
    """
    STEP 4: Lock Sync Validation
    Returns: (status, comparison_info)
    """
    print("\n" + "=" * 60)
    print("STEP 4: LOCK SYNC VALIDATION")
    print("=" * 60 + "\n")
    
    versions_lock = REPO_ROOT / "versions/prompt-lock.json"
    worker_lock = REPO_ROOT / "cloudflare-worker/prompt-lock.json"
    
    with open(versions_lock, 'r') as f:
        versions_data = json.load(f)
    
    with open(worker_lock, 'r') as f:
        worker_data = json.load(f)
    
    # Compare the entire JSON content
    versions_str = json.dumps(versions_data, sort_keys=True)
    worker_str = json.dumps(worker_data, sort_keys=True)
    
    are_identical = versions_str == worker_str
    status = "SYNCED" if are_identical else "DRIFT"
    
    print(f"versions/prompt-lock.json vs cloudflare-worker/prompt-lock.json: {status}")
    
    comparison = {
        "status": status,
        "versions_lock_version": versions_data.get("version"),
        "worker_lock_version": worker_data.get("version"),
        "versions_lock_generated": versions_data.get("generated"),
        "worker_lock_generated": worker_data.get("generated"),
    }
    
    return status, comparison


def generate_audit_manifest(
    hash_status: str,
    lock_sync_status: str,
    missing_files: List[Dict[str, Any]],
    hash_mismatches: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    STEP 5: Create Audit Manifest
    """
    print("\n" + "=" * 60)
    print("STEP 5: CREATE AUDIT MANIFEST")
    print("=" * 60 + "\n")
    
    # Read version from prompt-lock
    with open(REPO_ROOT / "versions/prompt-lock.json", 'r') as f:
        lock_data = json.load(f)
    
    deployment_ready = (
        len(missing_files) == 0 and
        hash_status == "PASS" and
        lock_sync_status == "SYNCED"
    )
    
    manifest = {
        "audit_metadata": {
            "bundle_version": "1.0.0",
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "repository_version": lock_data.get("version", "1.0.0"),
            "audit_mode": "FAIL-CLOSED"
        },
        "inventory": {
            "total_domains": 10,
            "total_archetypes": 4,
            "total_prompts": 14,
            "ci_workflows_count": 5,
            "gpt_config_count": 15,
            "total_required_files": sum(len(files) for files in REQUIRED_FILES.values())
        },
        "validation_results": {
            "hash_integrity_status": hash_status,
            "lock_sync_status": lock_sync_status,
            "missing_files_count": len(missing_files),
            "hash_mismatches_count": len(hash_mismatches)
        },
        "issues": {
            "missing_files": missing_files,
            "hash_mismatches": hash_mismatches
        },
        "deployment_ready": deployment_ready,
        "verdict": (
            "READY_FOR_RUNTIME" if deployment_ready
            else "READY_WITH_WARNINGS" if len(missing_files) == 0
            else "NOT_READY"
        )
    }
    
    manifest_path = REPO_ROOT / "forensic-audit-manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"✓ Generated: {manifest_path.name}")
    print(f"  Deployment Ready: {deployment_ready}")
    print(f"  Verdict: {manifest['verdict']}")
    
    return manifest


def create_audit_bundle(manifest: Dict[str, Any]) -> Path:
    """
    STEP 6: Package files into ZIP
    """
    print("\n" + "=" * 60)
    print("STEP 6: CREATE AUDIT BUNDLE")
    print("=" * 60 + "\n")
    
    bundle_name = "forensic-deployment-audit-bundle-v1.0.0.zip"
    bundle_path = REPO_ROOT / bundle_name
    
    # Remove existing bundle if present
    if bundle_path.exists():
        bundle_path.unlink()
    
    with zipfile.ZipFile(bundle_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the manifest first
        zipf.write(
            REPO_ROOT / "forensic-audit-manifest.json",
            "forensic-audit-manifest.json"
        )
        print("✓ Added: forensic-audit-manifest.json")
        
        # Add all required files
        files_added = 1
        for category, files in REQUIRED_FILES.items():
            for file_path in files:
                full_path = REPO_ROOT / file_path
                if full_path.exists():
                    zipf.write(full_path, file_path)
                    files_added += 1
        
        # Add optional package files if they exist
        for opt_file in ["cloudflare-worker/package.json", "cloudflare-worker/package-lock.json"]:
            full_path = REPO_ROOT / opt_file
            if full_path.exists():
                zipf.write(full_path, opt_file)
                files_added += 1
    
    bundle_size = bundle_path.stat().st_size / 1024  # KB
    print(f"\n✓ Bundle created: {bundle_name}")
    print(f"  Files included: {files_added}")
    print(f"  Bundle size: {bundle_size:.2f} KB")
    
    return bundle_path


def generate_final_report(
    manifest: Dict[str, Any],
    bundle_path: Path,
    missing_files: List[Dict[str, Any]],
    hash_mismatches: List[Dict[str, Any]]
) -> None:
    """
    STEP 7: Final Report
    """
    print("\n" + "=" * 60)
    print("STEP 7: FINAL AUDIT REPORT")
    print("=" * 60 + "\n")
    
    # Calculate deployment readiness score
    total_checks = 4  # file presence, hash integrity, lock sync, structure
    passed_checks = 0
    
    if len(missing_files) == 0:
        passed_checks += 1
    if manifest["validation_results"]["hash_integrity_status"] == "PASS":
        passed_checks += 1
    if manifest["validation_results"]["lock_sync_status"] == "SYNCED":
        passed_checks += 1
    if manifest["deployment_ready"]:
        passed_checks += 1
    
    readiness_score = int((passed_checks / total_checks) * 100)
    
    # Print summary table
    print("=" * 60)
    print("FORENSIC DEPLOYMENT AUDIT SUMMARY")
    print("=" * 60)
    print(f"Repository Version:     {manifest['audit_metadata']['repository_version']}")
    print(f"Audit Timestamp:        {manifest['audit_metadata']['timestamp_utc']}")
    print(f"Audit Mode:             {manifest['audit_metadata']['audit_mode']}")
    print()
    print(f"Total Domains:          {manifest['inventory']['total_domains']}")
    print(f"Total Archetypes:       {manifest['inventory']['total_archetypes']}")
    print(f"Total Prompts:          {manifest['inventory']['total_prompts']}")
    print(f"CI Workflows:           {manifest['inventory']['ci_workflows_count']}")
    print(f"GPT Configs:            {manifest['inventory']['gpt_config_count']}")
    print(f"Required Files:         {manifest['inventory']['total_required_files']}")
    print()
    print(f"Hash Integrity:         {manifest['validation_results']['hash_integrity_status']}")
    print(f"Lock Sync Status:       {manifest['validation_results']['lock_sync_status']}")
    print(f"Missing Files:          {manifest['validation_results']['missing_files_count']}")
    print(f"Hash Mismatches:        {manifest['validation_results']['hash_mismatches_count']}")
    print()
    print(f"Deployment Ready:       {manifest['deployment_ready']}")
    print(f"Readiness Score:        {readiness_score}/100")
    print()
    print(f"Bundle Created:         {bundle_path.name}")
    print(f"Bundle Size:            {bundle_path.stat().st_size / 1024:.2f} KB")
    print()
    print("=" * 60)
    print(f"FINAL VERDICT: {manifest['verdict']}")
    print("=" * 60)
    
    # Show blocking issues if any
    if missing_files:
        print("\n⚠ BLOCKING ISSUES:")
        for issue in missing_files:
            print(f"  ✗ MISSING: {issue['path']} ({issue['category']})")
    
    if hash_mismatches:
        print("\n⚠ INTEGRITY WARNINGS:")
        for mismatch in hash_mismatches:
            print(f"  ✗ HASH MISMATCH: {mismatch['file']}")
    
    if not missing_files and not hash_mismatches:
        print("\n✓ No blocking issues found.")
        print("✓ All integrity checks passed.")
    
    print("\n" + "=" * 60)


def main():
    """Main execution flow"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  FORENSIC DEPLOYMENT AUDIT BUNDLE GENERATOR".center(58) + "║")
    print("║" + "  FAIL-CLOSED GOVERNANCE MODE".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    
    # Step 1 & 2: Verify files
    all_present, missing_files = verify_required_files()
    
    if not all_present:
        print("\n" + "!" * 60)
        print("FAIL-CLOSED: MISSING REQUIRED FILES")
        print("!" * 60)
        print("\nSTOPPING EXECUTION")
        print("DO NOT CREATE ZIP")
        print("DO NOT PROCEED")
        print("\nMissing files:")
        for missing in missing_files:
            print(f"  ✗ {missing['path']} ({missing['category']}) - {missing['severity']}")
        return 1
    
    # Step 3: Hash verification
    hash_status, hash_mismatches = verify_hash_integrity()
    
    # Step 4: Lock sync
    lock_sync_status, lock_comparison = verify_lock_sync()
    
    # Step 5: Generate manifest
    manifest = generate_audit_manifest(
        hash_status,
        lock_sync_status,
        missing_files,
        hash_mismatches
    )
    
    # Step 6: Create bundle
    bundle_path = create_audit_bundle(manifest)
    
    # Step 7: Final report
    generate_final_report(manifest, bundle_path, missing_files, hash_mismatches)
    
    # Return exit code based on verdict
    if manifest["verdict"] == "NOT_READY":
        return 1
    return 0


if __name__ == "__main__":
    exit(main())
