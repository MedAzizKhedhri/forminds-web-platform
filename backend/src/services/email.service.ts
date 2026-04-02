import { getTransporter, getTestMessageUrl } from '../config/mailer';
import config from '../config';

/**
 * Sends an email verification message with a link to verify the user's email.
 */
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  const transporter = await getTransporter();

  const verificationUrl = `${config.frontend.url}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ForMinds, ${firstName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verificationUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">If you didn't create an account on ForMinds, you can safely ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Verification email preview: ${previewUrl}`);
  }
  console.log(`\n✅ EMAIL VERIFICATION LINK:\n${verificationUrl}\n`);
};

/**
 * Sends a password reset email with a link to reset the user's password.
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  const transporter = await getTransporter();

  const resetUrl = `${config.frontend.url}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    `,
  });

  const previewUrl = getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Password reset email preview: ${previewUrl}`);
  }
  console.log(`\n✅ PASSWORD RESET LINK:\n${resetUrl}\n`);
};

/**
 * Sends a 2FA verification code via email.
 */
export const send2FACode = async (
  email: string,
  firstName: string,
  code: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Your Two-Factor Authentication Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Two-Factor Authentication Code</h2>
        <p>Hi ${firstName},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">If you didn't request this code, please secure your account by changing your password immediately.</p>
      </div>
    `,
  });

  const previewUrl = getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] 2FA code email preview: ${previewUrl}`);
  }
};

/**
 * Sends a notification about a new connection request.
 */
export const sendConnectionNotification = async (
  email: string,
  firstName: string,
  senderName: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - New Connection Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Connection Request</h2>
        <p>Hi ${firstName},</p>
        <p><strong>${senderName}</strong> would like to connect with you on ForMinds.</p>
        <p>
          <a href="${config.frontend.url}/network"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View Request
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because someone sent you a connection request on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl2 = getTestMessageUrl(info);
  if (previewUrl2) {
    console.log(`[Email] Connection notification preview: ${previewUrl2}`);
  }
};

/**
 * Sends a notification to a recruiter about a new application.
 */
export const sendApplicationNotification = async (
  email: string,
  opportunityTitle: string,
  applicantName: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - New Application for "${opportunityTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Application Received</h2>
        <p><strong>${applicantName}</strong> has applied to your opportunity:</p>
        <p style="font-size: 18px; color: #4F46E5;">${opportunityTitle}</p>
        <p>
          <a href="${config.frontend.url}/opportunities"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View Applications
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because someone applied to your opportunity on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl3 = getTestMessageUrl(info);
  if (previewUrl3) {
    console.log(`[Email] Application notification preview: ${previewUrl3}`);
  }
};

/**
 * Sends a notification to a student about their application status update.
 */
