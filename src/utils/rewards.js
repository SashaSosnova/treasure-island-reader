import {
  BOOK_COMPLETE_BONUS,
  CHAPTER_REWARD,
  PERFECT_BONUS,
  STREAK_MILESTONES,
  TIER_LABELS,
} from '../data/meta'
import { chapters, getChapterLabel, getQuizQuestions } from '../data/chapters'
import { YOUR_MOVE_REWARD, getYourMove } from '../data/yourMoves'
import { canEarnQuizReward } from './progress'
import {
  addToBalance,
  appendEarnings,
  getCompletedChapters,
  getStreakState,
  isBookBonusClaimed,
  markBookBonusClaimed,
  markChapterCompleted,
  setStreakState,
} from './storage'

export function getChapterRewardTier(chapter) {
  if (!chapter) return 'easy'
  if (chapter.isFinale || chapter.rewardTier === 'finale') return 'finale'
  if (chapter.rewardTier === 'hard') return 'hard'
  if (chapter.rewardTier === 'medium') return 'medium'
  if (chapter.rewardTier === 'easy') return 'easy'

  const questionCount = getQuizQuestions(chapter).length
  if (questionCount >= 5) return 'hard'
  if (questionCount === 4) return 'medium'
  return 'easy'
}

export function getChapterBaseReward(chapter) {
  const tier = getChapterRewardTier(chapter)
  return CHAPTER_REWARD[tier] ?? CHAPTER_REWARD.easy
}

/**
 * @returns {{
 *   tier: string,
 *   tierLabel: string,
 *   base: number,
 *   perfect: number,
 *   total: number,
 * }}
 */
export function calculateChapterReward(chapter, wrongCount) {
  const tier = getChapterRewardTier(chapter)
  const base = CHAPTER_REWARD[tier] ?? CHAPTER_REWARD.easy
  const perfect = wrongCount === 0 ? PERFECT_BONUS : 0
  return {
    tier,
    tierLabel: TIER_LABELS[tier] ?? tier,
    base,
    perfect,
    total: base + perfect,
  }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(dateKey, deltaDays) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + deltaDays)
  return localDateKey(date)
}

/**
 * Обновляет серию дней. Возвращает новые бонусы (если достигнуты ступени).
 */
export function advanceStreakForToday() {
  const today = localDateKey()
  const state = getStreakState()
  let currentStreak = state.currentStreak || 0
  let claimedMilestones = Array.isArray(state.claimedMilestones)
    ? [...state.claimedMilestones]
    : []
  const lastEarnDate = state.lastEarnDate || null

  if (lastEarnDate === today) {
    return {
      currentStreak,
      lastEarnDate,
      claimedMilestones,
      newBonuses: [],
      alreadyCountedToday: true,
    }
  }

  if (lastEarnDate === shiftDateKey(today, -1)) {
    currentStreak += 1
  } else {
    currentStreak = 1
    claimedMilestones = []
  }

  const newBonuses = []
  for (const milestone of STREAK_MILESTONES) {
    if (
      currentStreak >= milestone.days &&
      !claimedMilestones.includes(milestone.days)
    ) {
      claimedMilestones.push(milestone.days)
      newBonuses.push({ days: milestone.days, bonus: milestone.bonus })
    }
  }

  const nextState = {
    currentStreak,
    lastEarnDate: today,
    claimedMilestones,
  }
  setStreakState(nextState)

  return {
    ...nextState,
    newBonuses,
    alreadyCountedToday: false,
  }
}

export function getStreakProgress() {
  const state = getStreakState()
  const today = localDateKey()
  let currentStreak = state.currentStreak || 0
  const lastEarnDate = state.lastEarnDate || null

  if (lastEarnDate && lastEarnDate !== today && lastEarnDate !== shiftDateKey(today, -1)) {
    currentStreak = 0
  }

  const nextMilestone =
    STREAK_MILESTONES.find((item) => item.days > currentStreak) ?? null

  return {
    currentStreak,
    lastEarnDate,
    claimedMilestones: state.claimedMilestones || [],
    nextMilestone,
    earnedToday: lastEarnDate === today,
  }
}

export function maybeClaimBookBonus() {
  if (isBookBonusClaimed()) return null
  const completed = getCompletedChapters()
  if (completed.length < chapters.length) return null
  markBookBonusClaimed()
  return BOOK_COMPLETE_BONUS
}

/**
 * Начисляет награду за успешный тест: глава + идеал + серия + финал книги.
 */
export function claimQuizReward(chapter, wrongCount) {
  if (!canEarnQuizReward(chapter.id)) {
    return { ok: false, total: 0, reason: 'not-eligible' }
  }

  markChapterCompleted(chapter.id)

  const chapterReward = calculateChapterReward(chapter, wrongCount)
  const streak = advanceStreakForToday()
  const bookBonus = maybeClaimBookBonus()

  const entries = []
  const now = new Date().toISOString()

  entries.push({
    id: `${Date.now()}-chapter-${chapter.id}`,
    kind: 'chapter',
    amount: chapterReward.total,
    base: chapterReward.base,
    perfect: chapterReward.perfect,
    chapterId: chapter.id,
    tier: chapterReward.tier,
    title: `${getChapterLabel(chapter)} (${chapterReward.tierLabel})`,
    date: now,
  })

  for (const bonus of streak.newBonuses) {
    entries.push({
      id: `${Date.now()}-streak-${bonus.days}`,
      kind: 'streak',
      amount: bonus.bonus,
      streakDays: bonus.days,
      title: `Серия ${bonus.days} ${daysWord(bonus.days)}`,
      date: now,
    })
  }

  if (bookBonus) {
    entries.push({
      id: `${Date.now()}-book`,
      kind: 'book',
      amount: bookBonus,
      title: 'Вся книга прочитана',
      date: now,
    })
  }

  const bonusTotal =
    streak.newBonuses.reduce((sum, item) => sum + item.bonus, 0) + (bookBonus || 0)
  const total = chapterReward.total + bonusTotal

  if (total > 0) {
    addToBalance(total)
    appendEarnings(entries)
  }

  return {
    ok: true,
    total,
    chapterReward,
    streakBonuses: streak.newBonuses,
    bookBonus: bookBonus || 0,
    streak: {
      currentStreak: streak.currentStreak,
      nextMilestone:
        STREAK_MILESTONES.find((item) => item.days > streak.currentStreak) ?? null,
    },
  }
}

function daysWord(days) {
  if (days % 10 === 1 && days % 100 !== 11) return 'день'
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
    return 'дня'
  }
  return 'дней'
}

/** Ориентир потолка, если всё сделано идеально (включая «Твой ход»). */
export function estimateMaxBookEarnings() {
  let chapterBases = 0
  let yourMoves = 0
  for (const chapter of chapters) {
    chapterBases += getChapterBaseReward(chapter)
    const move = getYourMove(chapter)
    if (move) {
      yourMoves += move.reward ?? YOUR_MOVE_REWARD
    }
  }
  const perfects = chapters.length * PERFECT_BONUS
  const streaks = STREAK_MILESTONES.reduce((sum, item) => sum + item.bonus, 0)
  return {
    chapterBases,
    perfects,
    streaks,
    yourMoves,
    book: BOOK_COMPLETE_BONUS,
    total: chapterBases + perfects + streaks + yourMoves + BOOK_COMPLETE_BONUS,
  }
}
