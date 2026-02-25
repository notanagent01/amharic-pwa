# Amharic Learning PWA

A Progressive Web Application (PWA) designed to teach Amharic. This app features interactive modules to learn the Fidel script, vocabulary, grammar rules, and conversational dialogues. It embraces modern web technologies to provide a fully offline capable, fast, and accessible learning experience.

## Features

- **HomeScreen Dashboard:** Tracks your learning streak and XP, and dynamically unlocks modules as you progress.
- **Fidel Module:** Learn the Amharic characters (Fidels) with interactive tracing canvas, audio pronunciation, and a full character chart.
- **Vocab Module:** Learn essential vocabulary categorized by themes with audio support and example sentences.
- **Grammar Module:** Interactive grammar lessons with fill-in-the-blank exercises and contextual examples.
- **Dialogue Module:** Immersive conversations reflecting real-life scenarios with line-by-line audio and translations.
- **SRS (Spaced Repetition System):** Adaptive flashcard reviews to maintain long-term memory of learned concepts using a custom SM-2 algorithm.
- **PWA Capabilities:** Fully installable, functions completely offline, custom caching, and responsive design.
- **Dark Mode & Accessibility:** Supports system-level dark mode, semantic HTML, and correct language tagging for Ethiopic script (`lang="am"`).

## Tech Stack

- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Storage:** IndexedDB (via `idb-keyval`)
- **PWA:** vite-plugin-pwa (with Workbox)

## Local Development

To run this project locally:

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd "Amharic project"
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at `http://localhost:5173`.

4. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`

5. **Preview production build:**
   \`\`\`bash
   npm run preview
   \`\`\`
   This will serve the production build on `http://localhost:4173` to test PWA features.

## Curriculum Overview

The application follows a structured path designed to progressively build literacy:
1. **Fidel Module:** Introduction to the writing system via visual, auditory, and tracing elements.
2. **Vocab Module:** Building a core functional lexicon across diverse themes (colors, family, time, food, phrases).
3. **Grammar Module:** Combining words into grammatically correct patterns.
4. **Dialogue Module:** Placing vocabulary and morphology into contextual conversations.
5. **SRS (Flashcards):** Systematically recalling previously learned materials.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

*(Placeholder for future screenshots - coming soon!)*

---

*Built with ❤️ for Amharic learners.*
