import { Hono } from 'hono'
import { handle } from '@hono/node-server/vercel'

const app = new Hono().basePath('/api')

app.get('/', (c) => c.json({ message: 'Hello Hono!' }))

export default handle(app)
