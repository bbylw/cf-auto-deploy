# 🚀 CF Auto Deploy

基于 Cloudflare [临时账户](https://blog.cloudflare.com/temporary-accounts/)的**无摩擦 Cloudflare Worker 部署**技能。无需注册、无需 API token、无需信用卡 —— 只需部署、迭代、验证。

## 概述

基于 Cloudflare 临时账户功能（`wrangler deploy --temporary`），本技能让 AI agent 能够主动将 Worker 部署到 Cloudflare，无需任何认证摩擦。临时部署有效期为 60 分钟，期间用户可以认领账户使其永久化。

## 技能结构

```
.trae/skills/cf-auto-deploy/
├── SKILL.md              ← 入口文件（技能元数据 + 能力路由）
├── deploy.md             ← 🚀 部署能力：首次使用 --temporary 部署
├── iterate.md            ← 🔁 迭代能力：更新代码，复用临时 token
├── verify.md             ← 🧪 验证能力：测试端点，校验行为
├── README.md             ← 英文说明文档
├── README.zh-CN.md       ← 本文件（中文说明文档）
└── templates/            ← 预置项目脚手架
    ├── worker-hello-world/   最简 TypeScript Worker
    ├── worker-api/           带路由的 REST API
    └── worker-static-site/   带静态资源绑定的静态站点
```

## 三大能力

| 能力               | 用途                                         | 详细文档                   |
| ------------------ | -------------------------------------------- | -------------------------- |
| 🚀 **部署**（核心） | 首次部署，使用 `wrangler deploy --temporary` | [deploy.md](./deploy.md)   |
| 🔁 **迭代**         | 更新代码，复用缓存的临时 token               | [iterate.md](./iterate.md) |
| 🧪 **验证**         | 测试端点，校验行为                           | [verify.md](./verify.md)   |

## 工作流

```
🚀 部署 → 🧪 验证（冒烟测试）→ 🔁 迭代 → 🧪 验证（行为校验）→ 📝 认领
```

1. **部署**：检测项目类型 → 生成/校验配置 → `wrangler deploy --temporary` → 返回预览 URL + 认领 URL
2. **验证**：部署后立即进行冒烟测试
3. **迭代**：用户请求修改 → 编辑代码 → `wrangler deploy`（复用临时 token）→ 再次验证
4. **认领**：用户在浏览器中打开认领 URL → 账户永久化

## 快速开始

### 部署 hello world Worker

```bash
# 在空目录中
npx wrangler deploy --temporary
```

或使用模板：

```bash
# 复制模板
cp -r .trae/skills/cf-auto-deploy/templates/worker-hello-world/* .

# 部署
npx wrangler deploy --temporary
```

### 迭代部署

```bash
# 编辑 src/index.ts 后，重新部署（复用临时 token）
npx wrangler deploy
```

### 验证部署

```bash
# 冒烟测试
curl -sS -o /dev/null -w "%{http_code}" "<预览-url>"

# 查看响应内容
curl -sS "<预览-url>"
```

### 永久化

在 60 分钟内，在浏览器中打开部署输出中的认领 URL，即可认领账户使其永久化。

## 模板说明

### worker-hello-world
最简 TypeScript Worker，响应 "Hello from Cloudflare!"。
- 文件：`wrangler.toml`、`src/index.ts`、`package.json`
- 适用场景：从零开始、快速演示

### worker-api
带简单正则路由的 REST API。
- 端点：`GET /`、`GET /api/health`、`GET /api/users`、`GET /api/users/:id`、`POST /api/users`
- 适用场景：构建 API、后端原型

### worker-static-site
通过 `[assets]` 绑定提供静态文件服务，附带 `/api/time` 示例端点。
- 文件：`wrangler.toml`（含 `[assets]`）、`src/index.ts`、`public/index.html`
- 适用场景：部署静态站点、落地页

## 核心概念

### 临时账户
- 由 `wrangler deploy --temporary` 自动创建
- 无需注册、邮箱或信用卡
- 有效期 60 分钟，到期自动删除
- 可在有效期内认领（永久化）

### 认领 URL
- 在部署输出中返回
- 在浏览器中打开 → 注册/登录 Cloudflare → 账户归你所有
- 包含 Worker 及所有绑定资源（KV、D1、R2 等）

### Token 缓存
- 首次 `--temporary` 部署后，Wrangler 在本地缓存 token
- 后续部署无需 `--temporary` —— 直接 `wrangler deploy`
- token 随临时账户过期（60 分钟）而失效

### 预览 URL
- 格式：`https://<worker-name>.<random>.workers.dev`
- 迭代过程中保持不变（URL 不变，仅代码更新）
- 公开访问 —— 任何有链接的人都可以访问

## 限制

- **60 分钟有效期**：未认领的临时账户到期自动删除
- **不支持自定义域名**：仅使用 `*.workers.dev`
- **资源也是临时的**：未认领时 KV、D1、R2 随账户一起删除
- **速率限制**：为防止滥用可能有限流
- 查看[官方文档](https://developers.cloudflare.com/workers/platform/claim-deployments/)了解当前能力范围

## 错误处理

| 错误                          | 原因                             | 修复方法                               |
| ----------------------------- | -------------------------------- | -------------------------------------- |
| `wrangler: command not found` | 未安装 Wrangler                  | `npm install -g wrangler@latest`       |
| `Authentication required`     | 缺少 `--temporary` 或 token 过期 | 重新运行 `wrangler deploy --temporary` |
| `Worker not found`            | 账户已删除（超过 60 分钟）       | 使用 `--temporary` 重新开始            |
| `Build failed`                | TypeScript/语法错误              | 修复错误后重试部署                     |
| `Rate limit exceeded`         | 部署过于频繁                     | 等待几秒后重试                         |
| 500 Internal Error            | 代码异常                         | 通过 `wrangler tail` 查看日志          |

## 设计原则

1. **SKILL.md 作为入口**：保持技能元数据精简，符合 skill 规则（description < 200 字符）
2. **能力分离**：每个能力（部署/迭代/验证）有独立的详细文档
3. **脚手架模板**：为常见用例预置项目结构
4. **跨平台**：文档同时提供 bash 和 PowerShell 命令
5. **主动部署**：核心能力是无摩擦地主动部署，无需用户配置

## 参考链接

- [临时账户博客文章](https://blog.cloudflare.com/temporary-accounts/)
- [认领部署文档](https://developers.cloudflare.com/workers/platform/claim-deployments/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers 示例](https://developers.cloudflare.com/workers/examples/)
- [Wrangler 发布版本](https://github.com/cloudflare/workers-sdk/releases)
