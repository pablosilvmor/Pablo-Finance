import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app, db, auth;

const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

try {
  if (isConfigValid) {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    }, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  } else {
    throw new Error("Firebase configuration is missing or incomplete.");
  }
} catch (error) {
  console.warn("Firebase is not configured correctly.", error);
  auth = {
    onAuthStateChanged: (cb: any) => {
      setTimeout(() => cb(null), 0);
      return () => {};
    },
    currentUser: null,
    isDummy: true
  } as any;
  db = null as any;
}

export { app, db, auth };
