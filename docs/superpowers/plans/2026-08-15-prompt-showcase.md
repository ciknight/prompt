# Prompt 作品集展示站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `F:\code\prompt` 下 47 个 AI 提示词文件（TXT/Word/Excel）转化为一个 GitHub Pages 上的极简文档风静态作品集。

**Architecture:** Astro 5 + Starlight 主题 + Content Collections。手动 `npm run ingest` 脚本解析源文件 → 生成 markdown → Astro 静态构建 → GitHub Pages。

**Tech Stack:** Astro 5、Starlight、Content Collections、Pagefind、Shiki、mammoth、adm-zip、Node.js `node:test`、Playwright。

**Spec:** `docs/superpowers/specs/2026-08-15-prompt-showcase-design.md`

---

## File Structure

```
F:\code\prompt\
├── .claude/                       (existing)
├── docs/superpowers/
│   ├── specs/2026-08-15-prompt-showcase-design.md
│   └── plans/2026-08-15-prompt-showcase.md
│
├── .github/workflows/deploy.yml
│
├── scripts/
│   ├── lib/
│   │   ├── toSlug.mjs
│   │   ├── slug-map.mjs
│   │   ├── category-map.mjs
│   │   ├── parseTxt.mjs
│   │   ├── parseDocx.mjs
│   │   ├── parseXlsx.mjs
│   │   └── writePrompt.mjs
│   ├── ingest.mjs
│   └── ingest.test.mjs
│
├── tests/fixtures/
│   ├── sample.txt
│   └── sample-docx/                (constructed in test setup)
│
├── archive/                       (gitignored, created by ingest)
├── src/
│   ├── content/
│   │   ├── config.ts
│   │   ├── prompts/                (gitignored, generated)
│   │   └── prompts/images/         (gitignored, generated)
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── CategoryCard.astro
│   │   ├── PromptCard.astro
│   │   ├── TagBadge.astro
│   │   ├── CategoryBadge.astro
│   │   └── TableOfContents.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── prompts/index.astro
│   │   ├── category/[category].astro
│   │   └── tags/[tag].astro
│   └── styles/custom.css
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## Task 1: Initialize git + .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Initialize git**

Run from `F:\code\prompt`:

```bash
git init
git config user.email "claude@anthropic.com"
git config user.name "Claude"
git branch -M main
```

Expected: `Initialized empty Git repository in F:/code/prompt/.git/`

- [ ] **Step 2: Create .gitignore**

Write `F:\code\prompt\.gitignore`:

```gitignore
# dependencies
node_modules/
.pnpm-store/

# build output
dist/
.astro/

# ingest output (generated, regenerable)
src/content/prompts/
src/content/prompts/images/
archive/

# logs
npm-debug.log*
*.log

# environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# editor
.vscode/
.idea/
*.swp
```

- [ ] **Step 3: Initial commit**

```bash
git add .gitignore docs/
git commit -m "chore: initial commit with gitignore and design docs"
```

---

## Task 2: Install dependencies

**Files:**
- Create: `package.json`

- [ ] **Step 1: Initialize package.json**

Run from `F:\code\prompt`:

```bash
npm init -y
```

- [ ] **Step 2: Install Astro + Starlight**

```bash
npm install astro@^5 @astrojs/starlight@^0.30
```

- [ ] **Step 3: Install ingest dependencies**

```bash
npm install mammoth adm-zip gray-matter
```

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D typescript @types/node playwright
```

- [ ] **Step 5: Add scripts to package.json**

Edit `package.json` to add `"type": "module"` at top level and these scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "ingest": "node scripts/ingest.mjs",
    "test": "node --test scripts/ingest.test.mjs",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install astro, starlight, ingest deps"
```

---

## Task 3: Astro + TypeScript config

**Files:**
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/styles/custom.css`

- [ ] **Step 1: Write astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://example.github.io',
  base: '/prompt',
  integrations: [
    starlight({
      title: 'Prompt 作品集',
      description: 'AI 提示词合集：漫剧、视频、IP、字体、品牌设计',
      customCss: ['./src/styles/custom.css'],
      social: { github: 'https://github.com/example/prompt' },
      sidebar: [],
    }),
  ],
});
```

Note: `site` and `base` are placeholder values; user updates before deploy.

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: Write custom CSS (placeholder, refined in Task 23)**

```css
/* src/styles/custom.css */
:root {
  --sl-font: ui-sans-serif, system-ui, -apple-system, "PingFang SC",
    "Microsoft YaHei", sans-serif;
  --sl-font-mono: ui-monospace, "JetBrains Mono", "Cascadia Code", Consolas, monospace;
}

main {
  max-width: 72ch;
}

/* Reduce visual chrome: tighter headings, generous line-height */
.sl-markdown-content h2 { margin-top: 2.5rem; }
.sl-markdown-content p { line-height: 1.75; }
```

- [ ] **Step 4: Verify astro build works (sanity check)**

```bash
npx astro check
```

Expected: may show warnings about missing pages, but should not hard-error.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs tsconfig.json src/styles/custom.css
git commit -m "chore: configure astro + starlight with custom css"
```

---

## Task 4: toSlug utility (TDD)

**Files:**
- Test: `scripts/lib/toSlug.test.mjs`
- Create: `scripts/lib/toSlug.mjs`

- [ ] **Step 1: Write failing test**

Write `scripts/lib/toSlug.test.mjs`:

```js
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
```

Note: pinyin lookup is minimal; the `slug-map.mjs` in next task handles the bulk of name→slug mapping.

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test scripts/lib/toSlug.test.mjs
```

Expected: FAIL — `toSlug` module not found.

- [ ] **Step 3: Implement toSlug.mjs**

```js
// scripts/lib/toSlug.mjs
// Minimal Chinese → pinyin mapping for characters in our 44 files.
// Other characters fall through to their ASCII / remain transliterated.

