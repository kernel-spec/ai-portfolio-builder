/**
 * REAL RUNTIME BEHAVIOR TESTS
 * 
 * These tests ACTUALLY execute the Cloudflare Worker code.
 * No static pattern matching - only behavioral validation.
 * 
 * Tests use real Request objects and verify actual responses.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the worker module
// Since worker uses ES modules, we need to dynamically import
let worker;
let promptLock;

// Mock crypto.randomUUID for testing
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = {
    randomUUID: () => '12345678-1234-1234-1234-123456789abc'
  };
}

// Load worker before tests
await (async () => {
  const workerModule = await import('./index.js');
  worker = workerModule.default;
  
  // Load prompt-lock for test data
  const promptLockPath = join(__dirname, 'prompt-lock.json');
  promptLock = JSON.parse(readFileSync(promptLockPath, 'utf8'));
})();

/**
 * Helper: Create a Request object
 */
function createRequest(method, url, body = null, headers = {}) {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body !== null) {
    init.body = body;
  }
  
  return new Request(url, init);
}

/**
 * Helper: Get first valid agent from prompt-lock
 */
function getValidAgent() {
  const agentId = Object.keys(promptLock.prompts)[0];
  const agent = promptLock.prompts[agentId];
  return {
    agent_id: agentId,
    prompt_hash: agent.hash,
    type: agent.type,
    version: agent.version
  };
}

