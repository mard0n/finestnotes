// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.CF_WEB_URL,
  adapter: cloudflare(),
  integrations: [solidJs()]
});