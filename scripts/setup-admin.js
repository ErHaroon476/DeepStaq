const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-sdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'deepstaq'
});

const auth = admin.auth();

async function createAdminUser() {
  try {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@deepstaq.com';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123456';
    
    console.log('Creating admin user...');
    console.log('Email:', adminEmail);
    
    // Create the admin user
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
    });
    
    // Set admin role in custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
    
    console.log('✅ Admin user created successfully!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    console.log('Role: admin');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️ Admin user already exists. Updating role...');
      
      // Get existing user
      const userRecord = await auth.getUserByEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@deepstaq.com');
      
      // Set admin role
      await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
      
      console.log('✅ Admin role updated for existing user!');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  }
}

createAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
