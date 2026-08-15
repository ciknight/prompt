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