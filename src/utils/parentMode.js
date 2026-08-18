const PIN_KEY = 'treasure-island-parent-pin'
const SESSION_KEY = 'treasure-island-parent-unlocked'
const EVENT = 'treasure-island-parent-mode'

/** PIN по умолчанию — смените в режиме родителя. */
export const DEFAULT_PARENT_PIN = '2580'

export function getParentPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PARENT_PIN
}

export function setParentPin(pin) {
  const next = String(pin || '').trim()
  if (next.length < 4) {
    return { ok: false, error: 'PIN не короче 4 символов' }
  }
  localStorage.setItem(PIN_KEY, next)
  return { ok: true }
}

export function isParentMode() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function unlockParentMode(pin) {
  if (String(pin).trim() !== getParentPin()) {
    return { ok: false, error: 'Неверный код' }
  }
  sessionStorage.setItem(SESSION_KEY, '1')
  window.dispatchEvent(new Event(EVENT))
  return { ok: true }
}

export function lockParentMode() {
  sessionStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeParentMode(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(EVENT, onStoreChange)
  }
}
