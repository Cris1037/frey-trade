/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent the app from being embedded in iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from MIME-sniffing the content type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send origin on cross-origin requests, full URL on same-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features the app doesn't need
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
