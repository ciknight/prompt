import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLUG_MAP, resolveSlug } from './slug-map.mjs';

test('SLUG_MAP contains all 47 source files', () => {
  assert.ok(Object.keys(SLUG_MAP).length >= 47);
});

test('resolveSlug returns canonical slug for known file', () => {
  assert.equal(resolveSlug('漫剧剧本分镜衔接指令(10秒).txt'), 'manju-fenjing-jiehe-10s');
  assert.equal(resolveSlug('改文提示词.txt'), 'gaiwen-tici');
});

test('resolveSlug throws on unknown file', () => {
  assert.throws(() => resolveSlug('不存在的文件.txt'), /unknown file/);
});

test('no two files map to the same slug', () => {
  const slugs = Object.values(SLUG_MAP);
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slugs detected');
});
