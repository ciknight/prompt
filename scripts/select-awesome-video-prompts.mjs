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

  // Sort: landscape (2) → no-aspect (0) → vertical (-2). Then stable by source order.
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