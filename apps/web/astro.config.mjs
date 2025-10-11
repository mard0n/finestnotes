// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import solidJs from '@astrojs/solid-js';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.CF_WEB_URL,
  adapter: cloudflare(),
  // prefetch: {
  //   defaultStrategy: 'viewport',
  //   prefetchAll: true
  // }
  integrations: [solidJs()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': import.meta.env.VITE_API_URL,
      },
    }
  }
});