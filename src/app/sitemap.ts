import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const staticRoutes = [
    '',
    '/about',
    '/support',
    '/privacy',
    '/terms',
    '/faq',
    '/how-it-works',
    '/developers',
    '/become-a-contributor',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return [...staticRoutes]
}
