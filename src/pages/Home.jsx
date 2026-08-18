import { Link } from 'react-router-dom'
import { bookMeta, bookParts, chapters, getChapterLabel } from '../data/chapters'
import { getChapterIcon } from '../data/chapterIcons'
import { isChapterCompleted } from '../utils/storage'
import { isChapterUnlocked } from '../utils/progress'
import BalanceBadge from '../components/BalanceBadge'
import { useParentMode } from '../components/ParentMode'

export default function Home() {
  const parentMode = useParentMode()

  return (
    <div className="page home-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{bookMeta.author}</p>
          <h1>{bookMeta.title}</h1>
          <p className="subtitle">
            Перевод {bookMeta.translator} · {bookMeta.publisher}
          </p>
        </div>
        <BalanceBadge />
      </header>

      <div className="home-hero" aria-hidden="true">
        <img
          className="home-hero__img"
          src={`${import.meta.env.BASE_URL}island-hero.png`}
          alt=""
          width={800}
          height={450}
        />
        <div className="home-hero__shade">
          <p className="home-hero__tag">Читай · проходи тесты · зарабатывай</p>
        </div>
      </div>

      <section className="panel">
        <h2>Оглавление</h2>
        <p className="hint">
          {parentMode
            ? 'Режим родителя: все главы открыты — можно подготовить книгу. Для ребёнка снова будет порядок по тестам.'
            : 'Уровни по порядку: прочитал главу в книге → прошёл тест → открылась следующая.'}
        </p>
        <ol className="chapter-list">
          {bookParts.flatMap((part) => {
            const partChapters = chapters.filter(
              (chapter) => chapter.id >= part.from && chapter.id <= part.to,
            )
            if (partChapters.length === 0) return []

            return [
              <li key={`part-${part.id}`} className="part-heading" aria-hidden="false">
                {part.id < 7 ? `Часть ${part.id}. ${part.title}` : part.title}
              </li>,
              ...partChapters.map((chapter) => {
                const done = isChapterCompleted(chapter.id)
                const unlocked = isChapterUnlocked(chapter.id)
                const icon = getChapterIcon(chapter)

                if (!unlocked) {
                  return (
                    <li key={chapter.id}>
                      <div className="chapter-link chapter-link--locked" aria-disabled="true">
                        <span className="chapter-link__icon" aria-hidden="true">
                          {icon}
                        </span>
                        <span className="chapter-link__num">{getChapterLabel(chapter)}</span>
                        <span className="chapter-link__title">{chapter.title}</span>
                        <span className="chapter-link__badge">🔒</span>
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={chapter.id}>
                    <Link
                      className={`chapter-link ${done ? 'chapter-link--done' : 'chapter-link--unlocked'}`}
                      to={`/chapter/${chapter.id}`}
                    >
                      <span className="chapter-link__icon" aria-hidden="true">
                        {icon}
                      </span>
                      <span className="chapter-link__num">{getChapterLabel(chapter)}</span>
                      <span className="chapter-link__title">{chapter.title}</span>
                      {done && <span className="chapter-link__badge">✓</span>}
                    </Link>
                  </li>
                )
              }),
            ]
          })}
        </ol>
      </section>
    </div>
  )
}
