# Prompt 作品集展示站设计

**日期**：2026-08-15
**状态**：已批准，待实施
**目标**：将 `F:\code\prompt` 下的所有 prompt 文件（TXT、Word、Excel）整理为一个可公开发布的作品集网站。

---

## 1. 背景与目标

### 1.1 现状

`F:\code\prompt` 下有 47 个 AI 提示词文件，按现有目录分布：

| 路径 | 文件数 | 格式 |
|------|--------|------|
| 根目录 | 8 | .txt |
| 仿真人提示词/ | 6 | .txt |
| 其他/ | 5 | .txt |
| 实战/ | 28 | .txt / .docx / .xlsx |

最大文件 50MB（.docx），最大表格 40MB（.xlsx）。

### 1.2 目标

- **作品集发布**：以可浏览、可搜索的网站形式对外展示所有 prompt 资产
- **内容可视化**：在网页内直接阅读（docx 内容 + 图片）
- **可检索**：按分类、标签、关键词全文搜索
- **极简文档风**：清爽、专业、易读
- **零运行时依赖**：纯静态站点，托管在 GitHub Pages

### 1.3 非范围

- ❌ 不提供"下载原文件"功能
- ❌ 不提供"复制按钮"
- ❌ 不解析 .xlsx 表格内容（仅显示元信息 + 说明）
- ❌ 不做用户系统、评论、点赞等社交功能
- ❌ 不做 SSR / 服务端渲染
- ❌ 不做 i18n（站点为纯中文）

---

## 2. 目标用户

公开发布的作品集，访客为：

- AI 创作者：寻找灵感、复用 prompt
- 设计师 / 自媒体人：参考动画/视频/品牌案例
- 招聘方 / 同行：评估作品水平

---

## 3. 架构

### 3.1 核心原则

- **单一真相源（SSOT）**：源文件保持原样
- **手动 ingest + 自动 build**：脚本一次性生成产物，Astro 只负责展示
- **静态优先**：无运行时后端

### 3.2 目录结构

```
F:\code\prompt\
├── .claude/
├── scripts/
│   ├── ingest.mjs           ← 用户主动运行：扫描 + 解析 + 生成产物
│   └── ingest.test.mjs      ← ingest 单元/集成测试
│
├── archive/                  ← 原始 .doc/.xlsx 归档（非 public/，不暴露）
│   ├── manju-fenjing-10s.docx
│   └── ...
│
├── src/content/
│   ├── config.ts            ← Content Collections schema
│   ├── prompts/             ← ingest 生成的 markdown 产物
│   │   ├── manju-fenjing-10s.md
│   │   └── ...
│   └── prompts/images/      ← 图片（与 .md 平级，避免污染）
│       ├── manju-fenjing-10s/01.png
│       └── ...
│
├── src/components/...
├── src/pages/...
├── src/styles/...
├── astro.config.mjs
├── package.json
└── README.md
```

### 3.3 技术栈

| 组件 | 选型 |
|------|------|
| 框架 | Astro 5.x |
| 主题 | Starlight（Astro 官方文档主题） |
| 样式 | Starlight 默认 + 自定义极简风 |
| 内容管理 | Astro Content Collections（glob loader + zod schema） |
| 搜索 | Pagefind（Starlight 内置） |
| 代码高亮 | Shiki（Astro 内置） |
| docx 解析 | mammoth |
| 部署 | GitHub Pages + GitHub Actions |

---

## 4. 分类与标签

### 4.1 6 个一级分类

| 分类 | 范围 | 文件示例 |
|------|------|---------|
| 剧本分镜 | 漫剧/竖屏短剧的剧本与分镜指令 | 漫剧分镜(10s/15s)、文案分幕、改文提示词、剧本指令、仿真人分镜 |
| 角色与IP | 人物设计、IP、微表情、人物建模 | S级漫剧人物、人脸提示词、人物微表情、人物建模、AI IP设计、shotlab丧尸清道夫、别让你的IP呆板站着 |
| 场景视觉 | 场景、三视图、字体、材质 | S级漫剧场景、场景四视图、三视图、3D字体材质、字体材质1/2/4、布料拼接字体 |
| 视频生成 | 镜头语言、运镜、打斗、特效 | 对比飞行一镜到底打斗、炫酷打斗视频、特效镜头、视频风格 |
| 品牌与商业 | 品牌手册、UI、PPT、广告 | Huang GenLab、暴燃熊健身房品牌、品牌手册UI、年中述职ppt、手柄TVC、棒球比赛大屏、AI无人机航拍 |
| 动画短片 | 完整案例 | 多角色动画短片、学姐包粽子、古风ai短剧、好莱坞短剧、动漫角色pv、灰域追击、骨冠双猎、梨园双星 |

