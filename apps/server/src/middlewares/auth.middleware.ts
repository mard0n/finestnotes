import { auth } from "../utils/auth";
import { createMiddleware } from "hono/factory";

export const protect = createMiddleware(async (c, next) => {
  console.log("protect middleware c.req.raw.headers:", c.req.raw.headers);

  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  console.log("protect middleware session", session);

  if (!session || !session.user) {
    console.log("Unauthorized access attempt");
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
