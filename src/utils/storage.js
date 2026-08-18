import { Preferences } from '@capacitor/preferences'

const BALANCE_KEY = 'treasure-island-balance'
const COMPLETED_KEY = 'treasure-island-completed'
const REFLECTION_KEY = 'treasure-island-reflection'
const PAYOUTS_KEY = 'treasure-island-payouts'
const GIFTS_KEY = 'treasure-island-gifts'
const EARNINGS_KEY = 'treasure-island-earnings'
const STREAK_KEY = 'treasure-island-streak'
const BOOK_BONUS_KEY = 'treasure-island-book-bonus'
const YOUR_MOVE_KEY = 'treasure-island-your-move'
const BACKUP_VERSION = 1

const ALL_KEYS = [
  BALANCE_KEY,
  COMPLETED_KEY,
  REFLECTION_KEY,
  PAYOUTS_KEY,
  GIFTS_KEY,
  EARNINGS_KEY,
  STREAK_KEY,
  BOOK_BONUS_KEY,
  YOUR_MOVE_KEY,
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null || raw === '') return fallback
    const parsed = JSON.parse(raw)
    if (parsed == null) return fallback
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    if (
      fallback &&
      typeof fallback === 'object' &&
      !Array.isArray(fallback) &&
      (typeof parsed !== 'object' || Array.isArray(parsed))
    ) {
      return fallback
    }
    return parsed
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, value)
}

/** Дублируем в Capacitor Preferences — надёжнее при обновлении APK. */
async function mirrorToNative(key, value) {
  try {
    await Preferences.set({ key, value })
  } catch {
    // Браузер без Capacitor — ок
  }
}

function notifyProgressChanged() {
  window.dispatchEvent(new Event('treasure-island-progress'))
}

function persist(key, value) {
  writeLocal(key, value)
  void mirrorToNative(key, value)
  notifyProgressChanged()
}

export function getBalance() {
  const value = Number(localStorage.getItem(BALANCE_KEY))
  return Number.isFinite(value) ? value : 0
}

export function setBalance(amount) {
  const next = Math.max(0, Number(amount) || 0)
  persist(BALANCE_KEY, String(next))
  return next
}

export function addToBalance(amount) {
  return setBalance(getBalance() + amount)
}

export function getPayoutHistory() {
  return readJson(PAYOUTS_KEY, [])
}

export function getTotalPaid() {
  return getPayoutHistory().reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Уменьшает счёт на сумму выплаты и пишет запись в историю.
 * @returns {{ ok: true, paid: number, balance: number } | { ok: false, error: string }}
 */
export function payout(amount) {
  const balance = getBalance()
  const paid = Math.floor(Number(amount))

  if (!Number.isFinite(paid) || paid <= 0) {
    return { ok: false, error: 'Введи сумму больше 0' }
  }
  if (paid > balance) {
    return { ok: false, error: 'Нельзя выплатить больше, чем на счёте' }
  }

  const nextBalance = setBalance(balance - paid)
  const history = getPayoutHistory()
  history.unshift({
    id: Date.now(),
    amount: paid,
    date: new Date().toISOString(),
    balanceAfter: nextBalance,
  })
  persist(PAYOUTS_KEY, JSON.stringify(history))

  return { ok: true, paid, balance: nextBalance }
}

export function getCollectedGifts() {
  return readJson(GIFTS_KEY, [])
}

export function isGiftCollected(giftId) {
  return getCollectedGifts().includes(giftId)
}

export function collectGift(giftId) {
  const collected = getCollectedGifts()
  if (collected.includes(giftId)) {
    return { ok: false, error: 'Этот подарок уже собран' }
  }
  collected.push(giftId)
  persist(GIFTS_KEY, JSON.stringify(collected))
  return { ok: true, collected }
}

export function getCompletedChapters() {
  return readJson(COMPLETED_KEY, [])
}

export function isChapterCompleted(chapterId) {
  return getCompletedChapters().includes(Number(chapterId))
}

export function markChapterCompleted(chapterId) {
  const id = Number(chapterId)
  const completed = getCompletedChapters()
  if (!completed.includes(id)) {
    completed.push(id)
    persist(COMPLETED_KEY, JSON.stringify(completed))
  }
  return completed
}

export function getEarningsHistory() {
  return readJson(EARNINGS_KEY, [])
}

export function appendEarnings(entries) {
  if (!entries?.length) return getEarningsHistory()
  const history = getEarningsHistory()
  history.unshift(...entries)
  persist(EARNINGS_KEY, JSON.stringify(history))
  window.dispatchEvent(new Event('treasure-island-earnings'))
  return history
}

export function getStreakState() {
  return readJson(STREAK_KEY, {
    currentStreak: 0,
    lastEarnDate: null,
    claimedMilestones: [],
  })
}

export function setStreakState(state) {
  persist(STREAK_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event('treasure-island-earnings'))
  return state
}

export function isBookBonusClaimed() {
  return localStorage.getItem(BOOK_BONUS_KEY) === '1'
}

export function markBookBonusClaimed() {
  persist(BOOK_BONUS_KEY, '1')
  return true
}

export function getYourMoveAnswers() {
  return readJson(YOUR_MOVE_KEY, {})
}

export function getYourMoveAnswer(chapterId) {
  const answers = getYourMoveAnswers()
  const value = answers[String(chapterId)]
  return value == null ? null : value
}

/** Сохраняет выбор. Возвращает true, если это первый ответ по главе. */
export function saveYourMoveAnswer(chapterId, choiceIndex) {
  const id = String(chapterId)
  const answers = getYourMoveAnswers()
  if (answers[id] != null) {
    return { ok: false, already: true }
  }
  answers[id] = Number(choiceIndex)
  persist(YOUR_MOVE_KEY, JSON.stringify(answers))
  window.dispatchEvent(new Event('treasure-island-your-move'))
  return { ok: true, already: false }
}

export function getReflectionAnswers() {
  return readJson(REFLECTION_KEY, {})
}

export function saveReflectionAnswer(index, value) {
  const answers = getReflectionAnswers()
  answers[index] = value
  persist(REFLECTION_KEY, JSON.stringify(answers))
  return answers
}

export function exportBackup() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      [BALANCE_KEY]: localStorage.getItem(BALANCE_KEY),
      [COMPLETED_KEY]: localStorage.getItem(COMPLETED_KEY),
      [REFLECTION_KEY]: localStorage.getItem(REFLECTION_KEY),
      [PAYOUTS_KEY]: localStorage.getItem(PAYOUTS_KEY),
      [GIFTS_KEY]: localStorage.getItem(GIFTS_KEY),
      [EARNINGS_KEY]: localStorage.getItem(EARNINGS_KEY),
      [STREAK_KEY]: localStorage.getItem(STREAK_KEY),
      [BOOK_BONUS_KEY]: localStorage.getItem(BOOK_BONUS_KEY),
      [YOUR_MOVE_KEY]: localStorage.getItem(YOUR_MOVE_KEY),
    },
  }
}

