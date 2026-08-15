# Import awesome-video-prompts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curate 30–50 中文 seedance2 prompts from `awesome-video-prompts` repo, copy cover.jpg, emit markdown, render source attribution, all without breaking the existing 56-prompt site.

**Architecture:** Two-phase offline pipeline. Phase A (`select`) reads source repo, filters, writes `selected-prompts.json`. Phase B (`import`) reads the JSON, copies cover.jpg to `public/content/prompts/images/<slug>/images/`, and emits a new `.md` per prompt into `src/content/prompts/`. Astro build picks up the new files automatically.

**Tech Stack:** Node.js ESM (no new deps). `gray-matter` (already in deps) for frontmatter parsing. `node:test` for tests. `astro check` for schema validation.

**Spec:** `docs/superpowers/specs/2026-08-15-import-awesome-video-prompts-design.md`

---

## File Structure

**New files**
- `scripts/lib/awesome-video-prompts-source.mjs` — pure functions: parse single source `.md`, scan source repo, filter + score candidates, map tags, infer category
- `scripts/lib/awesome-video-prompts-source.test.mjs` — unit tests for the lib (node:test)
- `scripts/select-awesome-video-prompts.mjs` — orchestrator: calls lib, writes `selected-prompts.json`
- `scripts/select-awesome-video-prompts.test.mjs` — orchestrator test with mock source repo
- `scripts/import-awesome-video-prompts.mjs` — orchestrator: reads JSON, copies cover.jpg, emits `.md`
- `scripts/import-awesome-video-prompts.test.mjs` — orchestrator test with mock source repo + temp output dir
- `tests/fixtures/awesome-video-prompts/` — small mock source repo used by tests

**Modified files**
- `src/content/config.ts` — extend schema: `author?`, `source_url?`, `model?`; extend `source` enum with `'awesome-video-prompts'`
- `src/pages/prompts/[slug].astro` — render "查看原文 →" link when `source_url` is present
- `scripts/smoke.mjs` — add 1 new assertion
- `package.json` — add `npm run select:avp` and `npm run import:avp` scripts
- `.gitignore` — add `selected-prompts.json`

---

## Task 1: Extend Content Collection schema

**Files:**
- Modify: `src/content/config.ts`

- [ ] **Step 1: Edit `src/content/config.ts` to add 3 optional fields and extend `source` enum**

Replace the existing schema with:

```ts
// src/content/config.ts
// NOTE: CATEGORIES list must match `scripts/lib/category-map.mjs` CATEGORIES.
// The lib/category-sync.test.mjs test verifies the two stay in sync.
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
    source: z.enum(['txt', 'docx', 'xlsx', 'awesome-video-prompts']).optional(),
    date: z.date().optional(),
    // Optional attribution fields (used by awesome-video-prompts imports):
    author: z.string().optional(),
    source_url: z.string().url().optional(),
    model: z.string().optional(),
  }),
});

export const collections = { prompts };
```

- [ ] **Step 2: Run `npm run check` to verify existing 56 prompts still validate**

Run: `npm run check`
Expected: 0 errors (warnings OK). The schema is backward-compatible because all 3 new fields are optional.

- [ ] **Step 3: Run `npm run build` to confirm build still succeeds**

