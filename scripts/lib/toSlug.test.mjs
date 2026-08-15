import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSlug } from './toSlug.mjs';

test('pinyin transliteration handles common Chinese chars', () => {
  // pinyin-pro is not used here; toSlug uses a lookup map
  // We'll just verify shape for now
  const result = toSlug('漫剧剧本');
  assert.match(result, /^[a-z0-9-]+$/);
  assert.ok(result.length > 0);
});

test('preserves numbers and ASCII', () => {
  assert.equal(toSlug('10秒'), '10miao');
  assert.equal(toSlug('abc-def'), 'abc-def');
});

test('handles parens and dots', () => {
  const result = toSlug('test(10s).docx');
  assert.equal(result.includes('('), false);
  assert.equal(result.includes(')'), false);
  assert.equal(result.includes('.'), false);
});