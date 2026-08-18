import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import {
  BOOK_COMPLETE_BONUS,
  CHAPTER_REWARD,
  MAX_WRONG_ANSWERS,
  PERFECT_BONUS,
  STREAK_MILESTONES,
} from '../data/meta'
import { YOUR_MOVE_REWARD } from '../data/yourMoves'
import { chapters } from '../data/chapters'
import { gifts } from '../data/gifts'
import {
  getBalance,
  getCollectedGifts,
  getCompletedChapters,
  getEarningsHistory,
  getPayoutHistory,
  getTotalPaid,
  isBookBonusClaimed,
  payout,
} from '../utils/storage'
import {
  estimateMaxBookEarnings,
  getStreakProgress,
} from '../utils/rewards'
import { notifyBalanceChanged } from '../components/BalanceBadge'
import GiftClaimCard from '../components/GiftClaimCard'
import { ParentOnly } from '../components/ParentMode'

function subscribe(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('treasure-island-balance', onStoreChange)
  window.addEventListener('treasure-island-gifts', onStoreChange)
  window.addEventListener('treasure-island-earnings', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('treasure-island-balance', onStoreChange)
    window.removeEventListener('treasure-island-gifts', onStoreChange)
    window.removeEventListener('treasure-island-earnings', onStoreChange)
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function streakDots(current, target) {
  const total = target || STREAK_MILESTONES[0].days
  return Array.from({ length: total }, (_, index) => index < current)
}

export default function RewardsPage() {
  const balance = useSyncExternalStore(subscribe, getBalance, () => 0)
  const collectedCount = useSyncExternalStore(
    subscribe,
    () => getCollectedGifts().length,
    () => 0,
  )
  const completedCount = useSyncExternalStore(
    subscribe,
    () => getCompletedChapters().length,
    () => 0,
  )
  const bookBonusClaimed = useSyncExternalStore(
    subscribe,
    isBookBonusClaimed,
    () => false,
  )
  // Строковые снимки: getStreakProgress/getEarningsHistory каждый раз отдают новый объект/массив,
  // из‑за этого useSyncExternalStore уходит в бесконечный ререндер и страница становится пустой.
  const streakKey = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(getStreakProgress()),
    () => '',
  )
  const earningsKey = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(getEarningsHistory()),
    () => '[]',
  )

  const streak = useMemo(() => {
    try {
      return streakKey ? JSON.parse(streakKey) : getStreakProgress()
    } catch {
      return getStreakProgress()
    }
  }, [streakKey])

  const earnings = useMemo(() => {
    try {
      const parsed = earningsKey ? JSON.parse(earningsKey) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [earningsKey])

  const [tab, setTab] = useState('piggy')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const history = useMemo(() => {
    const items = getPayoutHistory()
    return Array.isArray(items) ? items : []
  }, [historyVersion, balance])
  const totalPaid = useMemo(() => getTotalPaid(), [historyVersion, balance])
  const budget = useMemo(() => estimateMaxBookEarnings(), [])

  const nextMilestone =
    streak.nextMilestone ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1]
  const dots = streakDots(
    Math.min(streak.currentStreak || 0, nextMilestone?.days || 1),
    nextMilestone?.days || STREAK_MILESTONES[0].days,
  )

  function refreshAfterPayout(result) {
    notifyBalanceChanged()
    setHistoryVersion((value) => value + 1)
    setAmount('')
    setMessage(`Выплачено ${result.paid} ₽. Осталось ${result.balance} ₽.`)
  }

  function handlePayout(rawAmount) {
    setMessage(null)
    const result = payout(rawAmount)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    refreshAfterPayout(result)
  }

  function handleSubmit(event) {
    event.preventDefault()
    handlePayout(amount)
  }

  return (
    <div className="page rewards-page">
      <header className="page-header">
        <div>
          <Link className="back-link" to="/">
            ← Оглавление
          </Link>
          <h1>Награды</h1>
          <p className="hint">
            Копилка за главы и серии дней. Один подарок — когда книга дочитана.
          </p>
        </div>
      </header>

      <div className="rewards-tabs" role="tablist" aria-label="Разделы наград">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'piggy'}
          className={`rewards-tab ${tab === 'piggy' ? 'rewards-tab--active' : ''}`}
          onClick={() => setTab('piggy')}
        >
          Копилка
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'rules'}
          className={`rewards-tab ${tab === 'rules' ? 'rewards-tab--active' : ''}`}
          onClick={() => setTab('rules')}
        >
          Правила
        </button>
      </div>

      {tab === 'piggy' && (
        <>
          <section className="panel result-panel">
            <p className="eyebrow">Итоговый счёт</p>
            <p className="rewards-balance">{balance} ₽</p>
            <p className="rewards-gifts-summary">
              Главы: <strong>{completedCount}/{chapters.length}</strong>
              {' · '}
              Подарок: <strong>{collectedCount > 0 ? 'получен' : 'ещё впереди'}</strong>
            </p>
            {totalPaid > 0 && (
              <p className="hint">Уже выплачено всего: {totalPaid} ₽</p>
            )}
          </section>

          <section className="panel">
            <h2>Горячие цели</h2>
            <div className="goal-card">
              <div className="goal-card__head">
                <strong>
                  <span className="streak-fire" aria-hidden="true">
                    🔥
                  </span>{' '}
                  Серия дней
                </strong>
                <span>
                  {streak.currentStreak > 0
                    ? `${streak.currentStreak} дн.`
                    : 'ещё не начата'}
                </span>
              </div>
              <div className="streak-bar" aria-hidden="true">
                <div
                  className="streak-bar__fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (streak.currentStreak / nextMilestone.days) * 100,
                    )}%`,
                  }}
                />
              </div>
              <div className="streak-dots">
                {dots.map((filled, index) => (
                  <span
                    key={index}
                    className={`streak-dot ${filled ? 'streak-dot--on' : ''}`}
                  />
                ))}
              </div>
              <p className="hint">
                {streak.nextMilestone
                  ? `До бонуса +${streak.nextMilestone.bonus} ₽ — ${streak.nextMilestone.days} дней подряд`
                  : 'Все ступени текущей серии уже получены'}
                {streak.earnedToday ? ' · сегодня уже засчитан день' : ''}
              </p>
            </div>

            <div className="goal-card">
              <div className="goal-card__head">
                <strong>Вся книга</strong>
                <span>
                  {bookBonusClaimed
                    ? 'получено'
                    : `${completedCount}/${chapters.length}`}
                </span>
              </div>
              <p className="hint">
                {bookBonusClaimed
                  ? `Бонус +${BOOK_COMPLETE_BONUS} ₽ уже на счёте`
                  : `Пройди все главы — бонус +${BOOK_COMPLETE_BONUS} ₽`}
              </p>
            </div>
          </section>

          {earnings.length > 0 && (
            <section className="panel">
              <h2>Лента начислений</h2>
              <ul className="earnings-history">
                {earnings.slice(0, 20).map((item) => (
                  <li key={item.id}>
                    <div className="earnings-history__row">
                      <strong>{item.title}</strong>
                      <span>+{item.amount} ₽</span>
                    </div>
                    {item.kind === 'chapter' && item.perfect > 0 && (
                      <span className="hint">
                        база {item.base} + идеал {item.perfect}
                      </span>
                    )}
                    <span className="hint">{formatDate(item.date)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <h2>Подарок за книгу</h2>
            <p className="hint">Один приз в конце плавания.</p>

            <div className="gift-list">
              {gifts.map((gift) => (
                <GiftClaimCard key={gift.id} gift={gift} />
              ))}
            </div>

            <ParentOnly>
              <details className="parent-panel gift-parent">
                <summary>Для родителя: что готовить</summary>
                <p>
                  {gifts[0].parentWhere}
                  <br />
                  Идея: {gifts[0].rewardIdea}
                </p>
              </details>
            </ParentOnly>
          </section>

          <ParentOnly>
            <section className="panel">
              <h2>Выплатить</h2>
              <p className="hint">
                Ориентир максимума за книгу (если всё идеально): около {budget.total} ₽.
                Когда деньги отданы — спиши сумму со счёта.
              </p>

              <form className="payout-form" onSubmit={handleSubmit}>
                <label className="payout-field">
                  <span>Сумма, ₽</span>
                  <input
                    type="number"
                    min="1"
                    max={balance || undefined}
                    step="1"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={balance > 0 ? String(balance) : '0'}
                    disabled={balance <= 0}
                  />
                </label>

                <div className="button-row">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={balance <= 0}
                  >
                    Выплатить
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={balance <= 0}
                    onClick={() => handlePayout(balance)}
                  >
                    Выплатить всё
                  </button>
                </div>
              </form>

              {message && <p className="payout-message">{message}</p>}
            </section>

            {history.length > 0 && (
              <section className="panel">
                <h2>История выплат</h2>
                <ul className="payout-history">
                  {history.map((item) => (
                    <li key={item.id}>
                      <strong>−{item.amount} ₽</strong>
                      <span>{formatDate(item.date)}</span>
                      <span className="hint">осталось {item.balanceAfter} ₽</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </ParentOnly>
        </>
      )}

      {tab === 'rules' && (
        <section className="panel">
          <h2>Как зарабатываются монеты</h2>
          <p className="hint">
            Награда за всю главу целиком (не за каждый вопрос). Повторно за ту же главу
            монеты не дают. Больше {MAX_WRONG_ANSWERS} ошибок в тесте — 0 ₽.
          </p>

          <h3 className="rules-subtitle">Глава</h3>
          <ul className="rules-table">
            <li>
              <span>Обычная (3 вопроса)</span>
              <strong>{CHAPTER_REWARD.easy} ₽</strong>
            </li>
            <li>
              <span>Средняя (4 вопроса)</span>
              <strong>{CHAPTER_REWARD.medium} ₽</strong>
            </li>
            <li>
              <span>Сложная (5+ вопросов)</span>
              <strong>{CHAPTER_REWARD.hard} ₽</strong>
            </li>
            <li>
              <span>Финал книги</span>
              <strong>{CHAPTER_REWARD.finale} ₽</strong>
            </li>
            <li>
              <span>Идеал — 0 ошибок</span>
              <strong>+{PERFECT_BONUS} ₽</strong>
            </li>
          </ul>

          <h3 className="rules-subtitle">Серия дней подряд</h3>
          <p className="hint">
            День засчитывается, если пройден хотя бы один тест. Пропустил день — серия
            сбрасывается, ступени можно получить снова.
          </p>
          <ul className="rules-table">
            {STREAK_MILESTONES.map((item) => (
              <li key={item.days}>
                <span>{item.days} дней</span>
                <strong>+{item.bonus} ₽</strong>
              </li>
            ))}
          </ul>

          <h3 className="rules-subtitle">Твой ход</h3>
          <ul className="rules-table">
            <li>
              <span>Выбор без «неправильного» ответа</span>
              <strong>+{YOUR_MOVE_REWARD} ₽</strong>
            </li>
          </ul>

          <h3 className="rules-subtitle">Финал</h3>
          <ul className="rules-table">
            <li>
              <span>Все главы пройдены</span>
              <strong>+{BOOK_COMPLETE_BONUS} ₽</strong>
            </li>
            <li>
              <span>Подарок за книгу</span>
              <strong>один, в конце</strong>
            </li>
          </ul>
        </section>
      )}
    </div>
  )
}
