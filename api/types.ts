export type Result = {
  email: string
  isEmailValid: boolean
  isDisposable: boolean
  isMxRecordFound: boolean
  isSMTPConnected: boolean
  isEmailExist: boolean
  isCatchAll: boolean
}

export type TestResult = Pick<Result, 'isSMTPConnected' | 'isEmailExist'>

export enum SMTPStages {
  CONNECT = 'CONNECT',
  EHLO = 'EHLO',
  MAIL_FROM = 'MAIL_FROM',
  RCPT_TO = 'RCPT_TO',
  QUIT = 'QUIT',
}

export interface SMTPStage {
  command?: string | ((email: string) => string)
  expected_reply_code: string
}