/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */

import { FastifyInstance, RouteHandlerMethod } from 'fastify';
import { startDownload, checkStatus, getDownloadLink, getDownloadHistory } from './download.controller';

export async function downloadRoutes(fastify: FastifyInstance) {
  
  // ১. ভিডিও ডাউনলোড শুরু করা
  // আমরা টাইপ এরর এড়ানোর জন্য 'as unknown as RouteHandlerMethod' ব্যবহার করছি
  fastify.post(
    '/start', 
    { preHandler: [fastify.authenticate] }, 
    startDownload as unknown as RouteHandlerMethod
  );
  
  // ২. স্ট্যাটাস চেক করা
  fastify.get(
    '/status/:id', 
    { preHandler: [fastify.authenticate] }, 
    checkStatus as unknown as RouteHandlerMethod
  );
  
  // ৩. আসল লিঙ্ক আনলক করা
  fastify.post(
    '/get-link', 
    { preHandler: [fastify.authenticate] }, 
    getDownloadLink as unknown as RouteHandlerMethod
  );

  // ৪. হিস্ট্রি দেখা
  fastify.get(
    '/history', 
    { preHandler: [fastify.authenticate] }, 
    getDownloadHistory as unknown as RouteHandlerMethod
  );
}