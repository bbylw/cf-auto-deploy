/**
 * Cloudflare Worker — Static Site template
 * Serves static files from ./public via the assets binding.
 * Deploy: npx wrangler deploy --temporary
 *
 * The [assets] binding in wrangler.toml handles static file serving.
 * This Worker is only invoked for non-asset requests (e.g., API routes).
 */

export interface Env {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Example API route alongside static assets
    if (url.pathname === "/api/time") {
      return Response.json({ time: new Date().toISOString() });
    }

    // For everything else, the assets binding serves files automatically.
    // If no file matches, return 404.
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
