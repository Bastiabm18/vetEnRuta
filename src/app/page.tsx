// src/app/page.tsx

// Esta es la última línea mágica: fuerza el renderizado dinámico para la página de inicio.
export const dynamic = 'force-dynamic';

// Importa el componente de cliente que contiene toda tu página.
import HomePageClient from './HomePageClient';

// Este componente de servidor simplemente renderiza tu página de cliente.
export default function Home() {
  return <HomePageClient />;
}