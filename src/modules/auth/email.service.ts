/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = 'Vidoose Team <noreply@vidoose.app>';
const SUPPORT_EMAIL = 'support@vidoose.app';

export const sendVerificationEmail = async (email: string, token: string) => {
  const link = `${env.FRONTEND_URL}/auth/verify?token=${token}`;
  
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your Vidoose Account',
    html: `
      <div style="font-family: sans-serif;">
        <h2>Welcome to Vidoose!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${link}" style="padding: 10px 20px; background: #0070f3; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or verify using this link: ${link}</p>
        <p>If you have issues, contact ${SUPPORT_EMAIL}</p>
      </div>
    `
  });
};

export const sendOtpEmail = async (email: string, otpCode: string) => {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Login OTP - Vidoose',
    html: `
      <div style="font-family: sans-serif;">
        <h2>Your One-Time Password</h2>
        <h1 style="letter-spacing: 5px; color: #333;">${otpCode}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>Don't share this code with anyone.</p>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const link = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: sans-serif;">
        <p>You requested a password reset.</p>
        <a href="${link}" style="padding: 10px 20px; background: #e00; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `
  });
};