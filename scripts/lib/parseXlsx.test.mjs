// scripts/lib/parseXlsx.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { parseXlsx } from './parseXlsx.mjs';

// Minimal xlsx with two prompt rows in B and one duplicate in C.
async function makeMinimalXlsx(rows) {
  const dir = await mkdtemp(join(tmpdir(), 'xlsx-'));
  const zip = new AdmZip();

  zip.addFile(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
       <Default Extension="xml" ContentType="application/xml"/>
       <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
       <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
       <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
     </Types>`
  );

  zip.addFile(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
       <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
     </Relationships>`
  );

  zip.addFile(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
               xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
       <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
     </workbook>`
  );

  // Shared strings: 1 header, then rows of prompt text
  const ss = ['header', ...rows.flatMap((r) => [r.b, ...(r.c ? [r.c] : [])])];
  const si = ss.map((s) => `<si><t xml:space="preserve">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</t></si>`).join('');
  zip.addFile(
    'xl/sharedStrings.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${ss.length}" uniqueCount="${ss.length}">${si}</sst>`
  );

  // Build sheet rows. sst index of header is 0.
  // Each row r: B = sstIdx (b), C = sstIdx (c) if present.
  let sstIdx = 1;
  const rowXml = rows
    .map((r, i) => {
      const rowNum = i + 2; // row 1 is header
      const bIdx = sstIdx++;
      const cIdx = r.c ? sstIdx++ : null;
      const cells = [`<c r="B${rowNum}" t="s"><v>${bIdx}</v></c>`];
      if (cIdx !== null) cells.push(`<c r="C${rowNum}" t="s"><v>${cIdx}</v></c>`);
      return `<row r="${rowNum}">${cells.join('')}</row>`;
    })
    .join('');
  zip.addFile(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
       <sheetData>
         <row r="1"><c r="A1" t="s"><v>0</v></c></sheetData>
       </sheetData>
       <sheetData>${rowXml}</sheetData>
     </worksheet>`
  );

  const p = join(dir, 'test.xlsx');
  zip.writeZip(p);
  return { path: p, dir };
}

test('parseXlsx returns one entry per non-empty B column row', async () => {
  const { path, dir } = await makeMinimalXlsx([
    { b: 'prompt one body' },
    { b: 'prompt two body' },
    { b: '' }, // empty B → skipped
    { b: 'prompt three body', c: 'second segment' },
  ]);
  try {
    const results = await parseXlsx(path);
    assert.equal(results.length, 3);
    assert.equal(results[0].markdown, 'prompt one body');
    assert.equal(results[0].slug, 'test-row2');
    assert.equal(results[1].markdown, 'prompt two body');
    assert.equal(results[2].markdown.includes('prompt three body'), true);
    assert.equal(results[2].markdown.includes('second segment'), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('parseXlsx skips C when it duplicates B', async () => {
  const { path, dir } = await makeMinimalXlsx([{ b: 'same content', c: 'same content' }]);
  try {
    const [first] = await parseXlsx(path);
    assert.equal(first.markdown, 'same content');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('parseXlsx returns empty array for xlsx with no data rows', async () => {
  const { path, dir } = await makeMinimalXlsx([]);
  try {
    const results = await parseXlsx(path);
    assert.deepEqual(results, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});