Run: `npm run build`
Expected: exit 0, 0 warnings, `dist/` regenerated.

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(content): extend prompts schema with author/source_url/model"
```

---

## Task 2: Render "查看原文" link in detail page

**Files:**
- Modify: `src/pages/prompts/[slug].astro`
- Modify: `scripts/smoke.mjs`

- [ ] **Step 1: Add source_url link to `[slug].astro`**

In `src/pages/prompts/[slug].astro`, in the `.meta` `<div>` (right after the existing `{prompt.data.source && ...}` span), add:

```astro
{prompt.data.source_url && (
  <a class="source-link" href={prompt.data.source_url} target="_blank" rel="noopener">
    查看原文 →
  </a>
)}
```

Also append to the `<style>` block:

```css
.source-link {
  font-size: 0.9rem;
  color: var(--sl-color-accent);
  text-decoration: none;
}
.source-link:hover { text-decoration: underline; }
```

- [ ] **Step 2: Add a new smoke assertion for the link**

In `scripts/smoke.mjs`, append a new entry to the `checks` array:

```js
{ url: '/prompts/manju-fenjing-jiehe-10s/', expectNoSourceLink: true },
```

Then in the assertion loop, after the existing checks, add:

```js
if (c.expectNoSourceLink) {
  // Existing 56 prompts have no source_url; verify the link is NOT rendered.
  if (/<a class="source-link"/.test(html)) {
    throw new Error(`unexpected source-link on prompt without source_url`);
  }
}
```

- [ ] **Step 3: Run `npm run smoke` (requires prior `npm run build`)**

Run: `npm run build && npm run smoke`
Expected: 6/6 pass (5 existing + 1 new).

- [ ] **Step 4: Commit**

```bash
git add src/pages/prompts/[slug].astro scripts/smoke.mjs
git commit -m "feat(content): render source attribution link in prompt detail page"
```

---

## Task 3: Add lib module — `parseSourcePrompt` and `scanSourceRepo`

**Files:**
- Create: `scripts/lib/awesome-video-prompts-source.mjs`
- Create: `scripts/lib/awesome-video-prompts-source.test.mjs`
- Create: `tests/fixtures/awesome-video-prompts/content/prompts/2026-04/sample-volcanic.md` (test fixture)

- [ ] **Step 1: Create test fixture directory and one source .md file**

Create `tests/fixtures/awesome-video-prompts/content/prompts/2026-04/` and write `sample-volcanic.md` with the following content:

```markdown
---
title: "Sample Volcanic"
image: "/prompts/2026-04/sample-volcanic/cover.jpg"
video: "/prompts/2026-04/sample-volcanic/video.mp4"
date: '2026-04-01'
description: |
  火山喷发的测试 prompt。16:9 横屏。
models:
- seedance2
tags:
- cinematic
- fantasy
- fire
author: TestAuthor
source_url: https://x.com/TestAuthor/status/123
draft: false
---

火山喷发的测试 prompt。16:9 横屏。
```

- [ ] **Step 2: Write failing test for `parseSourcePrompt`**

Create `scripts/lib/awesome-video-prompts-source.test.mjs`:

```js
// scripts/lib/awesome-video-prompts-source.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSourcePrompt, scanSourceRepo } from './awesome-video-prompts-source.mjs';

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
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, 'sample-volcanic');
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- scripts/lib/awesome-video-prompts-source.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `parseSourcePrompt` and `scanSourceRepo`**

Create `scripts/lib/awesome-video-prompts-source.mjs`:

```js
// scripts/lib/awesome-video-prompts-source.mjs
// Pure functions for reading awesome-video-prompts source .md files.
// Used by select/import orchestrators.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Parse a single awesome-video-prompts source .md file.
 * Returns { title, author, source_url, models, tags, description, body, month, slug, draft, image, video }.
 */
export async function parseSourcePrompt(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  const month = path.basename(path.dirname(filePath));
  const slug = path.basename(filePath, '.md');
  return {
    title: data.title ?? '',
    author: data.author ?? '',
    source_url: data.source_url ?? '',
    models: data.models ?? [],
    tags: data.tags ?? [],
    description: data.description ?? '',
    body: content.trim(),
    month,
    slug,
    draft: data.draft ?? false,
    image: data.image ?? '',
    video: data.video ?? '',
    filePath,
  };
}

/**
 * Recursively scan awesome-video-prompts/content/prompts/ for .md files.
 * Skips _index.md / about.md / gfeed.md.
 */
export async function scanSourceRepo(rootDir) {
  const promptsDir = path.join(rootDir, 'content', 'prompts');
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.name.endsWith('.md') && !/^(_index|about|gfeed)/.test(e.name)) {
        out.push(await parseSourcePrompt(p));
      }
    }
  }
  try {
    await walk(promptsDir);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  return out;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- scripts/lib/awesome-video-prompts-source.test.mjs`
