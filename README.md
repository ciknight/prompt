# Prompt 作品集

AI 提示词合集：漫剧、视频、IP、字体、品牌设计的实战提示词。

## 本地开发

```bash
npm install
npm run ingest     # 解析源文件 → 生成 markdown（首次必跑）
npm run dev        # 本地预览 http://localhost:4321/prompt/
```

## 添加 / 更新 prompt

1. 把源文件放进根目录、`仿真人提示词/`、`其他/`、`实战/` 之一
2. 在 `scripts/lib/slug-map.mjs` 加一行 `{源文件名: slug}`
3. 在 `scripts/lib/category-map.mjs` 加分类映射
4. `npm run ingest`

## 构建发布

```bash
npm run build
```

产物在 `dist/`，推送到 GitHub Pages。

## 部署

main 分支 push 触发 `.github/workflows/deploy.yml`，自动部署到 GitHub Pages。

部署前需修改 `astro.config.mjs`：

```js
site: 'https://YOUR-USERNAME.github.io',
base: '/YOUR-REPO-NAME',
```

## 目录

```
src/
├── components/    # 复用组件
├── content/
│   ├── config.ts  # Zod schema
│   └── prompts/   # ingest 生成的 markdown
├── pages/         # 路由
└── styles/        # 自定义 CSS

scripts/
├── ingest.mjs     # 主入口
└── lib/           # 解析器、映射表
```