// scripts/lib/parseDocx.mjs
// DOCX → markdown, **without** extracting embedded images.
//
// Rationale: all prompts on this site were collected from public sources
// and may include screenshots/example images owned by the original authors.
// To avoid redistributing third-party images, we strip all <img> tags
// from the parsed markdown.

import mammoth from 'mammoth';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Read the `base` field from astro.config.mjs so it stays in sync with
 * the deployment base path. Falls back to '' if parsing fails.
 */
async function readAstroBase() {
  try {
    const src = await fs.readFile('astro.config.mjs', 'utf8');
    const m = src.match(/base:\s*['"]([^'"]*)['"]/);
    if (!m) return '';
    const base = m[1];
    return base.endsWith('/') ? base : base + '/';
  } catch {
    return '';
  }
}

/**
 * Strip markdown image syntax `![alt](url)` (and reference-style
 * `![alt][ref]`). We do this as a defensive measure in case mammoth
 * emits image references even when no convertImage callback is provided.
 */
function stripImages(md) {
  return md
    // Inline: ![alt](url "title") or ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Reference: ![alt][ref]
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '');
}

export async function parseDocx(srcPath, slug, options = {}) {
  const basePrefix = options.basePrefix ?? (await readAstroBase());

  // No convertImage callback → mammoth won't write any image files to disk.
  // Then stripImage() removes any remaining markdown image references.
  const result = await mammoth.convertToMarkdown({ path: srcPath });

  return {
    markdown: stripImages(result.value),
    images: [], // always empty; kept for API compatibility
  };
}