import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Enable XSS protection in older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Enforce HTTPS for all resources
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (restrict browser features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Sucrase compilation
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src 'self'",
              "object-src 'none'", // Prevent Flash/embedded objects
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'", // Prevent embedding in iframes
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
