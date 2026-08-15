// scripts/clean-md.mjs
// One-off cleanup of generated .md files:
//   - Strip mammoth's heading anchors: <a id="heading_N"></a>
//   - Convert __bold__ → **bold** (more widely recognized)
//   - Strip U+FFFD (UTF-8 replacement) chars that mammoth emits when
//     a byte sequence fails to decode (these break YAML frontmatter)
//   - Promote section labels (短标签行) to ## or ### headings
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
    // Normalize line endings (some files have \r\n from Windows editors)
    .replace(/\r\n/g, '\n')
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
    // Promote short label-like lines to h3 headings. Catches docx
    // headings that mammoth emitted as plain paragraphs (no bold):
    //   `核心情绪：` → ### 核心情绪
    //   `0—1秒：`        → ### 0—1秒
    //   `提示词：`        → ### 提示词
    // Strict conditions to avoid false positives:
    //   - ≤ 14 characters (rejects long descriptive paragraphs)
    //   - ends with `:` or `:`
    //   - no sentence-ending punctuation (，。！？.!?；;)
    //   - no commas (avoids multi-clause paragraphs)
    .replace(
      /^[ \t]*([^。，！？；,.\!?\n]{1,14})[：:][ \t]*$/gm,
      (_match, label) => {
        // Reject too-short labels that are likely fragments
        const t = label.trim();
        if (t.length < 2) return _match;
        // Reject lines that look like a sentence (contain subject+verb
        // patterns beyond 4 chars). We allow 2-14 char labels which catch
        // "核心情绪", "0—1秒", "本段台词" but skip longer fragments.
        return `### ${t}`;
      },
    )
    // Demote any leftover ####+ not matched above
    .replace(/^####+ /gm, '**')
    // Strip the first bold line immediately after frontmatter (the
    // document title repeats the H1 we already render in the page header)
    .replace(/^---\n[\s\S]*?\n---\n\*\*([^*\n]+)\*\*\n/, (m) => m.replace(/\*\*[^*\n]+\*\*\n/, ''))
    // Strip bold from lines that have no numeric prefix and aren't
    // meaningful as headings (e.g. `**视频教程：**`, `**提示词：**`,
    // `**小红书链接：**`). They become plain paragraphs.
    .replace(/^[ \t]*\*\*([^*\n]+)\*\*[ \t]*$/gm, '$1')
    // Strip lines containing Feishu / Lark document URLs. These are
    // typically private share links (often followed by passwords) that
    // don't belong on a public static site. Matches feishu.cn / .com,
    // larksuite.com / .cn, and lark.com / .cn, with or without a
    // markdown link wrapper. The whole line is dropped so any trailing
    // "密码：xxx" gets removed too.
    .replace(/^.*(?:feishu\.(?:cn|com)|larksuite\.(?:com|cn)|lark\.(?:com|cn)).*\n?/gm, '')
    // Collapse 3+ consecutive blank lines down to 2 (one paragraph break)
    .replace(/\n{3,}/g, '\n\n')
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