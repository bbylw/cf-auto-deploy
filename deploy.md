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
compatibility_date = "<recent-past-date>"

# For static assets:
# [assets]
# directory = "./public"
```

Rules:
- `name`: kebab-case from directory name, max 63 chars
- `main`: Worker entry file
- `compatibility_date`: a **past or today's date** in `YYYY-MM-DD` format
  - ⚠️ **Must NOT be a future date** — Wrangler rejects future dates with `Compatibility date invalid`
  - Safe default: `2025-06-20` (or any date within the last year)
  - Do not use "today" if you are unsure of the current date — prefer a known-safe past date
  - 💡 If you know the current system date with certainty, you may use a more recent past date (today or yesterday) to unlock newer edge runtime features. The `2025-06-20` default is a conservative fallback.
- Do NOT add `account_id` — temporary accounts don't need it

> **Pre-deploy check**: Always open `wrangler.toml` and verify `compatibility_date` is not in the future before running `wrangler deploy`. This is the #1 cause of first-deploy failures.

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

## Step 4: Pre-Deploy Validation

Before running `wrangler deploy`, **always** run these local checks to avoid wasting upload time on API-stage failures:

| Check | How | On Failure |
|-------|-----|-----------|
| `compatibility_date` not in future | Read `wrangler.toml`, compare to today | Change to a past date (e.g. `2025-06-20`) |
| `name` ≤ 63 chars | `len(name)` in config | Shorten to kebab-case slug |
| `main` file exists | Check file at `main` path | Fix path or create the file |
| KV/D1/R2 bindings | Scan `wrangler.toml` for `[[kv_namespaces]]`, `[[d1_databases]]`, `[[r2_buckets]]` | If namespace ID exists → deploy normally. If ID is missing/invalid → create with `wrangler kv namespace create <name> --temporary` (wrangler 4.103.0+, pipe `yes` for ToS). Resources are temporary until account is claimed |
| TypeScript compiles | `npx tsc --noEmit` (optional) | Fix syntax errors |

> **Why pre-check?** Wrangler validates `compatibility_date` and `name` length only at the API stage (after upload), wasting 2-5 seconds per failed attempt. Local checks are instant.

## Step 5: Deploy with Temporary Account

```bash
npx wrangler deploy --temporary
```

**First-time use (or after `wrangler logout`)**: Wrangler prompts to accept Cloudflare's Terms of Service. Pipe `yes` to auto-accept in non-interactive contexts:

```bash
# Linux / macOS (Bash / Zsh)
echo "yes" | npx wrangler deploy --temporary
```

```powershell
# Windows PowerShell — `echo` is an alias for Write-Output and pipes a String
# object (not raw stdin), which some Node CLIs fail to read. Use a bare string:
"yes" | npx wrangler deploy --temporary
```

What happens:
1. Wrangler detects no authenticated session
2. With `--temporary`, Cloudflare provisions a throwaway account (solves a proof-of-work challenge)
3. Wrangler caches the temporary account reference locally (for iteration via `--temporary`)
4. Worker is deployed, preview URL + claim URL returned

## Step 6: Parse Output

Extract from wrangler output:
- **Preview URL**: `https://<worker-name>.<random-subdomain>.workers.dev`
- **Claim URL**: `https://dash.cloudflare.com/?claim=...`
- **Deployment ID**: for later reference

## Step 7: Report to User

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

| Error | Code | Cause | Fix |
|-------|------|-------|-----|
| `wrangler: command not found` | — | Not installed | `npm install -g wrangler@latest` |
| `Attempting to login via OAuth...` | — | `--temporary` flag missing, or OAuth session active | Re-run with `--temporary`; if session active, run `wrangler logout` first |
| `You're already authenticated... --temporary can't be used` | — | OAuth login was triggered (e.g. by `kv namespace create`) | Run `wrangler logout`, then retry with `--temporary` |
| `Can't set compatibility date in the future` | 10021 | `compatibility_date` is a future date | Edit `wrangler.toml`, change to a past date (e.g. `2025-06-20`) |
| `Worker name is too long to be used as a subdomain` | 100132 | Name > 63 chars | Shorten in `wrangler.toml` (pre-check in Step 4) |
| `KV namespace '...' not found` | 10041 | KV binding references a non-existent namespace ID | Create the namespace first: `wrangler kv namespace create <name> --temporary` (pipe `yes` for ToS). Then update the ID in `wrangler.toml` |
| `The entry-point file at "..." was not found` | — | Wrong `main` path | Check `main` points to existing file |
| `Build failed with N errors` | — | TypeScript/syntax error | Fix code per error output (esbuild reports line:col) |
| `? You must accept Cloudflare's Terms of Service` | — | First-time use after logout | Pipe `yes`: Bash `echo "yes" \| npx wrangler deploy --temporary` · PowerShell `"yes" \| npx wrangler deploy --temporary` |
| Network error | — | Connectivity | Retry, check internet connection |

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
