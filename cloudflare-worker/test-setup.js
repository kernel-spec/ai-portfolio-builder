/**
 * Test Setup for Cloudflare Worker Tests
 * 
 * This file configures the test environment to handle JSON imports
 * without import assertions, maintaining Cloudflare Worker compatibility.
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register a custom loader that handles JSON imports
register('./json-loader.js', pathToFileURL('./'));
