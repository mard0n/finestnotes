import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

import fs from "fs";
import path from "path";

/* 
  drizzle config should never be imported or used by the running application. The drizzle config is only for:
  - pnpm run db:generate - Generate migrations
  - pnpm run db:studio - Run Drizzle Studio
  - Other drizzle-kit commands

  Running application (pnpm run dev) should only use the D1 binding provided by Wrangler.
*/


const getLocalD1 = () => {
  try {
    // Check if we're in a bundled environment (like when running via wrangler dev)
    const isBundled = process.cwd() === '/bundle' || !fs.existsSync('package.json');
    
    if (isBundled) {
      throw new Error('Cannot access local D1 database from bundled environment. Use drizzle-kit commands from the project directory.');
    }

    // For drizzle-kit commands, look for .wrangler in the current directory
    const basePath = path.resolve('.wrangler');

    // Check if .wrangler directory exists
    if (!fs.existsSync(basePath)) {
      throw new Error(`.wrangler directory not found at ${basePath}. Make sure to run 'wrangler dev' first to initialize the local D1 database.`);
    }

    const dbFile = fs
      .readdirSync(basePath, { encoding: 'utf-8', recursive: true })
      .find((f) => f.endsWith('.sqlite'));

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}. Make sure to run 'wrangler dev' first to initialize the local D1 database.`);
    }

    const url = path.resolve(basePath, dbFile);
    return url;
  } catch (err) {
    console.error(`Error finding local D1 database: ${err}`);
  }
}

const isProd = () => process.env.NODE_ENV === 'production'

const getCredentials = () => {
  const prod = {
    driver: 'd1-http',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      databaseId: process.env.CLOUDFLARE_DATABASE_ID,
      token: process.env.CLOUDFLARE_D1_TOKEN
    }

  }

  const dev = {
    dbCredentials: {
      url: getLocalD1()
    }
  }
  return isProd() ? prod : dev

}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  ...getCredentials(),
});