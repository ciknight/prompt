// astro.config.mjs
// TODO: replace placeholder deploy values (site, base, social.github) before first release.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://example.github.io',
  base: '/prompt',
  integrations: [
    starlight({
      title: 'Prompt 作品集',
      description: 'AI 提示词合集：漫剧、视频、IP、字体、品牌设计',
      customCss: ['./src/styles/custom.css'],
      social: { github: 'https://github.com/example/prompt' },
    }),
  ],
});
