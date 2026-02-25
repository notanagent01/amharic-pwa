import { useState, useEffect } from 'react';
import { getTodayISO, applyRating, calculateStreak } from '@/lib/srs';
import type { Rating } from '@/lib/srs';
import { getCard, putSRSState, getUserPrefs, putUserPrefs, getAllSRSStates, getDueCards } from '@/lib/db';
import type { Card, SRSState } from '@/types';
import { playAudioKey } from '@/lib/audio';

// Removed FlashcardProps

function FlashcardSession({ queue, onComplete }: { queue: { card: Card, state: SRSState }[], onComplete: (xp: number) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [totalXP, setTotalXP] = useState(0);

    const currentItem = queue[currentIndex];

    // Reset flipped state when card changes
    useEffect(() => {
        setIsFlipped(false);
    }, [currentIndex]);

    const handleRate = async (rating: Rating) => {
        const today = getTodayISO();
        const result = applyRating(currentItem.state, rating, today);

        await putSRSState(result.new_state);

        const newTotalXP = totalXP + result.xp_earned;
        setTotalXP(newTotalXP);

        if (currentIndex + 1 >= queue.length) {
            onComplete(newTotalXP);
        } else {
            setCurrentIndex(i => i + 1);
        }
    };

    if (!currentItem) return null;

    const { card } = currentItem;
    const showFidel = card.front_fidel !== null && card.fidel_confidence !== 'pending';

    const renderFrontContent = () => (
        <>
            {showFidel ? (
                <div lang="am" className="text-6xl md:text-7xl fidel-char mb-4 text-slate-900 dark:text-slate-100">{card.front_fidel}</div>
            ) : (
                <div className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">{card.front_roman}</div>
            )}

            {card.audio_key && (
                <button
                    onClick={() => playAudioKey(card.audio_key!)}
                    className="mt-4 p-3 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
            )}
        </>
    );

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[60vh] animate-in fade-in zoom-in-95">
            <div className="w-full max-w-sm flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Review</span>
                <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {queue.length}</span>
            </div>

            <div className="w-full max-w-sm relative perspective-[1000px]" style={{ perspective: '1000px', minHeight: '400px' }}>
                <div
                    className="w-full h-full relative"
                    style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                >
                    {/* Front Face */}
                    <div
                        className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* Progress bar */}
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 w-full absolute top-0 left-0">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                            />
                        </div>

                        <div className="flex-1 flex flex-col p-8 items-center justify-center text-center relative z-10 overflow-y-auto">
                            {renderFrontContent()}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-10">
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Show Answer
                            </button>
                        </div>
                    </div>

                    {/* Back Face */}
                    <div
                        className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {/* Progress bar */}
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 w-full absolute top-0 left-0 z-20">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                            />
                        </div>

                        <div className="flex-1 flex flex-col p-8 items-center justify-start text-center relative z-10 overflow-y-auto mt-2">
                            <div className="scale-75 origin-top mb-2">
                                {renderFrontContent()}
                            </div>

                            <div className="w-full pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">{card.back}</div>
                                {showFidel && (
                                    <div className="text-sm tracking-wide text-slate-500 dark:text-slate-400 mb-4">{card.front_roman}</div>
                                )}

                                {(card as any).example_amharic && (
                                    <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-left">
                                        <div lang="am" className="fidel-char text-lg text-slate-700 dark:text-slate-300">{(card as any).example_amharic}</div>
                                        <div className="text-xs text-slate-500 mt-1">{(card as any).example_transliteration}</div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">{(card as any).example_english}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-10">
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => handleRate('again')} className="py-3 rounded-lg font-bold bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors px-1 text-sm sm:text-base">Again</button>
                                <button onClick={() => handleRate('hard')} className="py-3 rounded-lg font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 transition-colors px-1 text-sm sm:text-base">Hard</button>
                                <button onClick={() => handleRate('good')} className="py-3 rounded-lg font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors px-1 text-sm sm:text-base">Good</button>
                                <button onClick={() => handleRate('easy')} className="py-3 rounded-lg font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors px-1 text-sm sm:text-base">Easy</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SRSModule() {
    const [phase, setPhase] = useState<'setup' | 'session' | 'end'>('setup');
    const [queue, setQueue] = useState<{ card: Card, state: SRSState }[]>([]);
    const [nextDueDate, setNextDueDate] = useState<string | null>(null);
    const [xpEarned, setXPEarned] = useState(0);

    useEffect(() => {
        loadDueCards();
    }, []);

    const loadDueCards = async () => {
        const today = getTodayISO();
        const states = await getDueCards(today);

        if (states.length > 0) {
            const qs = [];
            for (const st of states) {
                const c = await getCard(st.card_id);
                if (c) qs.push({ card: c, state: st });
            }
            setQueue(qs);
        } else {
            // Find next due date
            const allStates = await getAllSRSStates();
            const futureStates = allStates.filter(s => s.due_date > today).sort((a, b) => a.due_date.localeCompare(b.due_date));
            if (futureStates.length > 0) {
                setNextDueDate(futureStates[0].due_date);
            }
        }
    };

    const handleSessionComplete = async (xp: number) => {
        setXPEarned(xp);
        setPhase('end');

        const prefs = await getUserPrefs();
        const today = getTodayISO();
        const newStreak = calculateStreak(prefs.last_study_date, today, prefs.streak_count);

        await putUserPrefs({
            ...prefs,
            streak_count: newStreak,
            last_study_date: today,
            xp_total: prefs.xp_total + xp
        });
    };

    if (phase === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-in zoom-in-95">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Daily Review</h2>

                    {queue.length > 0 ? (
                        <>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                                You have <strong className="text-blue-600 dark:text-blue-400 text-xl">{queue.length}</strong> cards due today.
                            </p>
                            <button
                                onClick={() => setPhase('session')}
                                className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5"
                            >
                                Start Session
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                                You're all caught up! 🎉
                            </p>
                            {nextDueDate && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6">
                                    <p className="text-sm font-medium text-slate-500">Next reviews due</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{nextDueDate}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (phase === 'session') {
        return <FlashcardSession queue={queue} onComplete={handleSessionComplete} />;
    }

    if (phase === 'end') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-in slide-in-from-bottom-8">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="text-6xl mb-6">🌟</div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Session Complete!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Great job keeping up with your reviews.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{queue.length}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Cards</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl flex flex-col items-center border border-emerald-100 dark:border-emerald-800/30">
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">+{Math.round(xpEarned)}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70 mt-1">XP Earned</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
