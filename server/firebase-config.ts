import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin
let firebaseApp;
let db: FirebaseFirestore.Firestore;

export function initializeFirebase() {
  if (getApps().length === 0) {
    // Check if we have service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      try {
        const serviceAccountKey: ServiceAccount = JSON.parse(serviceAccount);
        firebaseApp = initializeApp({
          credential: cert(serviceAccountKey),
        });
        
        console.log('Firebase initialized with service account for project:', serviceAccountKey.project_id);
      } catch (error) {
        console.error('Failed to parse Firebase service account key:', error);
        throw new Error('Invalid Firebase service account key format');
      }
    } else {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found');
      throw new Error('Firebase service account key is required');
    }
    
    db = getFirestore(firebaseApp);
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true
    });
  } else {
    firebaseApp = getApps()[0];
    db = getFirestore(firebaseApp);
  }
  
  return db;
}

export { db };