import type { RouteType } from '@finest/utils/types';
import { hc } from 'hono/client'

const server = hc<RouteType>(import.meta.env.VITE_API_URL || '')

export { server };