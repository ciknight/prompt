# 从 awesome-video-prompts 小批量精选导入设计

**日期**：2026-08-15
**状态**：待用户 review
**目标**：从 awesome-video-prompts 仓库精选 30–50 条中文 prompt 整合进本站，保留原文作者与链接，符合现有版权声明与 schema 约定。

---

## 1. 背景与目标

### 1.1 现状

- 现有 `src/content/prompts/` 共 56 条 prompt（来源：txt/docx/xlsx）
- 现有 schema 6 个中文 category：剧本分镜 / 角色与IP / 场景视觉 / 视频生成 / 品牌与商业 / 动画短片
- 现有 `scripts/lib/tag-slug.mjs` 维护 23 个闭合中文标签词表（TAG_SLUGS）
- 现有图片路径约定：`public/content/prompts/images/<slug>/images/<filename>`（由 parseDocx.mjs 输出，build 时 Astro 复制到 dist/）
- 现有 `src/pages/prompts/[slug].astro` 头部已渲染 title / category / tags / date / source

### 1.2 目标

- 从 awesome-video-prompts 精选 30–50 条 **seedance2 模型 + 中文 + 横屏偏好** 的 prompt 补充进站
- 每条保留原文作者 + 原文链接（source_url）
- 不破坏现有 schema、tag 体系、图片路径、build 流程
- 现有 21 个单元测试 + 5 个 smoke 断言全部继续通过

### 1.3 非范围

- ❌ 不导入视频文件（video.mp4）——用户明确排除
- ❌ 不全量导入（仅精选 30–50 条）
- ❌ 不修改 awesome-video-prompts 仓库（已 archived/read-only）
- ❌ 不修改现有 ingest 流程（ingest.mjs / clean-md.mjs / parseDocx.mjs）
- ❌ 不实现 CopyButton / DownloadLink（沿用 CLAUDE.md 现有约定）
- ❌ 不做英文 prompt 翻译（保留原英文 tag 与原文 body）
- ❌ 不创建新 category（仅在现有 6 个内分类）

---

## 2. 上游数据

### 2.1 源仓库（已 clone 到 `F:\code\awesome-video-prompts\`）

| 维度 | 数值 |
|---|---|
| 提示词总数 | 3097 条（4479 个 .md 文件，含月索引等） |
| 月份目录 | 2025-02 (1) · 2025-12 (4) · 2026-01 (24) · 2026-02 (550) · 2026-03 (588) · 2026-04 (1436) · 2026-05 (1467) · 2026-06 (409) |
| 模型 Top | seedance2 (2869) · kling3 (314) · grok (191) · pixverse (55) · geminiomniflash (47) · veo3 (34) |
| 语言分布（50 条样本） | 英文 56% · 中文 38% · 日文 6% |
| 版权 | 仓库无 LICENSE 声明；frontmatter 保留 `author` + `source_url`（多为 X/Twitter） |
| 归档状态 | 2026-08-06 archived（read-only） |

### 2.2 源文件 frontmatter schema

```yaml
title: "..."            # 必填
image: "/prompts/..."   # 封面 jpg 路径（相对站点根）
video: "/prompts/..."   # 视频 mp4 路径（本项目不导入）
date: 'YYYY-MM-DD'
description: |          # 完整 prompt 正文（通常与 body 内容相同）
  ...
models:                 # 模型列表（数组）
  - seedance2
tags:                   # 英文 tag 数组
  - cinematic
  - fpv
author: "..."           # 原文作者
source_url: "..."       # 原文链接
draft: false            # 是否草稿
```

### 2.3 源媒体路径

封面图：`awesome-video-prompts/static/prompts/<month>/<id>-<slug>/cover.jpg`

---

## 3. 架构

### 3.1 核心原则

- **解耦两阶段**：先挑候选，再导入。两步互不依赖，可在 `selected-prompts.json` 上手编增删。
- **不动现有脚本**：保留 `ingest.mjs` / `clean-md.mjs` / `parseDocx.mjs` 处理 txt/docx/xlsx；新流程处理 markdown 源。
- **幂等可回滚**：导入脚本可重跑，撤销只需 `git checkout -- src/content/prompts/` + 删 `public/content/prompts/images/<slug>/`。

