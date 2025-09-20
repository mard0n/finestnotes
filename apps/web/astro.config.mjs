// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import { config } from './src/config';

// https://astro.build/config
export default defineConfig({
  site: config.apiUrl,
  adapter: cloudflare()
});