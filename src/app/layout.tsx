import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Reemplazo con fuente Inter


const GeistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const GeistMono = Inter({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
import { Bebas_Neue } from "next/font/google"; // Fuente de Google
import { Montserrat } from "next/font/google";
import { Josefin_Sans } from "next/font/google";
import { Playwrite_MX_Guides } from "next/font/google";
import { Crimson_Text } from "next/font/google";
import { twMerge } from "tailwind-merge";
import "./globals.css";

// Configuración de Bebas Neue
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const josefin = Josefin_Sans({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-josefin",
});

const playwrite = Playwrite_MX_Guides({
  weight: "400",
  variable: "--font-playwrite",
});
const crimson = Crimson_Text({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-crimson",
});


// Configuración de Montserrat
const montserrat = Montserrat({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Vet En Ruta",
  description: "Developed by BABM",
  icons: {
    icon: "/icon.ico", // Ruta al logo en la carpeta public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Clases optimizadas con twMerge
  const htmlClasses = twMerge(
    GeistSans.variable,
    GeistMono.variable,
    montserrat.variable,
    bebas.variable,
    josefin.variable,
    playwrite.variable,
    crimson.variable,
  );

  const bodyClasses = twMerge(
    "min-h-screen bg-background text-foreground antialiased",
    GeistSans.className // Aplica Geist Sans como fuente principal
  );

  return (
    <html lang="es" className={htmlClasses}>
      <body className={bodyClasses}>
        {children}
      </body>
    </html>
  );
}