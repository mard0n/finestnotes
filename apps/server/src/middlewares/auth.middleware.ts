import { auth } from "../utils/auth";
import { createMiddleware } from "hono/factory";

export const protect = createMiddleware(async (c, next) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
        error: "No valid session found",
      },
      401,
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});
