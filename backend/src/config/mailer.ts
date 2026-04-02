import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import config from './index';

let transporter: Transporter | null = null;

/**
 * Lazily initializes and returns the nodemailer transporter.
 * Uses SMTP config if SMTP_HOST is provided, otherwise falls back to Ethereal test account.
 */
export const getTransporter = async (): Promise<Transporter> => {
  if (transporter) {
    return transporter;
  }

  if (config.smtp.host) {
    const options: SMTPTransport.Options = {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    };

    transporter = nodemailer.createTransport(options);
    console.log(`[Mailer] Configured with SMTP host: ${config.smtp.host}`);
  } else {
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
export const getTestMessageUrl = (
  info: nodemailer.SentMessageInfo
): string | false => {
  return nodemailer.getTestMessageUrl(info);
};
