/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyInstance } from 'fastify';
import { getPlatformSEO, getSitemap } from './seo.controller'; // Ensure controller exists

export async function seoRoutes(fastify: FastifyInstance) {
  fastify.get('/platform/:platform', getPlatformSEO);
  fastify.get('/sitemap.xml', getSitemap);
}