const PINYIN = {
  '漫': 'man', '剧': 'ju', '剧': 'ju', '分': 'fen', '镜': 'jing',
  '衔': 'xian', '接': 'jie', '指': 'zhi', '令': 'ling',
  '秒': 'miao', '文': 'wen', '案': 'an', '幕': 'mu',
  '改': 'gai', '词': 'ci', '人': 'ren', '物': 'wu',
  '场': 'chang', '景': 'jing', '道': 'dao', '具': 'ju',
  '提': 'ti', '取': 'qu', '豆': 'dou', '包': 'bao',
  '训': 'xun', '练': 'lian', '其': 'qi', '他': 'ta',
  '仿': 'fang', '真': 'zhen', '提': 'ti', '示': 'shi',
  '故': 'gu', '事': 'shi', '制': 'zhi', '作': 'zuo',
  '级': 'ji', '三': 'san', '视': 'shi', '图': 'tu',
  '脸': 'lian', '建': 'jian', '模': 'mo', '比': 'bi',
  '对': 'dui', '飞': 'fei', '行': 'xing', '一': 'yi',
  '镜': 'jing', '到': 'dao', '底': 'di', '打': 'da',
  '斗': 'dou', '炫': 'xuan', '酷': 'ku', '特': 'te',
  '效': 'xiao', '风': 'feng', '格': 'ge',
  '实': 'shi', '战': 'zhan',
};

