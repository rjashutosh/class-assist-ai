/**
 * Email integration (mock). Replace with SendGrid/SES/nodemailer when ready.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SendResult {
  sent: boolean;
  id?: string;
}

export class EmailService {
  async sendEmail(_options: SendEmailOptions): Promise<SendResult> {
    return { sent: true, id: `email-mock-${Date.now()}` };
  }
}
