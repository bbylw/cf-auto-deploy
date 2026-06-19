# 🚀 Deploy Capability

First-time deployment to Cloudflare using temporary accounts. The core capability of `cf-auto-deploy`.

## Flow

```
Detect Project → Generate/Validate Config → Ensure Source → Deploy → Parse Output → Report
```

## Step 1: Detect Project Type

Inspect the working directory:

| Signal | Project Type | Action |
|--------|-------------|--------|
| `wrangler.toml` / `wrangler.jsonc` exists | Existing Worker | Use existing config |
| `package.json` with `wrangler` dep | Worker project | Validate config |
| `index.html` only | Static site | Generate Worker config with `assets` binding |
| `src/index.ts` / `src/index.js` | Worker source | Generate minimal `wrangler.toml` |
| Framework (Next.js, Remix, Astro, etc.) | Full-stack app | Use framework-specific adapter |
| No Cloudflare-compatible files | Unknown | Scaffold a new Worker from [templates/](./templates/) |

## Step 2: Generate / Validate Config

If `wrangler.toml` does not exist, generate:

```toml
name = "<project-name>"
main = "src/index.ts"
compatibility_date = "<today's-date>"

# For static assets:
# [assets]
# directory = "./public"
```

Rules:
- `name`: kebab-case from directory name, max 63 chars
- `main`: Worker entry file
- `compatibility_date`: today (YYYY-MM-DD)
- Do NOT add `account_id` — temporary accounts don't need it

## Step 3: Ensure Source File Exists

If no Worker source exists, scaffold from [templates/worker-hello-world/](./templates/worker-hello-world/):

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    return new Response(`Hello from Cloudflare! Path: ${url.pathname}`, {
      headers: { "content-type": "text/plain" },
    });
  },
} satisfies ExportedHandler<Env>;
```

## Step 4: Deploy with Temporary Account

```bash
npx wrangler deploy --temporary
```

What happens:
1. Wrangler detects no authenticated session
2. With `--temporary`, Cloudflare provisions a throwaway account
3. Wrangler caches the temporary API token locally (for iteration)
4. Worker is deployed, preview URL + claim URL returned

## Step 5: Parse Output

Extract from wrangler output:
- **Preview URL**: `https://<worker-name>.<random-subdomain>.workers.dev`
- **Claim URL**: `https://dash.cloudflare.com/?claim=...`
- **Deployment ID**: for later reference

## Step 6: Report to User

```
✅ Deployed successfully!

🔗 Preview URL: <preview-url>  (valid for 60 minutes)
📝 Claim URL:   <claim-url>    (click to make it permanent)

To iterate: tell me what to change.
To make permanent: open the Claim URL within 60 minutes.
```

## Post-Deploy

Immediately run a smoke test (see [verify.md](./verify.md)):

```bash
curl -sS -o /dev/null -w "%{http_code}" "<preview-url>"
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `wrangler: command not found` | Not installed | `npm install -g wrangler@latest` |
| `Authentication required` | `--temporary` flag missing | Re-run with `--temporary` |
| `Compatibility date invalid` | Wrong date format | Use `YYYY-MM-DD` |
| `Worker name too long` | Name > 63 chars | Shorten in `wrangler.toml` |
| `Module not found` | Wrong `main` path | Check `main` points to existing file |
| Network error | Connectivity | Retry, check internet connection |

## Examples

### Deploy existing Worker
```
User: Deploy my Worker to Cloudflare
→ Detect wrangler.toml → wrangler deploy --temporary → return preview URL
```

### Deploy static site
```
User: Put my static site online
→ Detect index.html → generate Worker with assets binding → deploy → return URL
```

### Scaffold + deploy from scratch
```
User: Deploy a hello world to Cloudflare
→ No existing files → scaffold from template → deploy → return URL
```
