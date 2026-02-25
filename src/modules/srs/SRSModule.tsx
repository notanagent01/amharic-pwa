import { useState, useEffect } from 'react';
import { getTodayISO, applyRating, calculateStreak } from '@/lib/srs';
import type { Rating } from '@/lib/srs';
import { getCard, putSRSState, getUserPrefs, putUserPrefs, getAllSRSStates, getDueCards } from '@/lib/db';
import type { Card, SRSState } from '@/types';
import { playAudioKey } from '@/lib/audio';

// Removed FlashcardProps

import { Icon } from '@/components/ui/Icon';
import { Card as UICard } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

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
                <div lang="am" className="text-6xl md:text-7xl fidel-char mb-4 text-text font-bold">{card.front_fidel}</div>
            ) : (
                <div className="text-4xl md:text-5xl font-bold mb-4 text-text">{card.front_roman}</div>
            )}

            {card.audio_key && (
                <button
                    onClick={(e) => { e.stopPropagation(); playAudioKey(card.audio_key!); }}
                    className="mt-4 p-3 rounded-full bg-surface-hover text-secondary hover:text-primary transition-colors"
                >
                    <Icon name="volume-2" />
                </button>
            )}
        </>
    );

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[60vh] animate-fade-in pb-24">
            <div className="w-full max-w-sm flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted">Review</span>
                <span className="text-sm font-medium text-muted">{currentIndex + 1} / {queue.length}</span>
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
                        className="absolute inset-0 bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col border border-border"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* Progress bar */}
                        <ProgressBar progress={((currentIndex) / queue.length) * 100} height="h-1.5" className="absolute top-0 left-0 rounded-none bg-surface-hover" />

                        <div className="flex-1 flex flex-col p-8 items-center justify-center text-center relative z-10 overflow-y-auto cursor-pointer" onClick={() => setIsFlipped(true)}>
                            {renderFrontContent()}
                        </div>

                        <div className="p-4 bg-bg border-t border-border relative z-10">
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-colors shadow-lg shadow-primary/20"
                            >
                                Show Answer
                            </button>
                        </div>
                    </div>

                    {/* Back Face */}
                    <div
                        className="absolute inset-0 bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col border border-border"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {/* Progress bar */}
                        <ProgressBar progress={((currentIndex) / queue.length) * 100} height="h-1.5" className="absolute top-0 left-0 rounded-none bg-surface-hover z-20" />

                        <div className="flex-1 flex flex-col p-8 items-center justify-start text-center relative z-10 overflow-y-auto mt-2">
                            <div className="scale-75 origin-top mb-2">
                                {renderFrontContent()}
                            </div>

                            <div className="w-full pt-4 border-t border-border">
                                <div className="text-xl font-medium text-text mb-2">{card.back}</div>
                                {showFidel && (
                                    <div className="text-sm tracking-wide text-muted mb-4">{card.front_roman}</div>
                                )}

                                {(card as any).example_amharic && (
                                    <div className="mt-4 bg-bg p-4 rounded-xl text-left border border-border/50">
                                        <div lang="am" className="fidel-char text-lg text-text">{(card as any).example_amharic}</div>
                                        <div className="text-xs text-muted mt-1">{(card as any).example_transliteration}</div>
                                        <div className="text-sm font-medium text-text mt-2">{(card as any).example_english}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-bg border-t border-border relative z-10">
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => handleRate('again')} className="py-3 rounded-lg font-bold bg-[#E63946]/10 text-[#E63946] hover:bg-[#E63946]/20 transition-colors px-1 text-sm sm:text-base border border-[#E63946]/20">Again</button>
                                <button onClick={() => handleRate('hard')} className="py-3 rounded-lg font-bold bg-[#F4A261]/10 text-[#F4A261] hover:bg-[#F4A261]/20 transition-colors px-1 text-sm sm:text-base border border-[#F4A261]/20">Hard</button>
                                <button onClick={() => handleRate('good')} className="py-3 rounded-lg font-bold bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20 transition-colors px-1 text-sm sm:text-base border border-[#4CAF50]/20">Good</button>
                                <button onClick={() => handleRate('easy')} className="py-3 rounded-lg font-bold bg-[#2196F3]/10 text-[#2196F3] hover:bg-[#2196F3]/20 transition-colors px-1 text-sm sm:text-base border border-[#2196F3]/20">Easy</button>
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in pb-24">
                <UICard padding="lg" className="w-full max-w-md text-center">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <Icon name="layers" size={40} className="text-primary" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-text mb-2">Daily Review</h2>

                    {queue.length > 0 ? (
                        <>
                            <p className="text-lg text-muted mb-8">
                                You have <strong className="text-primary text-xl">{queue.length}</strong> cards due today.
                            </p>
                            <button
                                onClick={() => setPhase('session')}
                                className="w-full py-4 rounded-xl font-bold text-lg bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
                            >
                                Start Session
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg text-muted mb-6">
                                You're all caught up! 🎉
                            </p>
                            {nextDueDate && (
                                <div className="bg-bg border border-border p-4 rounded-xl mb-6">
                                    <p className="text-sm font-medium text-muted">Next reviews due</p>
                                    <p className="text-lg font-bold text-text">{nextDueDate}</p>
                                </div>
                            )}
                        </>
                    )}
                </UICard>
            </div>
        );
    }

    if (phase === 'session') {
        return <FlashcardSession queue={queue} onComplete={handleSessionComplete} />;
    }

    if (phase === 'end') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in pb-24">
                <UICard padding="lg" className="w-full max-w-md text-center">
                    <div className="text-6xl mb-6 flex justify-center text-secondary">
                        <Icon name="star" size={64} fill="currentColor" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-text mb-2">Session Complete!</h2>
                    <p className="text-muted mb-8">Great job keeping up with your reviews.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-bg border border-border p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-3xl font-black text-primary">{queue.length}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">Cards</span>
                        </div>
                        <div className="bg-[#4CAF50]/10 p-4 rounded-2xl flex flex-col items-center border border-[#4CAF50]/30">
                            <span className="text-3xl font-black text-[#4CAF50]">+{Math.round(xpEarned)}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#4CAF50]/80 mt-1">XP Earned</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 rounded-xl font-bold bg-surface-hover hover:bg-border text-text transition-colors"
                    >
                        Back to Home
                    </button>
                </UICard>
            </div>
        );
    }

    return null;
}
