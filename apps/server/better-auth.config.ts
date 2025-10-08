import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import db from './drizzle.config';

const { BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;
import * as schema from "./src/db/schema";

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
});