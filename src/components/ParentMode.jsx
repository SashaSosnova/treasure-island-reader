import { useState, useSyncExternalStore } from 'react'
import {
  isParentMode,
  lockParentMode,
  setParentPin,
  subscribeParentMode,
  unlockParentMode,
} from '../utils/parentMode'
import { useFamilySync } from '../utils/cloudSync'
import { exportBackup, importBackup, resetProgress } from '../utils/storage'

export function useParentMode() {
  return useSyncExternalStore(subscribeParentMode, isParentMode, () => false)
}

/** Контент только для родителя — ребёнку не рендерится. */
export function ParentOnly({ children }) {
  const unlocked = useParentMode()
  if (!unlocked) return null
  return children
}

function FamilyCloudPanel() {
  const {
    family,
    firebaseReady,
    createFamilyCloud,
    joinFamilyCloud,
    saveProgressToCloud,
    restoreProgressFromCloud,
    leaveFamilyCloud,
  } = useFamilySync()
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    setBusy(true)
    try {
      await createFamilyCloud()
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    setBusy(true)
    try {
      await joinFamilyCloud(joinCode)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    const ok = window.confirm(
      'Записать прогресс этого устройства в облако? Данные в облаке по этому коду будут заменены.',
    )
    if (!ok) return
    setBusy(true)
    try {
      await saveProgressToCloud()
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore() {
    const ok = window.confirm(
      'Восстановить прогресс из облака? Локальные данные на этом устройстве будут заменены.',
    )
    if (!ok) return
    setBusy(true)
    try {
      await restoreProgressFromCloud()
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="parent-pin-change">
      <summary>Облако — код семьи</summary>
      {!firebaseReady ? (
        <p className="hint">Firebase ещё не настроен. Нужен файл `.env` с ключами.</p>
      ) : null}

      {family.code ? (
        <>
          <p className="hint">
            Код семьи: <strong className="family-code">{family.code}</strong>
          </p>
          <p className="hint">
            {family.syncReady
              ? 'Автосинк включён: новые изменения пишутся в облако сами.'
              : 'Код привязан. Сначала один раз сохрани или восстанови прогресс.'}
            {family.syncing ? ' …' : ''}
          </p>
          {family.cloudHasProgress ? (
            <p className="hint">В облаке уже есть сохранённый прогресс.</p>
          ) : (
            <p className="hint">В облаке пока пусто — нужна «Сохранить прогресс» на устройстве с данными.</p>
          )}
          {family.lastSyncedAt ? (
            <p className="hint">
              Облако:{' '}
              {new Date(family.lastSyncedAt).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          ) : null}

          <div className="button-row family-sync-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={busy || !firebaseReady}
              onClick={handleSave}
            >
              Сохранить прогресс
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={busy || !firebaseReady}
              onClick={handleRestore}
            >
              Восстановить из облака
            </button>
          </div>

          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={leaveFamilyCloud}
          >
            Отключить это устройство
          </button>
        </>
      ) : (
        <>
          <p className="hint">
            1) Создай код на телефоне с прогрессом → «Сохранить прогресс».
            2) На другом устройстве введи код → «Восстановить из облака».
          </p>
          <button
            type="button"
            className="secondary-button"
            disabled={busy || !firebaseReady}
            onClick={handleCreate}
          >
            Создать семью
          </button>
          <label className="family-join-field">
            <span className="hint">Уже есть код?</span>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Например AB12CD"
              maxLength={8}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={busy || !firebaseReady || joinCode.trim().length < 4}
            onClick={handleJoin}
          >
            Войти по коду
          </button>
        </>
      )}

      {family.message ? <p className="hint">{family.message}</p> : null}
      {family.error ? <p className="gate-error">{family.error}</p> : null}
    </details>
  )
}

export function ParentModeToggle() {
  const unlocked = useParentMode()
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [message, setMessage] = useState(null)

  function handleUnlock(event) {
    event.preventDefault()
    setMessage(null)
    const result = unlockParentMode(pin)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setPin('')
    setOpen(false)
  }

  function handleChangePin(event) {
    event.preventDefault()
    setMessage(null)
    const result = setParentPin(newPin)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setMessage('PIN обновлён')
    setNewPin('')
  }

  function handleExportBackup() {
    const backup = exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `treasure-island-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Бэкап скачан. Сохраните файл в надёжном месте.')
  }

  function handleImportBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result))
        const result = importBackup(backup)
        setMessage(result.ok ? 'Прогресс восстановлен из бэкапа.' : result.error)
      } catch {
        setMessage('Не удалось прочитать файл бэкапа')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  async function handleResetProgress() {
    const ok = window.confirm(
      'Сбросить весь прогресс? Монеты, пройденные главы, подарки и выплаты обнулятся. PIN родителя сохранится.',
    )
    if (!ok) return
    await resetProgress()
    setMessage('Прогресс сброшен. Можно начинать с чистого листа.')
  }

  if (unlocked) {
    return (
      <div className="parent-mode-bar parent-mode-bar--on">
        <div className="parent-mode-bar__row">
          <span>Режим родителя: все главы открыты</span>
          <button type="button" className="text-button" onClick={() => lockParentMode()}>
            Выйти
          </button>
        </div>
        <details className="parent-pin-change">
          <summary>Настройки, облако и бэкап</summary>
          <details className="parent-pin-change">
            <summary>Сменить PIN</summary>
            <form onSubmit={handleChangePin}>
              <input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
                placeholder="Новый PIN"
                autoComplete="new-password"
              />
              <button type="submit" className="secondary-button">
                Сохранить
              </button>
            </form>
          </details>
          <FamilyCloudPanel />
          <details className="parent-pin-change">
            <summary>Бэкап и сброс</summary>
            <p className="hint">
              Локальный файл на всякий случай. В облаке прогресс синкается по коду семьи.
            </p>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={handleExportBackup}>
                Скачать бэкап
              </button>
              <label className="secondary-button" style={{ cursor: 'pointer' }}>
                Восстановить
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={handleImportBackup}
                />
              </label>
              <button type="button" className="secondary-button" onClick={handleResetProgress}>
                Сбросить прогресс
              </button>
            </div>
          </details>
        </details>
        {message && <p className="hint">{message}</p>}
      </div>
    )
  }

  return (
    <div className="parent-mode-bar">
      {!open ? (
        <button
          type="button"
          className="parent-secret-entry"
          onClick={() => setOpen(true)}
          aria-label="Вход для родителя"
          title="Родителям"
        >
          ···
        </button>
      ) : (
        <form className="parent-unlock-form" onSubmit={handleUnlock}>
          <p className="hint">Код родителя</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            autoComplete="off"
            autoFocus
          />
          <div className="button-row">
            <button type="submit" className="secondary-button">
              Войти
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setOpen(false)
                setPin('')
                setMessage(null)
              }}
            >
              Отмена
            </button>
          </div>
          {message && <p className="gate-error">{message}</p>}
        </form>
      )}
    </div>
  )
}
