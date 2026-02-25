import type { SRSState } from '@/types'

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewResult {
  new_state: SRSState
  xp_earned: number
}

const DEFAULT_EASE_FACTOR = 2.5
const MIN_EASE_FACTOR = 1.3
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const XP_BY_RATING: Record<Rating, number> = {
  again: 0,
  hard: 5,
  good: 10,
  easy: 15
}

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map((part) => Number(part))
  return new Date(year, month - 1, day)
}

function formatISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDaysISO(isoDate: string, days: number): string {
  const baseDate = parseISODate(isoDate)
  const msToAdd = Math.trunc(days) * ONE_DAY_MS
  return formatISODate(new Date(baseDate.getTime() + msToAdd))
}

function clampEaseFactor(easeFactor: number): number {
  return Math.max(MIN_EASE_FACTOR, easeFactor)
}

// Creates initial SRS state for a new card (first time ever shown)
export function createInitialSRSState(card_id: string): SRSState {
  return {
    card_id,
    interval: 1,
    ease_factor: DEFAULT_EASE_FACTOR,
    due_date: getTodayISO(),
    reps: 0
  }
}

// Applies a rating to an existing SRS state and returns the new state
// Implements SM-2 with EXACT parameters from SPEC.md:
// Again: interval=1, ease_factor -= 0.2
// Hard: interval = max(1, interval × 1.2), ease_factor -= 0.15
// Good: interval = interval × ease_factor
// Easy: interval = interval × ease_factor × 1.3, ease_factor += 0.15
// ease_factor minimum floor: 1.3 (never go below this)
// Increment reps by 1 on every rating except Again (reset reps to 0)
// due_date = today + interval days, formatted as ISO YYYY-MM-DD
export function applyRating(state: SRSState, rating: Rating, today: string): ReviewResult {
  let interval = state.interval
  let easeFactor = state.ease_factor
  let reps = state.reps

  switch (rating) {
    case 'again':
      interval = 1
      easeFactor -= 0.2
      reps = 0
      break
    case 'hard':
      interval = Math.max(1, state.interval * 1.2)
      easeFactor -= 0.15
      reps = state.reps + 1
      break
    case 'good':
      interval = state.interval * state.ease_factor
      reps = state.reps + 1
      break
    case 'easy':
      interval = state.interval * state.ease_factor * 1.3
      easeFactor += 0.15
      reps = state.reps + 1
      break
  }

  const new_state: SRSState = {
    ...state,
    interval,
    ease_factor: clampEaseFactor(easeFactor),
    due_date: addDaysISO(today, interval),
    reps
  }

  return {
    new_state,
    xp_earned: XP_BY_RATING[rating]
  }
}

// Returns true if a card is due (due_date <= today)
export function isDue(state: SRSState, today: string): boolean {
  return state.due_date <= today
}

// Returns today's date as ISO YYYY-MM-DD string (uses local time)
export function getTodayISO(): string {
  return formatISODate(new Date())
}

// Calculates streak: given last_study_date and today, returns new streak count
// If last_study_date was yesterday: streak + 1
// If last_study_date was today: streak unchanged (already studied today)
// If last_study_date was 2+ days ago or null: streak resets to 1
export function calculateStreak(last_study_date: string | null, today: string, current_streak: number): number {
  if (last_study_date === today) {
    return current_streak
  }

  if (last_study_date === addDaysISO(today, -1)) {
    return current_streak + 1
  }

  return 1
}
