import { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { ENV } from './types.js'
import dataSchema from './zod.js'
import { log } from './logger.js'

export const authMiddleware =
  (): MiddlewareHandler => async (c: Context, next) => {
    const { API_TOKEN } = env<ENV>(c)

    const token = c.req.header('Authorization')?.split('Bearer ')[1]

    if (!API_TOKEN || API_TOKEN.length === 0) {
      const message = 'Missing API_TOKEN environment variable'

      log.error(message)

      return c.json(
        {
          success: false,
          message,
        },
        500
      )
    }

    if (!token || token !== API_TOKEN) {
      const message = `${!token ? 'Missing' : 'Invalid'} authorization token`

      log.error(message)

      return c.json(
        {
          success: false,
          message,
        },
        401
      )
    }

    await next()
  }

export const inputMiddleware =
  (): MiddlewareHandler => async (c: Context, next) => {
    const data = await c.req.json()
    const result = dataSchema.safeParse(data)

    if (!result.success) {
      const message = 'Invalid input'

      log.error(message, JSON.stringify(result.error.flatten()))

      return c.json(
        {
          success: false,
          message,
          issues: result.error.flatten(),
        },
        400
      )
    }

    await next()
  }
