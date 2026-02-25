export interface Card {
    id: string
    front_fidel: string | null   // Ethiopic script; null if Fidel lookup failed or pending
    front_roman: string          // ETS romanization — always present, never raw FSI notation
    fidel_confidence: 'ok' | 'low' | 'pending'  // 'pending' suppresses fidel views in tracing/chart
    back: string
    audio_key: string | null
    module_id: string
}

export interface SRSState {
    card_id: string
    interval: number
    ease_factor: number
    due_date: string  // ISO date string YYYY-MM-DD
    reps: number
}

export interface Progress {
    module_id: string
    status: 'locked' | 'in_progress' | 'complete'
    score: number
    completed_at: string | null
}

export interface UserPrefs {
    streak_count: number
    last_study_date: string | null
    xp_total: number
}

export interface CustomVocab {
    id: string
    amharic: string
    english: string
    user_audio_blob: ArrayBuffer | null
}

export interface FidelChar {
    base_consonant: string
    romanization: string
    orders: string[]  // array of 7 Unicode codepoints, one per vowel order
    is_labiovelar: boolean
    frequency_rank: number
}

export interface VocabWord {
    id: string
    amharic: string
    english: string
    transliteration: string
    audio_key: string
    theme: string
    module_id: string
}
