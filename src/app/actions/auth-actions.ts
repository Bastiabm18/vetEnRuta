'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signOut() {
  // Eliminar la cookie de sesión
  const cookieStore = await cookies();
  cookieStore.delete('firebaseAuthSession');
  
  // Redirigir al login
  redirect('/');
}