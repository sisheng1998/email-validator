import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from '@hono/node-server/vercel'
import { randomBytes } from 'node:crypto'
import { authMiddleware, inputMiddleware } from './middleware'
import { Data } from './zod'
import { Result } from './types'
import { getMxRecords, testInbox, verifyEmailFormat } from './utils'

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

    // TODO: Check if the email is disposable

    const [_, domain] = email.split('@')
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
      const { isEmailExist } = await testInbox(
        mxRecords[index].exchange,
        `${randomBytes(20).toString('hex')}@${domain}`
      )

      result.isCatchAll = isEmailExist
    } catch (error) {}

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

export default handle(app)
