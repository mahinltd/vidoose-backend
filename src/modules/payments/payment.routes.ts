/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyInstance } from 'fastify';
import { createCheckoutSession } from './payment.controller'; // Ensure controller exists
import { paypalWebhook } from './webhook.controller';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create subscription (Protected)
  fastify.post('/create-subscription', { preHandler: [fastify.authenticate] }, createCheckoutSession);
  
  // PayPal calls this (Public)
  fastify.post('/webhook', paypalWebhook);
}