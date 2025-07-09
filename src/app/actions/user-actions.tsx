// app/actions/user-actions.ts
"use server";

import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

export async function updateUserRole(uid: string, role: string) {
  try {
    await adminFirestore.collection('users').doc(uid).update({ role });
    await adminAuth.setCustomUserClaims(uid, { role });
    await adminAuth.revokeRefreshTokens(uid);
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { error: 'Error actualizando rol' };
  }
}

export async function deleteUser(uid: string) {
  try {
    await adminFirestore.collection('users').doc(uid).delete();
    await adminAuth.deleteUser(uid);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: 'Error eliminando usuario' };
  }
}