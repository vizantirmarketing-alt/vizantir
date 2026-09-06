import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  trailingSlash: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    qualities: [55, 75, 80, 85],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  serverExternalPackages: [
    '@google-analytics/data',
    'googleapis',
    'google-auth-library',
    'google-gax',
    'playwright-core',
    '@sparticuz/chromium-min',
  ],

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vizantir.com' }],
        destination: 'https://www.vizantir.com/:path*',
        permanent: true,
      },
      {
        source: '/portfolio',
        destination: '/case-studies',
        permanent: true,
      },
      {
        source: '/blog/wordpress-vs-nextjs-2026',
        destination: '/nextjs-vs-wordpress',
        statusCode: 301,
      },
      {
        source: '/blog/wordpress-vs-nextjs-2026/',
        destination: '/nextjs-vs-wordpress',
        statusCode: 301,
      },
      {
        source: '/blog/wordpress-vs-nextjs-honest-comparison',
        destination: '/nextjs-vs-wordpress',
        statusCode: 301,
      },
      {
        source: '/blog/wordpress-vs-nextjs-honest-comparison/',
        destination: '/nextjs-vs-wordpress',
        statusCode: 301,
      },
    ];
  },

  async headers() {
    const markdownAlternates = {
      key: 'Link',
      value: [
        '</llms.txt>; rel="alternate"; type="text/plain"',
        '</llms-full.txt>; rel="alternate"; type="text/plain"',
        '</pricing.md>; rel="alternate"; type="text/markdown"',
      ].join(', '),
    };

    return [
      {
        source: '/play-sw.js',
        headers: [
          {
            // `/play/` cannot be a prefix of the lobby URL `/play`, so the
            // allowed max-scope is `/play` (games stay under it; marketing does not).
            key: 'Service-Worker-Allowed',
            value: '/play',
          },
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // `/:path*` does not match `/`
        source: '/',
        headers: [markdownAlternates],
      },
      {
        source: '/:path*',
        headers: [markdownAlternates],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
