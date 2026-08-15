// scripts/lib/parseXlsx.mjs
// Parse a multi-row prompt table from an xlsx file.
//
// The table used here has 4 columns:
//   A: 视频截图 (reference video)
//   B: 提示词        (primary prompt body)
//   C: 提示词2       (optional second segment; appended if present and not a duplicate of B)
//   D: 参考图        (reference image, free text)
//
// Each non-empty row (B column has content) becomes one prompt in the
// returned array, with a stable slug derived from the source filename
// and the 1-based row number. xlsx carries no embedded media, so no
// images are produced.

import AdmZip from 'adm-zip';

const ROW_RANGE = { from: 2, to: 21 }; // skip header row 1; stop at row 21 (current sheet dim)

/**
 * Pull a single cell's text from the worksheet XML.
 * Returns '' for empty / missing cells.
 */
function readCell(sheetXml, sst, ref) {
  // Match <c r="REF" ... t="TYPE" ... > ... </c>
  const re = new RegExp(
    `<c r="${ref}"(?:\\s+s="\\d+")?\\s+t="([^"]+)"[^>]*>([\\s\\S]*?)</c>`
  );
  const m = sheetXml.match(re);
  if (!m) return '';
  const type = m[1];
  const inner = m[2];
  if (type === 's') {
    const v = inner.match(/<v>([^<]*)<\/v>/);
    return v ? (sst[Number(v[1])] ?? '') : '';
  }
  if (type === 'inlineStr' || type === 'str') {
    const is = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
    return is ? is[1] : '';
  }
  return '';
}

export async function parseXlsx(srcPath) {
  const zip = new AdmZip(srcPath);
  const sheetEntry = zip.getEntry('xl/worksheets/sheet1.xml');
  const sstEntry = zip.getEntry('xl/sharedStrings.xml');
  if (!sheetEntry) throw new Error(`no sheet1.xml in ${srcPath}`);
  const sheetXml = sheetEntry.getData().toString('utf8');
  const sst = sstEntry
    ? [...sstEntry.getData().toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
        (m) => {
          const t = m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/);
          return t ? t[1] : '';
        }
      )
    : [];

  const fileBase = srcPath
    .replace(/^.+[\\/]/, '')
    .replace(/\.[^.]+$/, '');

  const prompts = [];
  for (let row = ROW_RANGE.from; row <= ROW_RANGE.to; row++) {
    const b = readCell(sheetXml, sst, `B${row}`).trim();
    if (!b) continue; // skip rows without a primary prompt

    const c = readCell(sheetXml, sst, `C${row}`).trim();

    // Compose body. If C is present and is not just a duplicate of B,
    // append it as a second segment.
    let body = b;
    if (c && c !== b) body += '\n\n' + c;

    // Title: first line of B, capped at 40 chars + ellipsis so very
    // long single-line rows don't flood category listings.
    const firstLine = b.split(/\r?\n/, 1)[0].trim();
    const titleText = firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine;
    const title = `实战表格 · ${titleText}`;

    prompts.push({
      title,
      markdown: body,
      slug: `${fileBase}-row${row}`,
      category: '动画短片',
      tags: ['写实', '电影感', '分镜'],
    });
  }
  return prompts;
}