// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import svgr from "vite-plugin-svgr";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.CF_WEB_URL,
  adapter: cloudflare(),
  output: 'server',
  // prefetch: {
  //   defaultStrategy: 'viewport',
  //   prefetchAll: true
  // }
  integrations: [react()],

  vite: {
    plugins: [tailwindcss(), svgr()],
    server: {
      proxy: {
        '/api': import.meta.env.VITE_API_URL,
      },
    }
  }
});