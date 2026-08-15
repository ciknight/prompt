// scripts/lib/parseDocx.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocx } from './parseDocx.mjs';
import AdmZip from 'adm-zip';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

async function makeMinimalDocx() {
  const dir = await mkdtemp(join(tmpdir(), 'docx-'));
  const zip = new AdmZip();

  zip.addFile('[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
       <Default Extension="xml" ContentType="application/xml"/>
       <Default Extension="png" ContentType="image/png"/>
       <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
       <Override PartName="/word/media/image1.png" ContentType="image/png"/>
     </Types>`);

  zip.addFile('_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
     </Relationships>`);

  zip.addFile('word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
     </Relationships>`);

  zip.addFile('word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
       <w:body>
         <w:p><w:r><w:t>测试段落一</w:t></w:r></w:p>
         <w:p>
           <w:r>
             <w:drawing>
               <wp:inline distT="0" distB="0" distL="0" distR="0">
                 <wp:extent cx="100" cy="100"/>
                 <wp:effectExtent l="0" t="0" r="0" b="0"/>
                 <wp:docPr id="1" name="Picture 1"/>
                 <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
                 <a:graphic>
                   <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                     <pic:pic>
                       <pic:nvPicPr>
                         <pic:cNvPr id="1" name="image1.png"/>
                         <pic:cNvPicPr/>
                       </pic:nvPicPr>
                       <pic:blipFill>
                         <a:blip r:embed="rId1"/>
                         <a:stretch><a:fillRect/></a:stretch>
                       </pic:blipFill>
                       <pic:spPr>
                         <a:xfrm>
                           <a:off x="0" y="0"/>
                           <a:ext cx="100" cy="100"/>
                         </a:xfrm>
                         <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                       </pic:spPr>
                     </pic:pic>
                   </a:graphicData>
                 </a:graphic>
               </wp:inline>
             </w:drawing>
           </w:r>
         </w:p>
         <w:p><w:r><w:t>测试段落二</w:t></w:r></w:p>
       </w:body>
     </w:document>`);

  const imgBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  zip.addFile('word/media/image1.png', imgBytes);

  const path = join(dir, 'test.docx');
  zip.writeZip(path);
  return { path, dir, imgBytes };
}

test('parseDocx extracts text', async () => {
  const { path, dir, imgBytes } = await makeMinimalDocx();
  const imageDir = join(process.cwd(), 'public/content/prompts/images/test-slug');
  try {
    const result = await parseDocx(path, 'test-slug');
    assert.ok(typeof result.markdown === 'string');
    assert.ok(result.markdown.includes('测试段落一'));
    assert.ok(result.markdown.includes('测试段落二'));
    assert.equal(result.images.length, 1);
    assert.match(result.images[0].path, /test-slug[\\/]+images[\\/]+/);

    // Image filename must be content-hashed (deterministic) — same bytes → same name
    const expectedHash = createHash('sha256').update(imgBytes).digest('hex').slice(0, 16);
    assert.ok(
      result.images[0].path.endsWith(`${expectedHash}.png`),
      `filename should end with ${expectedHash}.png, got: ${result.images[0].path}`
    );

    // src must include base prefix from astro.config.mjs
    assert.ok(result.images[0].src.startsWith('/prompt/'), `expected base-prefixed src, got: ${result.images[0].src}`);
    assert.ok(result.images[0].src.includes(expectedHash), 'src should include content hash');
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(imageDir, { recursive: true, force: true });
  }
});

test('parseDocx is deterministic — same docx produces same filenames', async () => {
  const { path, dir, imgBytes } = await makeMinimalDocx();
  const imageDir = join(process.cwd(), 'public/content/prompts/images/det-test');
  try {
    const r1 = await parseDocx(path, 'det-test');
    const r2 = await parseDocx(path, 'det-test');
    assert.equal(r1.images[0].src, r2.images[0].src, 'src must be identical across runs');

    // File on disk should be the same (re-ingest doesn't accumulate duplicates)
    const file1 = await readFile(r1.images[0].path);
    const file2 = await readFile(r2.images[0].path);
    assert.equal(Buffer.compare(file1, file2), 0);
    assert.equal(Buffer.compare(file1, imgBytes), 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(imageDir, { recursive: true, force: true });
  }
});