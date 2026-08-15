# CLAUDE.md

AI 提示词作品集（"AI 提示词收藏"）的项目说明，供 AI 助手快速理解项目约定。

## 项目目的

把 `实战/`、`仿真人提示词/`、`其他/`、根目录的 47 个 prompt 文件（txt/docx/xlsx）展示成一个静态网站。**所有内容均收集自互联网公开渠道，不是本站原创**（见 `src/pages/about.astro`）。

## 技术栈

- **Astro 5** + **Starlight** 主题
- **Content Collections**（Zod schema 校验 frontmatter）
- **Pagefind** 静态搜索索引
- **mammoth** docx → markdown（不再提取图片）
- **TypeScript** 严格模式（`astro/tsconfigs/strict`）
- **GitHub Pages** + GitHub Actions 自动部署

## 站点结构

```
src/
├── components/        # 7 个 .astro 组件（SiteHeader, SiteFooter, Badge, Card 等）
├── content/
│   ├── config.ts      # Content Collections schema (zod)
│   └── prompts/        # 47 个 .md（git tracked，从 ingest 生成）
├── layouts/
│   └── BaseLayout.astro  # html/head/header/footer 共享布局
├── lib/
│   └── base-url.ts    # baseUrl() helper — 从 astro.config 的 base 派生 URL 前缀
├── pages/              # 6 个路由
│   ├── index.astro
│   ├── about.astro
│   ├── prompts/index.astro
│   ├── prompts/[slug].astro
│   ├── category/[category].astro
│   └── tags/[tag].astro
└── styles/
    └── custom.css      # 极简文档风微调

scripts/
├── ingest.mjs          # 主入口（CLI: npm run ingest）
├── strip-images.mjs     # 一次性：从已有 .md 剥离图片引用
├── clean-md.mjs        # 一次性：清理生成的 .md（heading 升级、噪音剥离）
├── smoke.mjs           # HTTP smoke 测试（spawn astro preview + 断言）
└── lib/                # parseTxt/parseDocx/parseXlsx + slug-map/category-map/tag-slug/tags-map

docs/superpowers/
├── specs/2026-08-15-prompt-showcase-design.md   # 设计 spec
└── plans/2026-08-15-prompt-showcase.md          # 实施 plan
```

## 关键约定（不要违反）

### 1. 内容版权
- **所有 prompt 都收集自互联网，不是原创**（`src/pages/about.astro` 有完整声明）
- **不要实现** "下载原文件" 功能（spec §1.3 禁止）
- **不要实现** "复制 prompt" 按钮（user 主动取消过）
- docx 内嵌图片会被提取并展示（`parseDocx.mjs` 提供 `convertImage` 回调，内容哈希命名，写到 `public/content/prompts/images/<slug>/images/`，build 时由 Astro 复制到 `dist/`）

### 2. URL 用拼音 slug，**不用中文**
- category slug 在 `scripts/lib/category-map.mjs` 的 `CATEGORY_SLUGS` 映射
- tag slug 在 `scripts/lib/tag-slug.mjs` 的 `TAG_SLUGS` 映射
- 所有组件/页面用 `baseUrl()` helper（`src/lib/base-url.ts`）拼接路径
- 不要再硬编码 `/category/xxx/` 这种路径

### 3. 内部链接
- 用 `${baseUrl()}category/${categorySlug(name)}/` 而不是 `/category/${encodeURIComponent(name)}/`
- 改 `astro.config.mjs` 的 `base` 时**无需**手动同步其他文件

### 4. 站点名
- 站点名：**AI 提示词收藏**（不是 "Prompt 作品集"）
- 改任何名字时同步 8 个文件：`astro.config.mjs`、`BaseLayout.astro`、`SiteHeader.astro`、`SiteFooter.astro`、`index.astro`、`about.astro`、`prompts/index.astro`、`prompts/[slug].astro`、`category/[category].astro`、`tags/[tag].astro`、README.md