export const sendApplicationStatusUpdate = async (
  email: string,
  firstName: string,
  opportunityTitle: string,
  status: string
): Promise<void> => {
  const transporter = await getTransporter();

  const statusLabels: Record<string, string> = {
    reviewed: 'Reviewed',
    shortlisted: 'Shortlisted',
    accepted: 'Accepted',
    rejected: 'Rejected',
  };

  const statusLabel = statusLabels[status] || status;

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - Application Update: ${statusLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Status Update</h2>
        <p>Hi ${firstName},</p>
        <p>Your application for <strong>${opportunityTitle}</strong> has been updated to:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #4F46E5;">${statusLabel}</span>
        </div>
        <p>
          <a href="${config.frontend.url}/applications"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View My Applications
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because you have an active application on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl4 = getTestMessageUrl(info);
  if (previewUrl4) {
    console.log(`[Email] Application status update preview: ${previewUrl4}`);
  }
};

/**
 * Sends a notification to a recruiter about their opportunity being approved or rejected.
 */
export const sendOpportunityValidationNotification = async (
  email: string,
  firstName: string,
  opportunityTitle: string,
  status: string,
  reason?: string
): Promise<void> => {
  const transporter = await getTransporter();

  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Rejected';
  const statusColor = isApproved ? '#10B981' : '#EF4444';

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - Opportunity ${statusLabel}: ${opportunityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Opportunity ${statusLabel}</h2>
        <p>Hi ${firstName},</p>
        <p>Your opportunity <strong>"${opportunityTitle}"</strong> has been:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 24px; font-weight: bold; color: ${statusColor};">${statusLabel}</span>
        </div>
        ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        ${isApproved ? '<p>Your opportunity is now visible to students on the platform.</p>' : '<p>You can review the feedback and submit a revised opportunity.</p>'}
        <p>
          <a href="${config.frontend.url}/opportunities/mine"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View My Opportunities
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because you published an opportunity on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl5 = getTestMessageUrl(info);
  if (previewUrl5) {
    console.log(`[Email] Opportunity validation notification preview: ${previewUrl5}`);
  }
};

/**
 * Sends a notification to a recruiter that their account has been verified.
 */
export const sendRecruiterVerificationNotification = async (
  email: string,
  firstName: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Your Recruiter Account Has Been Verified',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Verified</h2>
        <p>Hi ${firstName},</p>
        <p>Great news! Your recruiter account on ForMinds has been verified by our admin team.</p>
        <p>You can now publish opportunities and connect with talented students on the platform.</p>
        <p>
          <a href="${config.frontend.url}/opportunities/create"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Create an Opportunity
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because your recruiter account was verified on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl6 = getTestMessageUrl(info);
  if (previewUrl6) {
    console.log(`[Email] Recruiter verification notification preview: ${previewUrl6}`);
  }
};

/**
 * Sends a notification to a user that their account has been suspended.
 */
export const sendAccountSuspensionNotification = async (
  email: string,
  firstName: string,
  reason: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Your Account Has Been Suspended',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Suspended</h2>
        <p>Hi ${firstName},</p>
        <p>Your account on ForMinds has been suspended by an administrator.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this is an error, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because your account status was changed on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl7 = getTestMessageUrl(info);
  if (previewUrl7) {
    console.log(`[Email] Account suspension notification preview: ${previewUrl7}`);
  }
};

/**
 * Sends a notification to a user that their account has been reactivated.
 */
export const sendAccountReactivationNotification = async (
  email: string,
  firstName: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'ForMinds - Your Account Has Been Reactivated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Reactivated</h2>
        <p>Hi ${firstName},</p>
        <p>Good news! Your account on ForMinds has been reactivated. You can now log in and use the platform again.</p>
        <p>
          <a href="${config.frontend.url}/login"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Log In
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because your account status was changed on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl8 = getTestMessageUrl(info);
  if (previewUrl8) {
    console.log(`[Email] Account reactivation notification preview: ${previewUrl8}`);
  }
};

/**
 * Sends a confirmation email when a user registers for an event.
 */
export const sendEventRegistrationConfirmation = async (
  email: string,
  firstName: string,
  eventTitle: string,
  date: string,
  qrCode: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - Registration Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Registration Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>You have been successfully registered for the following event:</p>
        <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #4F46E5; margin: 0 0 8px 0;">${eventTitle}</p>
          <p style="margin: 0; color: #6B7280;">Date: ${date}</p>
        </div>
        <p>Your QR code for check-in:</p>
        <div style="text-align: center; margin: 16px 0; padding: 16px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
          <p style="font-size: 14px; font-weight: bold; word-break: break-all; color: #374151;">${qrCode}</p>
        </div>
        <p>Please present this QR code at the event for check-in. You can also find it in your "My Tickets" section on the platform.</p>
        <p>
          <a href="${config.frontend.url}/events/my-tickets"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View My Tickets
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because you registered for an event on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl9 = getTestMessageUrl(info);
  if (previewUrl9) {
    console.log(`[Email] Event registration confirmation preview: ${previewUrl9}`);
  }
};

/**
 * Sends a notification to registered participants when an event is cancelled.
 */
export const sendEventCancellationNotification = async (
  email: string,
  firstName: string,
  eventTitle: string
): Promise<void> => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - Event Cancelled: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event Cancelled</h2>
        <p>Hi ${firstName},</p>
        <p>We're sorry to inform you that the following event has been cancelled:</p>
        <div style="background-color: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #EF4444; margin: 0;">${eventTitle}</p>
        </div>
        <p>Your registration has been automatically cancelled. We apologize for any inconvenience.</p>
        <p>
          <a href="${config.frontend.url}/events"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Browse Other Events
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because you were registered for an event on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl10 = getTestMessageUrl(info);
  if (previewUrl10) {
    console.log(`[Email] Event cancellation notification preview: ${previewUrl10}`);
  }
};

/**
 * Sends a notification to an organizer about their event being approved or rejected.
 */
export const sendEventValidationNotification = async (
  email: string,
  firstName: string,
  eventTitle: string,
  status: string,
  reason?: string
): Promise<void> => {
  const transporter = await getTransporter();

  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Rejected';
  const statusColor = isApproved ? '#10B981' : '#EF4444';

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: `ForMinds - Event ${statusLabel}: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event ${statusLabel}</h2>
        <p>Hi ${firstName},</p>
        <p>Your event <strong>"${eventTitle}"</strong> has been:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 24px; font-weight: bold; color: ${statusColor};">${statusLabel}</span>
        </div>
        ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        ${isApproved ? '<p>Your event is now visible to users on the platform.</p>' : '<p>You can review the feedback and submit a revised event.</p>'}
        <p>
          <a href="${config.frontend.url}/events/mine"
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px;">
            View My Events
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">You received this email because you created an event on ForMinds.</p>
      </div>
    `,
  });

  const previewUrl11 = getTestMessageUrl(info);
  if (previewUrl11) {
    console.log(`[Email] Event validation notification preview: ${previewUrl11}`);
  }
};