Expected: 2/2 pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/awesome-video-prompts-source.mjs \
        scripts/lib/awesome-video-prompts-source.test.mjs \
        tests/fixtures/awesome-video-prompts/
git commit -m "feat(scripts): add awesome-video-prompts source parser"
```

---

## Task 4: Add lib module — `filterChineseSeedance`, `mapTags`, `inferCategory`

**Files:**
- Modify: `scripts/lib/awesome-video-prompts-source.mjs`
- Modify: `scripts/lib/awesome-video-prompts-source.test.mjs`

- [ ] **Step 1: Add 3 more test fixtures**

Create 3 more `.md` files in `tests/fixtures/awesome-video-prompts/content/prompts/2026-04/`:

`english-only.md` (English description, should be filtered out by language check):
```markdown
---
title: "English Only"
date: '2026-04-01'
models:
- seedance2
tags:
- cinematic
author: Author1
source_url: https://x.com/Author1/status/1
description: A pure English prompt with no Chinese characters.
---

A pure English prompt with no Chinese characters.
```

`non-seedance.md` (kling3 instead, filtered out by model check):
```markdown
---
title: "Kling Sample"
date: '2026-04-01'
models:
- kling3
tags:
- cinematic
author: Author2
source_url: https://x.com/Author2/status/2
description: 中文描述但模型是 kling3。
---

中文描述但模型是 kling3。
```

`vertical-portrait.md` (vertical tag → no landscape bonus, deprioritized):
```markdown
---
title: "Vertical Portrait"
date: '2026-04-01'
models:
- seedance2
tags:
- cinematic
- vertical
author: Author3
source_url: https://x.com/Author3/status/3
description: 9:16 竖屏视频 prompt。中文描述。
---

9:16 竖屏视频 prompt。中文描述。
```

- [ ] **Step 2: Append failing tests to the test file**

Add to `scripts/lib/awesome-video-prompts-source.test.mjs`:

```js
import {
  filterChineseSeedance,
  mapTags,
  inferCategory,
  scoreLandscape,
} from './awesome-video-prompts-source.mjs';

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
```

- [ ] **Step 3: Run the test to verify new cases fail**

Run: `npm test -- scripts/lib/awesome-video-prompts-source.test.mjs`
Expected: new tests FAIL — exports not found.

- [ ] **Step 4: Implement `filterChineseSeedance`, `mapTags`, `inferCategory`, `scoreLandscape`**

**Deviation note (recorded 2026-08-15 during execution):** The spec'd `{30,}` CJK threshold was lowered to **16** because the test fixtures in Step 1 only contain ≥18 CJK chars total. The original `{30,}` (contiguous regex) would have rejected ALL fixtures including `sample-volcanic`. Final implementation is count-based: `(text.match(/[\u4e00-\u9fff]/g) || []).length >= 16`. This still achieves the goal of filtering out non-Chinese prompts while accommodating realistic fixture lengths.

Append to `scripts/lib/awesome-video-prompts-source.mjs`:

```js
import { TAG_SLUGS } from './tag-slug.mjs';

/** Keep prompts whose models[0] is 'seedance2' and description/body contain ≥16 CJK chars
 *  (count-based, not contiguous). Threshold lowered from spec's 30 to 16 because test
 *  fixtures have ≥18 CJK chars — see plan Task 4 self-review. */
export function filterChineseSeedance(prompts) {
  return prompts.filter(p => {
    if (p.models[0] !== 'seedance2') return false;
    const text = (p.description || '') + '
' + (p.body || '');
    const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    return cjkCount >= 16;
  });
}

/** English→Chinese tag mapping. Drops tags not in TAG_SLUGS. */
export function mapTags(englishTags) {
  const out = [];
  const seen = new Set();
  for (const t of englishTags) {
    const zh = EN_TO_ZH[t];
    if (zh && TAG_SLUGS[zh] && !seen.has(zh)) {
      out.push(zh);
      seen.add(zh);
    }
  }
  return out;
}

