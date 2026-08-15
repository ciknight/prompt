// src/content/config.ts
// NOTE: CATEGORIES list must match `scripts/lib/category-map.mjs` CATEGORIES.
// The lib/category-sync.test.mjs test verifies the two stay in sync.
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
    source: z.enum(['txt', 'docx', 'xlsx', 'awesome-video-prompts']).optional(),
    date: z.date().optional(),
    // Optional attribution fields (used by awesome-video-prompts imports):
    author: z.string().optional(),
    source_url: z.string().url().optional(),
    model: z.string().optional(),
  }),
});

export const collections = { prompts };