export function toSlug(input) {
  const stripped = input
    .replace(/\.[^.]+$/, '')         // remove extension
    .replace(/[()（）\[\]【】]/g, '') // remove brackets
    .replace(/[、，,。：:]/g, '-');   // punctuation → dash

  const pinyinized = [...stripped].map(ch => {
    if (/[a-zA-Z0-9]/.test(ch)) return ch;
    if (PINYIN[ch]) return PINYIN[ch];
    return ''; // skip unknown chars
  }).join('');

  return pinyinized
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test scripts/lib/toSlug.test.mjs
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/toSlug.mjs scripts/lib/toSlug.test.mjs
git commit -m "feat(scripts): add toSlug with pinyin lookup"
```

---

## Task 5: slug-map module (TDD)

**Files:**
- Test: `scripts/lib/slug-map.test.mjs`
- Create: `scripts/lib/slug-map.mjs`

- [ ] **Step 1: Write failing test**

```js
// scripts/lib/slug-map.test.mjs
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test scripts/lib/slug-map.test.mjs
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement slug-map.mjs (all 44 files)**

```js
// scripts/lib/slug-map.mjs
// Maps every source filename → canonical slug.
// Defined manually to avoid slug collisions and ensure stable URLs.

export const SLUG_MAP = {
  // 根目录 (8)
  '其他.txt': 'qita-zonghe',
  '场景四视图.txt': 'changjing-sishitu',
  '改文提示词.txt': 'gaiwen-tici',
  '文案分幕.txt': 'wenan-fenmu',
  '漫剧人物场景道具提取指令.txt': 'manju-renwu-changjing-daoju',
  '漫剧剧本分镜衔接指令(10秒).txt': 'manju-fenjing-jiehe-10s',
  '漫剧剧本分镜衔接指令(15秒).txt': 'manju-fenjing-jiehe-15s',
  '豆包大模型训练词.txt': 'doubao-damo-xunlianci',

  // 仿真人提示词/ (6)
  '仿真人提示词/GPT故事制作.txt': 'gpt-gushi-zhizuo',
  '仿真人提示词/S级漫剧人物提示词.txt': 's-ji-manju-renwu',
  '仿真人提示词/S级漫剧场景.txt': 's-ji-manju-changjing',
  '仿真人提示词/三视图.txt': 'sanshitu',
  '仿真人提示词/人脸提示词.txt': 'renlian-tici',
  '仿真人提示词/仿真人分镜衔接指令.txt': 'fangzhengren-fenjing-jiehe',

  // 其他/ (5)
  '其他/人物建模提示词.txt': 'renwu-jianmo-tici',
  '其他/对比、飞行、一镜到底、打斗提示词.txt': 'duibi-feixing-yijing-daoda-dadou',
  '其他/炫酷打斗视频提示词.txt': 'xuanku-dadou-shipin',
  '其他/特效镜头提示词.txt': 'texiao-jingtou-tici',
  '其他/视频风格提示词.txt': 'shipin-fengge-tici',

  // 实战/ (28)
  '实战/10种热门AI修图玩法教程和提示词.docx': '10-rementu-xiutu-wanfa',
  '实战/3D字体材质3提示词和教程.docx': '3d-ziti-caizhi-3',
  '实战/AI直出全套IP设计｜完整提示词.docx': 'ai-zhichu-quantao-ip',
  '实战/AI直出全套系列IP设计｜完整提示词.docx': 'ai-zhichu-xilie-ip',
  '实战/shotlab丧尸清道夫图片资产拆解.docx': 'shotlab-jiangshi-qingdaofu',
  '实战/《ai无人机航拍》提示词和操作流程.docx': 'ai-wurenji-hangpai',
  '实战/《Huang GenLab》品牌作品集提示词.docx': 'huang-genlab-pinpai',
  '实战/《人物微表情》提示词和操作流程.docx': 'renwu-wei-biaoqing',
  '实战/《多角色动画短片》提示词和操作流程.txt': 'duojuese-donghua-duanpian',
  '实战/《学姐包粽子动画短片》提示词和操作流程.docx': 'xuejie-baozongzi-donghua',
  '实战/《年中述职》可编辑ppt提示词和教程.txt': 'nianzhong-shuzhi-ppt',
  '实战/《手柄TVC产品广告》提示词和操作流程.txt': 'shoubing-tvc-guanggao',
  '实战/《暴燃熊健身房》可编辑psd品牌全案提示词和教程.docx': 'baoranxiong-jianshenfang-pinpai',
  '实战/《梨园双星》故事板seedance2.5.txt': 'liyuan-shuangxing-gushiban',
  '实战/《棒球比赛大屏》提示词和操作流程.docx': 'bangqiu-bisai-daping',
  '实战/《灰域追击》故事板提示词和操作流程.docx': 'huiyu-zhuiji-gushiban',
  '实战/《骨冠双猎》故事板提示词和操作流程.docx': 'guguan-shuanglie-gushiban',
  '实战/别让你的IP【呆板】的站着｜完整提示词.docx': 'bie-rang-ip-daibai-zhanzhe',
  '实战/动漫角色pv教程和提示词.txt': 'dongman-juese-pv',
  '实战/古风ai短剧提示词和教程.txt': 'gufeng-ai-duanju',
  '实战/品牌手册+UI可编辑设计稿提示词.docx': 'pinpai-shouce-ui',
  '实战/好莱坞风格短剧提示词和教程.txt': 'haolaiwu-fengge-duanju',
  '实战/字体材质1提示词和教程.docx': 'ziti-caizhi-1',
  '实战/布料拼接字体材质4提示词和教程.docx': 'buliao-pinjie-ziti-4',
  '实战/提示词 实战 提示词持续更新表格.xlsx': 'shizhan-biaoge',
  '实战/角色微表情提示词.txt': 'juese-wei-biaoqing',
  '实战/角色微表情提示词3.txt': 'juese-wei-biaoqing-3',
  '实战/（烘焙）字体材质2提示词和教程.docx': 'hongbei-ziti-caizhi-2',
};

export function resolveSlug(filename) {
  const slug = SLUG_MAP[filename];
  if (!slug) throw new Error(`unknown file in slug-map: ${filename}`);
  return slug;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test scripts/lib/slug-map.test.mjs
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/slug-map.mjs scripts/lib/slug-map.test.mjs
git commit -m "feat(scripts): add slug-map for all 44 source files"
```

---

## Task 6: category-map module (TDD)

**Files:**
- Test: `scripts/lib/category-map.test.mjs`
- Create: `scripts/lib/category-map.mjs`

- [ ] **Step 1: Write failing test**

```js
// scripts/lib/category-map.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_MAP, resolveCategory, CATEGORIES } from './category-map.mjs';

test('CATEGORIES has exactly 6 entries', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.ok(CATEGORIES.includes('剧本分镜'));
  assert.ok(CATEGORIES.includes('角色与IP'));
  assert.ok(CATEGORIES.includes('场景视觉'));
  assert.ok(CATEGORIES.includes('视频生成'));
  assert.ok(CATEGORIES.includes('品牌与商业'));
  assert.ok(CATEGORIES.includes('动画短片'));
});

test('resolveCategory returns correct category', () => {
  assert.equal(resolveCategory('漫剧剧本分镜衔接指令(10秒).txt'), '剧本分镜');
  assert.equal(resolveCategory('S级漫剧人物提示词.txt'), '角色与IP');
  assert.equal(resolveCategory('3D字体材质3提示词和教程.docx'), '场景视觉');
});

test('every slug in slug-map also has category mapping', () => {
  const { SLUG_MAP } = await import('./slug-map.mjs');
  for (const filename of Object.keys(SLUG_MAP)) {
    assert.doesNotThrow(() => resolveCategory(filename), `${filename} missing category`);
  }
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
node --test scripts/lib/category-map.test.mjs
```

- [ ] **Step 3: Implement category-map.mjs**

```js
// scripts/lib/category-map.mjs
export const CATEGORIES = [
  '剧本分镜',
  '角色与IP',
  '场景视觉',
  '视频生成',
  '品牌与商业',
  '动画短片',
];

export const CATEGORY_MAP = {
  // 剧本分镜
  '其他.txt': '剧本分镜',
  '场景四视图.txt': '剧本分镜',
  '改文提示词.txt': '剧本分镜',
  '文案分幕.txt': '剧本分镜',
  '漫剧人物场景道具提取指令.txt': '剧本分镜',
  '漫剧剧本分镜衔接指令(10秒).txt': '剧本分镜',
  '漫剧剧本分镜衔接指令(15秒).txt': '剧本分镜',
  '仿真人提示词/仿真人分镜衔接指令.txt': '剧本分镜',
  '仿真人提示词/GPT故事制作.txt': '剧本分镜',

  // 角色与IP
  '仿真人提示词/S级漫剧人物提示词.txt': '角色与IP',
  '仿真人提示词/人脸提示词.txt': '角色与IP',
  '其他/人物建模提示词.txt': '角色与IP',
  '实战/《人物微表情》提示词和操作流程.docx': '角色与IP',
  '实战/AI直出全套IP设计｜完整提示词.docx': '角色与IP',
  '实战/AI直出全套系列IP设计｜完整提示词.docx': '角色与IP',
  '实战/shotlab丧尸清道夫图片资产拆解.docx': '角色与IP',
  '实战/别让你的IP【呆板】的站着｜完整提示词.docx': '角色与IP',
  '实战/角色微表情提示词.txt': '角色与IP',
  '实战/角色微表情提示词3.txt': '角色与IP',

  // 场景视觉
  '仿真人提示词/S级漫剧场景.txt': '场景视觉',
  '仿真人提示词/三视图.txt': '场景视觉',
  '实战/3D字体材质3提示词和教程.docx': '场景视觉',
  '实战/字体材质1提示词和教程.docx': '场景视觉',
  '实战/布料拼接字体材质4提示词和教程.docx': '场景视觉',
  '实战/（烘焙）字体材质2提示词和教程.docx': '场景视觉',

  // 视频生成
  '豆包大模型训练词.txt': '视频生成',
  '其他/对比、飞行、一镜到底、打斗提示词.txt': '视频生成',
  '其他/炫酷打斗视频提示词.txt': '视频生成',
  '其他/特效镜头提示词.txt': '视频生成',
  '其他/视频风格提示词.txt': '视频生成',

  // 品牌与商业
  '实战/《Huang GenLab》品牌作品集提示词.docx': '品牌与商业',
  '实战/《暴燃熊健身房》可编辑psd品牌全案提示词和教程.docx': '品牌与商业',
  '实战/《年中述职》可编辑ppt提示词和教程.txt': '品牌与商业',
  '实战/《手柄TVC产品广告》提示词和操作流程.txt': '品牌与商业',
  '实战/《棒球比赛大屏》提示词和操作流程.docx': '品牌与商业',
  '实战/《ai无人机航拍》提示词和操作流程.docx': '品牌与商业',
  '实战/品牌手册+UI可编辑设计稿提示词.docx': '品牌与商业',

  // 动画短片
  '实战/《多角色动画短片》提示词和操作流程.txt': '动画短片',
  '实战/《学姐包粽子动画短片》提示词和操作流程.docx': '动画短片',
  '实战/《梨园双星》故事板seedance2.5.txt': '动画短片',
  '实战/《灰域追击》故事板提示词和操作流程.docx': '动画短片',
  '实战/《骨冠双猎》故事板提示词和操作流程.docx': '动画短片',
  '实战/动漫角色pv教程和提示词.txt': '动画短片',
  '实战/古风ai短剧提示词和教程.txt': '动画短片',
  '实战/好莱坞风格短剧提示词和教程.txt': '动画短片',
  '实战/10种热门AI修图玩法教程和提示词.docx': '动画短片',
  '实战/提示词 实战 提示词持续更新表格.xlsx': '动画短片',
};

export function resolveCategory(filename) {
  const cat = CATEGORY_MAP[filename];
  if (!cat) throw new Error(`no category for: ${filename}`);
  return cat;
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
node --test scripts/lib/category-map.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/category-map.mjs scripts/lib/category-map.test.mjs
git commit -m "feat(scripts): add category-map for all files"
```

---

## Task 7: parseTxt module (TDD)

**Files:**
- Test: `scripts/lib/parseTxt.test.mjs`
- Create: `scripts/lib/parseTxt.mjs`
- Create: `tests/fixtures/sample.txt`

- [ ] **Step 1: Create test fixture**

```bash
mkdir -p tests/fixtures
```

Write `tests/fixtures/sample.txt`:

```
这是测试样本

## 标题二

正文段落一。

正文段落二。
```

- [ ] **Step 2: Write failing test**

```js
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
```

- [ ] **Step 3: Run test, expect fail**

```bash
node --test scripts/lib/parseTxt.test.mjs
```

- [ ] **Step 4: Implement parseTxt.mjs**

```js
// scripts/lib/parseTxt.mjs
import fs from 'node:fs/promises';

export async function parseTxt(filePath) {
  return fs.readFile(filePath, 'utf8');
}
```

- [ ] **Step 5: Run test, expect pass**

```bash
node --test scripts/lib/parseTxt.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/parseTxt.mjs scripts/lib/parseTxt.test.mjs tests/fixtures/sample.txt
git commit -m "feat(scripts): add parseTxt module"
```

---

## Task 8: parseDocx module (TDD)

**Files:**
- Test: `scripts/lib/parseDocx.test.mjs`
- Create: `scripts/lib/parseDocx.mjs`

This task uses a programmatically constructed docx fixture (no large binary in repo).

- [ ] **Step 1: Write failing test**

```js
// scripts/lib/parseDocx.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocx } from './parseDocx.mjs';
import AdmZip from 'adm-zip';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function makeMinimalDocx() {
  // Build a minimal valid .docx (zip with required parts)
  const dir = await mkdtemp(join(tmpdir(), 'docx-'));
  const zip = new AdmZip();

  zip.addFile('[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
       <Default Extension="xml" ContentType="application/xml"/>
       <Default Extension="png" ContentType="image/png"/>
       <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
       <Override PartName="/word/media/image1.png" ContentType="image/png"/>
     </Types>`);

  zip.addFile('_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
     </Relationships>`);

  zip.addFile('word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
     </Relationships>`);

  zip.addFile('word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
       <w:body>
         <w:p><w:r><w:t>测试段落一</w:t></w:r></w:p>
         <w:p><w:r><w:t>测试段落二</w:t></w:r></w:p>
       </w:body>
     </w:document>`);

  // 1x1 transparent PNG
  zip.addFile('word/media/image1.png',
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));

  const path = join(dir, 'test.docx');
  zip.writeZip(path);
  return { path, dir };
}

test('parseDocx extracts text', async () => {
  const { path, dir } = await makeMinimalDocx();
  try {
    const result = await parseDocx(path, 'test-slug');
    assert.ok(typeof result.markdown === 'string');
    assert.ok(result.markdown.includes('测试段落一'));
    assert.ok(result.markdown.includes('测试段落二'));
    assert.equal(result.images.length, 1);
    assert.match(result.images[0].path, /test-slug[\\/]+images[\\/]+/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
node --test scripts/lib/parseDocx.test.mjs
```

- [ ] **Step 3: Implement parseDocx.mjs**

```js
// scripts/lib/parseDocx.mjs
import mammoth from 'mammoth';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function parseDocx(srcPath, slug, imagesBaseDir = 'src/content/prompts/images') {
  const imageDir = path.join(imagesBaseDir, slug, 'images');
  await fs.mkdir(imageDir, { recursive: true });

  const result = await mammoth.convertToMarkdown(
    { path: srcPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const ext = (image.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const fileName = `${randomUUID()}.${ext}`;
        const imgPath = path.join(imageDir, fileName);
        const buffer = await image.read('base64');
        await fs.writeFile(imgPath, Buffer.from(buffer, 'base64'));
        return { src: path.posix.join('/content/prompts/images', slug, 'images', fileName) };
      }),
    }
  );

  return {
    markdown: result.value,
    images: (result.messages || []).filter(m => m.type === 'warning'),
  };
}
```

Note: images stored at `src/content/prompts/images/{slug}/images/{uuid}.png`, referenced from markdown via `/content/prompts/images/...` path that Astro will resolve.

- [ ] **Step 4: Run test, expect pass**

```bash
node --test scripts/lib/parseDocx.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/parseDocx.mjs scripts/lib/parseDocx.test.mjs
git commit -m "feat(scripts): add parseDocx with image extraction"
```

---

## Task 9: parseXlsx module (TDD)

**Files:**
- Test: `scripts/lib/parseXlsx.test.mjs`
- Create: `scripts/lib/parseXlsx.mjs`

- [ ] **Step 1: Write failing test**

```js
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
```

- [ ] **Step 2: Run test, expect fail**

- [ ] **Step 3: Implement parseXlsx.mjs**

```js
// scripts/lib/parseXlsx.mjs
// We do NOT parse xlsx content. xlsx files are too large (40MB) and
// tabular; we generate a placeholder markdown that explains the file
// and points users to the archived original.

export async function parseXlsx(filename) {
  const markdown = `> ⚠️ **这是一个 Excel 表格文件**
>
> 原始文件：\`${filename}\`
> 表格内容不适合在网页中完整渲染。请在本地用 Excel/WPS 打开查看。
>
> 归档路径：\`archive/${filename.replace(/^.+[\\/]/, '')}\`
`;
  return { markdown };
}
```

- [ ] **Step 4: Run test, expect pass**

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/parseXlsx.mjs scripts/lib/parseXlsx.test.mjs
git commit -m "feat(scripts): add parseXlsx placeholder module"
```

