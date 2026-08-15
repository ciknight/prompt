// scripts/lib/awesome-video-prompts-source.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSourcePrompt,
  scanSourceRepo,
  filterChineseSeedance,
  mapTags,
  inferCategory,
  scoreLandscape,
} from './awesome-video-prompts-source.mjs';

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
  assert.equal(results.length, 4);
  const slugs = results.map(r => r.slug).sort();
  assert.deepEqual(slugs, ['english-only', 'non-seedance', 'sample-volcanic', 'vertical-portrait']);
});

test('filterChineseSeedance keeps Chinese seedance2 prompts only', async () => {
  const all = await scanSourceRepo(FIXTURES);
  const kept = filterChineseSeedance(all);
  const slugs = kept.map(p => p.slug).sort();
  // sample-volcanic + vertical-portrait kept; english-only + non-seedance dropped.
  assert.deepEqual(slugs, ['sample-volcanic', 'vertical-portrait']);
});

test('mapTags translates cinematic→电影感, drops unmapped tags', () => {
  const mapped = mapTags(['cinematic', 'fpv', 'fire']);
  assert.deepEqual(mapped, ['电影感']); // 'fire' not in TAG_SLUGS, dropped
});

test('mapTags preserves order and dedupes', () => {
  const mapped = mapTags(['cinematic', 'realistic', 'cinematic']);
  assert.deepEqual(mapped, ['电影感', '写实']);
});

test('inferCategory routes fantasy+cinematic to 视频生成', () => {
  assert.equal(inferCategory(['cinematic', 'fantasy'], 'seedance2'), '视频生成');
});

test('inferCategory routes animation tags to 动画短片', () => {
  assert.equal(inferCategory(['cinematic', 'animation'], 'seedance2'), '动画短片');
});

test('inferCategory routes ip-design tags to 角色与IP', () => {
  assert.equal(inferCategory(['cinematic', 'ip-design'], 'seedance2'), '角色与IP');
});

test('inferCategory routes fashion/campaign tags to 品牌与商业', () => {
  assert.equal(inferCategory(['cinematic', 'fashion', 'campaign'], 'seedance2'), '品牌与商业');
});

test('inferCategory routes storyboard to 剧本分镜', () => {
  assert.equal(inferCategory(['cinematic', 'storyboard'], 'seedance2'), '剧本分镜');
});

test('scoreLandscape: horizontal > none > vertical', () => {
  const a = { description: '16:9 横屏 cinematic shot', body: 'foo' };
  const b = { description: 'no aspect', body: 'bar' };
  const c = { description: '9:16 竖屏 vertical', body: 'baz' };
  assert.ok(scoreLandscape(a) > scoreLandscape(b));
  assert.ok(scoreLandscape(b) > scoreLandscape(c));
});

