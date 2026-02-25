import { describe, expect, it } from 'vitest'
import {
  CONSONANT_KEYS,
  getVowelOrderChar,
  validateFidelInput
} from '@/lib/keyboard'

const getConsonant = (baseChar: string) => {
  const consonant = CONSONANT_KEYS.find((item) => item.base_char === baseChar)

  if (consonant === undefined) {
    throw new Error(`Consonant not found: ${baseChar}`)
  }

  return consonant
}

describe('getVowelOrderChar', () => {
  it('returns expected characters across vowel orders', () => {
    const la = getConsonant('ለ')
    const ba = getConsonant('በ')
    const ga = getConsonant('ገ')

    expect(getVowelOrderChar(la, 1)).toBe('ለ')
    expect(getVowelOrderChar(la, 2)).toBe('ሉ')
    expect(getVowelOrderChar(la, 6)).toBe('ለ')
    expect(getVowelOrderChar(la, 7)).toBe('ሎ')
    expect(getVowelOrderChar(ba, 4)).toBe('ባ')
    expect(getVowelOrderChar(ga, 5)).toBe('ጌ')
  })

  it('throws for invalid vowel order values', () => {
    const la = getConsonant('ለ')

    expect(() => getVowelOrderChar(la, 0)).toThrow(RangeError)
    expect(() => getVowelOrderChar(la, 8)).toThrow(RangeError)
    expect(() => getVowelOrderChar(la, 3.5)).toThrow(RangeError)
  })
})

describe('validateFidelInput', () => {
  it('returns correct for exact match', () => {
    expect(validateFidelInput('ሰላም', 'ሰላም')).toEqual({
      correct: true,
      wrong_positions: []
    })
  })

  it('returns mismatch indexes for partial input', () => {
    expect(validateFidelInput('ሰላ', 'ሰላም')).toEqual({
      correct: false,
      wrong_positions: [2]
    })
  })

  it('returns mismatch indexes for wrong characters', () => {
    expect(validateFidelInput('ሰሉም', 'ሰላም')).toEqual({
      correct: false,
      wrong_positions: [1]
    })
  })
})
