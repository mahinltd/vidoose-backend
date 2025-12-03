/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../../models/user.model';
import { Subscription } from '../../models/subscription.model';
import { AdminLog } from '../../models/adminLog.model';

export const paypalWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
  const event = req.body as any;
  const eventType = event.event_type;
  
  // In production: Verify PayPal Signature using 'paypal-rest-sdk' or headers
  // For now, we trust the ID structure (secure this before live!)

  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    const subId = event.resource.id;
    const customId = event.resource.custom_id; // Pass userId here during creation

    // Upgrade User
    if (customId) {
      await User.findByIdAndUpdate(customId, { plan: 'premium' });
      await Subscription.findOneAndUpdate(
        { paypalSubscriptionId: subId }, 
        { status: 'active' }
      );
      console.log(`✅ User ${customId} upgraded to Premium`);
    }
  }

  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
    const subId = event.resource.id;
    const sub = await Subscription.findOne({ paypalSubscriptionId: subId });
    if (sub) {
      await User.findByIdAndUpdate(sub.userId, { plan: 'free' });
      sub.status = 'cancelled';
      await sub.save();
    }
  }

  return reply.send({ status: 'received' });
};