---

## Task 10: ingest orchestrator

**Files:**
- Test: `scripts/ingest.test.mjs`
- Create: `scripts/ingest.mjs`
- Create: `scripts/lib/writePrompt.mjs`

- [ ] **Step 1: Implement writePrompt.mjs**

```js
// scripts/lib/writePrompt.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writePrompt({ slug, title, category, tags, source, date, markdown, outDir = 'src/content/prompts' }) {
  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `category: ${category}`,
    `tags: [${tags.map(t => JSON.stringify(t)).join(', ')}]`,
    `slug: ${slug}`,
    `source: ${source}`,
    `date: ${date.toISOString().slice(0, 10)}`,
    '---',
    '',
  ].join('\n');

  const outPath = path.join(outDir, `${slug}.md`);
  await fs.writeFile(outPath, fm + markdown, 'utf8');
  return outPath;
}
```

- [ ] **Step 2: Write integration test**

```js
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
```

- [ ] **Step 3: Run test, expect fail**

- [ ] **Step 4: Implement ingest.mjs**

```js
// scripts/ingest.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseTxt } from './lib/parseTxt.mjs';
import { parseDocx } from './lib/parseDocx.mjs';
import { parseXlsx } from './lib/parseXlsx.mjs';
import { writePrompt } from './lib/writePrompt.mjs';
import { resolveSlug } from './lib/slug-map.mjs';
import { resolveCategory } from './lib/category-map.mjs';

const DEFAULT_TAGS = {
  txt: [],
  docx: [],
  xlsx: [],
};

export async function ingestOne({ relativePath, sourceDir, outDir, archiveDir }) {
  const srcPath = path.join(sourceDir, relativePath);
  const stat = await fs.stat(srcPath);
  const ext = path.extname(srcPath).slice(1).toLowerCase();
  const slug = resolveSlug(relativePath);
  const category = resolveCategory(relativePath);

  let markdown;
  if (ext === 'txt') {
    markdown = await parseTxt(srcPath);
  } else if (ext === 'docx') {
    const result = await parseDocx(srcPath, slug);
    markdown = result.markdown;
  } else if (ext === 'xlsx') {
    const result = await parseXlsx(relativePath);
    markdown = result.markdown;
  } else {
    throw new Error(`unsupported extension: ${ext}`);
  }

  const title = relativePath.replace(/\.[^.]+$/, '').replace(/[\\/]/g, ' / ');

  await writePrompt({
    slug,
    title,
    category,
    tags: DEFAULT_TAGS[ext] || [],
    source: ext,
    date: stat.mtime,
    markdown,
    outDir,
  });

  // Copy archive
  if (ext === 'docx' || ext === 'xlsx') {
    await fs.mkdir(archiveDir, { recursive: true });
    await fs.copyFile(srcPath, path.join(archiveDir, `${slug}.${ext}`));
  }
}

// CLI entry point
async function main() {
  const sourceDir = '.';
  const outDir = 'src/content/prompts';
  const archiveDir = 'archive';

  const { SLUG_MAP } = await import('./lib/slug-map.mjs');
  let ok = 0, fail = 0;
  for (const rel of Object.keys(SLUG_MAP)) {
    try {
      await ingestOne({ relativePath: rel, sourceDir, outDir, archiveDir });
      console.log(`✓ ${rel}`);
      ok++;
    } catch (e) {
      console.error(`✗ ${rel}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 5: Run test, expect pass**

