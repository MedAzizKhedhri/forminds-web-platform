import sgMail from '@sendgrid/mail';
import config from './index';

interface Transporter {
  sendMail(mailOptions: any): Promise<any>;
}

let transporter: Transporter;

/**
 * Lazily initializes and returns the email transporter.
 * Uses SendGrid API if SENDGRID_API_KEY is provided, otherwise falls back to Ethereal test account.
 */
export const getTransporter = async (): Promise<Transporter> => {
  if (transporter) {
    return transporter;
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('[Mailer] Using SendGrid API');

    transporter = {
      sendMail: async (mailOptions: any) => {
        const msg = {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text,
        };

        try {
          await sgMail.send(msg);
          return { messageId: 'sendgrid-sent' };
        } catch (error) {
          console.error('[Mailer] SendGrid error:', error);
          throw error;
        }
      },
    };
  } else {
    // Fallback to nodemailer if no SendGrid key
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
  if (process.env.SENDGRID_API_KEY) {
    return false; // SendGrid doesn't have preview URLs
  }
  const nodemailer = require('nodemailer');
  return nodemailer.getTestMessageUrl(info);
};
