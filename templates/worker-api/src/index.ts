/**
 * Cloudflare Worker — REST API template with simple routing
 * Deploy: npx wrangler deploy --temporary
 *
 * Endpoints:
 *   GET  /              → health check
 *   GET  /api/health    → { status: "ok" }
 *   GET  /api/users     → list of users
 *   GET  /api/users/:id → single user
 *   POST /api/users     → create user
 */

export interface Env {}

interface RouteHandler {
  (request: Request, env: Env, params: Record<string, string>): Promise<Response> | Response;
}

const routes: { method: string; pattern: RegExp; handler: RouteHandler }[] = [
  {
    method: "GET",
    pattern: /^\/$/,
    handler: () => new Response("API is running. Try /api/health"),
  },
  {
    method: "GET",
    pattern: /^\/api\/health$/,
    handler: () => Response.json({ status: "ok", timestamp: Date.now() }),
  },
  {
    method: "GET",
    pattern: /^\/api\/users$/,
    handler: () =>
      Response.json([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]),
  },
  {
    method: "GET",
    pattern: /^\/api\/users\/(\d+)$/,
    handler: (_req, _env, params) => {
      const id = parseInt(params[1], 10);
      const users: Record<number, { id: number; name: string }> = {
        1: { id: 1, name: "Alice" },
        2: { id: 2, name: "Bob" },
      };
      const user = users[id];
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });
      return Response.json(user);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/users$/,
    handler: async (request) => {
      const body = await request.json().catch(() => ({}));
      return Response.json({ created: true, user: body }, { status: 201 });
    },
  },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    for (const route of routes) {
      if (route.method !== method) continue;
      const match = route.pattern.exec(pathname);
      if (match) {
        const params: Record<string, string> = {};
        match.forEach((v, i) => (params[i] = v));
        try {
          return await route.handler(request, env, params);
        } catch (err) {
          return Response.json(
            { error: "Internal Server Error", message: String(err) },
            { status: 500 }
          );
        }
      }
    }

    return Response.json({ error: "Not Found", path: pathname }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
