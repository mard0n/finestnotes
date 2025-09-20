import type { route } from "@finest/utils/types";
import { hc } from 'hono/client'
import { config } from '../config'

const client = hc<route>(config.apiUrl)

export { client };