# MVP 需求文档：Image Background Remover

> **项目名称**：BG Remover（图片去背景工具）
> **版本**：MVP v1.0
> **日期**：2026-04-19
> **作者**：傅鹏丞

---

## 1. 项目概述

### 1.1 产品定位
一款基于 AI 的在线图片去背景工具，用户上传图片后自动移除背景，生成透明 PNG，完全免费使用。

### 1.2 目标用户
- 电商卖家（商品图去背景）
- 设计师（快速抠图）
- 社交媒体运营（制作头像/海报）
- 普通用户（证件照换底色前置步骤）

### 1.3 核心价值
- **零门槛**：拖拽即用，无需注册
- **速度快**：3-5 秒出结果
- **免费**：不收费，吸引流量

---

## 2. 技术方案

### 2.1 架构
```
用户浏览器 → Cloudflare Pages (静态前端)
                  ↓
           Cloudflare Function (/api/remove-bg)
                  ↓
           remove.bg API (AI 去背景)
                  ↓
           返回透明 PNG → 浏览器下载
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Next.js 14 (App Router) | 静态导出模式 |
| 样式 | Tailwind CSS | 响应式 + 暗色模式 |
| 部署 | Cloudflare Pages | 全球 CDN，免费额度大 |
| 后端逻辑 | Cloudflare Pages Functions | 边缘计算，无需服务器 |
| AI 引擎 | remove.bg API | 成熟稳定的去背景服务 |
| 语言 | TypeScript | 类型安全 |

### 2.3 数据流
1. 用户在前端选择/拖拽图片
2. 前端将图片通过 FormData POST 到 `/api/remove-bg`
3. Cloudflare Function 将请求转发到 remove.bg API
4. remove.bg 返回去背景后的 PNG 图片（二进制流）
5. Function 将结果直接流式返回给前端（纯内存，不落盘）
6. 前端展示结果并提供下载按钮

---

## 3. 功能需求

### 3.1 P0 — MVP 必须有

| ID | 功能 | 描述 | 验收标准 |
|----|------|------|---------|
| F01 | 图片上传 | 支持拖拽和点击上传 | 支持 PNG/JPG/JPEG/WebP，最大 10MB |
| F02 | 去背景处理 | 调用 remove.bg API 自动去除背景 | 处理时间 ≤ 10 秒，返回透明 PNG |
| F03 | 结果展示 | 左右对比展示原图和去背景结果 | 棋盘格背景显示透明区域 |
| F04 | 下载结果 | 点击按钮下载去背景后的图片 | 下载为 PNG 格式，文件名含 `-no-bg` |
| F05 | 响应式布局 | 适配桌面和移动端 | 手机/平板/桌面均可正常使用 |
| F06 | 错误处理 | 友好的错误提示 | 文件过大、格式不对、API 异常均有明确提示 |

### 3.2 P1 — 锦上添花（后续迭代）

| ID | 功能 | 描述 |
|----|------|------|
| F07 | 暗色模式 | 支持亮色/暗色主题切换 |
| F08 | 批量处理 | 一次上传多张图片批量去背景 |
| F09 | 背景替换 | 去背景后可替换为纯色/渐变/自定义背景 |
| F10 | 历史记录 | 浏览器本地存储最近处理记录 |
| F11 | 多语言 | 支持中英文切换 |

---

## 4. 页面设计

### 4.1 主页（唯一页面）

```
┌──────────────────────────────────────────┐
│  🎨 BG Remover              [🌙 主题]    │  ← 顶部导航栏
├──────────────────────────────────────────┤
│                                          │
│      ✨ Powered by AI                    │
│                                          │
│   Remove Image Background                │
│      100% Automatically                  │
│                                          │
│   Drop your image and get a              │
│   transparent background in seconds.     │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │     📤 Drop image here           │    │  ← 上传区域
│  │       or click to upload         │    │
│  │                                  │    │
│  │  PNG, JPG, WebP — Max 10MB      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │ ✨ AI    │  │ ⚡ Instant│  │ 📥 Free  │  ← 特性介绍
│  │ Powered  │  │ Results  │  │ Download │
│  └──────────┘  └──────────┘             │
│                                          │
├──────────────────────────────────────────┤
│  Built with ❤️ — Powered by remove.bg    │  ← 页脚
└──────────────────────────────────────────┘
```

### 4.2 处理中状态
- 上传区域替换为加载动画（旋转 Loader）
- 显示 "Removing background..." 文案
- 提示 "通常需要 3-5 秒"

### 4.3 结果状态
- 左侧：原图（带棋盘格透明背景）
- 右侧：去背景结果（带棋盘格透明背景）
- 下方：[⬇️ Download PNG] [🔄 Try Another Image]

---

## 5. API 设计

### 5.1 去背景接口

```
POST /api/remove-bg
Content-Type: multipart/form-data

