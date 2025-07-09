// src/app/login/page.tsx

// Esta línea es la clave: le dice a Next.js que no pre-renderice esta página.
export const dynamic = 'force-dynamic';

// Importa el componente de cliente que acabas de renombrar.
import LoginClientPage from './LoginClientPage';

// Este es tu nuevo componente de servidor, que simplemente renderiza el de cliente.
export default function LoginPage() {
  return <LoginClientPage />;
}