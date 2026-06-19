# 🔁 Iterate Capability

Update a previously deployed Worker within the 60-minute temporary account window. Reuses the cached temporary account — no re-authentication needed.

## How Temporary Account Reuse Works

After the first `wrangler deploy --temporary`:
1. Wrangler stores the temporary account reference locally
2. Subsequent `wrangler deploy --temporary` commands **reuse the same temporary account** (output shows `Account: <name> (reused)`)
3. **You must keep passing `--temporary`** — a bare `wrangler deploy` will attempt standard OAuth login, NOT reuse the temp account
4. The 60-minute clock keeps ticking from the first deploy; the reused output shows remaining time (e.g. `Claim within: 54 minutes`)
5. Account expires if not claimed within 60 minutes

## Flow

```
Confirm Prior Deploy → Apply Code Changes → Redeploy (--temporary) → Verify → Report
```

## Step 1: Confirm Prior Deployment

```bash
npx wrangler deploy --temporary --dry-run
```

Or check the previous deploy output for `Account: <name> (reused)` and the remaining claim window.

If the 60-minute window has expired:
- `wrangler deploy --temporary` will create a **new** temporary account (new name, new URL)
- → The preview URL will change; inform the user

## Step 2: Apply Code Changes

Make the requested changes to the Worker source:
- Edit `src/index.ts` (or configured `main` file)
- Update routes, handlers, logic, responses as requested
- Keep changes minimal and focused

## Step 3: Redeploy (Keep `--temporary`)

```bash
npx wrangler deploy --temporary
```

Reuses the cached temporary account. The preview URL stays the same — only the deployed code changes. Output confirms reuse:

```
Temporary account ready:
        Account: <name> (reused)
        Claim within: <minutes> minutes
        Claim URL: <same-claim-url>
```

> ⚠️ **Do NOT drop `--temporary`** during iteration. A bare `wrangler deploy` triggers OAuth login and will fail in an agent context (no browser to complete the flow).

## Step 4: Verify the Change

See [verify.md](./verify.md). At minimum:

```bash
curl -sS "<preview-url>" | head -c 500
```

## Step 5: Report

```
🔁 Iteration #<N> deployed!

🔗 URL: <same-preview-url>
⏱️  Time remaining: ~<minutes> min (claim window)

Change verified:
<brief description of what was confirmed>
```

## Iteration Patterns

| Pattern | Example |
|---------|---------|
| Quick text change | Change "hello world" → "hello cloudflare" |
| Add a route | Add `/api/status` returning JSON |
| Add a binding | Add KV namespace to `wrangler.toml` |
| Fix a bug | Read error from curl → fix → redeploy |

### Pattern A: Quick text/response change
```
User: Change "hello world" to "hello cloudflare"
→ Edit src/index.ts → wrangler deploy → curl to verify new text
```

### Pattern B: Add a new route
```
User: Add a /api/status endpoint that returns JSON
→ Add route handler → wrangler deploy → curl /api/status to verify
```

### Pattern C: Add a binding (KV, D1, R2)
```
User: Add a KV namespace to store visits
→ Update wrangler.toml with [[kv_namespaces]] → wrangler deploy
→ Note: temporary accounts support bindings, but they're also temporary
```

### Pattern D: Fix a bug
```
User: The /api/users endpoint returns 500, fix it
→ Read error from curl response → fix code → wrangler deploy → verify
```

## Time Window Management

The 60-minute clock starts from the **first** temporary deploy:

| Elapsed | Action |
|---------|--------|
| 0–50 min | Safe to iterate normally |
| 50–55 min | Warn user: "⏰ ~5-10 min left in claim window" |
| 55–60 min | Strong warning: suggest claiming now or starting fresh |
| 60+ min | Account deleted → must use [deploy.md](./deploy.md) for new one |

**Claim reminder**: After every few iterations, remind the user:
```
💡 To make this permanent, claim the account:
   <claim-url>
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `Attempting to login via OAuth...` | Ran bare `wrangler deploy` without `--temporary` | Re-run with `--temporary` flag to reuse temp account |
| `Worker not found` | Account deleted (60 min passed) | Start fresh with [deploy.md](./deploy.md) — a new temp account and URL will be created |
| `Build failed` | TypeScript/syntax error | Fix the error, retry deploy |
| `Rate limit exceeded` | Too many deploys too fast | Wait a few seconds, retry |
| `Binding not found` | Referenced resource was deleted | Remove binding or recreate with new temp account |
| New account name appears | 60-min window expired | Inform user the URL changed; update references |

## Best Practices

1. **Iterate fast**: tight loop — small change → deploy → verify → repeat
2. **Verify every change**: always `curl` the preview URL after deploy
3. **Track iterations**: keep a mental count to inform the user
4. **Don't break the URL**: preview URL is stable — don't change `name` in `wrangler.toml` mid-session
5. **Claim before complex changes**: if user is happy with direction, suggest claiming first so work isn't lost