### 5. Markdown 内容来源
- `src/content/prompts/*.md` 由 ingest 生成（git tracked）
- 不要再让用户手动编辑这些文件（会跟 ingest 冲突）
- 修改 markdown 行为：改 `scripts/lib/parseDocx.mjs` 或 `scripts/clean-md.mjs`，然后重跑 ingest

### 6. clean-md.mjs 三个关键提升
- `**X. Title**`（粗体 + 数字前缀）→ `## X. Title` (h2)
- `X：`（1-14 字符短标签，无句末标点）→ `### X` (h3)
- 文档标题（frontmatter 后第一行 `**title**`）被剥离（页面 H1 已显示）

## 工作流

### 日常开发

```bash
npm install
npm test               # 21-24 个单元测试
npm run smoke          # HTTP smoke（spawn preview + 5 断言）
npm run build          # 静态构建
npm run dev            # localhost:4321/prompt/
npm run ingest         # 重新从源文件生成 markdown
```

### 一次性清理脚本

```bash
node scripts/clean-md.mjs   # 清理 .md（heading 升级、剥离噪音）
node scripts/strip-images.mjs # 剥离图片引用
```

### 部署

1. 编辑 `astro.config.mjs`：`site: 'https://YOUR-USERNAME.github.io'`、`base: '/YOUR-REPO-NAME'`
2. 推送 main → `.github/workflows/deploy.yml` 跑：npm ci → npm run check → npm test → npm run build → npm run smoke → 部署
3. GitHub 仓库 → Settings → Pages → Source 选 "GitHub Actions"

## 不要做

- ❌ 用 `${encodeURIComponent(name)}` 生成 category URL（应用 `categorySlug(name)`）
- ❌ 在 `.astro` 文件中硬编码路径（用 `baseUrl()`）
- ❌ 把"Prompt 作品集"作为站点名（应用 "AI 提示词收藏"）
- ❌ 给中文 category 生成中文 URL slug
- ❌ 实现 CopyButton 或 DownloadLink（user 已取消）
- ❌ 把 `archive/` 提交到 git（gitignored，因为占空间且不部署）

## 关键陷阱

1. **Windows CRLF 行尾**：某些 markdown 文件有 `\r\n`，导致 regex 锚点失败。`clean-md.mjs` 第一步 `replace(/\r\n/g, "\n")` 处理这个。
2. **Astro 缓存**：快速修改文件后 build 报 "Duplicate id" 警告 → `rm -rf .astro` 然后重 build。
3. **Base prefix 漂移**：所有内部链接必须用 `baseUrl()`，否则在 GitHub Pages 子路径下 404。
4. **mammoth 输出 U+FFFD**：docx 中某些 UTF-8 字节解码失败会替换为 `U+FFFD`，破坏 YAML。`clean-md.mjs` 最后一步剥除。
5. **randomUUID 非确定性**：早期实现用 `randomUUID()` 作图片文件名导致重新 ingest 后 git diff 噪音。已改为 sha256 内容哈希（确定性）。

## 仓库约定

- 提交信息格式：`<type>(<scope>): <subject>`（如 `feat(scripts): ...`、`fix(content): ...`）
- 测试用 Node 内置 `node:test`
- 不引入新依赖前先考虑用 Node 标准库
- bash 用 POSIX 语法（`rm -rf`、grep）；PowerShell 用 `Remove-Item -Recurse -Force`

## 当前状态

- 47 prompts · 78 静态页面 · 121 图片（从 docx 提取，build 复制到 dist/）
- 21/21 测试通过 · 6/6 smoke 通过 · 0 build warnings
- HEAD 在 main 上可推送部署

## 详细文档

- 设计：`docs/superpowers/specs/2026-08-15-prompt-showcase-design.md`
- 实施 plan：`docs/superpowers/plans/2026-08-15-prompt-showcase.md`
- 用户手册：`README.md`
- 版权声明：`src/pages/about.astro`