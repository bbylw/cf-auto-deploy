---
name: "cf-auto-deploy"
description: "Deploys Cloudflare Workers via temporary accounts (wrangler deploy --temporary) with iterate and verify support. Invoke when user asks to deploy/preview/update/test a Worker without signup."
---

# 🚀 CF Auto Deploy

Frictionless Cloudflare Worker deployments using [temporary accounts](https://blog.cloudflare.com/temporary-accounts/). No signup, no API token, no credit card — just deploy, iterate, and verify.

## When to Invoke

Trigger when the user:
- Wants to **deploy / ship / preview / share** something on Cloudflare
- Says "deploy this", "put it online", "give me a URL to test"
- Mentions `wrangler`, `Cloudflare Workers`, `temporary account`, `--temporary`
- Wants to **update / change / fix / redeploy** an already-deployed Worker
- Wants to **verify / test / check** if the deployment works

**Do NOT invoke** if target is not Cloudflare (Vercel, Netlify, AWS), or user wants to deploy to an existing permanent account with their own credentials.

## Capabilities

This skill has three built-in capabilities. **Read the corresponding detail file** before executing each capability:

| Capability          | Purpose                              | Detail File                |
| ------------------- | ------------------------------------ | -------------------------- |
| 🚀 **Deploy** (core) | First-time deploy with `--temporary` | [deploy.md](./deploy.md)   |
| 🔁 **Iterate**       | Update code, reuse temp account      | [iterate.md](./iterate.md) |
| 🧪 **Verify**        | Test endpoints, validate behavior    | [verify.md](./verify.md)   |

## Workflow

```
🚀 Deploy → 🧪 Verify (smoke) → 🔁 Iterate → 🧪 Verify (behavioral) → 📝 Claim
```

1. **Deploy** ([deploy.md](./deploy.md)): detect project → generate config → `wrangler deploy --temporary` → return preview URL + claim URL
2. **Verify** ([verify.md](./verify.md)): smoke test the deployment immediately
3. **Iterate** ([iterate.md](./iterate.md)): user requests changes → edit code → `wrangler deploy --temporary` (reuses temp account, shows "(reused)") → verify again
4. **Claim**: user opens claim URL in browser → account becomes permanent

## Prerequisites

- Node.js 18+ and npm
- Wrangler latest: `npx wrangler --version || npm install -g wrangler@latest`

## Quick Reference

```bash
# First deploy (creates temporary account)
npx wrangler deploy --temporary

# Iterate (reuses cached temp account — keep --temporary!)
npx wrangler deploy --temporary

# Verify
curl -sS -o /dev/null -w "%{http_code}" "<preview-url>"

# Stream logs for debugging
npx wrangler tail
```

> ⚠️ **Iteration rule**: Always pass `--temporary` when redeploying. A bare `wrangler deploy` triggers OAuth login (fails in agent context) instead of reusing the temp account.

## Key Constraints

- **60-minute lifetime** for unclaimed temporary accounts
- **No custom domains** (use `*.workers.dev` only)
- **Resources are temporary** — KV, D1, R2 deleted with account if not claimed
- ⚠️ **`compatibility_date` must be a past date** — future dates cause deploy failure (API error 10021). Safe default: `2025-06-20`
- ⚠️ **Always pass `--temporary`** when deploying — bare `wrangler deploy` triggers OAuth login
- ⚠️ **Worker `name` must be ≤ 63 chars** — longer names fail at API stage (error 100132), wasting upload time. Pre-check before deploy
- ⚠️ **KV/D1/R2 bindings NOT supported** in temporary accounts — `wrangler kv namespace create` doesn't accept `--temporary` and triggers OAuth login, which **disables temporary mode**. Only use bindings after claiming the account
- ⚠️ **First-time use requires accepting ToS** — after `wrangler logout`, the next `--temporary` deploy prompts for Terms of Service acceptance. Pipe `yes`: `echo "yes" | npx wrangler deploy --temporary`
- ⚠️ **`wrangler logout` destroys the temp account** — logging out creates a *new* temp account on next deploy (different subdomain, all prior Workers lost). Only logout intentionally
- Check [docs](https://developers.cloudflare.com/workers/platform/claim-deployments/) for current capabilities

## Templates

Pre-built scaffolds available in [templates/](./templates/):
- [worker-hello-world/](./templates/worker-hello-world/) — minimal TypeScript Worker
- [worker-api/](./templates/worker-api/) — REST API with routing
- [worker-static-site/](./templates/worker-static-site/) — static site with assets binding

## Reference

- [Temporary Accounts blog post](https://blog.cloudflare.com/temporary-accounts/)
- [Claim deployments docs](https://developers.cloudflare.com/workers/platform/claim-deployments/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)
