// scripts/ingest-one.mjs
// One-shot: ingest a single source file by relative path.
// Used to add new files to the site without re-running the full SLUG_MAP sweep.
//
// Usage: node scripts/ingest-one.mjs <relative-path>

import { ingestOne } from './ingest.mjs';

const rel = process.argv[2];
if (!rel) {
  console.error('Usage: node scripts/ingest-one.mjs <relative-path>');
  process.exit(2);
}

try {
  await ingestOne({
    relativePath: rel,
    sourceDir: '.',
    outDir: 'src/content/prompts',
    archiveDir: 'archive',
  });
  console.log(`Done: ${rel}`);
} catch (e) {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
}