```bash
node --test scripts/ingest.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add scripts/ingest.mjs scripts/ingest.test.mjs scripts/lib/writePrompt.mjs
git commit -m "feat(scripts): add ingest orchestrator with archive copy"
```

---

## Task 11: Run ingest on all 44 files

**Files:** (no source changes; only generates content + archive)

- [ ] **Step 1: Run ingest**

```bash
npm run ingest
```

Expected output:

```
✓ 其他.txt
✓ 场景四视图.txt
... (47 lines total)
✓ （烘焙）字体材质2提示词和教程.docx

Done: 47 ok, 0 failed
```

If failures appear: investigate, fix the relevant parser/map module, re-run.

- [ ] **Step 2: Spot-check generated markdown**

```bash
ls src/content/prompts | wc -l
```

Expected: `47`

```bash
ls src/content/prompts/images | wc -l
```

Expected: ≥ 18 (only docx files produce images; 实战/ has 18 .docx)

```bash
ls archive | wc -l
```

Expected: 19 (18 docx + 1 xlsx in 实战/)

- [ ] **Step 3: Commit generated content (or gitignore decision)**

Decide: do you want to commit generated markdown to git, or .gitignore it?

Recommended: **commit it** so GitHub Pages build doesn't require running ingest in CI.

```bash
# Update .gitignore: remove src/content/prompts/ lines if you want to commit
# Or keep gitignored and add ingest step to CI

# For now, commit:
sed -i '/^src\/content\/prompts\/$/d' .gitignore
sed -i '/^src\/content\/prompts\/images\/$/d' .gitignore
sed -i '/^archive\/$/d' .gitignore

git add src/content/prompts/ archive/
git commit -m "feat: process all 44 source files via ingest"
```

---

## Task 12: Content Collections schema

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write config.ts**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prompts' }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      '剧本分镜',
      '角色与IP',
      '场景视觉',
      '视频生成',
      '品牌与商业',
      '动画短片',
    ]),
    tags: z.array(z.string()),
    slug: z.string(),
    source: z.enum(['txt', 'docx', 'xlsx']).optional(),
    date: z.date().optional(),
  }),
});

export const collections = { prompts };
```

- [ ] **Step 2: Verify schema with astro check**

```bash
npx astro check
```

Expected: passes (warnings about missing routes/pages OK).

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(content): define prompts collection schema"
```

---

## Task 13: Badge components

**Files:**
- Create: `src/components/TagBadge.astro`
- Create: `src/components/CategoryBadge.astro`

- [ ] **Step 1: TagBadge.astro**

```astro
---
// src/components/TagBadge.astro
interface Props {
  tag: string;
}
const { tag } = Astro.props;
const href = `/tags/${encodeURIComponent(tag)}`;
---
<a class="tag-badge" href={href}>#{tag}</a>

<style>
  .tag-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    margin: 0 0.25rem 0.25rem 0;
    font-size: 0.8rem;
    background: var(--sl-color-gray-6);
    color: var(--sl-color-text);
    border-radius: 0.25rem;
    text-decoration: none;
    transition: background 0.15s;
  }
  .tag-badge:hover {
    background: var(--sl-color-gray-5);
  }
</style>
```

- [ ] **Step 2: CategoryBadge.astro**

