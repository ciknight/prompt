// scripts/import-awesome-video-prompts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { runImport } from './import-awesome-video-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '../tests/fixtures/awesome-video-prompts');

test('runImport copies cover.jpg and emits markdown', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-import-'));
  const candidatesPath = path.join(FIXTURES, '_out.json');
  const candidates = [
    {
      slug: 'sample-volcanic',
      month: '2026-04',
      title: 'Sample Volcanic',
      tags_zh: ['电影感'],
      category: '视频生成',
      model: 'seedance2',
      author: 'TestAuthor',
      source_url: 'https://x.com/TestAuthor/status/123',
      landscape_bonus: true,
      description: '火山喷发的测试 prompt。16:9 横屏。',
      filePath: path.join(FIXTURES, 'content/prompts/2026-04/sample-volcanic.md'),
    },
  ];
  await fs.writeFile(candidatesPath, JSON.stringify(candidates, null, 2));

  try {
    const result = await runImport({
      candidatesPath,
      sourceRoot: FIXTURES,
      promptsDir: path.join(tmpRoot, 'src/content/prompts'),
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(result.imported, 1);
    assert.equal(result.skipped, 0);

    const md = await fs.readFile(path.join(tmpRoot, 'src/content/prompts/sample-volcanic.md'), 'utf8');
    assert.match(md, /^---\ntitle: "Sample Volcanic"/m);
    assert.match(md, /^category: 视频生成/m);
    assert.match(md, /^source: awesome-video-prompts/m);
    assert.match(md, /^author: "TestAuthor"/m);
    assert.match(md, /^source_url: "https:\/\/x\.com\/TestAuthor\/status\/123"/m);
    assert.match(md, /^model: "seedance2"/m);
    assert.match(md, /tags: \["电影感"\]/);
    assert.match(md, /!\[\]\(\/content\/prompts\/images\/sample-volcanic\/images\/cover\.jpg\)/);
    assert.match(md, /火山喷发的测试 prompt/);

    const cover = await fs.stat(path.join(tmpRoot, 'public/content/prompts/images/sample-volcanic/images/cover.jpg'));
    assert.ok(cover.size > 0);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    await fs.unlink(candidatesPath).catch(() => {});
  }
});

test('runImport skips entries whose cover.jpg is missing', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-import-'));
  const candidatesPath = path.join(tmpRoot, 'cand.json');
  await fs.writeFile(candidatesPath, JSON.stringify([{
    slug: 'no-cover',
    month: '2026-04',
    title: 'No Cover',
    tags_zh: ['电影感'],
    category: '视频生成',
    model: 'seedance2',
    author: 'A',
    source_url: 'https://x.com/A/1',
    description: 'desc 中文',
    filePath: '/nonexistent/foo.md',
  }]));

  try {
    const result = await runImport({
      candidatesPath,
      sourceRoot: FIXTURES,
      promptsDir: path.join(tmpRoot, 'src/content/prompts'),
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(result.imported, 0);
    assert.equal(result.skipped, 1);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test('runImport resolves slug collision with -2 suffix', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-import-'));
  const promptsDir = path.join(tmpRoot, 'src/content/prompts');
  await fs.mkdir(promptsDir, { recursive: true });
  await fs.writeFile(path.join(promptsDir, 'sample-volcanic.md'), 'PLACEHOLDER');

  const candidatesPath = path.join(tmpRoot, 'cand.json');
  await fs.writeFile(candidatesPath, JSON.stringify([{
    slug: 'sample-volcanic',
    month: '2026-04',
    title: 'Sample Volcanic',
    tags_zh: ['电影感'],
    category: '视频生成',
    model: 'seedance2',
    author: 'TestAuthor',
    source_url: 'https://x.com/TestAuthor/status/123',
    description: 'desc 中文',
    filePath: path.join(FIXTURES, 'content/prompts/2026-04/sample-volcanic.md'),
  }]));

  try {
    const result = await runImport({
      candidatesPath,
      sourceRoot: FIXTURES,
      promptsDir,
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(result.imported, 1);
    const md = await fs.readFile(path.join(promptsDir, 'sample-volcanic-2.md'), 'utf8');
    assert.match(md, /^title: "Sample Volcanic"/m);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});


test('runImport rejects unsafe slug or month (path traversal)', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-import-'));
  const candidatesPath = path.join(tmpRoot, 'cand.json');
  await fs.writeFile(candidatesPath, JSON.stringify([
    { slug: '../../etc/passwd', month: '2026-04', title: 'A', tags_zh: ['电影感'], category: '视频生成', model: 'seedance2', author: 'A', source_url: 'https://x.com/A/1', description: 'desc', filePath: '/x' },
    { slug: 'ok-slug', month: '../2026', title: 'B', tags_zh: ['电影感'], category: '视频生成', model: 'seedance2', author: 'B', source_url: 'https://x.com/B/1', description: 'desc', filePath: '/x' },
  ]));
  try {
    const result = await runImport({
      candidatesPath,
      sourceRoot: FIXTURES,
      promptsDir: path.join(tmpRoot, 'src/content/prompts'),
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(result.imported, 0);
    assert.equal(result.skipped, 2);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});