### 3.2 数据流

```
[阶段 A：候选挑选（一次，离线）]
awesome-video-prompts/content/prompts/<month>/<id>-<slug>.md
    ↓ scripts/select-awesome-video-prompts.mjs
selected-prompts.json                                  ← 30–50 条候选清单

[阶段 B：导入（一次，离线）]
selected-prompts.json
    ↓ scripts/import-awesome-video-prompts.mjs
    ├── public/content/prompts/images/<our-slug>/images/cover.jpg   ← 从源复制
    ├── src/content/prompts/<our-slug>.md                          ← 新生成 markdown
    ↓ [astro build]
dist/...                                                       ← 静态站
```

### 3.3 目录结构（增量）

```
F:\code\prompt\
├── scripts/
│   ├── select-awesome-video-prompts.mjs   ← 新增：阶段 A
│   ├── import-awesome-video-prompts.mjs   ← 新增：阶段 B
│   └── lib/
│       ├── awesome-video-prompts-source.mjs  ← 新增：源数据读取 + 标签映射
│       └── awesome-video-prompts-source.test.mjs  ← 新增：单元测试
├── selected-prompts.json                  ← 新增（gitignored，候选清单）
├── src/
│   ├── content/
│   │   ├── config.ts                      ← 修改：扩展 schema
│   │   └── prompts/                       ← 增量：30–50 个新 .md
│   └── pages/prompts/[slug].astro         ← 修改：页脚 source_url 渲染
├── tests/
│   └── import-awesome-video-prompts.test.mjs  ← 新增：导入脚本集成测试
└── public/content/prompts/images/         ← 增量：30–50 个新 cover.jpg
```

### 3.4 不修改的现有脚本

`ingest.mjs` / `clean-md.mjs` / `parseDocx.mjs` / `parseTxt.mjs` / `parseXlsx.mjs` 不动。新脚本独立位于 `scripts/`，通过新的 lib 模块复用必要逻辑（仅读 tags.yaml、tag-slug.mjs）。

---

## 4. Schema 扩展

`src/content/config.ts` 在现有 schema 末尾追加 **可选**字段，并在 `source` enum 中加入新值：

```ts
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
    // 新增（可选，向后兼容）：
    author: z.string().optional(),
    source_url: z.string().url().optional(),
    model: z.string().optional(),
  }),
});
```

**向后兼容**：现有 56 个 .md 的 frontmatter 不需要修改。`source: undefined` 仍合法。

---

## 5. 标签映射

源仓库英文 tag → 现有中文 TAG_SLUGS 闭合词表的映射。

### 5.1 映射策略

由于现有 TAG_SLUGS 是闭合词表且只 23 项，**绝大多数英文 tag 会被丢弃**。导入脚本流程：

1. 读源 prompt 的英文 tag 数组
2. 用 awesome-video-prompts/data/tags.yaml 的 `zh-cn` 字段转中文
3. 在 TAG_SLUGS 中查中文 tag
4. 找到 → 保留；找不到 → 丢弃该 tag
5. 转换后 **至少保留 1 个 tag** 才导入；否则整条跳过

### 5.2 显式等价映射（select 阶段预筛选）

为避免产生大量"tag 全部被丢弃"的 prompt 拉低站点 tag 体系，select 阶段维护一份**显式等价映射表**。源 prompt 必须命中至少 1 个等价对才进入候选清单：

| 源英文 tag | → 等价 TAG_SLUGS |
|---|---|
| `cinematic` | `电影感` |
| `realistic`, `photorealistic-subject` | `写实` |
| `vfx`, `visual-effects` | `特效` |
| `storyboard` | `分镜` |
| `tracking`, `transitions` | `运镜` |
| `ip-design` | `IP` |
| `3d` | `3D` |

只保留**精确等价**的 tag 对——避免语义过度延伸（如 `multi-shot → 分镜`、`portrait → 真人` 因语义不完全等价不列入；`vertical → 竖屏` 因用户偏好横屏也不列入）。

候选 prompt 的 tags 经翻译后命中任一对 → 进入候选；否则被 select 阶段过滤掉。

### 5.3 不扩展 TAG_SLUGS

本 spec 不扩展 `tag-slug.mjs` 闭合词表。若用户后续希望补充（如 `FPV` `动作` `奇幻` 等），可在下一轮迭代中追加。

### 5.4 select 阶段的额外过滤

select 脚本同时按以下条件筛选：

- **模型 = seedance2**（即源 frontmatter `models[0] == 'seedance2'`）—— 与"seedance2.0 中文"目标对齐
- **中文 prompt**：description/body 含中文字符（`[一-鿿]{30,}`）
- **横版横屏优先**：body 中含以下横屏关键词 → 加权进入候选
  - 横屏：`16:9`、`横屏`、`landscape`、`horizontal`、`widescreen`
  - 竖屏降权（不淘汰，仍可入选）：`9:16`、`竖屏`、`vertical`、`portrait`
  - 排序：`含横屏关键词 > 无 aspect ratio 提及 > 含竖屏关键词`
- **时间窗**：date 在 `2025-12-01` 之后（仓库数据时间窗）
- **元数据完整**：author 与 source_url 都存在

---

## 6. 媒体资源

### 6.1 封面图复制

| 角色 | 源 | 目标 |
|---|---|---|
| 封面 | `awesome-video-prompts/static/prompts/<month>/<id>-<slug>/cover.jpg` | `public/content/prompts/images/<our-slug>/images/cover.jpg` |

**为什么放在 `images/` 子目录**：对齐现有 parseDocx.mjs 输出的图片路径约定（CLAUDE.md `5. randomUUID 非确定性`）。`images/` 子目录是固定命名空间，cover.jpg 直接放进去不与 docx hash 文件冲突。

### 6.2 视频文件

**不导入**。源仓库的 `video.mp4` 不复制到本仓库，markdown 也不渲染 `<video>` 标签。

### 6.3 markdown 引用封面

```markdown
![](/prompt/content/prompts/images/<our-slug>/images/cover.jpg)
```

路径前缀 `/prompt/` 来自 `astro.config.mjs` 的 `base` 配置；build 时由 Astro 处理。

custom.css 已有 `article img { max-width: 360px }`（CLAUDE.md `fix(styles): target article img instead of .sl-markdown-content`），无需新增样式。

---

## 7. 生成 markdown 模板

```markdown
---
title: "Phoenix Griffin Volcanic Battle"
category: 视频生成
tags: ["电影感", "奇幻", "特效"]
slug: volcanic-sky-phoenix-griffin
source: awesome-video-prompts
date: 2026-04-03
author: "LudovicCreator"
source_url: "https://x.com/LudovicCreator/status/2039258991809773666"
model: "seedance2"
---

![](/prompt/content/prompts/images/volcanic-sky-phoenix-griffin/images/cover.jpg)

[原 description 字段内容，去掉 frontmatter 重复]

---

[clean-md 之后的 markdown 已被 ingest 处理；新流程不调 clean-md，因为源已是结构化 markdown]
```

### 7.1 slug 生成

- 优先复用源英文 slug（如 `volcanic-sky-phoenix-griffin`）
- 检测冲突（现有 56 条 + 候选之间）→ 加 `-2` / `-3` 后缀

### 7.2 category 推断规则

按出现顺序短路：

1. 含 `animation/anime/pixar/stick-figure/clay-animation/minecraft-style/ink` → `动画短片`
2. 含 `ip-design/character` → `角色与IP`
3. 含 `advertisement/campaign/product-video/fashion/brand/beauty` → `品牌与商业`
4. 含 `cinematic/fpv/aerial/action/drama/fantasy/sci-fi/scene/multi-shot` → `视频生成`
5. 含 `storyboard/script` → `剧本分镜`
6. 默认 → `视频生成`

### 7.3 model 字段

取源 frontmatter `models[0]`（如 `seedance2`）。多模型时取第一个。

---

## 8. 详情页脚

`src/pages/prompts/[slug].astro` 在 `.meta` 区域渲染 `source_url`：

```astro
{prompt.data.source_url && (
  <a class="source-link" href={prompt.data.source_url} target="_blank" rel="noopener">
    查看原文 →
  </a>
)}
```

放在 `<CategoryBadge>` 与 `<time>` 之后，与现有 `.source` 样式并排。

