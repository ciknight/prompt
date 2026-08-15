// scripts/lib/writePrompt.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writePrompt({ slug, title, category, tags, source, date, markdown, outDir = 'src/content/prompts' }) {
  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `category: ${category}`,
    `tags: [${tags.map(t => JSON.stringify(t)).join(', ')}]`,
    `slug: ${slug}`,
    `source: ${source}`,
    `date: ${date.toISOString().slice(0, 10)}`,
    '---',
    '',
  ].join('\n');

  const outPath = path.join(outDir, `${slug}.md`);
  await fs.writeFile(outPath, fm + markdown, 'utf8');
  return outPath;
}