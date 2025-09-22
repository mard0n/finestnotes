// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.CF_WEB_URL,
  adapter: cloudflare()
});