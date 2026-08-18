/** Хелперы «короткого» экрана главы для ребёнка. */

export function getChapterHook(chapter) {
  return chapter?.hook || chapter?.mainIdea || ''
}

/** Один самый вау-факт. */
export function getCoolFact(chapter) {
  if (chapter?.coolFact) return chapter.coolFact
  const facts = chapter?.facts ?? []
  return facts[0] ?? null
}

/** До 2 «слов-лута». */
export function getWordLoot(chapter, limit = 2) {
  if (chapter?.wordLoot?.length) return chapter.wordLoot.slice(0, limit)
  return (chapter?.vocabulary ?? []).slice(0, limit)
}

/** До 2 пометок «где искать приколы» для ребёнка. */
export function getFunMarks(chapter, limit = 2) {
  return (chapter?.markInBook ?? []).slice(0, limit)
}
