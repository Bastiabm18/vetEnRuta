import { NextResponse, NextRequest } from "next/server";
// 1. Importa la nueva función en lugar de las constantes
import { getAdminInstances } from "@/lib/firebase-admin";
export async function POST(request: NextRequest) {
  try {
    // 2. Llama a la función para obtener las instancias DENTRO de la función POST
    // Esto asegura que la inicialización solo ocurre cuando se necesita.
    const { auth, firestore } = getAdminInstances();

    const { uid, role } = await request.json();

    if (!uid || !role || !['cliente', 'manager', 'maestro'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid UID or role." },
        { status: 400 }
      );
    }

    // El resto de tu lógica funciona exactamente igual
    // Actualizar Firestore
    await firestore.doc(`users/${uid}`).set({ role }, { merge: true });
    
    // Actualizar Custom Claims
    await auth.setCustomUserClaims(uid, { role });
    
    // Invalidar tokens existentes
    await auth.revokeRefreshTokens(uid);

    return NextResponse.json(
      { message: `User role updated to ${role}` }
    );

  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role." },
      { status: 500 }
    );
  }
}