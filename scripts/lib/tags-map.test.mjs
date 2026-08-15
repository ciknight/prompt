// scripts/lib/tags-map.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TAGS_MAP, resolveTags } from './tags-map.mjs';

test('TAGS_MAP covers all 47 files', async () => {
  const { SLUG_MAP } = await import('./slug-map.mjs');
  for (const filename of Object.keys(SLUG_MAP)) {
    assert.ok(TAGS_MAP[filename], `${filename} has no tags mapping`);
  }
  assert.ok(Object.keys(TAGS_MAP).length >= 47);
});

test('every file has 3-6 tags', () => {
  for (const [filename, tags] of Object.entries(TAGS_MAP)) {
    assert.ok(tags.length >= 3, `${filename} has only ${tags.length} tags (min 3)`);
    assert.ok(tags.length <= 6, `${filename} has ${tags.length} tags (max 6)`);
  }
});

test('resolveTags returns the tags for known files', () => {
  assert.deepEqual(resolveTags('实战/《棒球比赛大屏》提示词和操作流程.docx'), ['UI', '写实', '特效']);
});

test('resolveTags throws on unknown file', () => {
  assert.throws(() => resolveTags('不存在的文件.txt'), /no tags/);
});