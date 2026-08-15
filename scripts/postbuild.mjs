// scripts/postbuild.mjs
// Copies extracted images from src/content/prompts/images into dist/content/prompts/images
// so they're accessible at the paths referenced by the markdown bodies.

import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = 'src/content/prompts/images';
const DST = 'dist/content/prompts/images';

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else {
      await fs.copyFile(s, d);
    }
  }
}

try {
  await fs.access(SRC);
  await copyDir(SRC, DST);
  console.log(`✓ postbuild: copied images from ${SRC} to ${DST}`);
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log('postbuild: no images dir, skipping');
  } else {
    throw e;
  }
}