/**
 * Один подарок в конце книги — без звёздочек по главам.
 * Открывается, когда пройдена последняя глава романа (34).
 */
export const gifts = [
  {
    id: 'voyage-treasure',
    mark: '🎁',
    title: 'Сокровище капитана',
    hint: 'Дочитай книгу до конца — и получишь главный подарок за всё плавание.',
    chapterId: 34,
    chapterTitle: 'Последняя глава',
    parentWhere:
      'Один приз на всю книгу. Подготовь заранее и отдай после последней главы (и итогового теста).',
    rewardIdea: 'один заранее выбранный подарок за всю книгу',
  },
]

export const finaleReward = gifts[0]

export function getGiftById(id) {
  return gifts.find((gift) => gift.id === id) ?? null
}
