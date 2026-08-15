// scripts/lib/awesome-video-prompts-source.mjs
// Pure functions for reading awesome-video-prompts source .md files.
// Used by select/import orchestrators.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { TAG_SLUGS } from './tag-slug.mjs';

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

/** Keep prompts whose models[0] is 'seedance2' and description/body contain ≥16 CJK chars. */
export function filterChineseSeedance(prompts) {
  return prompts.filter(p => {
    if (p.models[0] !== 'seedance2') return false;
    const text = (p.description || '') + '\n' + (p.body || '');
    const cjkCount = (text.match(/[一-鿿]/g) || []).length;
    return cjkCount >= 16;
  });
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

