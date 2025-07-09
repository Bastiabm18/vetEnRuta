/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyBz4Ca7ySzi8aEVAu5GKRdzxv0Dwc7uiVo",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "veterinariaconcepcion-86d83.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "veterinariaconcepcion-86d83",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "veterinariaconcepcion-86d83.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "892958021638",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:892958021638:web:bbee139c840dd8917fcb87",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-KS0RV4N77V",
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: "service_fkgi13c",
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "template_rlnti1a",
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "_CSu9Vj2Xl4nxsYj8",
  },
    
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