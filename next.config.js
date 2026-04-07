/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['pdfjs-dist'],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Otimização para economizar memória e evitar SIGTERM no Vercel
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig