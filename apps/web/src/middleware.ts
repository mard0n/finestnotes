import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Convert Headers to plain object and get cookie header
    const cookieHeader = context.request.headers.get('cookie');

    console.log('Cookie header:', cookieHeader);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/get-session`, {
      headers: {
        'cookie': cookieHeader || '',
        'content-type': 'application/json',
      },
      credentials: import.meta.env.PROD ? 'same-origin' : 'include',
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Session data:', data);

      if (data && data.user) {
        context.locals.user = data.user;
        context.locals.session = data.session;
        console.log('Session set successfully:', { userId: data.user.id });
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