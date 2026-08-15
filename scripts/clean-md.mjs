// scripts/clean-md.mjs
// One-off cleanup of generated .md files:
//   - Strip mammoth's heading anchors: <a id="heading_N"></a>
//   - Convert __bold__ → **bold** (more widely recognized)
//   - Strip U+FFFD (UTF-8 replacement) chars that mammoth emits when
//     a byte sequence fails to decode (these break YAML frontmatter)
//
// Usage: node scripts/clean-md.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/prompts';

// U+FFFD encoded as UTF-8 byte sequence (3 bytes: 0xEF 0xBF 0xBD)
// Constructing it via fromCharCode avoids source-file encoding issues.
const REPLACEMENT_CHAR = String.fromCharCode(0xFFFD);

function clean(md) {
  return md
    // mammoth heading anchors
    .replace(/<a id="heading_\d+"><\/a>/g, '')
    // double-underscore bold → asterisks
    .replace(/__([^\s_][\s\S]*?[^\s_]|\S)__/g, '**$1**')
    // UTF-8 replacement char (mammoth decode failure marker)
    .replaceAll(REPLACEMENT_CHAR, '');
}

async function main() {
  const entries = await fs.readdir(ROOT);
  let changed = 0;
  for (const name of entries) {
    if (!name.endsWith('.md')) continue;
    const p = path.join(ROOT, name);
    const original = await fs.readFile(p, 'utf8');
    const cleaned = clean(original);
    if (original !== cleaned) {
      await fs.writeFile(p, cleaned, 'utf8');
      changed++;
      console.log(`  ${name}: cleaned`);
    }
  }
  console.log(`\nDone: cleaned ${changed} file(s)`);
}

main().catch(e => { console.error(e); process.exit(1); });