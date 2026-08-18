import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChapter, getChapterLabel } from '../data/chapters'
import { getChapterIcon } from '../data/chapterIcons'
import { gifts } from '../data/gifts'
import { isChapterCompleted } from '../utils/storage'
import {
  canEarnQuizReward,
  getPreviousChapter,
  isChapterUnlocked,
} from '../utils/progress'
import { getChapterHook, getCoolFact, getWordLoot } from '../utils/chapterDisplay'
import BalanceBadge from '../components/BalanceBadge'
import GiftClaimCard from '../components/GiftClaimCard'
import YourMoveCard from '../components/YourMoveCard'
import { ParentOnly, useParentMode } from '../components/ParentMode'

export default function ChapterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const parentMode = useParentMode()
  const chapter = getChapter(id)

  if (!chapter) {
    return (
      <div className="page">
        <p>Глава не найдена.</p>
        <Link to="/">← К оглавлению</Link>
      </div>
    )
  }

  const unlocked = isChapterUnlocked(chapter.id) || parentMode
  const completed = isChapterCompleted(chapter.id)
  const canEarn = canEarnQuizReward(chapter.id)
  const isFinale = Boolean(chapter.isFinale)
  const previous = getPreviousChapter(chapter.id)
  const finaleGift = isFinale ? gifts[0] : null
  const hook = getChapterHook(chapter)
  const coolFact = getCoolFact(chapter)
  const wordLoot = getWordLoot(chapter)
  const icon = getChapterIcon(chapter)

  if (!unlocked) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <Link className="back-link" to="/">
              ← Оглавление
            </Link>
            <h1>Глава пока закрыта</h1>
          </div>
          <BalanceBadge />
        </header>
        <section className="panel">
          <p>
            Сначала прочитай и пройди тест:{' '}
            <strong>
              {previous ? `${getChapterLabel(previous)}. ${previous.title}` : 'предыдущую главу'}
            </strong>
          </p>
          {previous && (
            <Link className="primary-button" to={`/chapter/${previous.id}`}>
              Перейти к предыдущей главе
            </Link>
          )}
        </section>
      </div>
    )
  }

  function openQuiz() {
    navigate(`/chapter/${chapter.id}/quiz`)
  }

  return (
    <div className="page chapter-page">
      <header className="page-header">
        <div>
          <Link className="back-link" to="/">
            ← Оглавление
          </Link>
          <p className="eyebrow">
            <span className="chapter-emoji" aria-hidden="true">
              {icon}
            </span>{' '}
            {getChapterLabel(chapter)}
          </p>
          <h1>{chapter.title}</h1>
        </div>
        <BalanceBadge />
      </header>

      {completed && (
        <section className="panel panel--muted">
          <p>
            <strong>Уровень пройден.</strong> Монеты за эту главу уже начислены.
          </p>
        </section>
      )}

      {chapter.previousChapterSummary && (
        <details className="panel panel--muted recap-details">
          <summary>Что было раньше</summary>
          <p>{chapter.previousChapterSummary}</p>
        </details>
      )}

      {hook && (
        <section className="panel chapter-hook">
          <p className="chapter-hook__text">{hook}</p>
        </section>
      )}

      {coolFact && (
        <section className="panel">
          <h2>Крутой факт</h2>
          <p>{coolFact}</p>
        </section>
      )}

      {wordLoot.length > 0 && (
        <section className="panel">
          <h2>Слова-лут</h2>
          <p className="hint">Крутые обороты из главы — можно отметить в книге.</p>
          <dl className="vocab-list">
            {wordLoot.map((item) => (
              <div className="vocab-item" key={item.word}>
                <dt>{item.word}</dt>
                <dd>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {finaleGift && (
        <section className="panel">
          <h2>Подарок за книгу</h2>
          <GiftClaimCard gift={finaleGift} compact />
        </section>
      )}

      {!completed && (
        <section className="panel quest-gate-panel">
          <h2>{isFinale ? 'Итоговый тест' : 'Тест'}</h2>
          <p className="hint">
            {isFinale
              ? 'Прочитай последнюю главу в книге — и проверь, что запомнилось по всему путешествию.'
              : 'Прочитай главу в книге, потом проходи тест. Вопросы — по деталям из текста.'}
          </p>
          <button type="button" className="primary-button" onClick={openQuiz}>
            {isFinale ? 'Начать итоговый тест' : 'Открыть тест'}
          </button>
        </section>
      )}

      <YourMoveCard chapter={chapter} />

      {chapter.vocabulary?.length > 0 && (
        <ParentOnly>
          <details className="panel parent-panel">
            <summary>Для родителя: слова из главы</summary>
            <ul className="highlight-list">
              {chapter.vocabulary.map((item) => (
                <li key={item.word}>
                  <strong>«{item.word}»</strong>
                </li>
              ))}
            </ul>
          </details>
        </ParentOnly>
      )}

      {finaleGift && (
        <ParentOnly>
          <details className="panel parent-panel">
            <summary>Для родителя: подарок за книгу</summary>
            <p>
              {finaleGift.parentWhere}
              <br />
              Идея: {finaleGift.rewardIdea}
            </p>
          </details>
        </ParentOnly>
      )}

      {completed && (
        <p className="hint locked-hint">Повторно пройти тест за монеты нельзя.</p>
      )}

      {!canEarn && !completed && (
        <p className="hint">Сначала нужно открыть эту главу по порядку.</p>
      )}
    </div>
  )
}