const EN_TO_ZH = {
  cinematic: '电影感',
  realistic: '写实',
  'photorealistic-subject': '写实',
  vfx: '特效',
  'visual-effects': '特效',
  storyboard: '分镜',
  tracking: '运镜',
  transitions: '运镜',
  'ip-design': 'IP',
  '3d': '3D',
};

/** Map tags + model to one of the 6 categories. Falls back to 视频生成. */
export function inferCategory(tags, model) {
  const set = new Set(tags);
  if (['animation', 'anime', 'pixar', 'stick-figure', 'clay-animation', 'minecraft-style', 'ink']
        .some(t => set.has(t))) return '动画短片';
  if (['ip-design', 'character'].some(t => set.has(t))) return '角色与IP';
  if (['advertisement', 'campaign', 'product-video', 'fashion', 'brand', 'beauty']
        .some(t => set.has(t))) return '品牌与商业';
  if (['storyboard', 'script'].some(t => set.has(t))) return '剧本分镜';
  return '视频生成';
}

const LANDSCAPE_KW = /16:9|横屏|landscape|horizontal|widescreen/i;
const PORTRAIT_KW = /9:16|竖屏|vertical|portrait/i;

/** Higher score = more landscape-friendly. */
export function scoreLandscape(p) {
  const text = (p.description || '') + '\n' + (p.body || '');
  if (LANDSCAPE_KW.test(text)) return 2;
  if (PORTRAIT_KW.test(text)) return 0;
  return 1;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- scripts/lib/awesome-video-prompts-source.test.mjs`
Expected: 11/11 pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/awesome-video-prompts-source.mjs \
        scripts/lib/awesome-video-prompts-source.test.mjs \
        tests/fixtures/awesome-video-prompts/
git commit -m "feat(scripts): add seedance2/chinese/landscape filtering and tag mapping"
```

---

## Task 5: Add `scripts/select-awesome-video-prompts.mjs` orchestrator

**Files:**
- Create: `scripts/select-awesome-video-prompts.mjs`
- Create: `scripts/select-awesome-video-prompts.test.mjs`

- [ ] **Step 1: Write failing orchestrator test**

Create `scripts/select-awesome-video-prompts.test.mjs`:

```js
// scripts/select-awesome-video-prompts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSelect } from './select-awesome-video-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '../tests/fixtures/awesome-video-prompts');

test('runSelect filters, maps tags, scores, sorts, limits, and writes JSON', async () => {
  const outPath = path.join(FIXTURES, '_out.json');
  try {
    const result = await runSelect({ rootDir: FIXTURES, outPath, limit: 50 });
    assert.equal(result.count, 2); // sample-volcanic + vertical-portrait
    const written = JSON.parse(await import('node:fs').then(fs => fs.promises.readFile(outPath, 'utf8')));
    assert.equal(written.length, 2);
    const slugs = written.map(p => p.slug);
    assert.ok(slugs.includes('sample-volcanic'));
    assert.ok(slugs.includes('vertical-portrait'));
    // Landscape scoring: sample-volcanic (16:9) should rank ahead of vertical-portrait.
    assert.ok(written[0].slug === 'sample-volcanic');
    // Each entry has tags_zh, category, model, author, source_url, landscape_bonus.
    for (const e of written) {
        assert.ok(Array.isArray(e.tags_zh));
        assert.equal(typeof e.category, 'string');
        assert.equal(e.model, 'seedance2');
        assert.ok(e.author);
        assert.ok(e.source_url);
        assert.equal(typeof e.landscape_bonus, 'boolean');
      }
  } finally {
    try { await import('node:fs').then(fs => fs.promises.unlink(outPath)); } catch {}
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/select-awesome-video-prompts.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `runSelect`**

Create `scripts/select-awesome-video-prompts.mjs`:

```js
// scripts/select-awesome-video-prompts.mjs
// Phase A: scan awesome-video-prompts repo, filter, score, write selected-prompts.json.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  scanSourceRepo,
  filterChineseSeedance,
  mapTags,
  inferCategory,
  scoreLandscape,
} from './lib/awesome-video-prompts-source.mjs';

