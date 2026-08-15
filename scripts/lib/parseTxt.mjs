// scripts/lib/parseTxt.mjs
import fs from 'node:fs/promises';

export async function parseTxt(filePath) {
  return fs.readFile(filePath, 'utf8');
}
