/**
 * WhatsApp integration (mock). Replace with Twilio/WhatsApp Business API when ready.
 */

export interface SendMessageOptions {
  to: string;
  message: string;
}

export interface SendResult {
  sent: boolean;
  id?: string;
}

export class WhatsAppService {
  async sendMessage(_options: SendMessageOptions): Promise<SendResult> {
    return { sent: true, id: `wa-mock-${Date.now()}` };
  }
}
