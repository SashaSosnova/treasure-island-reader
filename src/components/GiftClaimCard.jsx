import { useState, useSyncExternalStore } from 'react'
import {
  collectGift,
  getCollectedGifts,
  isChapterCompleted,
  isGiftCollected,
} from '../utils/storage'
import { notifyGiftsChanged } from './BalanceBadge'

function subscribe(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('treasure-island-gifts', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('treasure-island-gifts', onStoreChange)
  }
}

/** Подарок в конце книги: после последней главы романа. */
export function isGiftAvailable(gift) {
  return isChapterCompleted(gift.chapterId)
}

export default function GiftClaimCard({ gift, compact = false }) {
  useSyncExternalStore(subscribe, () => getCollectedGifts().length, () => 0)
  const [message, setMessage] = useState(null)

  const collected = isGiftCollected(gift.id)
  const available = isGiftAvailable(gift)

  function handleCollect() {
    setMessage(null)

    if (!available) {
      setMessage('Сначала дочитай книгу до последней главы.')
      return
    }

    const result = collectGift(gift.id)
    if (!result.ok) {
      setMessage(result.error)
      return
    }

    notifyGiftsChanged()
    setMessage(`Ура! Можно получить: ${gift.rewardIdea}.`)
  }

  if (!available && !collected) {
    return (
      <article className="gift-card gift-card--locked">
        <div className="gift-card__head">
          <span className="gift-card__mystery" aria-hidden="true">
            ?
          </span>
          <div>
            <h3>Подарок за книгу</h3>
            <p className="hint">Откроется, когда дочитаешь до конца.</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={`gift-card ${collected ? 'gift-card--collected' : ''}`}>
      <div className="gift-card__head">
        <span className="gift-card__mark">{collected ? gift.mark : '🎁'}</span>
        <div>
          <h3>{collected ? gift.title : 'Подарок за книгу'}</h3>
          {!compact && <p className="hint">{gift.hint}</p>}
        </div>
        {collected && <span className="gift-card__badge">✓</span>}
      </div>

      {collected ? (
        <p className="gift-card__reward gift-card__reward--reveal">
          Подарок: {gift.rewardIdea}
        </p>
      ) : (
        <>
          {compact && <p>{gift.hint}</p>}
          <button type="button" className="primary-button" onClick={handleCollect}>
            Забрать подарок
          </button>
        </>
      )}

      {message && <p className="payout-message">{message}</p>}
    </article>
  )
}
