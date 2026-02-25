export interface ConsonantKey {
  base_char: string
  romanization: string
  base_codepoint: number
  display_name: string
}

export interface KeyboardState {
  selected_consonant: ConsonantKey | null
  pending_input: boolean
}

const createConsonantKey = (
  base_char: string,
  romanization: string,
  base_codepoint: number
): ConsonantKey => ({
  base_char,
  romanization,
  base_codepoint,
  display_name: `${base_char} (${romanization})`
})

export const CONSONANT_KEYS: ConsonantKey[] = [
  createConsonantKey('ለ', 'l', 0x1208),
  createConsonantKey('አ', 'a', 0x12a0),
  createConsonantKey('ነ', 'n', 0x1290),
  createConsonantKey('ተ', 't', 0x1270),
  createConsonantKey('ከ', 'k', 0x12a8),
  createConsonantKey('በ', 'b', 0x1260),
  createConsonantKey('ሰ', 's', 0x1230),
  createConsonantKey('ደ', 'd', 0x12f0),
  createConsonantKey('ዘ', 'z', 0x12d8),
  createConsonantKey('ወ', 'w', 0x12c8),
  createConsonantKey('ረ', 'r', 0x1228),
  createConsonantKey('ሀ', 'h', 0x1200),
  createConsonantKey('መ', 'm', 0x1218),
  createConsonantKey('ሸ', 'sh', 0x1238),
  createConsonantKey('ቀ', 'q', 0x1240),
  createConsonantKey('ገ', 'g', 0x1308),
  createConsonantKey('ፈ', 'f', 0x1348),
  createConsonantKey('ዐ', "'a", 0x12d0),
  createConsonantKey('ጠ', "t'", 0x1320),
  createConsonantKey('ጸ', 'ts', 0x1338),
  createConsonantKey('ኀ', 'x', 0x1280),
  createConsonantKey('ኘ', 'ny', 0x1298),
  createConsonantKey('ፐ', 'p', 0x1350),
  createConsonantKey('ጀ', 'j', 0x1300),
  createConsonantKey('ጨ', "ch'", 0x1328),
  createConsonantKey('ቸ', 'ch', 0x1278),
  createConsonantKey('ዥ', 'zh', 0x12e0),
  createConsonantKey('ሐ', "h'", 0x1210),
  createConsonantKey('ሠ', "s'", 0x1220),
  createConsonantKey('ቐ', "q'", 0x1250),
  createConsonantKey('ቨ', 'v', 0x1268),
  createConsonantKey('ዀ', 'xw', 0x12c0),
  createConsonantKey('ጐ', 'gw', 0x1310),
  createConsonantKey('ፀ', "ts'", 0x1340)
]

export function getVowelOrderChar(consonant: ConsonantKey, order: number): string {
  if (!Number.isInteger(order) || order < 1 || order > 7) {
    throw new RangeError('Vowel order must be an integer from 1 to 7')
  }

  const codepoint =
    order === 6
      ? consonant.base_codepoint
      : consonant.base_codepoint + (order - 1)

  return String.fromCodePoint(codepoint)
}

export function validateFidelInput(
  user_input: string,
  expected: string
): { correct: boolean; wrong_positions: number[] } {
  const userChars = Array.from(user_input)
  const expectedChars = Array.from(expected)
  const maxLength = Math.max(userChars.length, expectedChars.length)
  const wrong_positions: number[] = []

  for (let index = 0; index < maxLength; index += 1) {
    if (userChars[index] !== expectedChars[index]) {
      wrong_positions.push(index)
    }
  }

  return {
    correct: wrong_positions.length === 0,
    wrong_positions
  }
}