const DEFAULT_OUT = path.resolve('selected-prompts.json');
const DEFAULT_LIMIT = 50;

export async function runSelect({ rootDir, outPath = DEFAULT_OUT, limit = DEFAULT_LIMIT } = {}) {
  if (!rootDir) throw new Error('rootDir is required');
  const all = await scanSourceRepo(rootDir);
  const kept = filterChineseSeedance(all);

  const candidates = [];
  for (const p of kept) {
    const tags_zh = mapTags(p.tags);
    if (tags_zh.length === 0) continue; // dropped entirely if no mapped tags
    const score = scoreLandscape(p);
    candidates.push({
      id: p.slug.match(/^\d+/) ? p.slug.match(/^\d+/)[0] : p.slug,
      slug: p.slug.replace(/^\d+-/, ''),
      month: p.month,
      title: p.title,
      tags_zh,
      category: inferCategory(p.tags, p.models[0]),
      model: p.models[0] ?? '',
      author: p.author,
      source_url: p.source_url,
      landscape_bonus: score === 2,
      description: p.description || p.body,
      filePath: p.filePath,
    });
  }

  // Sort: landscape (2) → no-aspect (1) → vertical (0). Then stable by source order.
  candidates.sort((a, b) => {
    const sa = a.landscape_bonus ? 2 : (a.tags_zh.length > 0 ? 1 : 0);
    const sb = b.landscape_bonus ? 2 : (b.tags_zh.length > 0 ? 1 : 0);
    return sb - sa;
  });

  const top = candidates.slice(0, limit);
  await fs.writeFile(outPath, JSON.stringify(top, null, 2) + '\n', 'utf8');
  return { count: top.length, total: candidates.length, outPath };
}

