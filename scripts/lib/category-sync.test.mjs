// scripts/lib/category-sync.test.mjs
// Verifies that the CATEGORIES list in category-map.mjs stays in sync with
// the enum values in src/content/config.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATEGORIES } from './category-map.mjs';

test('CATEGORIES in category-map matches enum in config.ts', async () => {
  const configSrc = await readFile(
    new URL('../../src/content/config.ts', import.meta.url),
    'utf8'
  );
  // Extract the literal strings inside z.enum([ ... ])
  const enumMatch = configSrc.match(/z\.enum\(\[\s*([^\]]+)\]\)/);
  assert.ok(enumMatch, 'could not locate z.enum([ ... ]) in config.ts');
  const enumBody = enumMatch[1];
  // Match each quoted string (' or ")
  const enumStrings = [...enumBody.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);

  assert.deepEqual(
    [...CATEGORIES],
    enumStrings,
    `CATEGORIES (${CATEGORIES.length}) and config.ts enum (${enumStrings.length}) must match exactly`
  );
});