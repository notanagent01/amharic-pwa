import { describe, expect, it } from 'vitest'
import type { SRSState } from '@/types'
import { applyRating, calculateStreak, isDue } from '@/lib/srs'

describe('applyRating', () => {
  it('applies "again" rating with interval reset and reps reset', () => {
    const state: SRSState = {
      card_id: 'card-1',
      interval: 7,
      ease_factor: 2.1,
      due_date: '2026-02-20',
      reps: 4
    }

    const result = applyRating(state, 'again', '2026-02-25')

    expect(result.xp_earned).toBe(0)
    expect(result.new_state.interval).toBe(1)
    expect(result.new_state.ease_factor).toBeCloseTo(1.9)
    expect(result.new_state.reps).toBe(0)
    expect(result.new_state.due_date).toBe('2026-02-26')
  })

  it('applies "hard" rating with interval multiplier and ease penalty', () => {
    const state: SRSState = {
      card_id: 'card-2',
      interval: 2,
      ease_factor: 2.5,
      due_date: '2026-02-20',
      reps: 1
    }

    const result = applyRating(state, 'hard', '2026-02-25')

    expect(result.xp_earned).toBe(5)
    expect(result.new_state.interval).toBeCloseTo(2.4)
    expect(result.new_state.ease_factor).toBeCloseTo(2.35)
    expect(result.new_state.reps).toBe(2)
    expect(result.new_state.due_date).toBe('2026-02-27')
  })

  it('applies "good" rating with interval scaled by ease factor', () => {
    const state: SRSState = {
      card_id: 'card-3',
      interval: 4,
      ease_factor: 2.5,
      due_date: '2026-02-20',
      reps: 5
    }

    const result = applyRating(state, 'good', '2026-02-25')

    expect(result.xp_earned).toBe(10)
    expect(result.new_state.interval).toBeCloseTo(10)
    expect(result.new_state.ease_factor).toBeCloseTo(2.5)
    expect(result.new_state.reps).toBe(6)
    expect(result.new_state.due_date).toBe('2026-03-07')
  })

  it('applies "easy" rating with boosted interval and ease bonus', () => {
    const state: SRSState = {
      card_id: 'card-4',
      interval: 4,
      ease_factor: 2.5,
      due_date: '2026-02-20',
      reps: 8
    }

    const result = applyRating(state, 'easy', '2026-02-25')

    expect(result.xp_earned).toBe(15)
    expect(result.new_state.interval).toBeCloseTo(13)
    expect(result.new_state.ease_factor).toBeCloseTo(2.65)
    expect(result.new_state.reps).toBe(9)
    expect(result.new_state.due_date).toBe('2026-03-10')
  })

  it('enforces ease factor floor at 1.3', () => {
    const state: SRSState = {
      card_id: 'card-5',
      interval: 3,
      ease_factor: 1.31,
      due_date: '2026-02-20',
      reps: 3
    }

    const result = applyRating(state, 'again', '2026-02-25')
    expect(result.new_state.ease_factor).toBe(1.3)
  })

  it('increments reps for non-again ratings and resets on again', () => {
    const baseState: SRSState = {
      card_id: 'card-6',
      interval: 5,
      ease_factor: 2.3,
      due_date: '2026-02-20',
      reps: 6
    }

    const goodResult = applyRating(baseState, 'good', '2026-02-25')
    const againResult = applyRating(baseState, 'again', '2026-02-25')

    expect(goodResult.new_state.reps).toBe(7)
    expect(againResult.new_state.reps).toBe(0)
  })
})

describe('isDue', () => {
  it('returns true when due date is today', () => {
    const state: SRSState = {
      card_id: 'card-7',
      interval: 1,
      ease_factor: 2.5,
      due_date: '2026-02-25',
      reps: 1
    }

    expect(isDue(state, '2026-02-25')).toBe(true)
  })

  it('returns true when due date is in the past', () => {
    const state: SRSState = {
      card_id: 'card-8',
      interval: 1,
      ease_factor: 2.5,
      due_date: '2026-02-24',
      reps: 1
    }

    expect(isDue(state, '2026-02-25')).toBe(true)
  })

  it('returns false when due date is in the future', () => {
    const state: SRSState = {
      card_id: 'card-9',
      interval: 1,
      ease_factor: 2.5,
      due_date: '2026-02-26',
      reps: 1
    }

    expect(isDue(state, '2026-02-25')).toBe(false)
  })
})

describe('calculateStreak', () => {
  it('increments streak when last study date was yesterday', () => {
    expect(calculateStreak('2026-02-24', '2026-02-25', 5)).toBe(6)
  })

  it('keeps streak unchanged when already studied today', () => {
    expect(calculateStreak('2026-02-25', '2026-02-25', 5)).toBe(5)
  })

  it('resets streak when last study date was two days ago', () => {
    expect(calculateStreak('2026-02-23', '2026-02-25', 5)).toBe(1)
  })

  it('resets streak to 1 when there is no previous study date', () => {
    expect(calculateStreak(null, '2026-02-25', 5)).toBe(1)
  })
})
