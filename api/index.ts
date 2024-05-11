import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from '@hono/node-server/vercel'
import { authMiddleware, inputMiddleware } from './middleware'
import { Data } from './zod'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => c.redirect('https://sisheng.my', 302))

app.post('/verify', authMiddleware(), inputMiddleware(), async (c) => {
  const data: Data = await c.req.json()

  try {
    return c.json(
      {
        success: true,
        message: 'Data is valid',
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
