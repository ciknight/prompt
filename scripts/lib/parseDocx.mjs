// scripts/lib/parseDocx.mjs
import mammoth from 'mammoth';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Where extracted images are written. Lives under public/ so Astro copies them
// to dist/ root automatically at build time.
const PUBLIC_IMAGES_DIR = 'public/content/prompts/images';

// Base URL prefix for image src in markdown. Must match `base` in astro.config.mjs.
// Update this constant if you change the deployment base path.
const BASE_PREFIX = '/prompt';

export async function parseDocx(srcPath, slug) {
  const imageDir = path.join(PUBLIC_IMAGES_DIR, slug, 'images');
  await fs.mkdir(imageDir, { recursive: true });

  const extractedImages = [];

  const result = await mammoth.convertToMarkdown(
    { path: srcPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const ext = (image.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const fileName = `${randomUUID()}.${ext}`;
        const imgPath = path.join(imageDir, fileName);
        const buffer = await image.read('base64');
        await fs.writeFile(imgPath, Buffer.from(buffer, 'base64'));
        const publicSrc = `${BASE_PREFIX}/content/prompts/images/${slug}/images/${fileName}`;
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