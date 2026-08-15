// scripts/lib/parseXlsx.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseXlsx } from './parseXlsx.mjs';

test('parseXlsx returns placeholder markdown', async () => {
  const result = await parseXlsx('some/file.xlsx');
  assert.equal(typeof result.markdown, 'string');
  assert.ok(result.markdown.includes('表格'));
  assert.ok(result.markdown.includes('下载原文件') || result.markdown.includes('在本地打开'));
});
