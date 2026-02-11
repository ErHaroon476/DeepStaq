import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper function to verify admin credentials
async function verifyAdmin(request: NextRequest) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
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
  const [email, password] = credentials.split(":");

  return email === adminEmail && password === adminPassword;
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const listUsersResult = await adminAuth.listUsers();
    
    const users = listUsersResult.users.map(user => {
      // Get custom claims to determine role
      const customClaims = user.customClaims || {};
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        role: customClaims.role || 'user',
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email, password, role = 'user' } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false, // Start as unverified
    });

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { uid, email, password, role } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    
    const userRecord = await adminAuth.updateUser(uid, updateData);

    // Update role if provided
    if (role) {
      await adminAuth.setCustomUserClaims(uid, { role });
    }

    // Get updated user with role
    const updatedUser = await adminAuth.getUser(uid);
    const customClaims = updatedUser.customClaims || {};

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        role: customClaims.role || 'user',
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await adminAuth.deleteUser(uid);

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
