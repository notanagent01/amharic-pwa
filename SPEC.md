# SPEC.md — Amharic PWA Reference Spec

## Stack
Vite + React 18 + TypeScript + Tailwind + idb + Workbox + eSpeak-NG WASM

## IndexedDB Schema (exact — do not deviate)
- cards: { id, front_fidel, front_roman, back, audio_key, module_id, fidel_confidence }
  - front_fidel: string | null  — Ethiopic script; null if Fidel lookup failed (show roman-only card)
  - front_roman: string         — ETS romanization (normalized from FSI notation; never raw FSI)
  - fidel_confidence: "ok" | "low" | "pending"  — "pending" suppresses fidel views
- srs_state: { card_id, interval, ease_factor, due_date, reps }
- progress: { module_id, status, score, completed_at }
- user_prefs: { streak_count, last_study_date, xp_total }
- custom_vocab: { id, amharic, english, user_audio_blob }

## SM-2 Algorithm (exact parameters)
- Again: interval = 1, ease_factor -= 0.2
- Hard: interval = max(1, interval × 1.2), ease_factor -= 0.15
- Good: interval = interval × ease_factor
- Easy: interval = interval × ease_factor × 1.3, ease_factor += 0.15
Default ease_factor = 2.5. Store due_date as ISO date string.

## Fidel Script
- 34 base consonants × 7 vowel orders = 238 core CV syllables
- 49 labiovelar forms (ቈ, ኈ, ጐ, etc.) = ~287 total active characters
- Unicode block: U+1200–U+137F (core), U+2D80–U+2DDF (extended)
- Teach no more than 8–10 new character forms per day

## Ethiopic Soft Keyboard
Two-key input: press base consonant → press vowel order (1–7).
Each combination maps to a specific Unicode codepoint.
No OS keyboard driver dependency.

## Audio
Format: Opus/WebM ~48kbps. Playback via AudioContext.decodeAudioData().
Slow playback: AudioContext playbackRate = 0.75.
Recording: MediaRecorder with audio/webm;codecs=opus. Keep in memory, never write to disk.
eSpeak-NG WASM: lazy-load only when TTS gap encountered. Binary is ~2MB.

## Routes
/ → HomeScreen
/fidel → FidelModule (chart + tracing)
/srs → SRSModule (flashcards)
/vocab → VocabModule
/grammar → GrammarModule
/dialogue → DialogueModule
/settings → SettingsScreen

## Grammar Corrections (implement exactly)
- Accusative marker: –n after vowel-final nouns, –ín after consonant-final nouns
- Masculine definite suffix: –u after consonant, –w after vowel
- Plural suffix: –oč (not –oC)

## Curriculum Order
Module 1: Fidel (Groups A, B, C) → Module 2: Phonology → Module 3: Vocabulary
→ Module 4: Grammar → Module 5: Dialogues
Each module end requires an SRS review session before next module unlocks.

## P2: Offline Dictionary
If implementing the offline dictionary (P2 feature), use datasets from https://github.com/geezorg/data (amharic subdirectory). Verify individual file licenses before bundling — the repo mixes licenses.

## FSI Seed Data (fsi_amharic_seed.json)
The project root contains a pre-extracted seed JSON from FSI Amharic Volumes 1 & 2.
- 644 vocab entries (module_id 3) from Vol 2 glossary — romanized Amharic only, no Fidel
- 551 dialogue/gloss pairs (module_id 5) from Vol 1; 40 distinct units represented out of 50
- **Covered units:** 1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20, 21, 22, 23, 26, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
- **Missing units** (no extractable Basic Sentences block): 4, 7, 11, 14, 16, 24, 25, 27, 34, 40 — mark as `coverage: "not_available"` in curriculum metadata; do not expose the gap to users
- **Duplicate flush entries:** units 3, 23, 33, and 39 each appear twice in dialogues_raw — deduplicate by merging pairs and removing exact duplicates before loading
- **Fidel is absent** — all content is romanized only. The 5-step Fidel injection pipeline (see PRD v4) must run before cards reach IndexedDB: normalize notation → tokenize CV syllables → lookup `fidel_lookup.json` → write `front_fidel` → set `fidel_confidence`. Cards with `fidel_confidence = "pending"` are suppressed from tracing and fidel-display views.
- **FSI romanization normalization** (must convert before storing in `front_roman` — never store raw FSI notation):

  | FSI token | ETS (store as front_roman) |
  |-----------|---------------------------|
  | `9`       | `ə`                       |
  | `T` (uppercase, surrounded by lowercase) | `ṭ` |
  | `K` (uppercase, surrounded by lowercase) | `k'` |
  | `S` (uppercase, surrounded by lowercase) | `ts'` |
  | `C` (uppercase, surrounded by lowercase) | `č'` |
  | `P` (uppercase, surrounded by lowercase) | `p'` |
  | Doubled consonant | unchanged (gemination is phonemic — preserve) |

  Store the original FSI string in a separate `roman_fsi` provenance field (not displayed to users).

- **Sentence pair quality tiers** (dialogue pairs only — gloss pairs are all reliable):
  - Tier A (Units 1–19, ~90 sentence pairs): production-ready after normalization + Fidel pass
  - Tier B (Units 20–45, ~126 sentence pairs): flag with `needs_review: true`; pre-filter with length-ratio heuristic (english_token_count / amharic_token_count outside 0.5–2.0 = likely misaligned); human review required before production
  - Tier C (Units 46–50 sentence pairs, ~24 pairs): exclude from v1 card set; gloss pairs from these units are fine

## Audio — FSI Clipping Pipeline
The FSI audio is 60 full-unit recordings (~25 hours total), not clip-level files. The app expects Opus/WebM clips keyed to individual cards. The rename-and-map workaround has been discarded.

The correct pipeline uses **WhisperX** forced alignment (not Aeneas):
1. Convert all 60 MP3s to 16kHz mono WAV (`ffmpeg -ar 16000 -ac 1`)
2. Run WhisperX `large-v2` model with `language="am"` to get word-level timestamps
3. Cross-reference timestamps with `fsi_amharic_seed.json` to build `clip_manifest.json`: `{ audio_key → { source_wav, start_sec, end_sec } }`
4. Clip and encode to Opus/WebM via ffmpeg with 50ms onset padding per clip

Clip naming convention (use these exact formats in audio_key fields):
- Vocabulary clips: `vocab_{romanized_word}` (e.g., `vocab_selam`)
- Dialogue line clips: `dial_u{unit:02d}_line_{index:03d}` (e.g., `dial_u01_line_003`)
- Character audio clips: `char_{consonant_roman}_ord{order}` (e.g., `char_l_ord1`) — these must come from new recording sessions; FSI does not contain isolated character pronunciation

Expected coverage from FSI: ~80–90% of vocab cards, ~95% of Tier A/B dialogue lines, 0% of character audio. Remaining gaps fall back to eSpeak-NG WASM at runtime. Thread 7 must populate `audio-manifest.json` with every `audio_key` referenced in the content files and mark each as `"source": "fsi_clip"`, `"source": "new_recording_needed"`, or `"source": "espeak_fallback"`.