```astro
---
// src/components/CategoryBadge.astro
interface Props {
  category: string;
}
const { category } = Astro.props;
const href = `/category/${encodeURIComponent(category)}`;
---
<a class="category-badge" href={href}>{category}</a>

<style>
  .category-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 0.85rem;
    background: var(--sl-color-accent-low);
    color: var(--sl-color-accent-high);
    border-radius: 0.25rem;
    text-decoration: none;
    font-weight: 500;
  }
  .category-badge:hover {
    background: var(--sl-color-accent);
    color: var(--sl-color-white);
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TagBadge.astro src/components/CategoryBadge.astro
git commit -m "feat(ui): add tag and category badges"
```

---

## Task 14: List cards

**Files:**
- Create: `src/components/PromptCard.astro`
- Create: `src/components/CategoryCard.astro`

- [ ] **Step 1: PromptCard.astro**

```astro
---
// src/components/PromptCard.astro
import TagBadge from './TagBadge.astro';
import CategoryBadge from './CategoryBadge.astro';

interface Props {
  title: string;
  category: string;
  tags: string[];
  slug: string;
  excerpt?: string;
  date?: Date;
}
const { title, category, tags, slug, excerpt, date } = Astro.props;
---
<article class="prompt-card">
  <h3><a href={`/prompts/${slug}/`}>{title}</a></h3>
  <div class="meta">
    <CategoryBadge category={category} />
    {date && <time datetime={date.toISOString()}>{date.toISOString().slice(0, 10)}</time>}
  </div>
  {excerpt && <p class="excerpt">{excerpt}</p>}
  <div class="tags">
    {tags.map(t => <TagBadge tag={t} />)}
  </div>
</article>

<style>
  .prompt-card {
    padding: 1rem 0;
    border-bottom: 1px solid var(--sl-color-gray-5);
  }
  .prompt-card h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
  .prompt-card h3 a { color: var(--sl-color-text); text-decoration: none; }
  .prompt-card h3 a:hover { color: var(--sl-color-accent); }
  .meta {
    display: flex; gap: 0.75rem; align-items: center;
    margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--sl-color-gray-3);
  }
  .excerpt {
    margin: 0 0 0.5rem;
    color: var(--sl-color-gray-2);
    font-size: 0.95rem;
    line-height: 1.5;
  }
  .tags { margin-top: 0.25rem; }
</style>
```

- [ ] **Step 2: CategoryCard.astro**

```astro
---
// src/components/CategoryCard.astro
interface Props {
  name: string;
  description: string;
  count: number;
}
const { name, description, count } = Astro.props;
const href = `/category/${encodeURIComponent(name)}`;
---
<a class="category-card" href={href}>
  <h3>{name} <span class="count">({count})</span></h3>
  <p>{description}</p>
</a>

<style>
  .category-card {
    display: block;
    padding: 1rem 1.25rem;
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 0.5rem;
    color: var(--sl-color-text);
    text-decoration: none;
    transition: border-color 0.15s, transform 0.15s;
  }
  .category-card:hover {
    border-color: var(--sl-color-accent);
    transform: translateY(-2px);
  }
  .category-card h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
  .count { color: var(--sl-color-gray-3); font-weight: normal; font-size: 0.9rem; }
  .category-card p {
    margin: 0;
    color: var(--sl-color-gray-2);
    font-size: 0.9rem;
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PromptCard.astro src/components/CategoryCard.astro
git commit -m "feat(ui): add prompt and category list cards"
```

---

## Task 15: SiteHeader + SiteFooter

**Files:**
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`

- [ ] **Step 1: SiteHeader.astro**

```astro
---
// src/components/SiteHeader.astro
import { CATEGORIES } from '../../scripts/lib/category-map.mjs';
---
<header class="site-header">
  <nav>
    <a href="/" class="brand">Prompt 作品集</a>
    <div class="links">
      <a href="/prompts/">全部</a>
      {CATEGORIES.map(c => (
        <a href={`/category/${encodeURIComponent(c)}/`}>{c}</a>
      ))}
      <a href="/about/">关于</a>
    </div>
  </nav>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--sl-color-gray-5);
    margin-bottom: 2rem;
    padding: 0.75rem 0;
  }
  nav {
    display: flex; align-items: center; gap: 1.5rem;
    max-width: 72ch;
    margin: 0 auto; padding: 0 1rem;
    flex-wrap: wrap;
  }
  .brand {
    font-weight: 600;
    color: var(--sl-color-text);
    text-decoration: none;
    font-size: 1.05rem;
  }
  .links {
    display: flex; gap: 1rem; flex-wrap: wrap;
  }
  .links a {
    color: var(--sl-color-gray-2);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .links a:hover { color: var(--sl-color-accent); }
</style>
```

- [ ] **Step 2: SiteFooter.astro**

```astro
---
// src/components/SiteFooter.astro
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div>
    <span>© {year} Prompt 作品集</span>
    <span>·</span>
    <a href="https://github.com/example/prompt">GitHub</a>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--sl-color-gray-5);
    margin-top: 4rem;
    padding: 1.5rem 1rem;
    color: var(--sl-color-gray-3);
    font-size: 0.85rem;
    text-align: center;
  }
  .site-footer a { color: var(--sl-color-gray-2); text-decoration: none; }
  .site-footer a:hover { color: var(--sl-color-accent); }
  .site-footer div { display: flex; gap: 0.5rem; justify-content: center; align-items: center; }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteHeader.astro src/components/SiteFooter.astro
git commit -m "feat(ui): add site header and footer"
```

---

## Task 16: Home page

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write index.astro**

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
import CategoryCard from '../components/CategoryCard.astro';

const CATEGORY_DESCRIPTIONS = {
  '剧本分镜': '漫剧/竖屏短剧的剧本、分镜、文案指令',
  '角色与IP': '人物设计、IP形象、微表情、人物建模',
  '场景视觉': '场景、三视图、字体、材质设计',
  '视频生成': '镜头语言、运镜、打斗、特效',
  '品牌与商业': '品牌手册、UI、PPT、广告设计',
  '动画短片': '完整动画案例（剧本+分镜+视觉）',
};

const prompts = await getCollection('prompts');
const counts = {};
for (const p of prompts) {
  counts[p.data.category] = (counts[p.data.category] || 0) + 1;
}

const CATEGORIES = ['剧本分镜', '角色与IP', '场景视觉', '视频生成', '品牌与商业', '动画短片'];

// Latest 5 prompts
const recent = prompts
  .sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0))
  .slice(0, 5);
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <h1>Prompt 作品集</h1>
    <p class="lede">{prompts.length} 个 AI 提示词 · 6 个分类 · 全文搜索</p>

    <h2>分类</h2>
    <div class="category-grid">
      {CATEGORIES.map(c => (
        <CategoryCard
          name={c}
          description={CATEGORY_DESCRIPTIONS[c]}
          count={counts[c] || 0}
        />
      ))}
    </div>

    <h2>最近更新</h2>
    <ul class="recent-list">
      {recent.map(p => (
        <li><a href={`/prompts/${p.data.slug}/`}>{p.data.title}</a>
          <span class="recent-cat">{p.data.category}</span>
        </li>
      ))}
    </ul>
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  .lede { color: var(--sl-color-gray-2); margin-bottom: 2rem; }
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .recent-list { list-style: none; padding: 0; }
  .recent-list li {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--sl-color-gray-6);
  }
  .recent-list a {
    color: var(--sl-color-text);
    text-decoration: none;
  }
  .recent-list a:hover { color: var(--sl-color-accent); }
  .recent-cat {
    font-size: 0.8rem;
    color: var(--sl-color-gray-3);
  }
</style>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build completes, `dist/index.html` exists.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(pages): add home page with category grid"
```