### 4.2 标签体系

**维度类**：竖屏、漫剧、真人、3D、写实、电影感
**技法类**：分镜、运镜、一镜到底、打斗、特效、微表情
**资产类**：人物、场景、道具、IP、字体、材质、UI、PPT

每个 prompt 通常 3-6 个标签。

---

## 5. 页面与组件

### 5.1 页面清单

| 路由 | 来源 | 说明 |
|------|------|------|
| `/` | `src/pages/index.astro` | 首页：分类卡片 + 推荐 + 搜索 |
| `/prompts` | `src/pages/prompts/index.astro` | 全部 prompts 列表（筛选+排序） |
| `/prompts/[slug]` | Starlight 自动 | 单个 prompt 详情 |
| `/category/[category]` | `src/pages/category/[category].astro` | 按分类浏览 |
| `/tags/[tag]` | `src/pages/tags/[tag].astro` | 按标签浏览 |
| `/about` | `src/pages/about.astro` | 关于此项目 |

### 5.2 组件清单

| 组件 | 职责 | 依赖 |
|------|------|------|
| `Layout.astro` | 全局布局、`<head>`、SEO | Starlight |
| `SiteHeader.astro` | 顶部导航 | Layout |
| `SiteFooter.astro` | 页脚 | Layout |
| `CategoryCard.astro` | 首页分类卡片 | 静态数据 |
| `PromptCard.astro` | 列表卡片 | TagBadge |
| `TagBadge.astro` | 标签胶囊 | - |
| `CategoryBadge.astro` | 分类胶囊 | - |
| `TableOfContents.astro` | 长文档右侧目录 | - |

**明确不做的组件**：CopyButton、DownloadLink。

---

## 6. 数据流

### 6.1 ingest 脚本（手动运行）

```
源文件 (实战/, 仿真人提示词/, 其他/, 根目录 .txt)
  ↓ 扫描 + 分类映射（slug → category, tags）
  ├──→ .docx: mammoth 解析 + 图片提取
  ├──→ .txt:  直接读 + 简单 markdown 包装
  └──→ .xlsx: 复制到 archive/，生成"占位 + 说明" .md
  ↓
   ┌──────────────────────────────────────────┐
   │ 产出1: archive/{slug}.{ext}               │ 原始 doc/xlsx 归档
   │ 产出2: src/content/prompts/{slug}.md      │ markdown 主页
   │ 产出3: src/content/prompts/images/        │ 图片
   │          {slug}/01.png, 02.png, ...       │
   └──────────────────────────────────────────┘
```

**frontmatter 字段**：

```yaml
---
title: 漫剧剧本分镜衔接指令（10秒）
category: 剧本分镜
tags: [分镜, 竖屏, 漫剧]
slug: manju-fenjing-jiehe-10s   # 由手工映射表定义（不是从文件名自动生成）
source: txt  # 或 docx, xlsx
date: 2026-07-08  # 来源文件最后修改日期
---
```

**slug 策略**：所有 44 个文件的 slug 都在 `scripts/slug-map.mjs` 中手工维护。原因：文件名常含括号/数字/版本号，自动生成既难又易冲突。

### 6.2 Astro 构建流程

```
src/content/prompts/*.md
  ↓ getCollection() + zod schema 校验
  ↓ Markdown → HTML + Shiki 代码高亮
  ↓ 图片相对路径解析为绝对路径
  ↓ Pagefind 自动构建搜索索引
  ↓
dist/
  ├── index.html
  ├── prompts/manju-fenjing-10s/index.html
  ├── _pagefind/  ← 搜索索引
  └── _astro/     ← 资源
```

### 6.3 Content Collections Schema

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prompts' }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      '剧本分镜', '角色与IP', '场景视觉',
      '视频生成', '品牌与商业', '动画短片',
    ]),
    tags: z.array(z.string()),
    slug: z.string(),
    source: z.enum(['txt', 'docx', 'xlsx']).optional(),
    date: z.date().optional(),
  }),
});

