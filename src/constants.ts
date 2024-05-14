import { SMTPStage, SMTPStages } from './types.js'

export const stages: Record<SMTPStages, SMTPStage> = {
  [SMTPStages.CONNECT]: { expected_reply_code: '220' },
  [SMTPStages.EHLO]: {
    command: `EHLO mail.example.org\r\n`,
    expected_reply_code: '250',
  },
  [SMTPStages.MAIL_FROM]: {
    command: `MAIL FROM:<name@example.org>\r\n`,
    expected_reply_code: '250',
  },
  [SMTPStages.RCPT_TO]: {
    command: (email: string) => `RCPT TO:<${email}>\r\n`,
    expected_reply_code: '250',
  },
  [SMTPStages.QUIT]: {
    command: `QUIT\r\n`,
    expected_reply_code: '221',
  },
}
