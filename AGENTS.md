# AGENTS.md — Amharic PWA Build Instructions for Codex

## Project Overview
We are building a browser-based Progressive Web App (PWA) for learning Amharic (አማርኛ) to A2 proficiency.
The full spec lives in SPEC.md at the root. Read it before writing any code.

## Stack
- Vite + React 18 + TypeScript (strict mode)
- Tailwind CSS (utility classes only, no custom CSS files unless unavoidable)
- idb (IndexedDB wrapper)
- Workbox (Service Worker)
- eSpeak-NG compiled to WASM for offline Amharic TTS fallback

## Folder Structure (do not deviate)
src/ lib/ ← pure TypeScript logic: srs.ts, db.ts, audio.ts, tracing.ts, keyboard.ts modules/ fidel/ ← Fidel chart + tracing module srs/ ← Flashcard SRS module vocab/ ← Vocabulary builder module grammar/ ← Grammar module dialogue/ ← Dialogue practice module components/ ← Shared React components data/ ← JSON data files (fidel-data.json, vocab.json, grammar-exercises.json, dialogues.json) workers/ ← Service Worker (sw.ts) assets/ ← Static assets public/ audio/ ← Audio files (Opus/WebM) manifest.webmanifest

## Coding Standards
- TypeScript strict mode. No `any`. Export typed interfaces for everything.
- No placeholder comments (no `// TODO`, `// stub`, `// implement later`). Every function must be fully implemented.
- All IndexedDB access via the `idb` wrapper — never raw `indexedDB` calls.
- All audio playback via `AudioContext` — never `<audio>` elements.
- No network calls anywhere in the app. Fully offline after first load.
- Tailwind only for styling. No inline styles.

## How to Run Tests
```bash
npm run test        # vitest unit tests
npm run build       # Vite production build
npm run preview     # Preview production build locally
```

## Git Workflow

-   Each Codex task should produce a PR with a clear title matching the task name.
-   Commit messages follow Conventional Commits: `feat:`, `fix:`, `data:`, `test:`.
-   Do not push directly to main. Always create a branch and open a PR.

## Review Instructions for @codex review

When reviewing PRs: - Verify all TypeScript types are explicit and correct. - Check that no network calls exist anywhere. - Confirm IndexedDB schema matches the exact schema in SPEC.md. Specifically: `cards` must have `front_fidel` (string | null), `front_roman` (string), and `fidel_confidence` fields — not the old `front` field. Any PR still using `card.front` is wrong. - Confirm SM-2 algorithm parameters match exactly: Again(interval=1, ef-=0.2), Hard(interval×1.2, ef-=0.15), Good(interval×ef), Easy(interval×ef×1.3, ef+=0.15). - Flag any `// TODO` or stub functions. - Flag any raw FSI romanization stored in `front_roman` (must be ETS-normalized; `9` → `ə`, uppercase ejective letters → their ETS equivalents per SPEC.md). - Flag any `card.front` references in React components — must use `front_fidel` for Ethiopic display and `front_roman` for transliteration.