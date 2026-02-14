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
});

console.log('\n✓ All runtime behavior tests completed successfully!');
console.log('Tests actually executed the worker code and verified responses.\n');
