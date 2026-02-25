import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserPrefs, getAllCards, getProgress } from '@/lib/db'

export default function HomeScreen() {
    const [xp, setXp] = useState(0)
    const [streak, setStreak] = useState(0)
    const [percentage, setPercentage] = useState(0)

    // Track module lock status based on curriculum order
    const [modulesUnlocked, setModulesUnlocked] = useState({
        fidel: true, // Always unlocked
        srs: false,  // Unlocked if any cards exist
        vocab: false,
        grammar: false,
        dialogue: false
    })

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Load User Prefs
                const prefs = await getUserPrefs()
                setXp(prefs.xp_total)
                setStreak(prefs.streak_count)

                // 2. Load Fidel unlock percentage
                // Spec: "Total fidel characters unlocked: count cards in IndexedDB with module_id = 'fidel' and progress status = 'complete' and fidel_confidence !== "pending""
                // Wait, progress status = 'complete' means counting *which* cards?
                // The spec says: count cards where module_id = 'fidel' AND the progress for those cards? No, there is no card-level progress in the schema. "progress status = 'complete'" might refer to progress table, but the spec says "count cards in IndexedDB with module_id = 'fidel' and progress status = 'complete'".
                // Rechecking spec: cards just have { id, front_fidel, front_roman, back, audio_key, module_id, fidel_confidence }
                // So counting unlocked cards: cards just existence in IDB usually means they are unlocked.
                const allCards = await getAllCards('fidel')
                const unlockedCards = allCards.filter(c => c.fidel_confidence !== 'pending')
                const calculatedPercentage = Math.round((unlockedCards.length / 287) * 100)
                setPercentage(Math.min(100, calculatedPercentage))

                // 3. Moduled unlock status
                // Curriculum Order: Fidel -> Phonology(n/a) -> Vocab -> Grammar -> Dialogues
                const srsCards = await getAllCards()
                const hasSrsCards = srsCards.length > 0;

                const fidelProg = await getProgress('fidel')
                const vocabProg = await getProgress('vocab')
                const grammarProg = await getProgress('grammar')

                setModulesUnlocked({
                    fidel: true,
                    srs: hasSrsCards,
                    vocab: fidelProg?.status === 'complete',
                    grammar: vocabProg?.status === 'complete',
                    dialogue: grammarProg?.status === 'complete'
                })
            } catch (err) {
                console.error("Failed to load homescreen data", err)
            }
        }
        loadData()
    }, [])

    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="p-4 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mt-4">
                <div>
                    <h1 className="text-sm text-gray-400">Welcome back</h1>
                    <p lang="am" className="fidel-char text-3xl font-bold mt-1">ጤና ይስጥልኝ</p>
                </div>
                <div className="text-right space-y-1">
                    <div className="text-sm font-semibold bg-surface rounded-full px-3 py-1 flex items-center justify-end gap-2 shadow-sm relative overflow-hidden">
                        {streak >= 3 && (
                            <svg className="w-4 h-4 text-orange-500 absolute left-2 top-1.5" viewBox="0 0 24 24" fill="currentColor">
                                <style>
                                    {`
                                        @keyframes flicker {
                                            0%, 100% { transform: scale(1) rotate(-2deg); opacity: 0.9; }
                                            25% { transform: scale(1.1) rotate(2deg); opacity: 1; }
                                            50% { transform: scale(0.95) rotate(-1deg); opacity: 0.8; }
                                            75% { transform: scale(1.05) rotate(1deg); opacity: 0.95; }
                                        }
                                        .fire-anim {
                                            animation: flicker 0.8s infinite alternate ease-in-out;
                                            transform-origin: bottom center;
                                        }
                                    `}
                                </style>
                                <path className="fire-anim" d="M12,23 C8.6862915,23 6,20.3137085 6,17 C6,13.2039237 8.5298031,9.81435252 11.8398492,6.58784339 C11.9678881,6.46305611 12.1643915,6.45281861 12.304566,6.5623862 C15.6322312,9.16240034 18,12.7686526 18,17 C18,20.3137085 15.3137085,23 12,23 Z M12,19 C13.1045695,19 14,18.1045695 14,17 C14,15.6568542 12.9157209,14.4719003 12,13.5 C11.0842791,14.4719003 10,15.6568542 10,17 C10,18.1045695 10.8954305,19 12,19 Z" />
                            </svg>
                        )}
                        <span className={streak >= 3 ? "ml-4" : ""}>{streak >= 3 ? "" : "🔥"} {streak} day streak</span>
                    </div>
                    <div className="text-sm font-semibold bg-surface rounded-full px-3 py-1 flex items-center justify-end gap-2 shadow-sm">
                        ⭐ {xp} XP
                    </div>
                </div>
            </div>

            <div className="flex justify-center my-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            className="text-gray-800"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                        <circle
                            className="text-accent transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold">{percentage}%</span>
                        <span className="text-xs text-gray-400">Mastery</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link to="/fidel" className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${modulesUnlocked.fidel ? 'bg-surface hover:bg-surface/80 active:scale-95 text-white shadow-sm' : 'bg-gray-900/50 text-gray-600 pointer-events-none'}`}>
                    <span className="text-3xl">ሀ</span>
                    <span className="font-semibold">Fidel</span>
                </Link>
                <Link to="/srs" className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${modulesUnlocked.srs ? 'bg-surface hover:bg-surface/80 active:scale-95 text-white shadow-sm' : 'bg-gray-900/50 text-gray-600 pointer-events-none'}`}>
                    <span className="text-3xl">{modulesUnlocked.srs ? '📇' : '🔒'}</span>
                    <span className="font-semibold">Review</span>
                </Link>
                <Link to="/vocab" className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${modulesUnlocked.vocab ? 'bg-surface hover:bg-surface/80 active:scale-95 text-white shadow-sm' : 'bg-gray-900/50 text-gray-600 pointer-events-none'}`}>
                    <span className="text-3xl">{modulesUnlocked.vocab ? '📚' : '🔒'}</span>
                    <span className="font-semibold">Vocab</span>
                </Link>
                <Link to="/grammar" className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${modulesUnlocked.grammar ? 'bg-surface hover:bg-surface/80 active:scale-95 text-white shadow-sm' : 'bg-gray-900/50 text-gray-600 pointer-events-none'}`}>
                    <span className="text-3xl">{modulesUnlocked.grammar ? '🧩' : '🔒'}</span>
                    <span className="font-semibold">Grammar</span>
                </Link>
                <Link to="/dialogue" className={`col-span-2 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${modulesUnlocked.dialogue ? 'bg-surface hover:bg-surface/80 active:scale-95 text-white shadow-sm' : 'bg-gray-900/50 text-gray-600 pointer-events-none'}`}>
                    <span className="text-3xl">{modulesUnlocked.dialogue ? '💬' : '🔒'}</span>
                    <span className="font-semibold">Dialogues</span>
                </Link>
            </div>
        </div>
    )
}
