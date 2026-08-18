import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../firebase'
import { exportBackup } from './storage'

const FAMILY_KEY = 'treasure-island-family-code'
const SYNC_READY_KEY = 'treasure-island-cloud-ready'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const COLLECTION = 'treasureIslandFamilies'

function randomCode(length = 6) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return out
}

export function loadFamilyCode() {
  try {
    return localStorage.getItem(FAMILY_KEY)
  } catch {
    return null
  }
}

export function saveFamilyCode(code) {
  try {
    if (!code) localStorage.removeItem(FAMILY_KEY)
    else localStorage.setItem(FAMILY_KEY, code)
  } catch {
    // ignore
  }
}

export function loadSyncReady() {
  try {
    return localStorage.getItem(SYNC_READY_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSyncReady(ready) {
  try {
    if (ready) localStorage.setItem(SYNC_READY_KEY, '1')
    else localStorage.removeItem(SYNC_READY_KEY)
  } catch {
    // ignore
  }
}

export async function ensureAuth() {
  const auth = getFirebaseAuth()
  if (auth.currentUser) return auth.currentUser

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        unsub()
        if (user) {
          resolve(user)
          return
        }
        try {
          const cred = await signInAnonymously(auth)
          resolve(cred.user)
        } catch (err) {
          reject(err)
        }
      },
      reject,
    )
  })
}

function familyRef(code) {
  return doc(getFirebaseDb(), COLLECTION, code)
}

export function toCloudPayload(updatedAt = Date.now()) {
  const backup = exportBackup()
  return {
    app: 'treasure-island',
    version: backup.version,
    data: backup.data,
    updatedAt,
  }
}

function normalizePayload(remote) {
  return {
    version: remote.version ?? 1,
    data: remote.data ?? {},
    updatedAt: remote.updatedAt ?? Date.now(),
    hasProgress: Boolean(remote.data && Object.keys(remote.data).length > 0),
  }
}

/** Создаёт пустую семью — локальный прогресс в облако не копируется. */
export async function createFamily() {
  if (!isFirebaseConfigured()) throw new Error('Firebase не настроен')
  await ensureAuth()

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    const ref = familyRef(code)
    const existing = await getDoc(ref)
    if (existing.exists()) continue

    const updatedAt = Date.now()
    await setDoc(ref, {
      code,
      createdAt: updatedAt,
      app: 'treasure-island',
      version: 1,
      data: {},
      updatedAt,
    })
    saveFamilyCode(code)
    saveSyncReady(false)
    return code
  }

  throw new Error('Не удалось создать код семьи, попробуй ещё раз')
}

/** Только привязывает код. Прогресс из облака не подставляет. */
export async function joinFamily(rawCode) {
  if (!isFirebaseConfigured()) throw new Error('Firebase не настроен')
  const code = rawCode.trim().toUpperCase()
  if (code.length < 4) throw new Error('Введи код семьи')

  await ensureAuth()
  const snap = await getDoc(familyRef(code))
  if (!snap.exists()) throw new Error('Семья с таким кодом не найдена')

  const remote = snap.data()
  if (remote.app && remote.app !== 'treasure-island') {
    throw new Error('Этот код от другого приложения')
  }

  saveFamilyCode(code)
  saveSyncReady(false)

  return {
    code,
    ...normalizePayload(remote),
  }
}

export async function fetchFamilyPayload(code) {
  await ensureAuth()
  const snap = await getDoc(familyRef(code))
  if (!snap.exists()) throw new Error('Семья не найдена')
  const remote = snap.data()
  if (remote.app && remote.app !== 'treasure-island') {
    throw new Error('Этот код от другого приложения')
  }
  return normalizePayload(remote)
}

export async function pushFamilyData(code) {
  await ensureAuth()
  const updatedAt = Date.now()
  await setDoc(
    familyRef(code),
    {
      code,
      ...toCloudPayload(updatedAt),
    },
    { merge: true },
  )
  return updatedAt
}

export function subscribeFamily(code, onData, onError) {
  return onSnapshot(
    familyRef(code),
    (snap) => {
      if (!snap.exists()) {
        onError('Семья не найдена')
        return
      }
      onData(normalizePayload(snap.data()))
    },
    (err) => {
      onError(err.message || 'Ошибка синхронизации')
    },
  )
}

export function leaveFamily() {
  saveFamilyCode(null)
  saveSyncReady(false)
}
