import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAVUYctXW-fZ_nLDXbDnuMmvVCK_6WEzE",
  authDomain: "sistema-cocheras.firebaseapp.com",
  projectId: "sistema-cocheras",
  storageBucket: "sistema-cocheras.firebasestorage.app",
  messagingSenderId: "155438323199",
  appId: "1:155438323199:web:b2868e62383def7d7883ca"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;