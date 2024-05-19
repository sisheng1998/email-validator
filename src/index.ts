import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import 'dotenv/config'
import { authMiddleware, inputMiddleware } from './middleware.js'
import { Data } from './zod.js'
import { Result } from './types.js'
import {
  getMxRecords,
  isEmailDisposable,
  testInbox,
  verifyEmailFormat,
} from './utils.js'
import { log, logger } from './logger.js'

const app = new Hono()

app.use('*', cors())

app.use(logger())

app.get('/', (c) => c.redirect('https://sisheng.my', 302))

app.post('/verify', authMiddleware(), inputMiddleware(), async (c) => {
  const { email }: Data = await c.req.json()

  const result: Result = {
    email,
    isEmailValid: false,
    isDisposable: false,
    isMxRecordFound: false,
    isSMTPConnected: false,
    isEmailExist: false,
    isCatchAll: false,
  }

  try {
    const isEmailValid = verifyEmailFormat(email)

    if (!isEmailValid) {
      return c.json(
        {
          success: true,
          result,
        },
        200
      )
    }

    result.isEmailValid = true

    const [_, domain] = email.split('@')

    result.isDisposable = isEmailDisposable(domain)

    const mxRecords = await getMxRecords(domain)

    if (mxRecords.length === 0) {
      return c.json(
        {
          success: true,
          result,
        },
        200
      )
    }

    result.isMxRecordFound = true

    let index = 0

    while (index < mxRecords.length) {
      try {
        const { isSMTPConnected, isEmailExist, isCatchAll } = await testInbox(
          mxRecords[index].exchange,
          email
        )

        result.isSMTPConnected = isSMTPConnected
        result.isEmailExist = isEmailExist
        result.isCatchAll = isCatchAll

        if (isSMTPConnected) break

        index++
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : error?.toString() || 'Unknown error occurred'

        log.error(message)

        break
      }
    }

    return c.json(
      {
        success: true,
        result,
      },
      200
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error?.toString() || 'Unknown error occurred'

    log.error(message)

    return c.json(
      {
        success: false,
        message,
      },
      400
    )
  }
})

app.notFound((c) => c.json({ success: false, message: 'Not found' }, 404))

app.onError((error, c) => {
  const message = error.message

  log.error(message)

  return c.json({ success: false, message }, 500)
})

const port = Number(process.env.PORT || 3000)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    log.info(`Server is running on port ${info.port}`)
  }
)