export function importBackup(backup) {
  if (!backup || typeof backup !== 'object' || !backup.data) {
    return { ok: false, error: 'Неверный файл бэкапа' }
  }

  for (const key of ALL_KEYS) {
    const value = backup.data[key]
    if (value == null) continue
    persist(key, String(value))
  }

  window.dispatchEvent(new Event('treasure-island-balance'))
  window.dispatchEvent(new Event('treasure-island-gifts'))
  window.dispatchEvent(new Event('treasure-island-earnings'))
  return { ok: true }
}

/** Полная замена прогресса из облака (join / remote update). */
export async function replaceProgressFromCloud(backup) {
  if (!backup || typeof backup !== 'object' || !backup.data) {
    return { ok: false, error: 'Неверный ответ облака' }
  }

  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    try {
      await Preferences.remove({ key })
    } catch {
      // Web / без плагина
    }
  }

  for (const key of ALL_KEYS) {
    const value = backup.data[key]
    if (value == null || value === '') continue
    persist(key, String(value))
  }

  window.dispatchEvent(new Event('treasure-island-balance'))
  window.dispatchEvent(new Event('treasure-island-gifts'))
  window.dispatchEvent(new Event('treasure-island-earnings'))
  window.dispatchEvent(new Event('treasure-island-your-move'))
  return { ok: true }
}

/** Полный сброс прогресса ребёнка. PIN родителя не трогаем. */
export async function resetProgress() {
  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    try {
      await Preferences.remove({ key })
    } catch {
      // Web / без плагина
    }
  }

  try {
    sessionStorage.removeItem('treasure-island-quiz-access')
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event('treasure-island-balance'))
  window.dispatchEvent(new Event('treasure-island-gifts'))
  window.dispatchEvent(new Event('treasure-island-earnings'))
  notifyProgressChanged()
  return { ok: true }
}

/**
 * При старте: если localStorage пуст, а в Preferences есть данные — восстанавливаем.
 * Если localStorage есть — копируем в Preferences (на случай первого запуска на устройстве).
 */
export async function hydrateStorage() {
  try {
    const hydrate = (async () => {
      for (const key of ALL_KEYS) {
        const localValue = localStorage.getItem(key)
        const native = await Preferences.get({ key })

        if ((localValue == null || localValue === '') && native.value) {
          writeLocal(key, native.value)
        } else if (localValue != null && localValue !== '') {
          await Preferences.set({ key, value: localValue })
        }
      }
    })()

    await Promise.race([
      hydrate,
      new Promise((resolve) => {
        setTimeout(resolve, 800)
      }),
    ])
  } catch {
    // Web / без плагина / таймаут — ок, стартуем с localStorage
  }

  window.dispatchEvent(new Event('treasure-island-balance'))
  window.dispatchEvent(new Event('treasure-island-gifts'))
  window.dispatchEvent(new Event('treasure-island-earnings'))
}
