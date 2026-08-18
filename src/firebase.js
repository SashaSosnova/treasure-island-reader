import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

let app = null
let auth = null
let db = null

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен: проверь файл .env')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth() {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

export function getFirebaseDb() {
  if (!db) db = getFirestore(getFirebaseApp())
  return db
}
