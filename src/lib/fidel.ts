import fidelData from '@/data/fidel-data.json'
import type { FidelChar } from '@/types'

const data = fidelData as FidelChar[]

// Get all characters in a specific group
export function getGroup(group: 'A' | 'B' | 'C' | 'LAB'): FidelChar[] {
  return data.filter((char) => char.group === group)
}

// Get a character by its base consonant romanization
export function getByRomanization(romanization: string): FidelChar | undefined {
  return data.find((char) => char.base_consonant_romanization === romanization)
}

// Get all characters sorted by frequency rank
export function getAllByFrequency(): FidelChar[] {
  return [...data].sort((a, b) => a.frequency_rank - b.frequency_rank)
}

// Get a specific order form for a character (returns empty string if not applicable)
export function getOrderChar(char: FidelChar, order: 1 | 2 | 3 | 4 | 5 | 6 | 7): string {
  const form = char.orders.find((candidate) => candidate.order === order)
  return form?.char ?? ''
}

// Get all non-labiovelar characters (the 238 core CV syllables)
export function getCoreChars(): FidelChar[] {
  return data.filter((char) => !char.is_labiovelar)
}

// Get labiovelar characters only (the 49 forms)
export function getLabiovelars(): FidelChar[] {
  return data.filter((char) => char.is_labiovelar)
}
