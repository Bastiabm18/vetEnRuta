import { NextResponse, NextRequest } from "next/server";
import { adminAuth, adminFirestore } from "../../../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role || !['cliente', 'manager', 'maestro'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid UID or role." },
        { status: 400 }
      );
    }

    // Actualizar Firestore
    await adminFirestore.doc(`users/${uid}`).set({ role }, { merge: true });
    
    // Actualizar Custom Claims
    await adminAuth.setCustomUserClaims(uid, { role });
    
    // Invalidar tokens existentes
    await adminAuth.revokeRefreshTokens(uid);

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