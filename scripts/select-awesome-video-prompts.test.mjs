// scripts/select-awesome-video-prompts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { runSelect } from './select-awesome-video-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '../tests/fixtures/awesome-video-prompts');

test('runSelect filters, maps tags, scores, sorts, limits, and writes JSON', async () => {
  const outPath = path.join(FIXTURES, '_out.json');
  try {
    const result = await runSelect({ rootDir: FIXTURES, outPath, limit: 50 });
    assert.equal(result.count, 2); // sample-volcanic + vertical-portrait
    const written = JSON.parse(await fs.readFile(outPath, 'utf8'));
    assert.equal(written.length, 2);
    const slugs = written.map(p => p.slug);
    assert.ok(slugs.includes('sample-volcanic'));
    assert.ok(slugs.includes('vertical-portrait'));
    // Landscape scoring: sample-volcanic (16:9) should rank ahead of vertical-portrait.
    assert.ok(written[0].slug === 'sample-volcanic');
    // Each entry has tags_zh, category, model, author, source_url, landscape_bonus.
    for (const e of written) {
      assert.ok(Array.isArray(e.tags_zh));
      assert.equal(typeof e.category, 'string');
      assert.equal(e.model, 'seedance2');
      assert.ok(e.author);
      assert.ok(e.source_url);
      assert.equal(typeof e.landscape_bonus, 'boolean');
    }
  } finally {
    try { await fs.unlink(outPath); } catch {}
  }
});