/**
 * JSON Loader Hook for Node.js ESM
 * 
 * This loader allows importing JSON files without import assertions,
 * maintaining compatibility with Cloudflare Workers runtime.
 */

import { readFile } from 'node:fs/promises';

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const content = await readFile(new URL(url), 'utf8');
    return {
      format: 'json',
      source: content,
      shortCircuit: true
    };
  }
  return nextLoad(url, context);
}
