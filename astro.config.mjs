// astro.config.mjs
// Custom domain: https://prompt.ibeat.top
// GitHub Pages URL: https://ciknight.github.io/prompt/
// When deploying to custom domain, `base` is `/` (root); when staying on
// github.io, `base` would be `/prompt` (subpath).
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://prompt.ibeat.top',
  base: '/',
  integrations: [
    starlight({
      title: 'AI 提示词收藏',
      description: 'AI 提示词收藏：漫剧、视频、IP、字体、品牌设计',
      customCss: ['./src/styles/custom.css'],
      social: { github: 'https://github.com/ciknight/prompt' },
    }),
  ],
});