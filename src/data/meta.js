/** Тест провален, если ошибок больше этого числа (3+ ошибок = перечитать главу). */
export const MAX_WRONG_ANSWERS = 2

/** Базовая награда за главу по тиру сложности. Потолок книги — 4000 ₽. */
export const CHAPTER_REWARD = {
  easy: 60, // 3 вопроса
  medium: 75, // 4 вопроса
  hard: 90, // 5+ вопросов или rewardTier: 'hard'
  finale: 150,
}

/** Бонус за 0 ошибок в тесте главы. */
export const PERFECT_BONUS = 10

/**
 * Ступени серии дней подряд (календарные дни с ≥1 успешным тестом).
 * Бонус начисляется один раз за ступень в рамках текущей серии.
 */
export const STREAK_MILESTONES = [
  { days: 3, bonus: 50 },
  { days: 7, bonus: 100 },
  { days: 14, bonus: 150 },
]

/** Разовая награда за прохождение всех глав книги. */
export const BOOK_COMPLETE_BONUS = 300

export const TIER_LABELS = {
  easy: 'обычная',
  medium: 'средняя',
  hard: 'сложная',
  finale: 'финал',
}

export const bookMeta = {
  title: 'Остров сокровищ',
  author: 'Роберт Льюис Стивенсон',
  translator: 'Николай Чуковский',
  publisher: 'Эксмо',
}

/** Части романа в переводе Н. Чуковского. */
export const bookParts = [
  { id: 1, title: 'Старый пират', from: 1, to: 6 },
  { id: 2, title: 'Судовой повар', from: 7, to: 12 },
  { id: 3, title: 'Мои приключения на суше', from: 13, to: 15 },
  { id: 4, title: 'Частокол', from: 16, to: 21 },
  { id: 5, title: 'Мои приключения на море', from: 22, to: 27 },
  { id: 6, title: 'Капитан Сильвер', from: 28, to: 34 },
  { id: 7, title: 'Итог', from: 35, to: 35 },
]

export const markKinds = {
  funny: 'Смешное',
  thought: 'Подумать',
}

export function getBookPart(chapterId) {
  const id = Number(chapterId)
  return bookParts.find((part) => id >= part.from && id <= part.to) ?? null
}
