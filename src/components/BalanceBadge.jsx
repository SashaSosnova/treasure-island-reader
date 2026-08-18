import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { getBalance, getCollectedGifts } from '../utils/storage'

function subscribe(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('treasure-island-balance', onStoreChange)
  window.addEventListener('treasure-island-gifts', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('treasure-island-balance', onStoreChange)
    window.removeEventListener('treasure-island-gifts', onStoreChange)
  }
}

export function notifyBalanceChanged() {
  window.dispatchEvent(new Event('treasure-island-balance'))
}

export function notifyGiftsChanged() {
  window.dispatchEvent(new Event('treasure-island-gifts'))
}

export default function BalanceBadge() {
  const balance = useSyncExternalStore(subscribe, getBalance, () => 0)
  const collectedCount = useSyncExternalStore(
    subscribe,
    () => getCollectedGifts().length,
    () => 0,
  )

  return (
    <Link className="balance-badge" to="/rewards" aria-label="Открыть награды">
      <span className="balance-badge__label">Счёт</span>
      <strong className="balance-badge__value">{balance} ₽</strong>
      <span className="balance-badge__gifts">
        {collectedCount > 0 ? 'Подарок ✓' : 'Подарок в конце'}
      </span>
    </Link>
  )
}
