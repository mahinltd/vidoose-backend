/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { FastifyReply, FastifyRequest } from 'fastify';

export const getPlatformSEO = async (req: FastifyRequest, reply: FastifyReply) => {
  const { platform } = req.params as any;
  
  // JSON-LD Structure for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Vidoose ${platform} Downloader`,
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": `Download ${platform} videos in 4K/HD instantly without watermark using Vidoose AI engine.`
  };

  return reply.send({
    title: `Best ${platform} Video Downloader - No Watermark (2025)`,
    description: `Fastest tool to save ${platform} reels and videos. Supports 1080p, 4K. Try Vidoose now.`,
    jsonLd
  });
};

export const getSitemap = async (req: FastifyRequest, reply: FastifyReply) => {
  const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <url><loc>https://vidoose.app/</loc><priority>1.0</priority></url>
       <url><loc>https://vidoose.app/youtube-downloader</loc><priority>0.8</priority></url>
       <url><loc>https://vidoose.app/tiktok-downloader</loc><priority>0.8</priority></url>
    </urlset>
  `;
  return reply.type('application/xml').send(xml);
};