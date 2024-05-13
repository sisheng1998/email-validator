import { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { ENV } from './types'
import dataSchema from './zod'

export const authMiddleware =
  (): MiddlewareHandler => async (c: Context, next) => {
    const { API_TOKEN } = env<ENV>(c)

    const token = c.req.header('Authorization')?.split('Bearer ')[1]

    if (!API_TOKEN || API_TOKEN.length === 0)
      return c.json(
        {
          success: false,
          message: 'Missing API_TOKEN environment variable',
        },
        500
      )

    if (!token || token !== API_TOKEN)
      return c.json(
        {
          success: false,
          message: `${!token ? 'Missing' : 'Invalid'} authorization token`,
        },
        401
      )

    await next()
  }

export const inputMiddleware =
  (): MiddlewareHandler => async (c: Context, next) => {
    const data = await c.req.json()
    const result = dataSchema.safeParse(data)

    if (!result.success)
      return c.json(
        {
          success: false,
          message: 'Invalid input',
          issues: result.error.flatten(),
        },
        400
      )

    await next()
  }
