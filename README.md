# 🚀 CF Auto Deploy

A skill for **frictionless Cloudflare Worker deployments** using [temporary accounts](https://blog.cloudflare.com/temporary-accounts/). No signup, no API token, no credit card — just deploy, iterate, and verify.

## Overview

Based on Cloudflare's Temporary Accounts feature (`wrangler deploy --temporary`), this skill enables AI agents to proactively deploy Workers to Cloudflare without any authentication friction. The temporary deployment stays live for 60 minutes, during which the user can claim the account to make it permanent.

## Skill Structure

```
.trae/skills/cf-auto-deploy/
├── SKILL.md              ← Entry point (skill metadata + capability routing)
├── deploy.md             ← 🚀 Deploy capability: first-time deploy with --temporary
├── iterate.md            ← 🔁 Iterate capability: update code, reuse temp token
├── verify.md             ← 🧪 Verify capability: test endpoints, validate behavior
├── README.md             ← This file
└── templates/            ← Pre-built project scaffolds
    ├── worker-hello-world/   Minimal TypeScript Worker
    ├── worker-api/           REST API with routing
    └── worker-static-site/   Static site with assets binding
```

## Capabilities

| Capability | Purpose | Detail |
|-----------|---------|--------|
| 🚀 **Deploy** (core) | First-time deploy with `wrangler deploy --temporary` | [deploy.md](./deploy.md) |
| 🔁 **Iterate** | Update code, reuse cached temp token | [iterate.md](./iterate.md) |
| 🧪 **Verify** | Test endpoints, validate behavior | [verify.md](./verify.md) |

## Workflow

```
🚀 Deploy → 🧪 Verify (smoke) → 🔁 Iterate → 🧪 Verify (behavioral) → 📝 Claim
```

1. **Deploy**: detect project type → generate/validate config → `wrangler deploy --temporary` → return preview URL + claim URL
2. **Verify**: smoke test the deployment immediately after deploy
3. **Iterate**: user requests changes → edit code → `wrangler deploy` (reuses temp token) → verify again
4. **Claim**: user opens claim URL in browser → account becomes permanent

## Quick Start

### Deploy a hello world Worker

```bash
# From an empty directory
npx wrangler deploy --temporary
```

Or use a template:

```bash
# Copy a template
cp -r .trae/skills/cf-auto-deploy/templates/worker-hello-world/* .

# Deploy
npx wrangler deploy --temporary
```

### Iterate on the deployment

```bash
# After editing src/index.ts, redeploy (reuses temp token)
npx wrangler deploy
```

### Verify the deployment

```bash
# Smoke test
curl -sS -o /dev/null -w "%{http_code}" "<preview-url>"

# Check response body
curl -sS "<preview-url>"
```

### Make it permanent

Open the claim URL (from the deploy output) in a browser within 60 minutes to claim the account.

## Templates

### worker-hello-world
Minimal TypeScript Worker that responds with "Hello from Cloudflare!".
- Files: `wrangler.toml`, `src/index.ts`, `package.json`
- Use when: starting from scratch, quick demos

### worker-api
REST API with simple regex-based routing.
- Endpoints: `GET /`, `GET /api/health`, `GET /api/users`, `GET /api/users/:id`, `POST /api/users`
- Use when: building APIs, backend prototypes

### worker-static-site
Static site served via the `[assets]` binding, with an example `/api/time` endpoint.
- Files: `wrangler.toml` (with `[assets]`), `src/index.ts`, `public/index.html`
- Use when: deploying static sites, landing pages

## Key Concepts

### Temporary Account
- Created automatically by `wrangler deploy --temporary`
- No signup, email, or credit card required
- Lives for 60 minutes, then auto-deleted
- Can be claimed (made permanent) within the window

### Claim URL
- Returned in the deploy output
- Open in browser → sign up / sign in to Cloudflare → account is yours
- Includes the Worker + all bindings (KV, D1, R2, etc.)

### Token Caching
- After first `--temporary` deploy, Wrangler caches the token locally
- Subsequent deploys don't need `--temporary` — just `wrangler deploy`
- Token expires with the temporary account (60 min)

### Preview URL
- Format: `https://<worker-name>.<random>.workers.dev`
- Stable across iterations (same URL, updated code)
- Public — anyone with the link can access it

## Limitations

- **60-minute lifetime** for unclaimed temporary accounts
- **No custom domains** (use `*.workers.dev` only)
- **Resources are temporary** — KV, D1, R2 deleted with account if not claimed
- **Rate limits** may apply for abuse prevention
- Check [official docs](https://developers.cloudflare.com/workers/platform/claim-deployments/) for current capabilities

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `wrangler: command not found` | Not installed | `npm install -g wrangler@latest` |
| `Authentication required` | `--temporary` missing or token expired | Run `wrangler deploy --temporary` (fresh) |
| `Worker not found` | Account deleted (60 min passed) | Start fresh with `--temporary` |
| `Build failed` | TypeScript/syntax error | Fix error, retry deploy |
| `Rate limit exceeded` | Too many deploys | Wait a few seconds, retry |
| 500 Internal Error | Code exception | Check `wrangler tail` logs |

## Design Principles

1. **SKILL.md as entry point**: keeps skill metadata minimal and compliant with skill rules (description < 200 chars)
2. **Capability separation**: each capability (deploy/iterate/verify) has its own detail file
3. **Templates for scaffolding**: pre-built project structures for common use cases
4. **Cross-platform**: documentation includes both bash and PowerShell commands
5. **Proactive deployment**: the core capability is deploying without user setup friction

## Reference

- [Temporary Accounts blog post](https://blog.cloudflare.com/temporary-accounts/)
- [Claim deployments docs](https://developers.cloudflare.com/workers/platform/claim-deployments/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers examples](https://developers.cloudflare.com/workers/examples/)
- [Wrangler releases](https://github.com/cloudflare/workers-sdk/releases)