---

## Task 17: Prompts list page

**Files:**
- Create: `src/pages/prompts/index.astro`

- [ ] **Step 1: Write prompts/index.astro**

```astro
---
// src/pages/prompts/index.astro
import { getCollection } from 'astro:content';
import SiteHeader from '../../components/SiteHeader.astro';
import SiteFooter from '../../components/SiteFooter.astro';
import PromptCard from '../../components/PromptCard.astro';

const prompts = await getCollection('prompts');
const sorted = prompts.sort((a, b) =>
  (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0)
);
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>全部 Prompts · Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <h1>全部 Prompts</h1>
    <p>{sorted.length} 个</p>
    {sorted.map(p => (
      <PromptCard
        title={p.data.title}
        category={p.data.category}
        tags={p.data.tags}
        slug={p.data.slug}
        excerpt={p.body.slice(0, 120)}
        date={p.data.date}
      />
    ))}
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/prompts/index.astro
git commit -m "feat(pages): add full prompts list page"
```

---

## Task 18: Category page

**Files:**
- Create: `src/pages/category/[category].astro`

- [ ] **Step 1: Write category page**

```astro
---
// src/pages/category/[category].astro
import { getCollection } from 'astro:content';
import SiteHeader from '../../components/SiteHeader.astro';
import SiteFooter from '../../components/SiteFooter.astro';
import PromptCard from '../../components/PromptCard.astro';
import { CATEGORIES } from '../../../scripts/lib/category-map.mjs';

export async function getStaticPaths() {
  return CATEGORIES.map(category => ({ params: { category } }));
}

const { category } = Astro.params;
const prompts = (await getCollection('prompts'))
  .filter(p => p.data.category === category)
  .sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0));
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>{category} · Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <h1>{category}</h1>
    <p>{prompts.length} 个 prompt</p>
    {prompts.map(p => (
      <PromptCard
        title={p.data.title}
        category={p.data.category}
        tags={p.data.tags}
        slug={p.data.slug}
        excerpt={p.body.slice(0, 120)}
        date={p.data.date}
      />
    ))}
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/category/[category].astro
git commit -m "feat(pages): add category browse page"
```

---

## Task 19: Tags page

**Files:**
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Write tags page**

```astro
---
// src/pages/tags/[tag].astro
import { getCollection } from 'astro:content';
import SiteHeader from '../../components/SiteHeader.astro';
import SiteFooter from '../../components/SiteFooter.astro';
import PromptCard from '../../components/PromptCard.astro';

export async function getStaticPaths() {
  const prompts = await getCollection('prompts');
  const tagSet = new Set();
  for (const p of prompts) for (const t of p.data.tags) tagSet.add(t);
  return [...tagSet].map(tag => ({ params: { tag } }));
}

const { tag } = Astro.params;
const prompts = (await getCollection('prompts'))
  .filter(p => p.data.tags.includes(tag))
  .sort((a, b) => (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0));
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>#{tag} · Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <h1># {tag}</h1>
    <p>{prompts.length} 个 prompt</p>
    {prompts.map(p => (
      <PromptCard
        title={p.data.title}
        category={p.data.category}
        tags={p.data.tags}
        slug={p.data.slug}
        excerpt={p.body.slice(0, 120)}
        date={p.data.date}
      />
    ))}
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tags/[tag].astro
git commit -m "feat(pages): add tag browse page"
```

---

## Task 20: Prompt detail page

**Files:**
- Create: `src/pages/prompts/[slug].astro`

- [ ] **Step 1: Write detail page**

```astro
---
// src/pages/prompts/[slug].astro
import { getCollection, render } from 'astro:content';
import SiteHeader from '../../components/SiteHeader.astro';
import SiteFooter from '../../components/SiteFooter.astro';
import CategoryBadge from '../../components/CategoryBadge.astro';
import TagBadge from '../../components/TagBadge.astro';

export async function getStaticPaths() {
  const prompts = await getCollection('prompts');
  return prompts.map(p => ({ params: { slug: p.data.slug }, props: { prompt: p } }));
}

const { prompt } = Astro.props;
const { Content } = await render(prompt);
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>{prompt.data.title} · Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <article>
      <header class="prompt-header">
        <h1>{prompt.data.title}</h1>
        <div class="meta">
          <CategoryBadge category={prompt.data.category} />
          {prompt.data.date && (
            <time datetime={prompt.data.date.toISOString()}>
              {prompt.data.date.toISOString().slice(0, 10)}
            </time>
          )}
          <span class="source">来源：{prompt.data.source}</span>
        </div>
        <div class="tags">
          {prompt.data.tags.map(t => <TagBadge tag={t} />)}
        </div>
      </header>

      <Content />
    </article>
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
  .prompt-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--sl-color-gray-5);
  }
  .prompt-header h1 { margin: 0 0 0.75rem; }
  .meta {
    display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: var(--sl-color-gray-3);
  }
  .tags { margin-top: 0.5rem; }
  .source {
    font-size: 0.8rem;
    color: var(--sl-color-gray-3);
  }
</style>
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: builds succeed. `dist/prompts/{slug}/index.html` exists for each prompt.

- [ ] **Step 3: Commit**

```bash
git add src/pages/prompts/[slug].astro
git commit -m "feat(pages): add prompt detail page"
```

---

## Task 21: About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Write about.astro**

```astro
---
// src/pages/about.astro
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
---
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>关于 · Prompt 作品集</title>
</head>
<body>
  <SiteHeader />
  <main>
    <h1>关于</h1>
    <p>这是一个 AI 提示词作品集，包含漫剧、视频、IP、字体材质、品牌设计等方向的提示词。</p>

    <h2>内容来源</h2>
    <p>所有提示词来自个人积累的实战经验，包括从番茄小说、文案分幕、漫剧分镜等场景的提炼。</p>

    <h2>技术栈</h2>
    <ul>
      <li>Astro 5 + Starlight 主题</li>
      <li>Content Collections（基于 Zod schema）</li>
      <li>Pagefind 全文搜索</li>
      <li>mammoth 解析 docx + 图片提取</li>
      <li>GitHub Pages + GitHub Actions</li>
    </ul>

    <h2>反馈</h2>
    <p>欢迎在 GitHub 提 issue 或 PR。</p>
  </main>
  <SiteFooter />
