/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/mobile-assy',
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    legacyBrowsers: true
  },
  webpack: function (config) {
    const originalEntry = config.entry;

    config.entry = async () => {
      const entries = await originalEntry();

      if (
        entries["main.js"] &&
        !entries["main.js"].includes("./src/polyfills.js")
      ) {
        entries["main.js"].unshift("./src/polyfills.js");
      }
      return entries;
    };

    return config;
  }
}

module.exports = nextConfig
