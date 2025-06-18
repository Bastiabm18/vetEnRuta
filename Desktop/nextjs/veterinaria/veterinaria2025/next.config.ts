/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Puedes agregar otros dominios aquí si es necesario
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Puedes agregar otros dominios aquí si es necesario
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Otras configuraciones de tu proyecto...
}

module.exports = nextConfig