不渲染"作者 / 模型"独立行——避免与现有 meta 重复；通过"查看原文"链到 source_url（X/Twitter 链接本身含作者信息）。

---

## 9. 错误处理

| 场景 | 行为 |
|---|---|
| 源文件缺 cover.jpg | 跳过该候选，记 WARN |
| slug 冲突 | 加 `-2`/`-3` 后缀 |
| tags 全部无法映射 | 跳过整条，记 WARN |
| source_url 缺失 | 跳过整条（必须保留来源） |
| description 为空 / body 为空 | 跳过整条 |
| 复制 cover.jpg 失败 | 跳过整条 |

**整体策略**：单条错误不中断，全部跑完后输出汇总：成功 X / 跳过 Y / 失败 Z。

CLI 输出示例：
```
[select] 4479 source files scanned
[select] 1827 Chinese prompts
[select] 412 passed cinematic/fpv/animation filter
[select] 38 written to selected-prompts.json

[import] 38 candidates
[import] ✓ volcanic-sky-phoenix-griffin → src/content/prompts/volcanic-sky-phoenix-griffin.md
[import] ✗ seedance-war-burger-scene (no Chinese tag)
[import] ...
[import] Done: 36 imported / 2 skipped
```

---

## 10. 测试

### 10.1 新增单元测试

`tests/import-awesome-video-prompts.test.mjs`：

| 用例 | 验证点 |
|---|---|
| mock 源 md + mock cover.jpg | 输出 md frontmatter 字段齐全（author/source_url/model/category/tags） |
| mock slug 冲突 | 自动加 `-2` 后缀 |
| mock 缺 cover.jpg | 该候选被跳过 |
| mock 英文 tags 不命中 TAG_SLUGS | tags 数组被过滤为空，整条跳过 |
| mock source_url 缺失 | 整条跳过 |

期望 `npm test` 通过 22+ 个（原 21 + 新 5）。

### 10.2 smoke 断言

`tests/smoke.mjs`（现有 5 断言 + 新增 1 条）：

```
- new assertion: HTML contains link with source_url
```

### 10.3 build

`npm run build` 必须 0 warning。

---

## 11. 落地清单

1. 修改 `src/content/config.ts` —— 扩 schema（加 author/source_url/model + 扩 source enum）
2. 修改 `src/pages/prompts/[slug].astro` —— 渲染"查看原文"链接
3. 新增 `scripts/lib/awesome-video-prompts-source.mjs` —— 源数据读取 + 标签映射
4. 新增 `scripts/select-awesome-video-prompts.mjs` —— 阶段 A
5. 新增 `scripts/import-awesome-video-prompts.mjs` —— 阶段 B
6. 新增 `tests/import-awesome-video-prompts.test.mjs`
7. 修改 `tests/smoke.mjs` —— 新增 1 条断言
8. 跑 `selected-prompts.json` 产出 + 人工 review 候选清单
9. 跑导入脚本，复制封面 + 生成 md
10. 跑 `npm test && npm run smoke && npm run build`，全部绿
11. 提交：`feat(content): curate 30–50 prompts from awesome-video-prompts + source attribution`

### 11.1 提交格式

按 CLAUDE.md 现有约定：`feat(content): <subject>`。

---

## 12. 回滚

```bash
git checkout -- src/content/prompts/ src/pages/prompts/[slug].astro src/content/config.ts
rm -rf public/content/prompts/images/<our-slug-1>/ <our-slug-2>/ ...
git checkout -- tests/
rm scripts/select-awesome-video-prompts.mjs \
   scripts/import-awesome-video-prompts.mjs \
   scripts/lib/awesome-video-prompts-source.mjs
rm selected-prompts.json   # gitignored
```

或更简单：本次提交是一个原子 commit，`git revert <commit-sha>` 即可整笔回滚。

---

## 13. 不在本 spec 范围（后续候选）

- 全量导入（1200+ 中文 prompt + 英文精选）
- 扩展 `tag-slug.mjs` 闭合词表（加入 `FPV`/`动作`/`奇幻` 等）
- 视频预览（用户明确排除）
- 双语支持（英文 prompt 翻译为中文）
- 自动周更新（基于 awesome-video-prompts 的 git 拉取）