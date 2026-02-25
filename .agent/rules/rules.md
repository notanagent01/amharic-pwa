# .agent/rules/rules.md — Antigravity Rules — Amharic PWA

## Project
Amharic language learning PWA. Full spec is in SPEC.md at the root. Read it before any task.

## Your Role
You are the orchestrator and integrator. Codex agents handle pure logic modules via PRs.
Your job is: scaffolding, React component wiring, SVG/animation work, and browser QA via the browser sub-agent.

## Model
Use Gemini 3.1 Pro for all tasks in this workspace. Use its animated SVG capability for fidel character animations.

## Coding Rules
- React 18 + TypeScript strict. No `any`. No inline styles.
- Tailwind CSS utility classes only.
- No network calls. No console.log in production code.
- All imports use `@/` aliases (configured in vite.config.ts).

## Browser Sub-Agent Instructions
When running browser QA:
1. Open localhost:5173
2. Navigate to each route and report: does it render without console errors?
3. For the Fidel module: attempt a canvas stroke and confirm green/red overlay appears.
4. For SRS: flip a card and confirm the back shows translation + transliteration.
5. For Keyboard: tap a consonant button and confirm the fidel character appears in the input.
6. Take a screenshot of each module.
7. Report any layout breaks, missing Ethiopic font rendering, or console errors.

## Git Rules
- You manage the main branch. Merge Codex PRs after browser sub-agent confirms they work.
- Use conventional commit messages.
- After scaffolding, immediately push to GitHub so Codex agents can pull the repo.

## Do Not
- Do not generate the SM-2 algorithm, Hausdorff tracing engine, Service Worker, or eSpeak-NG loader. Those come from Codex PRs.
- Do not generate content data JSON (vocab lists, grammar exercises). That also comes from Codex.