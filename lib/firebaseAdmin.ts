import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    "[DeepStaq] Firebase Admin env vars are missing. Secure server auth verification will not work until they are set."
  );
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential:
          projectId && clientEmail && privateKey
            ? cert({
                projectId,
                clientEmail,
                privateKey,
              })
            : undefined,
      })
    : getApp();

export const adminAuth = getAuth(app);

