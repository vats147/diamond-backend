"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInquiryEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env_1.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
});
const sendInquiryEmail = async (opts) => {
    if (!env_1.env.SMTP_USER)
        return; // email not configured
    await transporter.sendMail({
        from: `"Diamond Market" <${env_1.env.SMTP_USER}>`,
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
exports.sendInquiryEmail = sendInquiryEmail;
