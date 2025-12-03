/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model';
import { env } from '../../config/env';
import { sendVerificationEmail, sendOtpEmail, sendPasswordResetEmail } from './email.service';

// --- Utils ---
const generateHash = (str: string) => crypto.createHash('sha256').update(str).digest('hex');
const generateRandomToken = () => crypto.randomBytes(32).toString('hex');
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Controllers ---

// 1. Get Current User Profile (NEW)
export const getMe = async (req: FastifyRequest, reply: FastifyReply) => {
  const userId = (req.user as any).id;
  
  const user = await User.findById(userId).select('-passwordHash -otp -verifyToken -resetPassword');
  
  if (!user) {
    return reply.status(404).send({ message: 'User not found' });
  }

  return reply.send(user);
};

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = req.body as any;

  if (await User.findOne({ email })) {
    return reply.status(400).send({ message: 'Email already exists' });
  }

  const tokenRaw = generateRandomToken();
  const user = await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    verifyToken: {
      tokenHash: generateHash(tokenRaw),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  // Send Email (Non-blocking)
  sendVerificationEmail(email, tokenRaw).catch(console.error);

  return reply.status(201).send({ message: 'Registration successful. Please verify your email.' });
};

export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = req.body as any;
  
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return reply.status(401).send({ message: 'Invalid credentials' });
  }

  // If email not verified, block login
  if (!user.isVerified) {
    return reply.status(403).send({ message: 'Email not verified. Check your inbox.' });
  }

  // --- OTP FLOW START ---
  const otpCode = generateOTP();
  user.otp = {
    hash: await bcrypt.hash(otpCode, 10),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    attempts: 0
  };
  await user.save();

  sendOtpEmail(email, otpCode).catch(console.error);

  return reply.send({ 
    message: 'OTP sent to email. Please verify to complete login.', 
    requireOtp: true,
    email: email 
  });
};

export const verifyOTP = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, otp } = req.body as any;
  const user = await User.findOne({ email });

  if (!user || !user.otp || new Date() > user.otp.expiresAt) {
    return reply.status(400).send({ message: 'OTP expired or invalid' });
  }

  const isValid = await bcrypt.compare(otp, user.otp.hash);
  if (!isValid) {
    user.otp.attempts += 1;
    await user.save();
    return reply.status(400).send({ message: 'Invalid OTP code' });
  }

  user.otp = undefined;
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role, plan: user.plan }, 
    env.JWT_ACCESS_SECRET, 
    { expiresIn: '1d' }
  );

  return reply.send({ 
    message: 'Login Successful',
    token, 
    user: { email: user.email, role: user.role, plan: user.plan, isVerified: user.isVerified } 
  });
};

export const verifyEmail = async (req: FastifyRequest, reply: FastifyReply) => {
  const { token } = req.query as any;
  if (!token) return reply.status(400).send({ message: 'Token missing' });

  const tokenHash = generateHash(token);

  const user = await User.findOne({ 
    'verifyToken.tokenHash': tokenHash,
    'verifyToken.expiresAt': { $gt: new Date() }
  });

  if (!user) return reply.status(400).send({ message: 'Invalid or expired token' });

  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();

  return reply.send({ message: 'Email verified successfully' });
};

export const forgotPassword = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email } = req.body as any;
  const user = await User.findOne({ email });

  if (user) {
    const tokenRaw = generateRandomToken();
    user.resetPassword = {
      tokenHash: generateHash(tokenRaw),
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000)
    };
    await user.save();
    sendPasswordResetEmail(email, tokenRaw).catch(console.error);
  }

  return reply.send({ message: 'If user exists, reset link sent.' });
};

export const resetPassword = async (req: FastifyRequest, reply: FastifyReply) => {
  const { token, newPassword } = req.body as any;
  const tokenHash = generateHash(token);

  const user = await User.findOne({
    'resetPassword.tokenHash': tokenHash,
    'resetPassword.expiresAt': { $gt: new Date() }
  });

  if (!user) return reply.status(400).send({ message: 'Invalid link' });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPassword = undefined;
  await user.save();

  return reply.send({ message: 'Password reset successful' });
};
