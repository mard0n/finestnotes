import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/get-session`, {
      headers: context.request.headers,
      credentials: 'include',
    });

    if (response.ok) {
      const session = await response.json();
      if (session && session.user) {
        context.locals.user = session.user;
        context.locals.session = session.session;
      } else {
        context.locals.user = null;
        context.locals.session = null;
      }
    } else {
      context.locals.user = null;
      context.locals.session = null;
    }
  } catch (error) {
    console.error('Session check failed:', error);
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});