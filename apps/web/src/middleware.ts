import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Convert Headers to plain object and get cookie header
    const cookieHeader = context.request.headers.get('cookie');

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/get-session`, {
      headers: {
        'cookie': cookieHeader || '',
        'content-type': 'application/json',
      },
      credentials: import.meta.env.PROD ? 'same-origin' : 'include',
    });

    console.log('Astro Middleware Response:', response);

    if (response.ok) {
      const data = await response.json();

      if (data && data.user) {
        context.locals.user = data.user;
        context.locals.session = data.session;
      } else {
        context.locals.user = null;
        context.locals.session = null;
        console.log('No session found - user needs to login');
      }
    } else {
      const errorText = await response.text();
      console.error('Session fetch failed:', response.status, errorText);
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