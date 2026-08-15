// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prompts' }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      '剧本分镜',
      '角色与IP',
      '场景视觉',
      '视频生成',
      '品牌与商业',
      '动画短片',
    ]),
    tags: z.array(z.string()),
    slug: z.string(),
    source: z.enum(['txt', 'docx', 'xlsx']).optional(),
    date: z.date().optional(),
  }),
});

export const collections = { prompts };