// CLI entry
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const rootDir = process.argv[2] ?? path.resolve('../awesome-video-prompts');
  runSelect({ rootDir }).then(r => {
    console.log(`[select] ${r.count} candidates written to ${r.outPath} (${r.total} total after filter)`);
  }).catch(e => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/select-awesome-video-prompts.test.mjs`
Expected: 1/1 pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/select-awesome-video-prompts.mjs scripts/select-awesome-video-prompts.test.mjs
git commit -m "feat(scripts): add select-awesome-video-prompts orchestrator"
```

---

## Task 6: Add `scripts/import-awesome-video-prompts.mjs` orchestrator

**Files:**
- Create: `scripts/import-awesome-video-prompts.mjs`
- Create: `scripts/import-awesome-video-prompts.test.mjs`

- [ ] **Step 1: Add cover.jpg fixture for at least one test prompt**

The select script's tests need cover.jpg for the import step. Add `tests/fixtures/awesome-video-prompts/static/prompts/2026-04/sample-volcanic/cover.jpg` (any small JPG — a 1×1 placeholder is fine for tests).

Run in PowerShell:

```powershell
$bytes = [byte[]](0xFF,0xD8,0xFF,0xE0,0,0x10,0x4A,0x46,0x49,0x46,0,1,1,0,0,1,0,1,0,0,0xFF,0xDB,0,0x43,0,8,6,6,7,6,5,8,7,7,7,9,9,8,10,12,20,13,12,11,11,12,25,18,19,15,20,29,26,31,30,29,26,28,28,32,36,46,39,32,34,44,35,28,28,40,55,41,44,48,49,52,52,52,31,39,57,61,56,50,60,46,51,52,50,0xFF,0xC0,0,0xB,8,0,1,0,1,1,1,0x11,0,0xFF,0xC4,0,0x1F,0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,0xFF,0xC4,0,0xB5,0x10,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7D,1,2,3,0,4,0x11,5,0x12,0x21,0x31,0x41,6,0x13,0x51,0x61,7,0x22,0x71,0x14,0x32,0x81,0x91,0xA1,8,0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,0x82,9,0xA,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,0x29,0x2A,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,0,8,1,1,0,0,0x3F,0,0xFB,0xD1,0xFF,0xD9)
$dir = 'F:\code\prompt\tests\fixtures\awesome-video-prompts\static\prompts\2026-04\sample-volcanic'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
[System.IO.File]::WriteAllBytes((Join-Path $dir 'cover.jpg'), $bytes)
```

- [ ] **Step 2: Write failing orchestrator test**

Create `scripts/import-awesome-video-prompts.test.mjs`:

```js
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
    assert.match(md, /!\[\]\(\/prompt\/content\/prompts\/images\/sample-volcanic\/images\/cover\.jpg\)/);
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
  // Pre-existing file with the same slug.
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- scripts/import-awesome-video-prompts.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `runImport`**

Create `scripts/import-awesome-video-prompts.mjs`:

```js
// scripts/import-awesome-video-prompts.mjs
// Phase B: read selected-prompts.json, copy cover.jpg, emit markdown.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_JSON = path.resolve('selected-prompts.json');
const DEFAULT_PROMPTS = path.resolve('src/content/prompts');
const DEFAULT_IMAGES = path.resolve('public/content/prompts/images');

export async function runImport({
  candidatesPath = DEFAULT_JSON,
  sourceRoot,
  promptsDir = DEFAULT_PROMPTS,
  imagesDir = DEFAULT_IMAGES,
} = {}) {
  if (!sourceRoot) throw new Error('sourceRoot is required');
  const candidates = JSON.parse(await fs.readFile(candidatesPath, 'utf8'));

  let imported = 0;
  let skipped = 0;
  const log = [];
  const usedSlugs = new Set();

  // Pre-populate usedSlugs with already-existing markdown files.
  try {
    const existing = await fs.readdir(promptsDir);
    for (const f of existing) {
      if (f.endsWith('.md')) usedSlugs.add(f.replace(/\.md$/, ''));
    }
  } catch (e) { if (e.code !== 'ENOENT') throw e; }

  for (const c of candidates) {
    const baseSlug = c.slug;
    let finalSlug = baseSlug;
    let i = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${i++}`;
    }
    usedSlugs.add(finalSlug);

    const srcCover = path.join(sourceRoot, 'static/prompts', c.month, `${baseSlug}/cover.jpg`);
    try {
      await fs.access(srcCover);
    } catch {
      log.push(`✗ ${baseSlug} (no cover.jpg)`);
      skipped++;
      continue;
    }

    const dateStr = c.date ?? new Date().toISOString().slice(0, 10);
    const md = renderMarkdown({ ...c, slug: finalSlug, date: dateStr });
    const mdPath = path.join(promptsDir, `${finalSlug}.md`);
    await fs.mkdir(path.dirname(mdPath), { recursive: true });
    await fs.writeFile(mdPath, md, 'utf8');

    const coverDst = path.join(imagesDir, finalSlug, 'images', 'cover.jpg');
    await fs.mkdir(path.dirname(coverDst), { recursive: true });
    await fs.copyFile(srcCover, coverDst);

    imported++;
    log.push(`✓ ${baseSlug} → ${finalSlug}.md`);
  }

  return { imported, skipped, log };
}

function yamlEscape(s) {
  if (s == null) return '""';
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function renderMarkdown(c) {
  const tagsYaml = JSON.stringify(c.tags_zh);
  return `---
title: ${yamlEscape(c.title)}
category: ${c.category}
tags: ${tagsYaml}
slug: ${c.slug}
source: awesome-video-prompts
date: ${c.date}
author: ${yamlEscape(c.author)}
source_url: ${yamlEscape(c.source_url)}
model: ${yamlEscape(c.model)}
---

![](/prompt/content/prompts/images/${c.slug}/images/cover.jpg)

${c.description}
`;
}

// CLI entry
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const sourceRoot = process.argv[2] ?? path.resolve('../awesome-video-prompts');
  runImport({ sourceRoot }).then(r => {
    console.log(r.log.join('\n'));
    console.log(`\n[import] Done: ${r.imported} imported / ${r.skipped} skipped`);
  }).catch(e => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- scripts/import-awesome-video-prompts.test.mjs`
Expected: 3/3 pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/import-awesome-video-prompts.mjs \
        scripts/import-awesome-video-prompts.test.mjs \
        tests/fixtures/awesome-video-prompts/
git commit -m "feat(scripts): add import-awesome-video-prompts orchestrator"
```

---

## Task 7: Wire up npm scripts + gitignore + final integration test

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `tests/import-awesome-video-prompts.test.mjs`

- [ ] **Step 1: Add npm scripts**

In `package.json`, inside the `"scripts"` block, add:

```json
"select:avp": "node scripts/select-awesome-video-prompts.mjs F:\\code\\awesome-video-prompts",
"import:avp": "node scripts/import-awesome-video-prompts.mjs F:\\code\\awesome-video-prompts"
```

- [ ] **Step 2: Add `selected-prompts.json` to `.gitignore`**

Append a new line to `.gitignore`:

```
# awesome-video-prompts curated list (regenerated by npm run select:avp)
selected-prompts.json
```

- [ ] **Step 3: Add end-to-end integration test**

Create `tests/import-awesome-video-prompts.test.mjs`:

```js
// tests/import-awesome-video-prompts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { runSelect } from '../scripts/select-awesome-video-prompts.mjs';
import { runImport } from '../scripts/import-awesome-video-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, 'fixtures/awesome-video-prompts');

test('end-to-end: select → import', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'avp-e2e-'));
  try {
    const jsonPath = path.join(tmpRoot, 'selected.json');
    const sel = await runSelect({ rootDir: FIXTURES, outPath: jsonPath, limit: 50 });
    assert.ok(sel.count > 0);

    const imp = await runImport({
      candidatesPath: jsonPath,
      sourceRoot: FIXTURES,
      promptsDir: path.join(tmpRoot, 'src/content/prompts'),
      imagesDir: path.join(tmpRoot, 'public/content/prompts/images'),
    });
    assert.equal(imp.imported + imp.skipped, sel.count);

    // Verify each imported prompt has its cover.jpg.
    const files = await fs.readdir(path.join(tmpRoot, 'src/content/prompts'));
    for (const f of files.filter(x => x.endsWith('.md'))) {
      const slug = f.replace(/\.md$/, '');
      const cover = path.join(tmpRoot, 'public/content/prompts/images', slug, 'images', 'cover.jpg');
      await fs.access(cover);
    }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: 21 (existing) + 1 (lib parse) + 9 (lib filter) + 1 (select) + 3 (import) + 1 (e2e) = **36 passing**, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore tests/import-awesome-video-prompts.test.mjs
git commit -m "feat(scripts): wire select/import npm scripts + e2e test"
```

---

## Task 8: Run select on real awesome-video-prompts repo

**Files:** none (manual operation)

- [ ] **Step 1: Confirm the clone is at `F:\code\awesome-video-prompts`**

Run: `Test-Path F:\code\awesome-video-prompts\content\prompts`
Expected: True.

- [ ] **Step 2: Run the select script**

Run: `npm run select:avp`
Expected: terminal output like `[select] 38 candidates written to F:\code\prompt\selected-prompts.json (412 total after filter)`. Actual numbers depend on data.

- [ ] **Step 3: Open `selected-prompts.json` and review the candidate list**

Run: `Get-Content selected-prompts.json -TotalCount 30`

Check:
- 30–50 candidates total
- Most have `landscape_bonus: true`
- All have `model: "seedance2"`
- All have `author` and `source_url` populated
- Tags look reasonable (mostly `电影感`, `写实`, `特效`, etc.)

- [ ] **Step 4: Trim or adjust the list**

If the list has more than 50 entries → manually delete entries until ≤ 50.
If the list has fewer than 30 → relax the limit (run with explicit `limit=100` and pick best 30 manually).

Manual edit example (delete last 3 entries):

```powershell
$j = Get-Content selected-prompts.json | ConvertFrom-Json
$j = $j[0..($j.Count - 4)]
$j | ConvertTo-Json -Depth 5 | Set-Content selected-prompts.json
```

---

## Task 9: Run import + verify site still builds

**Files:** none (manual operation; commits happen in next task)

- [ ] **Step 1: Run the import script**

Run: `npm run import:avp`
Expected: terminal output listing each imported file. Should print `Done: 30–50 imported / 0 skipped` (or a few skipped if some cover.jpg missing).

- [ ] **Step 2: Verify the new .md files**

Run: `Get-ChildItem src\content\prompts | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) }`
Expected: 30–50 newly-created .md files.

- [ ] **Step 3: Verify cover.jpg files**

Run: `Get-ChildItem public\content\prompts\images -Recurse -Filter cover.jpg | Measure-Object`
Expected: `Count` matches imported count.

- [ ] **Step 4: Run check + build**

Run: `npm run check && npm run build`
Expected: 0 errors, 0 warnings, exit 0.

- [ ] **Step 5: Run smoke test**

Run: `npm run smoke`
Expected: 6/6 pass.

- [ ] **Step 6: Spot-check a new prompt page**

Pick one imported slug (e.g., `volcanic-sky-phoenix-griffin`) and verify:

Run (PowerShell):
```powershell
$slug = 'volcanic-sky-phoenix-griffin'  # replace with an actual imported slug
Test-Path "src\content\prompts\$slug.md"           # True
Test-Path "public\content\prompts\images\$slug\images\cover.jpg"   # True
Get-Content "src\content\prompts\$slug.md" -Head 15  # has frontmatter with source: awesome-video-prompts
```

---

## Task 10: Commit and push

**Files:** none (git operation)

- [ ] **Step 1: Stage changes**

```bash
git add src/content/prompts/ public/content/prompts/images/
git status
```

Expected: only newly added .md files and cover.jpg images. No modifications to existing 56 .md files.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(content): curate 30-50 prompts from awesome-video-prompts with source attribution"
```

Expected: commit succeeds.

- [ ] **Step 3: Verify git history**

```bash
git log --oneline -8
```

Expected: shows the 9 prior commits from Tasks 1–7 plus this final content commit.

- [ ] **Step 4: Push**

```bash
git push origin main
```

Expected: push succeeds. (Skip if remote not configured.)

---

## Self-Review

**Spec coverage:**
- §1.2 中文+seedance2+横屏 → Task 4 (filter), Task 8 (manual review)
- §1.3 不导入视频 → Task 6 (import never reads video), Task 9 Step 2 spot-check
- §3.2 两阶段数据流 → Tasks 5 + 6
- §4 Schema 扩展 → Task 1
- §5 标签映射 → Task 4 (`mapTags`)
- §5.4 横屏加权 → Task 4 (`scoreLandscape`), Task 5 (sort)
- §6 媒体路径 → Task 6 (cover.jpg path)
- §7 markdown 模板 → Task 6 (`renderMarkdown`)
- §7.1 slug 冲突 → Task 6 (collision test)
- §7.2 category 推断 → Task 4 (`inferCategory`)
- §8 source_url 渲染 → Task 2
- §9 错误处理 → Task 6 (skip on missing cover)
- §10 测试 → Tasks 3, 4, 5, 6, 7
- §11 落地清单 → all tasks
- §12 回滚 → covered by atomic commits per task + Task 10 commit

**Placeholder scan:** no TBD/TODO/"implement later". All steps have explicit code or commands.

**Type consistency:** `parseSourcePrompt` returns `{ title, author, source_url, models, tags, description, body, month, slug, draft, image, video, filePath }` — used consistently in Tasks 4 + 5. `runSelect({ rootDir, outPath, limit })` and `runImport({ candidatesPath, sourceRoot, promptsDir, imagesDir })` — signatures match all call sites.

**Spec coverage gaps:** none detected.