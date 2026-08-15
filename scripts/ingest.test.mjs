// scripts/ingest.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ingestOne } from './ingest.mjs';
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('ingestOne processes a .txt file end-to-end', async () => {
  const work = await mkdtemp(join(tmpdir(), 'ingest-'));
  const sourceDir = join(work, 'source');
  const outDir = join(work, 'out');
  const archiveDir = join(work, 'archive');
  await mkdir(sourceDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  await writeFile(join(sourceDir, '改文提示词.txt'), '改文测试内容\n第二行', 'utf8');

  await ingestOne({
    relativePath: '改文提示词.txt',
    sourceDir,
    outDir,
    archiveDir,
  });

  const out = await readFile(join(outDir, 'gaiwen-tici.md'), 'utf8');
  assert.match(out, /title: "改文提示词"/);
  assert.match(out, /category: 剧本分镜/);
  assert.ok(out.includes('改文测试内容'));
});