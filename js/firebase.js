// js/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAw006u4u9_LQ0uCFTaOEzBQ6_4X2eKCCg",
    authDomain: "coffeebrewapp-89b29.firebaseapp.com",
    projectId: "coffeebrewapp-89b29",
    storageBucket: "coffeebrewapp-89b29.firebasestorage.app",
    messagingSenderId: "521415953655",
    appId: "1:521415953655:web:e8f2d871cb6b18ca4dd7f2",
    measurementId: "G-7KJC3W9KNJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Теперь auth инициализируется корректно

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  // Теперь signInWithPopup доступен
  return await signInWithPopup(auth, googleProvider);
}

// ─── Auth functions ───────────────────────────────────────────────────────────

export const signIn = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);

/**
 * Register new user. After creating the Auth account, immediately write a
 * user-profile document to Firestore keyed by uid (not by nickname).
 */
export async function signUp(email, pass) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    createdAt: serverTimestamp(),
  });
  return cred;
}

// ─── Firestore: recipes ───────────────────────────────────────────────────────

/** Save recipe to user's private collection. */
export async function saveMyRecipe(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return addDoc(collection(db, 'users', user.uid, 'recipes'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/** Share recipe to the public feed. Includes nickname if available. */
export async function shareRecipe(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  // Try to get nickname from profile
  let nickname = null;
  try {
    const profile = await getUserProfile();
    nickname = profile?.nickname || null;
  } catch (_) {}
  return addDoc(collection(db, 'recipes'), {
    ...data,
    uid: user.uid,
    userEmail: user.email,
    userNickname: nickname,
    createdAt: serverTimestamp(),
  });
}

/** Load public feed. */
export async function loadFeed(count = 20) {
  const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Delete a recipe from user's private collection. */
export async function deleteMyRecipe(recipeId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return deleteDoc(doc(db, 'users', user.uid, 'recipes', recipeId));
}

/** Load current user's saved recipes. */
export async function loadMyRecipes() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(
    collection(db, 'users', user.uid, 'recipes'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update a recipe in user's private collection. */
export async function updateMyRecipe(recipeId, data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return updateDoc(doc(db, 'users', user.uid, 'recipes', recipeId), data);
}

// ─── Firestore: custom techniques ────────────────────────────────────────────

/** Save a custom pour technique. */
export async function saveCustomTechnique(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return addDoc(collection(db, 'users', user.uid, 'techniques'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/** Load current user's custom techniques. */
export async function loadCustomTechniques() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(
    collection(db, 'users', user.uid, 'techniques'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Delete a custom technique. */
export async function deleteCustomTechnique(id) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return deleteDoc(doc(db, 'users', user.uid, 'techniques', id));
}

// ─── Firestore: user profile ────────────────────────────────────────────────

/** Load user profile (nickname, etc). */
export async function getUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'users', user.uid));
  return snap.exists() ? snap.data() : null;
}

/** Update user profile fields (e.g. nickname). */
export async function updateUserProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  return setDoc(doc(db, 'users', user.uid), data, { merge: true });
}

/** Delete all user recipes. */
export async function deleteAllMyRecipes() {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  const q = query(collection(db, 'users', user.uid, 'recipes'), limit(500));
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  return Promise.all(promises);
}

/** Delete all custom techniques. */
export async function deleteAllCustomTechniques() {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти');
  const q = query(collection(db, 'users', user.uid, 'techniques'), limit(500));
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  return Promise.all(promises);
}
