import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured in environment variables" },
        { status: 500 }
      );
    }

    console.log('Creating admin user:', adminEmail);

    try {
      // Create the admin user
      const userRecord = await adminAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
      });

      // Set admin role in custom claims
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

      console.log('Admin user created successfully:', userRecord.uid);

      return NextResponse.json({
        message: "Admin user created successfully",
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          role: 'admin'
        }
      });

    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // User already exists, just update the role
        const existingUser = await adminAuth.getUserByEmail(adminEmail);
        await adminAuth.setCustomUserClaims(existingUser.uid, { role: 'admin' });

        return NextResponse.json({
          message: "Admin role updated for existing user",
          user: {
            uid: existingUser.uid,
            email: existingUser.email,
            emailVerified: existingUser.emailVerified,
            role: 'admin'
          }
        });
      }
      throw error;
    }

  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: "Failed to setup admin user" },
      { status: 500 }
    );
  }
}
