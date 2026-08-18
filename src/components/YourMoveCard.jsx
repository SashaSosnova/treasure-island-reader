import { useState, useSyncExternalStore } from 'react'
import { YOUR_MOVE_REWARD, getYourMove } from '../data/yourMoves'
import {
  addToBalance,
  appendEarnings,
  getYourMoveAnswer,
  getYourMoveAnswers,
  saveYourMoveAnswer,
} from '../utils/storage'
import { notifyBalanceChanged } from './BalanceBadge'

function subscribe(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('treasure-island-your-move', onStoreChange)
  window.addEventListener('treasure-island-balance', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('treasure-island-your-move', onStoreChange)
    window.removeEventListener('treasure-island-balance', onStoreChange)
  }
}

export default function YourMoveCard({ chapter }) {
  const yourMove = getYourMove(chapter)
  useSyncExternalStore(
    subscribe,
    () => JSON.stringify(getYourMoveAnswers()),
    () => '{}',
  )
  const savedIndex = getYourMoveAnswer(chapter.id)
  const [picked, setPicked] = useState(savedIndex)
  const [justEarned, setJustEarned] = useState(null)

  if (!yourMove) return null

  const reward = yourMove.reward ?? YOUR_MOVE_REWARD
  const chosen =
    picked != null && yourMove.choices[picked] ? yourMove.choices[picked] : null

  function handlePick(index) {
    if (getYourMoveAnswer(chapter.id) != null) return

    const result = saveYourMoveAnswer(chapter.id, index)
    setPicked(index)

    if (!result.ok) return

    if (reward > 0) {
      addToBalance(reward)
      appendEarnings([
        {
          id: `${Date.now()}-your-move-${chapter.id}`,
          kind: 'your-move',
          amount: reward,
          chapterId: chapter.id,
          title: `Твой ход · ${chapter.title}`,
          date: new Date().toISOString(),
        },
      ])
      notifyBalanceChanged()
      setJustEarned(reward)
    }
  }

  return (
    <section className="panel your-move-panel">
      <h2>Твой ход</h2>
      <p className="hint">Нет неправильного ответа — выбери, как бы поступил ты.</p>
      <p className="your-move-prompt">{yourMove.prompt}</p>

      {!chosen && (
        <div className="your-move-choices">
          {yourMove.choices.map((choice, index) => (
            <button
              key={choice.label}
              type="button"
              className="your-move-choice"
              onClick={() => handlePick(index)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

      {chosen && (
        <div className="your-move-reveal">
          <p className="your-move-reveal__pick">
            Ты выбрал: <strong>{chosen.label}</strong>
          </p>
          <p>{chosen.reveal}</p>
          {justEarned != null && (
            <p className="coin-pop" aria-live="polite">
              +{justEarned} ₽
            </p>
          )}
          {justEarned == null && savedIndex != null && reward > 0 && (
            <p className="hint">Бонус за этот выбор уже был начислен.</p>
          )}
        </div>
      )}
    </section>
  )
}