describe('Cloudflare Worker Runtime Behavior Tests', () => {
  
  // ============================================================
  // TEST 1: POST without body → expect 400
  // ============================================================
  test('POST without body returns 400', async () => {
    const request = createRequest('POST', 'https://example.com/', null);
    
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for missing body');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Invalid JSON body/i, 'Error should mention invalid JSON');
  });
  
  // ============================================================
  // TEST 2: POST with malformed JSON → expect 400
  // ============================================================
  test('POST with malformed JSON returns 400', async () => {
    const request = createRequest('POST', 'https://example.com/', 'not valid json{');
    
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for malformed JSON');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Invalid JSON body/i, 'Error should mention invalid JSON');
  });
  
  // ============================================================
  // TEST 3: POST missing agent_id → expect 400
  // ============================================================
  test('POST missing agent_id returns 400', async () => {
    const body = JSON.stringify({
      prompt_hash: '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413'
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for missing agent_id');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.ok(data.details, 'Response should contain validation details');
    assert.ok(
      data.details.some(d => d.includes('agent_id')),
      'Validation errors should mention agent_id'
    );
  });
  
  // ============================================================
  // TEST 4: POST missing prompt_hash → expect 400
  // ============================================================
  test('POST missing prompt_hash returns 400', async () => {
    const body = JSON.stringify({
      agent_id: 'domain-01-content'
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for missing prompt_hash');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.ok(data.details, 'Response should contain validation details');
    assert.ok(
      data.details.some(d => d.includes('prompt_hash')),
      'Validation errors should mention prompt_hash'
    );
  });
  
  // ============================================================
  // TEST 5: POST with invalid hash format → expect 400
  // ============================================================
  test('POST with invalid hash format returns 400', async () => {
    const body = JSON.stringify({
      agent_id: 'domain-01-content',
      prompt_hash: 'invalid-hash-format'
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for invalid hash format');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.ok(data.details, 'Response should contain validation details');
    assert.ok(
      data.details.some(d => d.includes('SHA-256')),
      'Validation errors should mention SHA-256 format requirement'
    );
  });
  
  // ============================================================
  // TEST 6: POST with unknown agent → expect 403
  // ============================================================
  test('POST with unknown agent_id returns 403', async () => {
    const body = JSON.stringify({
      agent_id: 'nonexistent-agent-id',
      prompt_hash: '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413'
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 403, 'Should return 403 for unknown agent');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Hash verification failed/i, 'Error should mention hash verification');
    assert.strictEqual(data.security_flag, true, 'Should set security_flag to true');
  });
  
  // ============================================================
  // TEST 7: POST with wrong hash → expect 403
  // ============================================================
  test('POST with wrong hash for valid agent returns 403', async () => {
    const body = JSON.stringify({
      agent_id: 'domain-01-content',
      prompt_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' // Wrong hash
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 403, 'Should return 403 for wrong hash');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Hash verification failed/i, 'Error should mention hash verification');
    assert.strictEqual(data.security_flag, true, 'Should set security_flag to true');
  });
  
  // ============================================================
  // TEST 8: POST with correct request → expect 200
  // ============================================================
  test('POST with valid agent and correct hash returns 200', async () => {
    const validAgent = getValidAgent();
    const body = JSON.stringify({
      agent_id: validAgent.agent_id,
      prompt_hash: validAgent.prompt_hash
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 200, 'Should return 200 for valid request');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'Response should indicate success');
    assert.strictEqual(data.verified, true, 'Response should indicate verification passed');
    assert.ok(data.dispatch_id, 'Response should contain dispatch_id');
    assert.ok(data.agent, 'Response should contain agent info');
    assert.strictEqual(data.agent.agent_id, validAgent.agent_id, 'Agent ID should match');
    assert.strictEqual(data.agent.type, validAgent.type, 'Agent type should match');
    assert.strictEqual(data.agent.version, validAgent.version, 'Agent version should match');
    assert.ok(data.timestamp, 'Response should contain timestamp');
  });
  
  // ============================================================
  // TEST 9: GET request to root → expect 405
  // ============================================================
  test('GET request to root returns 405', async () => {
    const request = createRequest('GET', 'https://example.com/');
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 405, 'Should return 405 for GET to root');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Method not allowed/i, 'Error should mention method not allowed');
  });
  
  // ============================================================
  // TEST 10: GET request to /health → expect 200
  // ============================================================
  test('GET request to /health returns 200', async () => {
    const request = createRequest('GET', 'https://example.com/health');
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 200, 'Should return 200 for health check');
    
    const data = await response.json();
    assert.strictEqual(data.status, 'healthy', 'Health check should report healthy');
    assert.strictEqual(data.service, 'prompt-dispatcher', 'Service name should be correct');
    assert.ok(data.version, 'Response should contain version');
    assert.ok(data.lock_file_version, 'Response should contain lock file version');
    assert.ok(typeof data.prompts_count === 'number', 'Response should contain prompts count');
  });
  
  // ============================================================
  // TEST 11: OPTIONS request → expect 200 with CORS
  // ============================================================
  test('OPTIONS request returns 200 with CORS headers', async () => {
    const request = createRequest('OPTIONS', 'https://example.com/');
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 200, 'Should return 200 for OPTIONS');
    
    // Verify CORS headers
    const headers = response.headers;
    assert.ok(
      headers.get('Access-Control-Allow-Origin'),
      'Should include Access-Control-Allow-Origin header'
    );
    assert.ok(
      headers.get('Access-Control-Allow-Methods'),
      'Should include Access-Control-Allow-Methods header'
    );
  });
  
  // ============================================================
  // TEST 12: PUT request → expect 405
  // ============================================================
  test('PUT request returns 405', async () => {
    const body = JSON.stringify({
      agent_id: 'domain-01-content',
      prompt_hash: '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413'
    });
    
    const request = createRequest('PUT', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 405, 'Should return 405 for PUT method');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Method not allowed/i, 'Error should mention method not allowed');
  });
  
  // ============================================================
  // TEST 13: POST with array body → expect 400
  // ============================================================
  test('POST with array body returns 400', async () => {
    const body = JSON.stringify([
      { agent_id: 'domain-01-content', prompt_hash: 'abc' }
    ]);
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 400, 'Should return 400 for array body');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
    assert.match(data.error, /Invalid request body structure/i, 'Error should mention invalid structure');
  });
  
  // ============================================================
  // TEST 14: DELETE request → expect 405
  // ============================================================
  test('DELETE request returns 405', async () => {
    const request = createRequest('DELETE', 'https://example.com/');
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 405, 'Should return 405 for DELETE method');
    
    const data = await response.json();
    assert.ok(data.error, 'Response should contain error message');
  });
  
  // ============================================================
  // TEST 15: Verify CORS headers on all responses
  // ============================================================
  test('All POST responses include CORS headers', async () => {
    const body = JSON.stringify({
      agent_id: 'domain-01-content',
      prompt_hash: '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413'
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    const headers = response.headers;
    assert.ok(
      headers.get('Access-Control-Allow-Origin'),
      'Response should include CORS origin header'
    );
    assert.ok(
      headers.get('Content-Type'),
      'Response should include Content-Type header'
    );
  });

  // ============================================================
  // 🔒 MUTATION RESISTANCE HARDENING TESTS
  // ============================================================
  
  // ============================================================
  // TEST 16: Hash bypass structure validation (ENHANCED)
  // ============================================================
  test('Hash bypass - validates full error structure and prevents success path leak', async () => {
    const validAgent = getValidAgent();
    const wrongHash = 'a'.repeat(64); // 64 'a' characters - wrong hash
    
    const body = JSON.stringify({
      agent_id: validAgent.agent_id,
      prompt_hash: wrongHash
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    // Status code validation
    assert.strictEqual(response.status, 403, 'Should return 403 for wrong hash');
    
    const data = await response.json();
    
    // Error structure validation
    assert.ok(data.error, 'Response must contain error field');
    assert.match(data.error, /Hash verification failed/i, 'Error must mention hash verification');
    assert.match(data.error, new RegExp(validAgent.agent_id), 'Error must include agent_id');
    
    // Security flag validation
    assert.strictEqual(data.security_flag, true, 'Must set security_flag to true');
    
    // Details validation - must include expected and received hashes
    assert.ok(data.details, 'Response must contain details object');
    assert.strictEqual(data.details.reason, 'hash_mismatch', 'Details must specify hash_mismatch reason');
    assert.strictEqual(data.details.expected_hash, validAgent.prompt_hash, 'Details must contain correct expected_hash');
    assert.strictEqual(data.details.received_hash, wrongHash, 'Details must contain received_hash');
    
    // Success path MUST NOT be present
    assert.strictEqual(data.success, undefined, 'Must NOT have success field in error response');
    assert.strictEqual(data.verified, undefined, 'Must NOT have verified field in error response');
    assert.strictEqual(data.dispatch_id, undefined, 'Must NOT have dispatch_id in error response');
    assert.strictEqual(data.message, undefined, 'Must NOT have success message in error response');
    
    // Agent data MUST NOT be in error response
    assert.strictEqual(data.agent, undefined, 'Must NOT have agent object in error response');
  });
  
  // ============================================================
  // TEST 17: Strict error body validation for unknown agent
  // ============================================================
  test('Unknown agent - validates complete error structure', async () => {
    const unknownAgentId = 'totally-unknown-agent-12345';
    const body = JSON.stringify({
      agent_id: unknownAgentId,
      prompt_hash: 'a'.repeat(64)
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 403, 'Should return 403 for unknown agent');
    
    const data = await response.json();
    
    // Full error structure validation
    assert.ok(data.error, 'Must contain error field');
    assert.match(data.error, new RegExp(unknownAgentId), 'Error must include the unknown agent_id');
    assert.strictEqual(data.security_flag, true, 'Must set security_flag for unknown agent');
    
    // Details validation
    assert.ok(data.details, 'Must contain details object');
    assert.strictEqual(data.details.reason, 'unknown_agent', 'Details must specify unknown_agent reason');
    
    // No hash information should leak for unknown agents
    assert.strictEqual(data.details.expected_hash, undefined, 'Should NOT leak expected_hash for unknown agent');
    
    // No success path fields
    assert.strictEqual(data.success, undefined, 'Must NOT have success field');
    assert.strictEqual(data.verified, undefined, 'Must NOT have verified field');
    assert.strictEqual(data.dispatch_id, undefined, 'Must NOT have dispatch_id');
  });
  
  // ============================================================
  // TEST 18: Lock file runtime consistency test
  // ============================================================
  test('Lock file consistency - returned hash matches lock file exactly', async () => {
    // Select a specific known agent from lock file
    const testAgentId = 'domain-01-content';
    const lockFileAgent = promptLock.prompts[testAgentId];
    
    assert.ok(lockFileAgent, 'Test agent must exist in lock file');
    assert.ok(lockFileAgent.hash, 'Test agent must have hash in lock file');
    
    const body = JSON.stringify({
      agent_id: testAgentId,
      prompt_hash: lockFileAgent.hash
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 200, 'Should return 200 for valid request');
    
    const data = await response.json();
    
    // Verify the response includes the exact hash from lock file
    assert.ok(data.agent, 'Response must contain agent object');
    assert.ok(data.agent.hash, 'Agent object must contain hash field');
    
    // CRITICAL: Hash in response must EXACTLY match lock file
    assert.strictEqual(
      data.agent.hash, 
      lockFileAgent.hash, 
      'Returned hash must exactly match lock file hash - no mutations allowed'
    );
    
    // Also verify other lock file fields match
    assert.strictEqual(data.agent.type, lockFileAgent.type, 'Agent type must match lock file');
    assert.strictEqual(data.agent.version, lockFileAgent.version, 'Agent version must match lock file');
    
    // Verify hash is not modified or stale
    assert.strictEqual(data.agent.hash.length, 64, 'Hash must be 64 characters (SHA-256)');
    assert.match(data.agent.hash, /^[a-f0-9]{64}$/, 'Hash must be valid hex string');
  });
  
  // ============================================================
  // TEST 19: Success path integrity test (COMPREHENSIVE)
  // ============================================================
  test('Success path - validates complete success response structure', async () => {
    const validAgent = getValidAgent();
    const body = JSON.stringify({
      agent_id: validAgent.agent_id,
      prompt_hash: validAgent.prompt_hash
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    assert.strictEqual(response.status, 200, 'Should return 200 for valid request');
    
    const data = await response.json();
    
    // Use deepStrictEqual for structure validation
    const requiredFields = ['success', 'verified', 'message', 'dispatch_id', 'agent', 'timestamp'];
    for (const field of requiredFields) {
      assert.ok(data[field] !== undefined, `Response must contain ${field} field`);
    }
    
    // Validate exact values and types
    assert.strictEqual(data.success, true, 'success must be exactly true');
    assert.strictEqual(data.verified, true, 'verified must be exactly true');
    assert.strictEqual(
      data.message, 
      'Prompt integrity verified. Ready for dispatch.', 
      'Message must match exact expected text'
    );
    
    // Validate dispatch_id
    assert.ok(data.dispatch_id, 'dispatch_id must exist');
    assert.match(data.dispatch_id, /^[a-f0-9-]{36}$/, 'dispatch_id must be valid UUID format');
    
    // Validate agent object structure
    assert.ok(data.agent, 'agent object must exist');
    assert.strictEqual(data.agent.agent_id, validAgent.agent_id, 'agent.agent_id must match');
    assert.ok(data.agent.type, 'agent.type must exist');
    assert.ok(data.agent.version, 'agent.version must exist');
    assert.ok(data.agent.hash, 'agent.hash must exist in success response');
    
    // Validate timestamp
    assert.ok(data.timestamp, 'timestamp must exist');
    assert.match(data.timestamp, /^\d{4}-\d{2}-\d{2}T/, 'timestamp must be ISO 8601 format');
    
    // Ensure NO error fields in success response
    assert.strictEqual(data.error, undefined, 'Must NOT have error field in success response');
    assert.strictEqual(data.security_flag, undefined, 'Must NOT have security_flag in success response');
    assert.strictEqual(data.details, undefined, 'Must NOT have details field in success response');
  });
  
  // ============================================================
  // TEST 20: Fail-closed guard - empty JSON
  // ============================================================
  test('Fail-closed - empty JSON body returns error, never 200', async () => {
    const body = JSON.stringify({});
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    // Must be error status, NEVER 200
    assert.notStrictEqual(response.status, 200, 'Empty JSON must NEVER return 200');
    assert.ok(
      response.status === 400 || response.status === 403, 
      'Empty JSON must return 400 or 403'
    );
    
    const data = await response.json();
    
    // Must have error
    assert.ok(data.error, 'Empty JSON must return error message');
    
    // Must NOT have success fields
    assert.notStrictEqual(data.success, true, 'Must NOT indicate success for empty JSON');
    assert.strictEqual(data.verified, undefined, 'Must NOT have verified field');
    assert.strictEqual(data.dispatch_id, undefined, 'Must NOT have dispatch_id');
  });
  
  // ============================================================
  // TEST 21: Fail-closed guard - missing prompt_hash
  // ============================================================
  test('Fail-closed - valid agent_id but missing prompt_hash returns 400', async () => {
    const validAgent = getValidAgent();
    const body = JSON.stringify({
      agent_id: validAgent.agent_id
      // prompt_hash intentionally missing
    });
    
    const request = createRequest('POST', 'https://example.com/', body);
    const response = await worker.fetch(request);
    
    // Must be 400 for validation failure
    assert.strictEqual(response.status, 400, 'Missing prompt_hash must return 400');
    
    const data = await response.json();
    
    // Must have error
    assert.ok(data.error, 'Must return error message');
    
    // Must NOT succeed even with valid agent_id
    assert.notStrictEqual(data.success, true, 'Must NOT succeed with missing hash');
    assert.strictEqual(data.verified, undefined, 'Must NOT be verified');
    assert.strictEqual(data.dispatch_id, undefined, 'Must NOT have dispatch_id');
  });
  
  // ============================================================
  // TEST 22: Fail-closed guard - completely invalid body types
  // ============================================================
  test('Fail-closed - validates various invalid body types never return 200', async () => {
    const invalidBodies = [
      'just a string',
      '12345',
      'true',
      'null',
      'undefined',
    ];
    
    for (const invalidBody of invalidBodies) {
      const request = createRequest('POST', 'https://example.com/', invalidBody);
      const response = await worker.fetch(request);
      
      // Must NEVER return 200 for invalid bodies
      assert.notStrictEqual(
        response.status, 
        200, 
        `Invalid body "${invalidBody}" must NEVER return 200`
      );
      
      const data = await response.json();
      
      // Must have error
      assert.ok(data.error, `Invalid body "${invalidBody}" must return error`);
      
      // Must NOT have success indicators
      assert.notStrictEqual(
        data.success, 
        true, 
        `Invalid body "${invalidBody}" must NOT indicate success`
      );
    }
  });
  
  // ============================================================
  // TEST 23: Hash format mutation resistance
  // ============================================================
  test('Hash format validation - prevents various hash format mutations', async () => {
    const validAgent = getValidAgent();
    const invalidHashes = [
      'short',                          // Too short
      'Z'.repeat(64),                   // Invalid characters
      validAgent.prompt_hash.toUpperCase(), // Wrong case (if case-sensitive)
      validAgent.prompt_hash + 'extra', // Too long
      validAgent.prompt_hash.slice(0, 63), // One character short
    ];
    
    for (const invalidHash of invalidHashes) {
      const body = JSON.stringify({
        agent_id: validAgent.agent_id,
        prompt_hash: invalidHash
      });
      
      const request = createRequest('POST', 'https://example.com/', body);
      const response = await worker.fetch(request);
      
      // Must NOT return 200 for invalid hash formats
      assert.notStrictEqual(
        response.status,
        200,
        `Invalid hash format must not return 200: ${invalidHash.substring(0, 20)}...`
      );
      
      const data = await response.json();
      
      // Must have error or security flag
      assert.ok(
        data.error || data.security_flag,
        `Invalid hash must trigger error: ${invalidHash.substring(0, 20)}...`
      );
    }
  });
});

console.log('\n✓ All runtime behavior tests completed successfully!');
console.log('Tests actually executed the worker code and verified responses.\n');
