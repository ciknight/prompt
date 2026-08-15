# Prompt 展示站

AI 提示词展示站：漫剧、视频、IP、字体、品牌设计的实战提示词。

## ⚠️ 内容来源与版权声明

本站所有提示词均**收集自互联网公开渠道**（AI 创作社群、公开教程、社交媒体分享等），并非本站原创作品。

- 所有提示词的**著作权归原作者所有**
- 本站仅作**展示与学习用途**，未用于任何商业目的
- 如有版权问题，请通过 GitHub issue 联系，站主将在核实后立即删除相关内容

源文件（.txt / .docx / .xlsx）在经过解析提取后已**从仓库中完全删除**（包括 git 历史）。如需重新整理，需要重新获取原始素材。

## 本地开发

```bash
npm install
npm run dev        # 本地预览 http://localhost:4321/prompt/
```

`npm run ingest` 是数据导入命令，从源文件生成 markdown 产物。**当前仓库不含源文件**，如要重新生成需先获取原始 .txt / .docx / .xlsx。

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

`scripts/lib/base-url.ts` 通过 `import.meta.env.BASE_URL` 自动读取 base，**无需手动同步**。

## 目录

```
src/
├── components/    # 复用组件
├── content/
│   ├── config.ts  # Zod schema
│   └── prompts/   # ingest 生成的 markdown
├── layouts/       # BaseLayout 等共享布局
├── lib/           # base-url 等辅助
├── pages/         # 路由
└── styles/        # 自定义 CSS

scripts/
├── ingest.mjs     # 主入口
├── strip-images.mjs  # 一次性清理：从 .md 移除图片引用
├── smoke.mjs      # HTTP smoke 测试
└── lib/           # 解析器、映射表
```