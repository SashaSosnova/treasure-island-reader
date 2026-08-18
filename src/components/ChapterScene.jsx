import { getChapterScene } from '../data/chapterScenes'

/** Bump when regenerating public/scenes art so browsers don't keep old images. */
const SCENE_ART_VERSION = '1'

/** Одна главная сцена главы — манга-кадр + короткое «что было». */
export default function ChapterScene({ chapter }) {
  const scene = chapter?.scene || getChapterScene(chapter)
  if (!scene?.image) return null

  const base = import.meta.env.BASE_URL || './'
  const root = base.endsWith('/') ? base : `${base}/`
  const src = `${root}${scene.image.replace(/^\//, '')}?v=${SCENE_ART_VERSION}`

  return (
    <section className="chapter-scene" aria-label="Сцена главы">
      <div className="chapter-scene__frame">
        <img
          className="chapter-scene__img"
          src={src}
          alt={scene.alt || 'Главная сцена главы'}
        />
      </div>
      {scene.summary && (
        <div className="chapter-scene__caption">
          <h2 className="chapter-scene__title">Что было в главе</h2>
          <p className="chapter-scene__summary">{scene.summary}</p>
        </div>
      )}
    </section>
  )
}
