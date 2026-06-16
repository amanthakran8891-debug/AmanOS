/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This project ships without an ESLint config; don't let linting block builds.
  eslint: { ignoreDuringBuilds: true },
  // Silence the dev cross-origin warning when opening via 127.0.0.1 or localhost.
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  // AmanOS is private — tell every crawler not to index, on every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
