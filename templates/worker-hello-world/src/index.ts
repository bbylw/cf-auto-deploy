/**
 * Minimal Cloudflare Worker — Hello World template
 * Deploy: npx wrangler deploy --temporary
 */

export interface Env {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Hello from Cloudflare!", {
        headers: { "content-type": "text/plain" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
