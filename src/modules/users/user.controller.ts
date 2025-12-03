/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { User } from '../../models/user.model';
import { Subscription } from '../../models/subscription.model';
import { env } from '../../config/env';

// --- Update Profile (Name/Password) ---
export const updateProfile = async (req: FastifyRequest, reply: FastifyReply) => {
  const userId = (req.user as any).id;
  const { password, name } = req.body as any;

  const user = await User.findById(userId);
  if (!user) return reply.status(404).send({ message: 'User not found' });

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }
  
  // If you add a 'name' field to your User model later
  // if (name) user.name = name;

  await user.save();
  return reply.send({ message: 'Profile updated successfully' });
};

// --- Cancel Subscription ---
export const cancelSubscription = async (req: FastifyRequest, reply: FastifyReply) => {
  const userId = (req.user as any).id;

  // Find active subscription
  const sub = await Subscription.findOne({ userId, status: 'active' });
  
  if (!sub) {
    return reply.status(400).send({ message: 'No active subscription found' });
  }

  try {
    // Call PayPal API to cancel
    // Note: You need to implement getAccessToken helper here or import it
    // For now, we simulate the DB update which is most important
    
    // In a real scenario, you would do:
    // await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${sub.paypalSubscriptionId}/cancel`, ...);

    sub.status = 'cancelled';
    await sub.save();

    // Downgrade user immediately or keep until period end (Business Logic)
    await User.findByIdAndUpdate(userId, { plan: 'free' });

    return reply.send({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    return reply.status(500).send({ message: 'Failed to cancel subscription', error });
  }
};