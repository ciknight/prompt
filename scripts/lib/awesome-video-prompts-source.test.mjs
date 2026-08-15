// scripts/lib/awesome-video-prompts-source.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSourcePrompt, scanSourceRepo } from './awesome-video-prompts-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '../../tests/fixtures/awesome-video-prompts');

test('parseSourcePrompt extracts frontmatter and body', async () => {
  const md = path.join(FIXTURES, 'content/prompts/2026-04/sample-volcanic.md');
  const result = await parseSourcePrompt(md);
  assert.equal(result.title, 'Sample Volcanic');
  assert.equal(result.author, 'TestAuthor');
  assert.equal(result.source_url, 'https://x.com/TestAuthor/status/123');
  assert.deepEqual(result.models, ['seedance2']);
  assert.deepEqual(result.tags, ['cinematic', 'fantasy', 'fire']);
  assert.match(result.body, /火山喷发/);
  assert.match(result.body, /16:9/);
  assert.equal(result.month, '2026-04');
  assert.equal(result.slug, 'sample-volcanic');
  assert.equal(result.draft, false);
});

test('scanSourceRepo finds all .md under content/prompts/', async () => {
  const results = await scanSourceRepo(FIXTURES);
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, 'sample-volcanic');
});