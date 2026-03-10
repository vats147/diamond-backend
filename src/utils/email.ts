import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export const sendInquiryEmail = async (opts: {
    ownerEmail: string;
    inquirerName: string;
    inquirerEmail: string;
    inquirerPhone?: string | null;
    message: string;
    businessName: string;
    diamondInfo?: string;
}): Promise<void> => {
    if (!env.SMTP_USER) return; // email not configured

    await transporter.sendMail({
        from: `"Diamond Market" <${env.SMTP_USER}>`,
        to: opts.ownerEmail,
        subject: `📩 New Inquiry from ${opts.inquirerName} — ${opts.businessName}`,
        html: `
      <h2>New Diamond Inquiry</h2>
      <p><strong>From:</strong> ${opts.inquirerName} (${opts.inquirerEmail})</p>
      ${opts.inquirerPhone ? `<p><strong>Phone:</strong> ${opts.inquirerPhone}</p>` : ''}
      ${opts.diamondInfo ? `<p><strong>Diamond:</strong> ${opts.diamondInfo}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${opts.message}</p>
    `,
    });
};

export const sendInvitationEmail = async (opts: {
    email: string;
    password: string;
    role: string;
    ownerName?: string;
    businessName?: string;
}): Promise<void> => {
    if (!env.SMTP_USER) return;

    const loginUrl = `${env.FRONTEND_URL}/login`;

    await transporter.sendMail({
        from: `"Diamond Market" <${env.SMTP_USER}>`,
        to: opts.email,
        subject: opts.businessName
            ? `👋 Welcome to ${opts.businessName} — Your Account is Ready!`
            : `👋 Welcome to Diamond Market — Your Invitation!`,
        html: `
      <h2>Hello ${opts.ownerName || 'there'},</h2>
      <p>Your account has been successfully created on <strong>Diamond Market</strong>.</p>
      
      <p><strong>Login Details:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${opts.email}</li>
        <li><strong>Password:</strong> ${opts.password}</li>
        <li><strong>Role:</strong> ${opts.role}</li>
      </ul>

      <p>You can access your dashboard here:</p>
      <p><a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Dashboard</a></p>
      
      <p>If the button doesn't work, copy and paste this link: ${loginUrl}</p>
      
      <p><em>Note: For security reasons, please change your password after your first login.</em></p>
      
      <br/>
      <p>Best regards,<br/>The Diamond Market Team</p>
    `,
    });
};

export const sendPasswordResetNotification = async (opts: {
    email: string;
    newPassword: string;
    businessName: string;
}): Promise<void> => {
    if (!env.SMTP_USER) return;

    const loginUrl = `${env.FRONTEND_URL}/login`;

    await transporter.sendMail({
        from: `"Diamond Market" <${env.SMTP_USER}>`,
        to: opts.email,
        subject: `🔑 Password Reset — ${opts.businessName}`,
        html: `
      <h2>Password Reset Notification</h2>
      <p>Your password for <strong>${opts.businessName}</strong> on Diamond Market has been reset by an administrator.</p>
      
      <p><strong>New Login Details:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${opts.email}</li>
        <li><strong>New Password:</strong> ${opts.newPassword}</li>
      </ul>

      <p>You can access your dashboard here:</p>
      <p><a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Dashboard</a></p>
      
      <p>If the button doesn't work, copy and paste this link: ${loginUrl}</p>
      
      <p><em>Security Notice: Please change your password immediately after logging in. If you did not request this change, please contact your administrator.</em></p>
      
      <br/>
      <p>Best regards,<br/>The Diamond Market Team</p>
    `,
    });
};
