import net from 'node:net'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { promises, MxRecord } from 'node:dns'
import { randomBytes } from 'node:crypto'
import { emailSchema } from './zod'
import { SMTPStages, TestResult } from './types'
import { stages } from './constants'

export const verifyEmailFormat = (email: string): boolean =>
  emailSchema.safeParse(email).success

export const isEmailDisposable = async (domain: string): Promise<boolean> => {
  const content = await readFile(
    path.join(process.cwd(), 'api', './disposable_email_list.conf'),
    {
      encoding: 'utf-8',
    }
  )

  const emailList = content.split('\n').slice(0, -1)
  return emailList.includes(domain)
}

export const getMxRecords = async (domain: string): Promise<MxRecord[]> => {
  try {
    const mxRecords = await promises.resolveMx(domain)
    return mxRecords.sort((a, b) => a.priority - b.priority)
  } catch (error) {
    return []
  }
}

const processStage = (
  socket: net.Socket,
  stageName: SMTPStages,
  email?: string
): void => {
  const stage = stages[stageName]

  if (stage.command) {
    const command =
      typeof stage.command === 'function'
        ? stage.command(email!)
        : stage.command
    socket.write(command)
  }
}

export const testInbox = async (
  hostname: string,
  email: string
): Promise<TestResult> =>
  new Promise((resolve, reject) => {
    const result: TestResult = { isSMTPConnected: false, isEmailExist: false }

    const socket = net.createConnection(25, hostname)
    let timeout: NodeJS.Timeout

    let currentStageName = SMTPStages.CONNECT

    const cleanUp = () => {
      clearTimeout(timeout)
      socket.end()
    }

    timeout = setTimeout(() => {
      cleanUp()
      reject(new Error('Connection timeout'))
    }, 3000)

    socket.on('connect', () => {
      clearTimeout(timeout)
      processStage(socket, currentStageName)
    })

    socket.on('data', (data) => {
      const response = data.toString()
      const currentStage = stages[currentStageName]

      if (!response.startsWith(currentStage.expected_reply_code)) {
        cleanUp()
        return
      }

      if (currentStageName === SMTPStages.CONNECT) {
        result.isSMTPConnected = true
      } else if (currentStageName === SMTPStages.RCPT_TO) {
        result.isEmailExist = true
      }

      currentStageName = Object.keys(SMTPStages)[
        Object.values(SMTPStages).indexOf(currentStageName) + 1
      ] as SMTPStages

      if (currentStageName) {
        processStage(socket, currentStageName, email)
      } else {
        cleanUp()
        resolve(result)
      }
    })

    socket.on('error', () => {
      cleanUp()
      resolve(result)
    })

    socket.on('close', () => {
      clearTimeout(timeout)
      resolve(result)
    })
  })

export const getNonExistentEmail = (domain: string): string =>
  `${randomBytes(20).toString('hex')}@${domain}`
