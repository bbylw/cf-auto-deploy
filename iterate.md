# 🔁 Iterate Capability

Update a previously deployed Worker within the 60-minute temporary account window. Reuses the cached temporary token — no re-authentication needed.

## How Token Caching Works

After the first `wrangler deploy --temporary`:
1. Wrangler stores the temporary API token in local config cache
2. Subsequent `wrangler deploy` commands (without `--temporary`) **automatically reuse** the same temporary account
3. No need to pass `--temporary` again — just `wrangler deploy`
4. Token expires when the temporary account is deleted (60 min) or claimed

## Flow

```
Confirm Prior Deploy → Apply Code Changes → Redeploy → Verify → Report
```

## Step 1: Confirm Prior Deployment

```bash
npx wrangler whoami
```

If this fails or shows no account:
- 60-minute window may have expired
- Cache may have been cleared
- → Fall back to [deploy.md](./deploy.md) for a fresh temporary deployment

## Step 2: Apply Code Changes

Make the requested changes to the Worker source:
- Edit `src/index.ts` (or configured `main` file)
- Update routes, handlers, logic, responses as requested
- Keep changes minimal and focused

## Step 3: Redeploy (No `--temporary` Needed)

```bash
npx wrangler deploy
```

Reuses the cached temporary account token. The preview URL stays the same — only the deployed code changes.

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
| `Authentication required` | Token expired or cache cleared | Run `wrangler deploy --temporary` again (new temp account) |
| `Worker not found` | Account deleted (60 min passed) | Start fresh with [deploy.md](./deploy.md) |
| `Build failed` | TypeScript/syntax error | Fix the error, retry deploy |
| `Rate limit exceeded` | Too many deploys too fast | Wait a few seconds, retry |
| `Binding not found` | Referenced resource was deleted | Remove binding or recreate with new temp account |

## Best Practices

1. **Iterate fast**: tight loop — small change → deploy → verify → repeat
2. **Verify every change**: always `curl` the preview URL after deploy
3. **Track iterations**: keep a mental count to inform the user
4. **Don't break the URL**: preview URL is stable — don't change `name` in `wrangler.toml` mid-session
5. **Claim before complex changes**: if user is happy with direction, suggest claiming first so work isn't lost