export const collections = { prompts };
```

### 6.4 运行时（访客）

| 行为 | 数据来源 |
|------|---------|
| 浏览首页/分类页 | 预渲染 HTML |
| 阅读 prompt 详情 | 预渲染 HTML（图片、代码高亮已构建） |
| 搜索 | Pagefind 客户端索引（一次性加载） |

整个网站零运行时后端依赖。

---

## 7. 错误处理

### 7.1 ingest 脚本阶段

| 场景 | 处理 |
|------|------|
| 源文件读取失败 | 红色错误 + 跳过 + 继续 |
| mammoth 解析 docx 失败 | 生成占位 .md + warnings |
| 图片提取失败 | 占位文本 `[图片提取失败：xxx]` |
| slug 冲突 | **报错退出**（强失败） |
| category 未映射 | 默认 `其他` + warning |
| frontmatter 缺失字段 | **报错退出** |

**策略**：配置错误强失败，解析错误降级继续。

### 7.2 Astro 构建阶段

任何 schema 错误、资源404、Pagefind 失败 → **build 失败**，不输出半成品。

### 7.3 运行时

静态站点 + 无复制按钮，几乎无运行时错误。`<img>` 加 `onerror` 降级显示 alt。

### 7.4 部署

GitHub Actions build 失败 → 不推送 gh-pages。README 强调 GitHub Pages base path 配置。

---

## 8. 测试

### 8.1 测试矩阵

| 层级 | 测试类型 | 工具 | 触发 |
|------|---------|------|------|
| ingest 脚本 | 单元 + 集成 | Node.js `node:test` | PR / 手动 |
| Schema | 类型校验 | `astro check` | build 时 |
| 构建 | 烟雾测试 | `npm run build` | CI / 手动 |
| 页面 | 端到端（轻量） | Playwright | CI |
| 手动验收 | 浏览器浏览 | - | 部署前 |

### 8.2 ingest 测试

**单元测试**：

```js
test('slug 生成：漫剧剧本分镜衔接指令(10秒).txt → manju-fenjing-jiehe-10s', () => {
  assert.equal(toSlug('漫剧剧本分镜衔接指令(10秒).txt'), 'manju-fenjing-jiehe-10s');
});

test('分类映射：改文提示词 → 剧本分镜', () => {
  assert.equal(categoryOf('改文提示词'), '剧本分镜');
});
```

**集成测试**：用 `tests/fixtures/` 下的小型 .txt 和构造 .docx 跑 ingest，断言产出。

### 8.3 不做的测试（YAGNI）

- ❌ E2E 用户流程测试
- ❌ 视觉回归测试
- ❌ 性能压测
- ❌ 解析覆盖率测试

### 8.4 手动验收清单

```
□ npm install 顺利
□ npm run ingest 把所有 44 个文件处理完，无致命错误
□ npm run dev 启动后，所有页面可访问
□ 抽样 5 个 prompt 详情页，肉眼检查正确
□ docx 中的图片都正确显示
□ xlsx 的占位说明页可见
□ npm run build 顺利，dist/ 产物完整
□ GitHub Actions 在 PR 触发，build 成功
□ GitHub Pages 部署后，正式 URL 可访问
```

---

## 9. 部署

### 9.1 GitHub Pages 配置

1. 仓库 Settings → Pages → Source: `gh-pages` branch
2. 在 `astro.config.mjs` 配置 `base` 为仓库名：

```js
export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/<repo-name>',
  integrations: [starlight()],
});
```

### 9.2 GitHub Actions

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with:
          # 默认会 build 并部署到 gh-pages
```

---

## 10. 关键决策记录

| 决策 | 选择 | 替代方案 | 理由 |
|------|------|---------|------|
| 主题 | Starlight | 自研布局 | 自带搜索/导航/暗色模式；契合"极简文档风" |
| 文档化方式 | 手动 ingest | 构建时转换 | 用户需要检查产物；保留源文件便于回溯 |
| 源文件处理 | 原文件保留 | 移动/重命名 | 单一真相源；用户后续清理 |
| .docx 图片 | mammoth 提取 | pandoc | 无需外部依赖；够用 |
| .xlsx | 仅元信息 + 说明 | 完整解析 | 40MB太大，结构是表格非文档 |
| 下载原文件 | 不提供 | 提供 | 用户明确不要 |
| 复制按钮 | 不提供 | 提供 | 用户明确不要 |

---

## 11. 风险与待办

| 风险 | 缓解 |
|------|------|
| 50MB .docx 解析慢 | ingest 加超时监控；必要时拆分大文件 |
| mammoth 对复杂排版支持有限 | 收集 warnings，构建后输出报告 |
| 中文搜索分词 | Pagefind 默认支持CJK，效果可接受 |
| 实战目录 40MB .xlsx | 仅展示元信息 + 引导用户下载查看 |
| GitHub Pages base path 错配 | README 强调；构建时断言 |

---

## 12. 实施后续

设计文档批准后，将进入 `writing-plans` 阶段，生成实施计划。