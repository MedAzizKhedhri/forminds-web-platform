import { Resend } from 'resend';
import config from './index';

interface Transporter {
  sendMail(mailOptions: any): Promise<any>;
}

let transporter: Transporter;

/**
 * Lazily initializes and returns the email transporter.
 * Uses Resend API if RESEND_API_KEY is provided, otherwise falls back to Ethereal test account.
 */
export const getTransporter = async (): Promise<Transporter> => {
  if (transporter) {
    return transporter;
  }

  // Debug: Log what we're reading
  console.log('[Mailer] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'MISSING');

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('[Mailer] Using Resend API');

    transporter = {
      sendMail: async (mailOptions: any) => {
        try {
          const response = await resend.emails.send({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
          });
          if (response.error) {
            throw response.error;
          }
          return { messageId: response.data?.id };
        } catch (error) {
          console.error('[Mailer] Resend error:', error);
          throw error;
        }
      },
    };
  } else {
    // Fallback to nodemailer if no Resend key
    const nodemailer = require('nodemailer');
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('[Mailer] Using Ethereal test account');
    console.log(`[Mailer] Ethereal user: ${testAccount.user}`);
  }

  return transporter;
};

/**
 * Returns the Ethereal preview URL for a sent message, or false if unavailable.
 */
export const getTestMessageUrl = (info: any): string | false => {
  if (process.env.RESEND_API_KEY) {
    return false; // Resend doesn't have preview URLs
  }
  const nodemailer = require('nodemailer');
  return nodemailer.getTestMessageUrl(info);
};
