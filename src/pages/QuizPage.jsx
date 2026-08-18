import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import {
  getChapter,
  getChapterLabel,
  getQuestionExplanation,
  getQuizQuestions,
  MAX_WRONG_ANSWERS,
} from '../data/chapters'
import { isChapterCompleted } from '../utils/storage'
import {
  getPreviousChapter,
  isChapterUnlocked,
} from '../utils/progress'
import { claimQuizReward } from '../utils/rewards'
import { notifyBalanceChanged } from '../components/BalanceBadge'
import BalanceBadge from '../components/BalanceBadge'

export default function QuizPage() {
  const { id } = useParams()
  const chapter = getChapter(id)
  const questions = useMemo(
    () => (chapter ? getQuizQuestions(chapter) : []),
    [chapter],
  )
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([]) // boolean per answered question
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)
  const [rewardResult, setRewardResult] = useState(null)
  // Фиксируем «уже пройдено» только на входе: после claim localStorage сразу completed,
  // и свежий isChapterCompleted() иначе перекрывает экран с расшифровкой монет.
  const [alreadyDoneOnEntry] = useState(() =>
    id != null ? isChapterCompleted(id) : false,
  )
  const advanceTimerRef = useRef(null)
  const finishingRef = useRef(false)

  const question = questions[current] ?? null
  const isFinale = Boolean(chapter?.isFinale)
  const unlocked = chapter ? isChapterUnlocked(chapter.id) : false
  const previous = chapter ? getPreviousChapter(chapter.id) : null
  const answered = selected !== null
  const answeredCorrectly = answered && selected === question?.correctIndex
  const correctCount = results.filter(Boolean).length
  const wrongCount = results.length - correctCount
  const showResultScreen = finished || finishingRef.current

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
      }
    }
  }, [])

  if (!chapter || questions.length === 0) {
    return (
      <div className="page">
        <p>Тест не найден.</p>
        <Link to="/">← К оглавлению</Link>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Тест закрыт</h1>
            <p className="hint">
              Сначала пройди предыдущую главу
              {previous ? `: ${getChapterLabel(previous)}` : ''}.
            </p>
          </div>
          <BalanceBadge />
        </header>
        <Link className="primary-button" to="/">
          К оглавлению
        </Link>
      </div>
    )
  }

  if (alreadyDoneOnEntry && !showResultScreen) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">{getChapterLabel(chapter)}</p>
            <h1>Тест уже пройден</h1>
          </div>
          <BalanceBadge />
        </header>
        <section className="panel">
          <p>Монеты за эту главу уже были начислены. Повторно заработать здесь нельзя.</p>
        </section>
        <div className="button-row">
          <Link className="primary-button" to="/">
            К оглавлению
          </Link>
          <Link className="secondary-button" to={`/chapter/${chapter.id}`}>
            К главе
          </Link>
        </div>
      </div>
    )
  }

  function finishWithResults(finalResults) {
    const finalWrong = finalResults.length - finalResults.filter(Boolean).length
    const didPass = finalWrong <= MAX_WRONG_ANSWERS

    finishingRef.current = true
    flushSync(() => {
      setPassed(didPass)
      setFinished(true)
      setResults(finalResults)
    })

    if (!didPass) {
      setRewardResult(null)
      return
    }

    const claimed = claimQuizReward(chapter, finalWrong)
    if (claimed.ok) {
      setRewardResult(claimed)
      queueMicrotask(() => notifyBalanceChanged())
      return
    }

    setRewardResult({ ok: false, total: 0 })
  }

  function goToNext(nextResults) {
    setResults(nextResults)
    const isLast = nextResults.length >= questions.length
    if (isLast) {
      finishWithResults(nextResults)
      return
    }
    setCurrent((value) => value + 1)
    setSelected(null)
  }

  function handleAnswer(optionIndex) {
    if (selected !== null) return
    setSelected(optionIndex)

    const isCorrect = optionIndex === question.correctIndex
    if (!isCorrect) return

    const nextResults = [...results, true]
    advanceTimerRef.current = setTimeout(() => {
      goToNext(nextResults)
    }, 700)
  }

  function handleContinue() {
    if (selected === null) return
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const isCorrect = selected === question.correctIndex
    goToNext([...results, isCorrect])
  }

  if (showResultScreen) {
    if (!passed) {
      return (
        <div className="page quiz-page">
          <header className="page-header">
            <div>
              <p className="eyebrow">{getChapterLabel(chapter)}</p>
              <h1>Нужно перечитать главу</h1>
            </div>
            <BalanceBadge />
          </header>

          <section className="panel result-panel">
            <p>
              Ошибок: <strong>{wrongCount}</strong> (можно не больше {MAX_WRONG_ANSWERS})
            </p>
            <p>
              Верных ответов:{' '}
              <strong>
                {correctCount} из {questions.length}
              </strong>
            </p>
            <p className="result-earned result-earned--fail">+0 ₽</p>
            <p className="hint">
              Монеты не начислены. Перечитай главу в книге и попробуй тест ещё раз.
            </p>
          </section>

          <div className="button-row">
            <Link className="primary-button" to={`/chapter/${chapter.id}`}>
              Перечитать главу
            </Link>
            <Link className="secondary-button" to="/">
              К оглавлению
            </Link>
          </div>
        </div>
      )
    }

    const chapterReward = rewardResult?.chapterReward
    const streakBonuses = rewardResult?.streakBonuses ?? []
    const bookBonus = rewardResult?.bookBonus ?? 0
    const nextMilestone = rewardResult?.streak?.nextMilestone
    const currentStreak = rewardResult?.streak?.currentStreak ?? 0

    return (
      <div className="page quiz-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">{getChapterLabel(chapter)}</p>
            <h1>{isFinale ? 'Итоговый тест пройден!' : 'Тест пройден!'}</h1>
          </div>
          <BalanceBadge />
        </header>

        <section className="panel result-panel">
          <p>
            Правильных ответов:{' '}
            <strong>
              {correctCount} из {questions.length}
            </strong>
          </p>
          {wrongCount > 0 && (
            <p className="hint">Ошибок: {wrongCount} (это ещё нормально)</p>
          )}

          {chapterReward && (
            <ul className="reward-breakdown reward-breakdown--animate">
              <li style={{ '--i': 0 }}>
                <span>Глава ({chapterReward.tierLabel})</span>
                <strong>+{chapterReward.base} ₽</strong>
              </li>
              {chapterReward.perfect > 0 && (
                <li style={{ '--i': 1 }}>
                  <span>Идеал без ошибок</span>
                  <strong>+{chapterReward.perfect} ₽</strong>
                </li>
              )}
              {streakBonuses.map((bonus, index) => (
                <li key={bonus.days} style={{ '--i': 2 + index }}>
                  <span>Серия {bonus.days} дн.</span>
                  <strong>+{bonus.bonus} ₽</strong>
                </li>
              ))}
              {bookBonus > 0 && (
                <li style={{ '--i': 2 + streakBonuses.length }}>
                  <span>Вся книга</span>
                  <strong>+{bookBonus} ₽</strong>
                </li>
              )}
            </ul>
          )}

          <p className="result-earned coin-pop">
            Заработано сейчас:{' '}
            <strong>+{rewardResult?.total ?? 0} ₽</strong>
          </p>

          {nextMilestone ? (
            <p className="hint streak-hint">
              <span className="streak-fire" aria-hidden="true">
                🔥
              </span>{' '}
              Серия: {currentStreak}/{nextMilestone.days}{' '}
              {currentStreak >= nextMilestone.days - 1
                ? `— ещё день до бонуса +${nextMilestone.bonus} ₽`
                : `— до бонуса +${nextMilestone.bonus} ₽`}
            </p>
          ) : (
            currentStreak > 0 && (
              <p className="hint streak-hint">
                <span className="streak-fire" aria-hidden="true">
                  🔥
                </span>{' '}
                Серия {currentStreak} дн. — все ступени этой серии уже получены!
              </p>
            )
          )}

          <p className="hint">Эту главу больше нельзя пройти за монеты.</p>
          {isFinale && (
            <p className="hint">Ты прошёл большой тест по всей книге — отличная работа!</p>
          )}
        </section>

        <div className="button-row">
          <Link className="primary-button" to="/">
            К оглавлению
          </Link>
          <Link className="secondary-button" to={`/chapter/${chapter.id}`}>
            {isFinale ? 'Назад к итогу' : 'К фактам главы'}
          </Link>
          <Link className="secondary-button" to="/rewards">
            К наградам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page quiz-page">
      <header className="page-header">
        <div>
          <Link className="back-link" to={`/chapter/${chapter.id}`}>
            ← Назад
          </Link>
          <p className="eyebrow">
            Вопрос {current + 1} из {questions.length}
          </p>
          <h1>{isFinale ? 'Итоговый тест' : 'Тест'}</h1>
          <p className="hint">Можно ошибиться не больше {MAX_WRONG_ANSWERS} раз.</p>
        </div>
        <BalanceBadge />
      </header>

      <section className="panel">
        <h2 className="question-text">{question.question}</h2>
        <div className="options">
          {question.options.map((option, index) => {
            let className = 'option-button'
            if (answered) {
              if (index === question.correctIndex) className += ' option-button--correct'
              else if (index === selected) className += ' option-button--wrong'
            }

            return (
              <button
                key={option}
                type="button"
                className={className}
                onClick={() => handleAnswer(index)}
                disabled={answered}
              >
                {option}
              </button>
            )
          })}
        </div>

        {answered && (
          <div
            className={`answer-feedback ${
              answeredCorrectly ? 'answer-feedback--ok' : 'answer-feedback--bad'
            }`}
          >
            <p className="answer-feedback__title">
              {answeredCorrectly ? 'Верно!' : 'Неверно'}
            </p>
            {!answeredCorrectly && (
              <>
                <p className="answer-feedback__text">
                  {getQuestionExplanation(question)}
                </p>
                <button type="button" className="primary-button" onClick={handleContinue}>
                  {current >= questions.length - 1 ? 'Завершить' : 'Дальше'}
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
