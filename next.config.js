/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '/tmp/legado-dev-next' : '.next',
};

module.exports = nextConfig;
