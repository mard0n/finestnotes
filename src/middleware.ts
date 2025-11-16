import { defineMiddleware } from "astro:middleware";
import type { Session, User } from "better-auth";
import { auth } from "./server/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const runtime = context.locals.runtime;

    if (!runtime?.env) {
      console.warn(
        "Missing Cloudflare runtime env in middleware; skipping session hydration."
      );
      return next();
    }

    const sessionUrl = new URL("/api/auth/get-session", context.request.url);
    const sessionRequest = new Request(sessionUrl, {
      headers: context.request.headers,
      method: "GET",
    });

    const response = await auth(runtime.env).handler(sessionRequest);

    if (response.ok) {
      const data = (await response.json()) as {
        user: Pick<User, "id" | "name"> | null;
        session: Session | null;
      };
      if (data && data.user) {
        context.locals.user = { name: data.user.name, id: data.user.id };
        context.locals.session = data.session;
      } else {
        context.locals.user = null;
        context.locals.session = null;
      }
    } else {
      const errorText = await response.text();
      console.error("Session fetch failed:", response.status, errorText);
      context.locals.user = null;
      context.locals.session = null;
    }
  } catch (error) {
    console.error("Session check failed:", error);
    context.locals.user = null;
    context.locals.session = null;
  }

  console.log("middleware next");
  return next();
});