请求参数:
  image_file: File (必填) — 图片文件，最大 10MB

成功响应:
  200 OK
  Content-Type: image/png
  Body: 去背景后的 PNG 图片二进制数据

错误响应:
  400 { error: "No image file provided" }
  413 { error: "File too large. Maximum size is 10MB." }
  500 { error: "Remove.bg API error: ..." }
```

### 5.2 第三方依赖

| 服务 | 用途 | 费用 |
|------|------|------|
| remove.bg API | AI 去背景 | 免费 1 次/月（试用），之后按量计费 |
| Cloudflare Pages | 托管 + 边缘函数 | 免费额度：10万次请求/月 |

---

## 6. 非功能需求

| 项目 | 要求 |
|------|------|
| 性能 | 单张图片处理 ≤ 10 秒 |
| 可用性 | 零注册、零登录，打开即用 |
| 安全性 | API Key 不暴露给前端，通过 Cloudflare Function 代理 |
| 隐私 | 图片不落盘，纯内存处理，处理完即销毁 |
| SEO | 完整 meta 标签，利于搜索引擎收录 |
| 兼容性 | Chrome / Safari / Firefox / Edge 最新两个大版本 |

---

## 7. 部署方案

### 7.1 环境变量

| 变量名 | 说明 | 设置方式 |
|--------|------|---------|
| `REMOVE_BG_API_KEY` | remove.bg API 密钥 | `wrangler pages secret put` |

### 7.2 部署命令

```bash
# 构建
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy out --project-name image-background-remover

# 设置 API 密钥
npx wrangler pages secret put REMOVE_BG_API_KEY --project-name image-background-remover
```

### 7.3 自定义域名（可选）
在 Cloudflare Pages 控制台绑定自定义域名，如 `bgremover.yourdomain.com`

---

## 8. 里程碑

| 阶段 | 内容 | 预计时间 | 状态 |
|------|------|---------|------|
| M1 | 项目搭建 + 核心功能开发 | 1 天 | ✅ 已完成 |
| M2 | UI 打磨 + 响应式适配 | 0.5 天 | ✅ 已完成 |
| M3 | Cloudflare 部署 + 测试 | 0.5 天 | ⏳ 待部署 |
| M4 | 自定义域名 + SEO 优化 | 0.5 天 | ⏳ 待开始 |
| M5 | 数据分析（GA/CF Analytics）| 0.5 天 | ⏳ 待开始 |

---

## 9. 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| remove.bg API 费用增长 | 成本上升 | MVP 阶段限制每日用量；后续考虑自部署 BRIA-RMBG |
| Cloudflare Function 超时（10s） | 大图处理失败 | 前端限制上传图片尺寸；压缩后再发送 |
| 免费额度用尽 | 服务中断 | 监控用量，提前预警 |

---

## 10. 成功指标

| 指标 | MVP 目标 |
|------|---------|
| 日活用户 | 100+ |
| 处理成功率 | > 95% |
| 平均处理时间 | < 8 秒 |
| 用户跳出率 | < 40% |

---

*文档版本: v1.0 | 最后更新: 2026-04-19*
