/**
 * Worker Unit Tests
 * Tests fail-closed validation behaviors
 * Uses Node native test runner (node:test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  handleDispatch,
  verifyPromptHash,
  validateRequest,
  methodNotAllowed
} from '../index.js';

// --------------------------------------------------
// TEST: Unknown Agent → 403
// --------------------------------------------------

describe('verifyPromptHash - unknown agent', () => {
  it('should return invalid for unknown agent_id', () => {
    const result = verifyPromptHash('unknown-agent-xyz', 'abc123');
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.details.reason, 'unknown_agent');
  });
});

// --------------------------------------------------
// TEST: Bad Hash → 403
// --------------------------------------------------

describe('verifyPromptHash - hash mismatch', () => {
  it('should return invalid for incorrect hash', () => {
    // Using a valid agent ID from prompt-lock.json but wrong hash
    const result = verifyPromptHash(
      'domain-01-content',
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.details.reason, 'hash_mismatch');
    assert.ok(result.details.expected_hash);
    assert.ok(result.details.received_hash);
  });
});

// --------------------------------------------------
// TEST: Valid Hash → Success
// --------------------------------------------------

describe('verifyPromptHash - valid hash', () => {
  it('should return valid for correct agent_id and hash', () => {
    // Using actual hash from prompt-lock.json for domain-01-content
    const result = verifyPromptHash(
      'domain-01-content',
      '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413'
    );
    
    assert.strictEqual(result.valid, true);
    assert.ok(result.agent);
    assert.strictEqual(result.agent.type, 'domain');
    assert.strictEqual(result.agent.version, '1.0.0');
  });
});

// --------------------------------------------------
// TEST: Invalid JSON → 400
// --------------------------------------------------

describe('validateRequest - invalid JSON structure', () => {
  it('should fail validation for missing agent_id', () => {
    const result = validateRequest({
      prompt_hash: 'abc123'
    });
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some(e => e.includes('agent_id')));
  });

  it('should fail validation for missing prompt_hash', () => {
    const result = validateRequest({
      agent_id: 'test-agent'
    });
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some(e => e.includes('prompt_hash')));
  });

  it('should fail validation for invalid prompt_hash format', () => {
    const result = validateRequest({
      agent_id: 'test-agent',
      prompt_hash: 'not-a-valid-hash'
    });
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some(e => e.includes('SHA-256')));
  });

  it('should pass validation for valid structure', () => {
    const result = validateRequest({
      agent_id: 'test-agent',
      prompt_hash: 'a'.repeat(64) // Valid 64 char hex
    });
    
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });
});

// --------------------------------------------------
// TEST: Wrong Method → 405
// --------------------------------------------------

describe('methodNotAllowed', () => {
  it('should return 405 status response', async () => {
    const response = methodNotAllowed();
    
    assert.strictEqual(response.status, 405);
    
    const body = await response.json();
    assert.strictEqual(body.error, 'Method not allowed.');
  });
});

// --------------------------------------------------
// TEST: handleDispatch - Integration
// --------------------------------------------------

describe('handleDispatch - request validation', () => {
  it('should reject request without content-type header', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => ({}),
    };
    
    // Mock the headers.get method
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return null;
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 415);
    
    const body = await response.json();
    assert.ok(body.error.includes('application/json'));
  });

  it('should reject invalid JSON', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => {
        throw new Error('Invalid JSON');
      },
    };
    
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return 'application/json';
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 400);
    
    const body = await response.json();
    assert.ok(body.error.includes('Invalid JSON'));
  });

  it('should reject request with validation errors', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => ({
        // Missing required fields
      }),
    };
    
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return 'application/json';
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 400);
    
    const body = await response.json();
    assert.ok(body.error.includes('Invalid request'));
    assert.ok(body.details);
  });

  it('should reject unknown agent with 403', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => ({
        agent_id: 'unknown-agent',
        prompt_hash: 'a'.repeat(64),
      }),
    };
    
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return 'application/json';
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 403);
    
    const body = await response.json();
    assert.ok(body.error.includes('Hash verification failed'));
    assert.strictEqual(body.security_flag, true);
  });

  it('should reject hash mismatch with 403', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => ({
        agent_id: 'domain-01-content',
        prompt_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      }),
    };
    
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return 'application/json';
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 403);
    
    const body = await response.json();
    assert.ok(body.error.includes('Hash verification failed'));
    assert.strictEqual(body.security_flag, true);
  });

  it('should accept valid request with correct hash', async () => {
    const mockRequest = {
      headers: new Map(),
      json: async () => ({
        agent_id: 'domain-01-content',
        prompt_hash: '5b469f18967048af5534d4b1193e91ae23f684a489de1d7ae38ac6b660e2f413',
      }),
    };
    
    mockRequest.headers.get = (key) => {
      if (key === 'content-type') return 'application/json';
      return null;
    };
    
    const response = await handleDispatch(mockRequest);
    assert.strictEqual(response.status, 200);
    
    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.verified, true);
    assert.ok(body.dispatch_id);
  });
});
