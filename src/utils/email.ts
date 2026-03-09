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
