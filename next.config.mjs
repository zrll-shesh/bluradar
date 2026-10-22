/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({ test: /\.geojson$/, type: 'json' });
    return config;
  },
};
export default nextConfig;
