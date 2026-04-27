/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pastelaria/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
