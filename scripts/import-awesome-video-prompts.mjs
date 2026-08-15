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

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const sourceRoot = process.argv[2] ?? path.resolve('../awesome-video-prompts');
  runImport({ sourceRoot }).then(r => {
    console.log(r.log.join('\n'));
    console.log(`\n[import] Done: ${r.imported} imported / ${r.skipped} skipped`);
  }).catch(e => { console.error(e); process.exit(1); });
}