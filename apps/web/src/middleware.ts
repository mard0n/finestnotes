import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Convert Headers to plain object and get cookie header
    const cookieHeader = context.request.headers.get("cookie");

    console.log('middleware cookieHeader', cookieHeader);
    console.log('middleware import.meta.env.VITE_API_URL', import.meta.env.VITE_API_URL);
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/get-session`,
      {
        headers: {
          cookie: cookieHeader || "",
          "content-type": "application/json",
          'accept-encoding': 'gzip, deflate, br',
        },
        credentials: "include", // Required for sending cookies from mydomain.com to api.mydomain.com
        // credentials: import.meta.env.PROD ? "same-origin" : "include",
      }
    );
    console.log('middleware fetch response:', response);

    if (response.ok) {
      const data = await response.json();
      console.log('middleware data', data);
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

  console.log('middleware next');
  return next();
});