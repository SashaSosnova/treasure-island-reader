import { useState, useSyncExternalStore } from 'react'
import { YOUR_MOVE_REWARD, getYourMove, isMakeMove } from '../data/yourMoves'
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
  const isMake = isMakeMove(yourMove)
  const done = picked != null
  const chosen =
    !isMake && done && yourMove.choices?.[picked] ? yourMove.choices[picked] : null

  function claimReward(index, titleKind) {
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
          title: `${titleKind} · ${chapter.title}`,
          date: new Date().toISOString(),
        },
      ])
      notifyBalanceChanged()
      setJustEarned(reward)
    }
  }

  function handlePick(index) {
    claimReward(index, 'Твой ход')
  }

  function handleMakeDone() {
    claimReward(0, 'Сделай')
  }

  const alreadyHint =
    justEarned == null && savedIndex != null && reward > 0 ? (
      <p className="hint">Бонус за это задание уже был начислен.</p>
    ) : null

  const coinPop =
    justEarned != null ? (
      <p className="coin-pop" aria-live="polite">
        +{justEarned} ₽
      </p>
    ) : null

  if (isMake) {
    return (
      <section className="panel your-move-panel">
        <h2>Сделай</h2>
        <p className="hint">Нарисуй или вырежи — потом покажи взрослому и нажми «Готово».</p>
        <p className="your-move-prompt">{yourMove.prompt}</p>
        {yourMove.how && <p className="your-move-how">{yourMove.how}</p>}

        {!done && (
          <button type="button" className="primary-button" onClick={handleMakeDone}>
            Готово
          </button>
        )}

        {done && (
          <div className="your-move-reveal">
            <p className="your-move-reveal__pick">
              <strong>Сделано.</strong>
            </p>
            <p>{yourMove.reveal}</p>
            {coinPop}
            {alreadyHint}
          </div>
        )}
      </section>
    )
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
          {coinPop}
          {alreadyHint}
        </div>
      )}
    </section>
  )
}
