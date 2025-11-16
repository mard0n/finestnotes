import type { APIRoute } from "astro";
import { app } from "../../server/api";

export const ALL: APIRoute = ({ locals, request }) => {
  console.log('locals', locals);
  
  if (!locals || !locals.runtime || !locals.runtime.env) {
    return new Response(JSON.stringify({ error: "Environment bindings not available. Are you running on Cloudflare Workers?" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const env = locals.runtime.env;
  const ctx = locals.runtime.ctx;

  return app.fetch(request, env, ctx);
};