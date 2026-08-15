// tests/import-awesome-video-prompts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { runSelect } from '../scripts/select-awesome-video-prompts.mjs';
import { runImport } from '../scripts/import-awesome-video-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, 'fixtures/awesome-video-prompts');

test('end-to-end: select → import', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-e2e-'));
  try {
    const jsonPath = path.join(tmpRoot, 'selected.json');
    const sel = await runSelect({ rootDir: FIXTURES, outPath: jsonPath, limit: 50 });
    assert.ok(sel.count > 0);

    const imp = await runImport({
      candidatesPath: jsonPath,
      sourceRoot: FIXTURES,
      promptsDir: path.join(tmpRoot, 'src/content/prompts'),
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(imp.imported + imp.skipped, sel.count);

    // Verify each imported prompt has its cover.jpg.
    const files = await fs.readdir(path.join(tmpRoot, 'src/content/prompts'));
    for (const f of files.filter(x => x.endsWith('.md'))) {
      const slug = f.replace(/\.md$/, '');
      const cover = path.join(tmpRoot, 'public/content/prompts/images', slug, 'images', 'cover.jpg');
      await fs.access(cover);
    }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
