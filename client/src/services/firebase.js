import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDAVUYctXW-fZ_nLDXbDnuMmvVCK_6WEzE",
  authDomain: "sistema-cocheras.firebaseapp.com",
  projectId: "sistema-cocheras",
  storageBucket: "sistema-cocheras.appspot.com",
  messagingSenderId: "590187004191",
  appId: "1:590187004191:web:8c8f9c8f9c8f9c8f9c8f9c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;