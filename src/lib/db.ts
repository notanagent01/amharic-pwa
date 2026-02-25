import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Card, CustomVocab, Progress, SRSState, UserPrefs } from '@/types'

const DB_NAME = 'amharic-pwa-db'
const DB_VERSION = 1
const USER_PREFS_KEY = 'singleton' as const

const DEFAULT_USER_PREFS: UserPrefs = {
  streak_count: 0,
  last_study_date: null,
  xp_total: 0
}

interface UserPrefsRecord extends UserPrefs {
  key: typeof USER_PREFS_KEY
}

interface AmharicDBSchema extends DBSchema {
  cards: {
    key: Card['id']
    value: Card
  }
  srs_state: {
    key: SRSState['card_id']
    value: SRSState
    indexes: {
      due_date: SRSState['due_date']
    }
  }
  progress: {
    key: Progress['module_id']
    value: Progress
  }
  user_prefs: {
    key: typeof USER_PREFS_KEY
    value: UserPrefsRecord
  }
  custom_vocab: {
    key: CustomVocab['id']
    value: CustomVocab
  }
}

let dbPromise: Promise<IDBPDatabase<AmharicDBSchema>> | null = null

function getDB(): Promise<IDBPDatabase<AmharicDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AmharicDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('srs_state')) {
          const srsStore = db.createObjectStore('srs_state', { keyPath: 'card_id' })
          srsStore.createIndex('due_date', 'due_date')
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'module_id' })
        }
        if (!db.objectStoreNames.contains('user_prefs')) {
          db.createObjectStore('user_prefs', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('custom_vocab')) {
          db.createObjectStore('custom_vocab', { keyPath: 'id', autoIncrement: false })
        }
      }
    })
  }

  return dbPromise
}

function withDefaultUserPrefs(prefs: UserPrefs | undefined): UserPrefs {
  if (!prefs) {
    return { ...DEFAULT_USER_PREFS }
  }

  return prefs
}

// Database initialization
export async function initDB(): Promise<void> {
  await getDB()
}

// Cards
export async function getCard(id: string): Promise<Card | undefined> {
  const db = await getDB()
  return db.get('cards', id)
}

export async function getAllCards(module_id?: string): Promise<Card[]> {
  const db = await getDB()
  const cards = await db.getAll('cards')

  if (!module_id) {
    return cards
  }

  return cards.filter((card) => card.module_id === module_id)
}

export async function putCard(card: Card): Promise<void> {
  const db = await getDB()
  await db.put('cards', card)
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('cards', id)
}

// SRS State
export async function getSRSState(card_id: string): Promise<SRSState | undefined> {
  const db = await getDB()
  return db.get('srs_state', card_id)
}

export async function getDueCards(today: string): Promise<SRSState[]> {
  const db = await getDB()

  if (typeof IDBKeyRange !== 'undefined') {
    return db.getAllFromIndex('srs_state', 'due_date', IDBKeyRange.upperBound(today))
  }

  const allStates = await db.getAll('srs_state')
  return allStates.filter((state) => state.due_date <= today)
}

export async function putSRSState(state: SRSState): Promise<void> {
  const db = await getDB()
  await db.put('srs_state', state)
}

export async function getAllSRSStates(): Promise<SRSState[]> {
  const db = await getDB()
  return db.getAll('srs_state')
}

// Progress
export async function getProgress(module_id: string): Promise<Progress | undefined> {
  const db = await getDB()
  return db.get('progress', module_id)
}

export async function getAllProgress(): Promise<Progress[]> {
  const db = await getDB()
  return db.getAll('progress')
}

export async function putProgress(progress: Progress): Promise<void> {
  const db = await getDB()
  await db.put('progress', progress)
}

// User Prefs
export async function getUserPrefs(): Promise<UserPrefs> {
  const db = await getDB()
  const storedPrefs = await db.get('user_prefs', USER_PREFS_KEY)

  if (!storedPrefs) {
    return withDefaultUserPrefs(undefined)
  }

  const { streak_count, last_study_date, xp_total } = storedPrefs
  return withDefaultUserPrefs({ streak_count, last_study_date, xp_total })
}

export async function putUserPrefs(prefs: UserPrefs): Promise<void> {
  const db = await getDB()
  const record: UserPrefsRecord = {
    key: USER_PREFS_KEY,
    ...prefs
  }
  await db.put('user_prefs', record)
}

// Custom Vocab
export async function getCustomVocab(id: string): Promise<CustomVocab | undefined> {
  const db = await getDB()
  return db.get('custom_vocab', id)
}

export async function getAllCustomVocab(): Promise<CustomVocab[]> {
  const db = await getDB()
  return db.getAll('custom_vocab')
}

export async function putCustomVocab(vocab: CustomVocab): Promise<void> {
  const db = await getDB()
  await db.put('custom_vocab', vocab)
}

export async function deleteCustomVocab(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('custom_vocab', id)
}
