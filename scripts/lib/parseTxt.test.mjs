// scripts/lib/parseTxt.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTxt } from './parseTxt.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, '../../tests/fixtures/sample.txt');

test('parseTxt reads UTF-8 file', async () => {
  const result = await parseTxt(FIXTURE);
  assert.equal(typeof result, 'string');
  assert.ok(result.includes('这是测试样本'));
});

test('parseTxt rejects missing file', async () => {
  await assert.rejects(
    () => parseTxt('tests/fixtures/nonexistent.txt'),
    /ENOENT/
  );
});
