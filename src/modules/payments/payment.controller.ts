/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { createSubscription } from './paypal.service';

export const createCheckoutSession = async (req: FastifyRequest, reply: FastifyReply) => {
  const { planId } = req.body as { planId: string };
  try {
    const subscription = await createSubscription(planId);
    return reply.send({ 
      subscriptionId: subscription.id, 
      approveLink: subscription.links[0].href 
    });
  } catch (error) {
    return reply.status(500).send({ message: 'PayPal Error', error });
  }
};