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

// Detect "numeric prefix" in a heading-like line, including escaped dots
// (mammoth emits "2\." because . is escaped in markdown) and fullwidth
// punctuation. Returns true for: "1.", "1.", "2.", "一、", "1、", etc.
const NUMERIC_PREFIX = /^(?:\d+[.．、]|[一二三四五六七八九十][、.．])/;

function clean(md) {
  return md
    // mammoth heading anchors
    .replace(/<a id="heading_\d+"><\/a>/g, '')
    // double-underscore bold → asterisks
    .replace(/__([^\s_][\s\S]*?[^\s_]|\S)__/g, '**$1**')
    // Promote lone-bold lines that look like headings to markdown headings.
    // mammoth emits docx headings as `**X. Title**` (bold); promote
    // only those with numeric prefix ("1.", "一、", etc.) to ## h2.
    // Labels like `**提示词**` stay as bold paragraphs.
    .replace(
      /^[ \t]*\*\*([^*\n]+)\*\*[ \t]*$/gm,
      (_match, inner) => {
        const t = inner.trim().replace(/\\\./g, '.'); // unescape "\."
        return NUMERIC_PREFIX.test(t) ? `## ${t}` : `**${t}**`;
      }
    )
    // Demote previously-over-promoted headings: anything that's not a
    // numeric-prefixed ## gets converted back to bold paragraph.
    // (e.g. ### 提示词 → **提示词**)
    .replace(
      /^### ([^\n]+)$/gm,
      (_match, inner) => {
        const t = inner.trim().replace(/\\\./g, '.');
        return NUMERIC_PREFIX.test(t) ? `## ${t}` : `**${t}**`;
      }
    )
    // Demote any leftover ####+ not matched above
    .replace(/^####+ /gm, '**')
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
    } else {
      // Debug: show why it didn't change
      // console.log(`  ${name}: no change`);
    }
  }
  console.log(`\nDone: cleaned ${changed} file(s)`);
}

main().catch(e => { console.error(e); process.exit(1); });