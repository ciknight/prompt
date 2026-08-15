// scripts/lib/category-map.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_MAP, resolveCategory, CATEGORIES } from './category-map.mjs';

test('CATEGORIES has exactly 7 entries', () => {
  assert.equal(CATEGORIES.length, 7);
  assert.ok(CATEGORIES.includes('剧本分镜'));
  assert.ok(CATEGORIES.includes('角色与IP'));
  assert.ok(CATEGORIES.includes('场景视觉'));
  assert.ok(CATEGORIES.includes('视频生成'));
  assert.ok(CATEGORIES.includes('品牌与商业'));
  assert.ok(CATEGORIES.includes('动画短片'));
  assert.ok(CATEGORIES.includes('技能'));
});

test('resolveCategory returns correct category', () => {
  assert.equal(resolveCategory('漫剧剧本分镜衔接指令(10秒).txt'), '剧本分镜');
  assert.equal(resolveCategory('仿真人提示词/S级漫剧人物提示词.txt'), '角色与IP');
  assert.equal(resolveCategory('实战/3D字体材质3提示词和教程.docx'), '场景视觉');
});

test('every slug in slug-map also has category mapping', async () => {
  const { SLUG_MAP } = await import('./slug-map.mjs');
  for (const filename of Object.keys(SLUG_MAP)) {
    assert.doesNotThrow(() => resolveCategory(filename), `${filename} missing category`);
  }
});
