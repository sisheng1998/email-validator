import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import 'dotenv/config'
import { authMiddleware, inputMiddleware } from './middleware.js'
import { Data } from './zod.js'
import { Result } from './types.js'
import {
  getMxRecords,
  getNonExistentEmail,
  isEmailDisposable,
  testInbox,
  verifyEmailFormat,
} from './utils.js'

const app = new Hono()

app.use('*', cors())

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
        const { isEmailExist, isSMTPConnected } = await testInbox(
          mxRecords[index].exchange,
          email
        )

        result.isEmailExist = isEmailExist
        result.isSMTPConnected = isSMTPConnected

        if (isSMTPConnected) break

        index++
      } catch (error) {
        break
      }
    }

    if (!result.isEmailExist) {
      return c.json(
        {
          success: true,
          result,
        },
        200
      )
    }

    try {
      const nonExistentEmail = getNonExistentEmail(domain)

      const { isEmailExist } = await testInbox(
        mxRecords[index].exchange,
        nonExistentEmail
      )

      result.isCatchAll = isEmailExist
    } catch (error) {
      result.isCatchAll = false
    }

    return c.json(
      {
        success: true,
        result,
      },
      200
    )
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : error?.toString(),
      },
      400
    )
  }
})

app.notFound((c) => c.json({ success: false, message: 'Not found' }, 404))

app.onError((error, c) =>
  c.json({ success: false, message: error.message }, 500)
)

const port = Number(process.env.PORT || 3000)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`)
  }
)
