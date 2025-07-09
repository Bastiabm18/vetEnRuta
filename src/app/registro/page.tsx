// src/app/registro/page.tsx

// Esta línea fuerza el renderizado dinámico y soluciona el error de build.
export const dynamic = 'force-dynamic';

// Importa el componente de cliente que acabas de renombrar.
import SignupPageClient from './SignupPageClient';

// Este componente de servidor simplemente renderiza tu página de cliente.
export default function SignupPage() {
  return <SignupPageClient />;
}
