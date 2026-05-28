import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Toggle Firebase features dynamically based on environment keys
export const isFirebaseEnabled = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Failed to initialize Google Firebase client SDK:", e);
  }
}

export { auth, db };

export async function fbSignup(name, email, password) {
  if (!auth) throw new Error("Firebase SDK not initialized. Verify .env credentials.");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: name });
  
  return {
    name: name,
    email: user.email,
    createdAt: Date.now(),
    plan: 'free',
    token: await user.getIdToken()
  };
}

export async function fbLogin(email, password) {
  if (!auth) throw new Error("Firebase SDK not initialized. Verify .env credentials.");
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  return {
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    createdAt: user.metadata.createdAt ? parseInt(user.metadata.createdAt) : Date.now(),
    plan: 'free',
    token: await user.getIdToken()
  };
}

export async function fbLoginWithGoogle() {
  if (!auth) throw new Error("Firebase SDK not initialized. Verify .env credentials.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  
  return {
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    createdAt: user.metadata.createdAt ? parseInt(user.metadata.createdAt) : Date.now(),
    plan: 'free',
    token: await user.getIdToken()
  };
}

export async function fbLogout() {
  if (auth) {
    await signOut(auth);
  }
}

export async function fbSaveSnippet(snippet, userEmail) {
  if (!db) throw new Error("Firestore SDK not initialized. Verify .env credentials.");
  const t = Date.now();
  const id = snippet.id || `snip_${Date.now()}`;
  const docRef = doc(db, 'snippets', id);
  
  const payload = {
    id,
    userId: userEmail,
    name: snippet.name,
    description: snippet.description || '',
    language: snippet.language,
    code: snippet.code,
    createdAt: snippet.createdAt || t,
    updatedAt: t
  };
  
  await setDoc(docRef, payload);
  return payload;
}

export async function fbListSnippets(userEmail) {
  if (!db) throw new Error("Firestore SDK not initialized. Verify .env credentials.");
  const colRef = collection(db, 'snippets');
  const q = query(colRef, where('userId', '==', userEmail));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(doc => {
    list.push(doc.data());
  });
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return list;
}

export async function fbDeleteSnippet(id) {
  if (!db) throw new Error("Firestore SDK not initialized. Verify .env credentials.");
  const docRef = doc(db, 'snippets', id);
  await deleteDoc(docRef);
}
