import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserPrefs, getAllCards, getProgress } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Icon } from '@/components/ui/Icon'
import { SectionHeader } from '@/components/ui/SectionHeader'

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
                const allCards = await getAllCards('fidel')
                const unlockedCards = allCards.filter(c => c.fidel_confidence !== 'pending')
                const calculatedPercentage = Math.round((unlockedCards.length / 287) * 100)
                setPercentage(Math.min(100, calculatedPercentage))

                // 3. Moduled unlock status
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

    return (
        <div className="p-4 space-y-8 animate-fade-in max-w-lg mx-auto pb-24">
            {/* Header section */}
            <div className="flex justify-between items-center mt-4">
                <div>
                    <h1 className="text-sm font-medium text-muted uppercase tracking-wider">Welcome back</h1>
                    <p lang="am" className="fidel-char text-3xl font-bold mt-1 text-primary">ጤና ይስጥልኝ</p>
                </div>
                <div className="text-right space-y-2">
                    <div className="text-sm font-semibold bg-surface border border-border rounded-full px-3 py-1 flex items-center justify-end gap-2 shadow-sm relative overflow-hidden">
                        {streak >= 3 && (
                            <svg className="w-4 h-4 text-secondary absolute left-2 top-1.5" viewBox="0 0 24 24" fill="currentColor">
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
                    <div className="text-sm font-semibold bg-surface border border-border rounded-full px-3 py-1 flex items-center justify-end gap-2 shadow-sm text-secondary">
                        <Icon name="star" size={14} className="text-secondary" /> {xp} XP
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <Card padding="lg" className="flex flex-col items-center text-center">
                <ProgressRing progress={percentage} size={120} strokeWidth={8} />
                <div className="mt-4">
                    <h2 className="text-xl font-bold font-ethiopic text-text">Fidel Mastery</h2>
                    <p className="text-muted text-sm mt-1">Learn the alphabet</p>
                </div>
                <Link to="/fidel" className="mt-6 w-full py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors">
                    Continue Learning
                </Link>
            </Card>

            {/* Modules Grid */}
            <div>
                <SectionHeader title="Path" />
                <div className="grid grid-cols-2 gap-4">
                    <Link to="/srs" className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${modulesUnlocked.srs ? 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover active:scale-95 text-text' : 'bg-surface/50 border-border/50 text-muted/50 pointer-events-none'}`}>
                        {modulesUnlocked.srs ? <Icon name="layers" size={32} className="text-primary" /> : <Icon name="layers" size={32} className="opacity-50" />}
                        <span className="font-semibold font-ethiopic">Review</span>
                    </Link>
                    <Link to="/vocab" className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${modulesUnlocked.vocab ? 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover active:scale-95 text-text' : 'bg-surface/50 border-border/50 text-muted/50 pointer-events-none'}`}>
                        {modulesUnlocked.vocab ? <Icon name="book-open" size={32} className="text-secondary" /> : <Icon name="book-open" size={32} className="opacity-50" />}
                        <span className="font-semibold font-ethiopic">Vocab</span>
                    </Link>
                    <Link to="/grammar" className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${modulesUnlocked.grammar ? 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover active:scale-95 text-text' : 'bg-surface/50 border-border/50 text-muted/50 pointer-events-none'}`}>
                        {modulesUnlocked.grammar ? <Icon name="play" size={32} className="text-[#4CAF50]" /> : <Icon name="play" size={32} className="opacity-50" />}
                        <span className="font-semibold font-ethiopic">Grammar</span>
                    </Link>
                    <Link to="/dialogue" className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${modulesUnlocked.dialogue ? 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover active:scale-95 text-text' : 'bg-surface/50 border-border/50 text-muted/50 pointer-events-none'}`}>
                        {modulesUnlocked.dialogue ? <Icon name="message-circle" size={32} className="text-[#2196F3]" /> : <Icon name="message-circle" size={32} className="opacity-50" />}
                        <span className="font-semibold font-ethiopic">Dialogues</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
