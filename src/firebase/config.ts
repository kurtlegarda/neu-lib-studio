
/**
 * Firebase configuration using environment variables.
 * Ensure these are set in your .env file or deployment settings.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Check for missing keys in development
if (typeof window !== "undefined" && !firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable.");
}