</body>
</html>

<style>
  main { max-width: 72ch; margin: 0 auto; padding: 0 1rem; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat(pages): add about page"
```

---

## Task 22: Build + smoke test

**Files:** (no source changes)

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: build succeeds with no errors. Some warnings about Starlight may appear; OK.

- [ ] **Step 2: Preview locally**

```bash
npm run preview
```

Then visit `http://localhost:4321/prompt/` (note `/prompt/` base path).

Manual smoke checks:

```
□ 首页显示6 个分类卡片 + 计数正确
□ 点击分类 → /category/{name} 显示该分类下 prompts
□ 点击 prompt → /prompts/{slug} 显示内容 + 标签
□ 点标签 → /tags/{tag} 显示该标签 prompts
□ Pagefind 搜索可用（搜索框在 Starlight 默认 UI）
□ 暗色 / 亮色切换正常
□ docx 中的图片正确显示
□ xlsx 占位说明页可见
```

- [ ] **Step 3: Stop preview server**

Ctrl+C in terminal.

---

## Task 23: Polish custom CSS (minimal-doc refinements)

**Files:**
- Modify: `src/styles/custom.css`

- [ ] **Step 1: Add refinements**

Replace `src/styles/custom.css` contents:

```css
/* src/styles/custom.css */
:root {
  --sl-font: ui-sans-serif, system-ui, -apple-system, "PingFang SC",
    "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  --sl-font-mono: ui-monospace, "JetBrains Mono", "Cascadia Code",
    "Source Code Pro", Consolas, monospace;
}

main {
  max-width: 72ch;
}

/* Generous reading rhythm */
.sl-markdown-content h2 {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--sl-color-gray-6);
  padding-bottom: 0.25rem;
}
.sl-markdown-content h3 {
  margin-top: 1.75rem;
}
.sl-markdown-content p {
  line-height: 1.75;
}
.sl-markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 1rem 0;
}
.sl-markdown-content blockquote {
  border-left: 3px solid var(--sl-color-accent);
  padding-left: 1rem;
  color: var(--sl-color-gray-2);
}
.sl-markdown-content code:not(pre code) {
  background: var(--sl-color-gray-6);
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
  font-size: 0.9em;
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/custom.css
git commit -m "style: refine minimal-doc typography and image styles"
```

---

## Task 24: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build with Astro
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

## Task 25: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# Prompt 作品集

AI 提示词合集：漫剧、视频、IP、字体、品牌设计的实战提示词。

## 本地开发

```bash
npm install
npm run ingest     # 解析源文件 → 生成 markdown（首次必跑）
npm run dev        # 本地预览 http://localhost:4321/prompt/
```

## 添加 / 更新 prompt

1. 把源文件放进根目录、`仿真人提示词/`、`其他/`、`实战/` 之一
2. 在 `scripts/lib/slug-map.mjs` 加一行 `{源文件名: slug}`
3. 在 `scripts/lib/category-map.mjs` 加分类映射
4. `npm run ingest`

## 构建发布

```bash
npm run build
```

产物在 `dist/`，推送到 GitHub Pages。

## 部署

main 分支 push 触发 `.github/workflows/deploy.yml`，自动部署到 GitHub Pages。

部署前需修改 `astro.config.mjs`：

```js
site: 'https://YOUR-USERNAME.github.io',
base: '/YOUR-REPO-NAME',
```

## 目录

```
src/
├── components/    # 复用组件
├── content/
│   ├── config.ts  # Zod schema
│   └── prompts/   # ingest 生成的 markdown
├── pages/         # 路由
└── styles/        # 自定义 CSS

scripts/
├── ingest.mjs     # 主入口
└── lib/           # 解析器、映射表
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with dev/build/deploy instructions"
```

---

## Task 26: Final end-to-end verification

**Files:** (no source changes)

- [ ] **Step 1: Fresh ingest run**

```bash
rm -rf src/content/prompts archive
npm run ingest
```

Expected: `Done: 47 ok, 0 failed`

- [ ] **Step 2: Build clean**

```bash
rm -rf dist
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Inspect dist**

```bash
ls dist/
ls dist/prompts | head -5
ls dist/category
```

Expected:
- `dist/index.html` (home)
- `dist/prompts/{slug}/index.html` for each prompt
- `dist/category/{category}/index.html` for each category
- `dist/_pagefind/` (search index)

- [ ] **Step 4: Push to GitHub**

Configure repo remote:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Then in GitHub repo Settings → Pages → ensure source is "GitHub Actions".

- [ ] **Step 5: Verify live site**

After ~2 minutes, visit `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

Manual checks:

```
□ 首页正确渲染
□ 至少5 个分类页可访问
□ 至少5 个 prompt 详情页可访问（含图片）
□ Pagefind 搜索可用
□ 暗色 / 亮色切换正常
```

- [ ] **Step 6: Final commit (cleanup if needed)**

```bash
git status
# 如果有未提交的清理产物：
git add -A
git commit -m "chore: final cleanup" --allow-empty
```

---

## Done Criteria

- [ ] All 26 tasks completed
- [ ] All tests pass (`npm run test`)
- [ ] Build succeeds with no errors (`npm run build`)
- [ ] GitHub Pages live and renders all 6 category pages
- [ ] At least 5 sample prompts visually verified
- [ ] docx images display correctly
- [ ] xlsx placeholder pages render
- [ ] User has reviewed and approved final site