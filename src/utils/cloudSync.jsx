import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import {
  createFamily,
  ensureAuth,
  fetchFamilyPayload,
  joinFamily,
  leaveFamily,
  loadFamilyCode,
  loadSyncReady,
  pushFamilyData,
  saveSyncReady,
  subscribeFamily,
} from './familySync'
import { replaceProgressFromCloud } from './storage'

const FamilySyncContext = createContext(null)

const defaultFamily = {
  code: null,
  connected: false,
  syncing: false,
  syncReady: false,
  cloudHasProgress: false,
  error: null,
  lastSyncedAt: null,
  message: null,
}

export function FamilySyncProvider({ children }) {
  const [family, setFamily] = useState(() => ({
    ...defaultFamily,
    code: loadFamilyCode(),
    syncReady: loadSyncReady(),
  }))

  const skipPushUntil = useRef(0)
  const pushTimer = useRef(null)
  const lastRemoteAt = useRef(0)
  const syncReadyRef = useRef(loadSyncReady())

  useEffect(() => {
    syncReadyRef.current = family.syncReady
  }, [family.syncReady])

  const schedulePush = useCallback(() => {
    const code = loadFamilyCode()
    if (!code || !isFirebaseConfigured() || !syncReadyRef.current) return
    if (Date.now() < skipPushUntil.current) return

    if (pushTimer.current) window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(async () => {
      setFamily((f) => ({ ...f, syncing: true, error: null, message: null }))
      try {
        const updatedAt = await pushFamilyData(code)
        lastRemoteAt.current = updatedAt
        setFamily((f) => ({
          ...f,
          syncing: false,
          connected: true,
          cloudHasProgress: true,
          lastSyncedAt: updatedAt,
          error: null,
        }))
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Не удалось сохранить в облако'
        setFamily((f) => ({ ...f, syncing: false, error: message }))
      }
    }, 700)
  }, [])

  useEffect(() => {
    const onProgress = () => schedulePush()
    window.addEventListener('treasure-island-progress', onProgress)
    return () => window.removeEventListener('treasure-island-progress', onProgress)
  }, [schedulePush])

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    const code = loadFamilyCode()
    if (!code) return

    setFamily((f) => ({ ...f, code, syncing: true, error: null }))
    let unsub = () => {}

    ;(async () => {
      try {
        await ensureAuth()
        unsub = subscribeFamily(
          code,
          (payload) => {
            void (async () => {
              const ready = syncReadyRef.current

              if (!ready) {
                setFamily((f) => ({
                  ...f,
                  connected: true,
                  syncing: false,
                  cloudHasProgress: payload.hasProgress,
                  lastSyncedAt: payload.updatedAt,
                }))
                return
              }

              if (payload.updatedAt && payload.updatedAt <= lastRemoteAt.current) {
                setFamily((f) => ({
                  ...f,
                  connected: true,
                  syncing: false,
                  cloudHasProgress: payload.hasProgress,
                  lastSyncedAt: payload.updatedAt,
                }))
                return
              }

              lastRemoteAt.current = payload.updatedAt
              skipPushUntil.current = Date.now() + 1200
              await replaceProgressFromCloud({
                version: payload.version ?? 1,
                data: payload.data ?? {},
              })
              setFamily((f) => ({
                ...f,
                code,
                connected: true,
                syncing: false,
                cloudHasProgress: payload.hasProgress,
                lastSyncedAt: payload.updatedAt,
                error: null,
              }))
            })()
          },
          (message) => {
            setFamily((f) => ({
              ...f,
              syncing: false,
              connected: false,
              error: message,
            }))
          },
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Ошибка подключения к семье'
        setFamily((f) => ({
          ...f,
          syncing: false,
          connected: false,
          error: message,
        }))
      }
    })()

    return () => {
      unsub()
      if (pushTimer.current) window.clearTimeout(pushTimer.current)
    }
  }, [family.code])

  const createFamilyCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setFamily((f) => ({
        ...f,
        error: 'Firebase не настроен. Проверь .env и консоль Firebase.',
      }))
      return
    }
    setFamily((f) => ({ ...f, syncing: true, error: null, message: null }))
    try {
      const code = await createFamily()
      lastRemoteAt.current = 0
      syncReadyRef.current = false
      setFamily({
        ...defaultFamily,
        code,
        connected: true,
        syncReady: false,
        cloudHasProgress: false,
        message: 'Код создан. Нажми «Сохранить прогресс», чтобы залить локальные данные в облако.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать семью'
      setFamily((f) => ({ ...f, syncing: false, error: message }))
    }
  }, [])

  const joinFamilyCloud = useCallback(async (code) => {
    if (!isFirebaseConfigured()) {
      setFamily((f) => ({
        ...f,
        error: 'Firebase не настроен. Проверь .env и консоль Firebase.',
      }))
      return
    }
    setFamily((f) => ({ ...f, syncing: true, error: null, message: null }))
    try {
      const payload = await joinFamily(code)
      lastRemoteAt.current = 0
      syncReadyRef.current = false
      setFamily({
        ...defaultFamily,
        code: payload.code,
        connected: true,
        syncReady: false,
        cloudHasProgress: payload.hasProgress,
        lastSyncedAt: payload.updatedAt,
        message: payload.hasProgress
          ? 'Код привязан. Нажми «Восстановить прогресс из облака», чтобы подтянуть данные.'
          : 'Код привязан, но в облаке пока пусто. Сначала сохрани прогресс на устройстве с данными.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось войти по коду'
      setFamily((f) => ({ ...f, syncing: false, error: message }))
    }
  }, [])

  const saveProgressToCloud = useCallback(async () => {
    const code = loadFamilyCode()
    if (!code) {
      setFamily((f) => ({ ...f, error: 'Сначала создай или введи код семьи' }))
      return
    }
    setFamily((f) => ({ ...f, syncing: true, error: null, message: null }))
    try {
      const updatedAt = await pushFamilyData(code)
      lastRemoteAt.current = updatedAt
      saveSyncReady(true)
      syncReadyRef.current = true
      setFamily((f) => ({
        ...f,
        syncing: false,
        connected: true,
        syncReady: true,
        cloudHasProgress: true,
        lastSyncedAt: updatedAt,
        message: 'Прогресс сохранён в облако. Дальше изменения будут писаться сами.',
        error: null,
      }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить прогресс'
      setFamily((f) => ({ ...f, syncing: false, error: message }))
    }
  }, [])

  const restoreProgressFromCloud = useCallback(async () => {
    const code = loadFamilyCode()
    if (!code) {
      setFamily((f) => ({ ...f, error: 'Сначала введи код семьи' }))
      return
    }
    setFamily((f) => ({ ...f, syncing: true, error: null, message: null }))
    try {
      const payload = await fetchFamilyPayload(code)
      if (!payload.hasProgress) {
        setFamily((f) => ({
          ...f,
          syncing: false,
          cloudHasProgress: false,
          error: 'В облаке пока нет прогресса. Сначала сохрани его на другом устройстве.',
        }))
        return
      }
      skipPushUntil.current = Date.now() + 1200
      lastRemoteAt.current = payload.updatedAt
      await replaceProgressFromCloud({
        version: payload.version,
        data: payload.data,
      })
      saveSyncReady(true)
      syncReadyRef.current = true
      setFamily((f) => ({
        ...f,
        syncing: false,
        connected: true,
        syncReady: true,
        cloudHasProgress: true,
        lastSyncedAt: payload.updatedAt,
        message: 'Прогресс восстановлен из облака. Дальше изменения будут писаться сами.',
        error: null,
      }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось восстановить прогресс'
      setFamily((f) => ({ ...f, syncing: false, error: message }))
    }
  }, [])

  const leaveFamilyCloud = useCallback(() => {
    leaveFamily()
    syncReadyRef.current = false
    lastRemoteAt.current = 0
    setFamily({ ...defaultFamily })
  }, [])

  return (
    <FamilySyncContext.Provider
      value={{
        family,
        createFamilyCloud,
        joinFamilyCloud,
        saveProgressToCloud,
        restoreProgressFromCloud,
        leaveFamilyCloud,
        firebaseReady: isFirebaseConfigured(),
      }}
    >
      {children}
    </FamilySyncContext.Provider>
  )
}

export function useFamilySync() {
  const ctx = useContext(FamilySyncContext)
  if (!ctx) {
    throw new Error('useFamilySync must be used within FamilySyncProvider')
  }
  return ctx
}
