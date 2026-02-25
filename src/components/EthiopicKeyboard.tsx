import { useState } from 'react'
import {
  CONSONANT_KEYS,
  getVowelOrderChar,
  type ConsonantKey
} from '@/lib/keyboard'

interface EthiopicKeyboardProps {
  onCharacter: (char: string) => void
  onBackspace: () => void
  disabled?: boolean
}

interface VowelOrder {
  order: number
  sound: string
}

const VOWEL_ORDERS: VowelOrder[] = [
  { order: 1, sound: 'ä' },
  { order: 2, sound: 'u' },
  { order: 3, sound: 'i' },
  { order: 4, sound: 'a' },
  { order: 5, sound: 'e' },
  { order: 6, sound: 'ə' },
  { order: 7, sound: 'o' }
]

export default function EthiopicKeyboard({
  onCharacter,
  onBackspace,
  disabled = false
}: EthiopicKeyboardProps) {
  const [selectedConsonant, setSelectedConsonant] = useState<ConsonantKey | null>(
    null
  )

  const handleConsonantPress = (consonant: ConsonantKey) => {
    if (disabled) {
      return
    }

    setSelectedConsonant((current) =>
      current?.base_char === consonant.base_char ? null : consonant
    )
  }

  const handleVowelPress = (order: number) => {
    if (disabled || selectedConsonant === null) {
      return
    }

    const composedChar = getVowelOrderChar(selectedConsonant, order)
    onCharacter(composedChar)
    setSelectedConsonant(null)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-4">
      <div
        className="grid grid-cols-4 md:grid-cols-7 gap-2"
        aria-label="Ethiopic consonant keyboard"
      >
        {CONSONANT_KEYS.map((consonant) => {
          const isSelected = selectedConsonant?.base_char === consonant.base_char

          return (
            <button
              key={consonant.base_char}
              type="button"
              aria-label={`Select consonant ${consonant.display_name}`}
              onClick={() => handleConsonantPress(consonant)}
              disabled={disabled}
              className={[
                'rounded-md p-2 text-center transition-colors',
                'bg-gray-800 text-gray-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
                isSelected
                  ? 'border-2 border-red-500'
                  : 'border border-gray-700 hover:bg-gray-700',
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              ].join(' ')}
            >
              <div className="fidel-char text-2xl leading-none">{consonant.base_char}</div>
              <div className="text-xs text-gray-300 mt-1">{consonant.romanization}</div>
            </button>
          )
        })}
      </div>

      {selectedConsonant !== null ? (
        <div
          className="grid grid-cols-4 md:grid-cols-7 gap-2"
          aria-label="Vowel order keyboard"
        >
          {VOWEL_ORDERS.map(({ order, sound }) => {
            const combinedChar = getVowelOrderChar(selectedConsonant, order)

            return (
              <button
                key={order}
                type="button"
                aria-label={`Input vowel order ${order} (${sound}) for ${selectedConsonant.display_name}`}
                onClick={() => handleVowelPress(order)}
                disabled={disabled}
                className={[
                  'rounded-md p-2 text-center transition-colors',
                  'border border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
                  disabled ? 'opacity-60 cursor-not-allowed' : ''
                ].join(' ')}
              >
                <div className="text-xs text-gray-400">{order}</div>
                <div className="fidel-char text-xl leading-none">{combinedChar}</div>
                <div className="text-xs text-gray-300">{sound}</div>
              </button>
            )
          })}
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Backspace"
        onClick={onBackspace}
        disabled={disabled}
        className={[
          'w-full rounded-md px-4 py-2 font-semibold text-white transition-colors',
          'bg-red-600 hover:bg-red-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        ].join(' ')}
      >
        Backspace
      </button>
    </div>
  )
}
