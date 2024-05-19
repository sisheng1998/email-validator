import { MiddlewareHandler } from 'hono/types'
import { getColorEnabled } from 'hono/utils/color'
import { getPath } from 'hono/utils/url'

enum LogPrefix {
  Incoming = '-->',
  Outgoing = '<--',
  Error = '[Error]',
}

const humanize = (times: string[]) => {
  const [delimiter, separator] = [',', '.']

  const orderTimes = times.map((v) =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter)
  )

  return orderTimes.join(separator)
}

const time = (start: number) => {
  const delta = Date.now() - start

  return humanize([
    delta < 1000 ? delta + 'ms' : Math.round(delta / 1000) + 's',
  ])
}

const colorStatus = (status: number) => {
  const colorEnabled = getColorEnabled()

  const output: { [key: string]: string } = {
    7: colorEnabled ? `\x1b[35m${status}\x1b[0m` : `${status}`,
    5: colorEnabled ? `\x1b[31m${status}\x1b[0m` : `${status}`,
    4: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
    3: colorEnabled ? `\x1b[36m${status}\x1b[0m` : `${status}`,
    2: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
    1: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
    0: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
  }

  const calculateStatus = (status / 100) | 0

  return output[calculateStatus]
}

type LogFunction = (message: string, ...messages: string[]) => void

const formatMessage: LogFunction = (message, ...messages) => {
  const timestamp = new Date().toISOString()

  console.log(
    `[${timestamp}]`,
    `(${formatDate(timestamp)})`,
    message.trim(),
    ...messages.map((m) => m.trim())
  )
}

const TIME_ZONE = 'Asia/Kuala_Lumpur'

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  }

  const humanFriendlyDate = date.toLocaleDateString('en-GB', dateOptions)
  const humanFriendlyTime = date.toLocaleTimeString('en-US', timeOptions)

  return `${humanFriendlyDate}, ${humanFriendlyTime}`
}

export const logger = (): MiddlewareHandler => async (c, next) => {
  const { method } = c.req

  const path = getPath(c.req.raw)

  log.incoming(method, path)

  const start = Date.now()

  await next()

  log.outgoing(method, path, colorStatus(c.res.status), time(start))
}

type Log = {
  info: LogFunction
  error: LogFunction
  incoming: LogFunction
  outgoing: LogFunction
}

export const log: Log = {
  info: (message, ...messages) => formatMessage(message, ...messages),
  error: (message, ...messages) =>
    formatMessage(LogPrefix.Error, message, ...messages),
  incoming: (message, ...messages) =>
    formatMessage(LogPrefix.Incoming, message, ...messages),
  outgoing: (message, ...messages) =>
    formatMessage(LogPrefix.Outgoing, message, ...messages),
}
