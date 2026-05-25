import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://rideonspinningstudio.com.mx';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/#horarios`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/#precios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/#colaboradores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politica-de-cancelacion`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
