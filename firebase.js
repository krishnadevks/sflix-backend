const admin = require("firebase-admin");
const fs = require("fs");

// Check if Firebase has already been initialized
if (!admin.apps.length) {
  try {
    // Use the service account key file path from an environment variable or default to local file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || "./firebase-service-account.json";

    // Validate if the service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at ${serviceAccountPath}`);
    }

    // Load the service account key
    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error.message);
    process.exit(1); // Exit the process if Firebase initialization fails
  }
} else {
  console.log("Firebase Admin already initialized.");
}

// Export Firestore instance
const db = admin.firestore();

module.exports = { db };
