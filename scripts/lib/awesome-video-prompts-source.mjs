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

