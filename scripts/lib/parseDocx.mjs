// scripts/lib/parseDocx.mjs
import mammoth from 'mammoth';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function parseDocx(srcPath, slug, imagesBaseDir = 'src/content/prompts/images') {
  const imageDir = path.join(imagesBaseDir, slug, 'images');
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
        const publicSrc = path.posix.join('/content/prompts/images', slug, 'images', fileName);
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