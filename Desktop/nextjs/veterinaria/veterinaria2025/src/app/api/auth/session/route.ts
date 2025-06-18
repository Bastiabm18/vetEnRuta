import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminFirestore } from "../../../../lib/firebase-admin";
import { DocumentSnapshot } from 'firebase-admin/firestore';

const SESSION_COOKIE_NAME = "firebaseAuthSession";
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { token?: string } = await request.json();
    const idToken = body.token;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { success: false, message: "ID token is required." },
        { status: 400 }
      );
    }

    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true);
    
    if (decodedIdToken) {
      const uid = decodedIdToken.uid;
      const userDocRef = adminFirestore.doc(`users/${uid}`);
      const userDocSnap: DocumentSnapshot = await userDocRef.get();

      if (!userDocSnap.exists) {
        return NextResponse.json(
          { success: false, message: "User data not found." },
          { status: 404 }
        );
      }

      const userData = userDocSnap.data();
      const userRole = userData?.role;

      if (!userRole) {
        return NextResponse.json(
          { success: false, message: "User role not found." },
          { status: 404 }
        );
      }

      await adminAuth.setCustomUserClaims(uid, { role: userRole });
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });

      return NextResponse.json(
        { success: true, message: "Session created successfully." }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid ID token." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Internal server error",
        code: error.code 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: "Session deleted." });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete session." },
      { status: 500 }
    );
  }
}