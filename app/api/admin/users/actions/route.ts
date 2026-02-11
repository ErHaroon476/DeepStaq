import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper function to verify admin credentials
async function verifyAdmin(request: NextRequest) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  // Get authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  // Decode basic auth
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [email] = credentials.split(":");

  return email === adminEmail;
}

// POST - Perform user actions (logout, block, unblock)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { uid, action } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (action === "logout") {
      // Revoke all refresh tokens to force logout
      await adminAuth.revokeRefreshTokens(uid);
      return NextResponse.json({ message: "User logged out successfully" });
    } else if (action === "block") {
      // Disable user account
      await adminAuth.updateUser(uid, { disabled: true });
      return NextResponse.json({ message: "User blocked successfully" });
    } else if (action === "unblock") {
      // Enable user account
      await adminAuth.updateUser(uid, { disabled: false });
      return NextResponse.json({ message: "User unblocked successfully" });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error performing user action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
