// scripts/strip-images.mjs
// One-off cleanup: remove all markdown image references from generated
// .md files. Used after parseDocx was changed to no longer extract images.
//
// Strips:
//   - ![alt](url)        (inline)
//   - ![alt](url "title")
//   - ![alt][ref]        (reference-style)
//
// Usage: node scripts/strip-images.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/prompts';

function stripImages(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '');
}

async function main() {
  const entries = await fs.readdir(ROOT);
  let total = 0;
  let changed = 0;
  for (const name of entries) {
    if (!name.endsWith('.md')) continue;
    const p = path.join(ROOT, name);
    const original = await fs.readFile(p, 'utf8');
    const cleaned = stripImages(original);
    const originalCount = (original.match(/!\[[^\]]*\]/g) || []).length;
    total += originalCount;
    if (original !== cleaned) {
      await fs.writeFile(p, cleaned, 'utf8');
      changed++;
      console.log(`  ${name}: stripped ${originalCount} image ref(s)`);
    }
  }
  console.log(`\nDone: stripped ${total} image refs from ${changed} file(s)`);
}

main().catch(e => { console.error(e); process.exit(1); });