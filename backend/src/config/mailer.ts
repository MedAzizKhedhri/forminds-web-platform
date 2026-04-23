import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import config from './index';

interface Transporter {
  sendMail(mailOptions: any): Promise<any>;
}

let transporter: Transporter;

/**
 * Lazily initializes and returns the email transporter.
 * Uses Mailgun API if MAILGUN_API_KEY is provided, otherwise falls back to Ethereal test account.
 */
export const getTransporter = async (): Promise<Transporter> => {
  if (transporter) {
    return transporter;
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

    console.log('[Mailer] Using Mailgun API');

    transporter = {
      sendMail: async (mailOptions: any) => {
        try {
          const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
          });
          return { messageId: response.id };
        } catch (error) {
          console.error('[Mailer] Mailgun error:', error);
          throw error;
        }
      },
    };
  } else {
    // Fallback to nodemailer if no Mailgun key
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
  if (process.env.MAILGUN_API_KEY) {
    return false; // Mailgun doesn't have preview URLs
  }
  const nodemailer = require('nodemailer');
  return nodemailer.getTestMessageUrl(info);
};
