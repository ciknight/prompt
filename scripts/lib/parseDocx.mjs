// scripts/lib/parseDocx.mjs
import mammoth from 'mammoth';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Where extracted images are written. Lives under public/ so Astro copies them
// to dist/ root automatically at build time.
const PUBLIC_IMAGES_DIR = 'public/content/prompts/images';

/**
 * Read the `base` field from astro.config.mjs so it stays in sync with
 * the deployment base path. Falls back to '' if parsing fails.
 * @returns {string} base path with trailing slash, e.g. '/prompt/'
 */
async function readAstroBase() {
  try {
    const src = await fs.readFile('astro.config.mjs', 'utf8');
    const m = src.match(/base:\s*['"]([^'"]*)['"]/);
    if (!m) return '';
    const base = m[1];
    return base.endsWith('/') ? base : base + '/';
  } catch {
    return '';
  }
}

export async function parseDocx(srcPath, slug, options = {}) {
  const basePrefix = options.basePrefix ?? (await readAstroBase());
  const imageDir = path.join(PUBLIC_IMAGES_DIR, slug, 'images');
  await fs.mkdir(imageDir, { recursive: true });

  const extractedImages = [];

  const result = await mammoth.convertToMarkdown(
    { path: srcPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const ext = (image.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const base64 = await image.read('base64');
        const bytes = Buffer.from(base64, 'base64');
        // Content-hashed filename: same image bytes → same name, regardless of
        // when extracted. Makes re-ingest deterministic and dedupes across docx files.
        const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
        const fileName = `${hash}.${ext}`;
        const imgPath = path.join(imageDir, fileName);
        await fs.writeFile(imgPath, bytes);
        const publicSrc = `${basePrefix}content/prompts/images/${slug}/images/${fileName}`;
        extractedImages.push({ path: imgPath, src: publicSrc });
        return { src: publicSrc };
      }),
    }
  );

  return {
    markdown: result.value,
    images: extractedImages,
  };
}