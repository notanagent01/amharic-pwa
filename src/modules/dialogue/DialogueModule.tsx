import { useState, useEffect } from 'react';
import { getProgress, putProgress } from '@/lib/db';
import dialoguesData from '@/data/dialogues.json';
import { playAudioKey } from '@/lib/audio';

// Removed unused types
type Dialogue = any;

const allDialogues = dialoguesData as Dialogue[];

const SCENARIO_ILLUSTRATIONS: Record<string, string> = {
    dial_001: '☕️',
    dial_002: '🚕',
    dial_003: '🛒',
    dial_004: '🤝',
    dial_005: '🍽️',
    dial_006: '🏥',
    dial_007: '🏨',
    dial_008: '🚌'
};

function DialoguePlayer({ dialogue, onComplete }: { dialogue: Dialogue, onComplete: (score: number) => void }) {
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [showTransliteration, setShowTransliteration] = useState(false);

    // State for the active line if it's a production point
    const [productionAnswered, setProductionAnswered] = useState<boolean>(false);
    const [productionSelection, setProductionSelection] = useState<number | null>(null);

    // State for comprehension quiz
    const [inQuiz, setInQuiz] = useState(false);
    const [quizScore, setQuizScore] = useState<{ correct: number, total: number }>({ correct: 0, total: 0 });
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizComplete, setQuizComplete] = useState(false);

    useEffect(() => {
        // Start with the first line
        handleNextLine();
    }, []);

    const handleNextLine = () => {
        const nextIdx = currentLineIndex + 1;
        if (nextIdx < dialogue.lines.length) {
            setCurrentLineIndex(nextIdx);
            setProductionAnswered(false);
            setProductionSelection(null);
            const nextLine = dialogue.lines[nextIdx];
            if (!nextLine.is_production_point && nextLine.audio_key) {
                playAudioKey(nextLine.audio_key).catch(console.error);
            }
        } else {
            // Done with lines, go to quiz
            setInQuiz(true);
        }
    };

    const currentLine = dialogue.lines[currentLineIndex];

    const handleProductionSelect = (index: number, isCorrect: boolean) => {
        setProductionSelection(index);
        if (isCorrect) {
            setProductionAnswered(true);
            if (currentLine?.audio_key) {
                playAudioKey(currentLine.audio_key).catch(console.error);
            }
            setTimeout(() => {
                handleNextLine();
            }, 2000);
        }
    };

    const handleQuizSelect = (qIndex: number, oIndex: number) => {
        if (quizComplete) return;
        setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
    };

    const submitQuiz = () => {
        let correct = 0;
        dialogue.comprehension_questions.forEach((q: any, i: number) => {
            if (quizAnswers[i] === q.correct_index) correct++;
        });
        setQuizScore({ correct, total: dialogue.comprehension_questions.length });
        setQuizComplete(true);

        // Save progress and complete
        const scorePct = Math.round((correct / dialogue.comprehension_questions.length) * 100);
        setTimeout(() => {
            onComplete(scorePct);
        }, 2000);
    };

    if (inQuiz) {
        return (
            <div className="flex flex-col max-w-2xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
                <h2 className="text-2xl font-bold mb-6 text-text">Comprehension Quiz</h2>
                <div className="flex flex-col gap-8">
                    {dialogue.comprehension_questions.map((q: any, i: number) => {
                        return (
                            <div key={i} className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                                <h3 className="text-lg font-medium text-text mb-4">{q.question_en}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt: string, optIdx: number) => {
                                        const isSelected = quizAnswers[i] === optIdx;
                                        const isCorrect = optIdx === q.correct_index;
                                        let btnClass = 'bg-surface border-border hover:border-primary/50 text-text';
                                        if (quizComplete) {
                                            if (isCorrect) btnClass = 'bg-[#4CAF50]/10 border-[#4CAF50] text-[#4CAF50] font-bold';
                                            else if (isSelected) btnClass = 'bg-[#E63946]/10 border-[#E63946] text-[#E63946]';
                                            else btnClass = 'opacity-50 border-border text-muted bg-surface';
                                        } else if (isSelected) {
                                            btnClass = 'bg-primary/10 border-primary ring-1 ring-primary text-text';
                                        }
                                        return (
                                            <button
                                                key={optIdx}
                                                disabled={quizComplete}
                                                onClick={() => handleQuizSelect(i, optIdx)}
                                                className={`p-4 border-2 rounded-xl text-left transition-all ${btnClass}`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8">
                    {!quizComplete ? (
                        <button
                            disabled={Object.keys(quizAnswers).length < dialogue.comprehension_questions.length}
                            onClick={submitQuiz}
                            className="w-full py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 disabled:bg-surface-hover disabled:text-muted disabled:opacity-50 text-white transition-colors"
                        >
                            Submit Answers
                        </button>
                    ) : (
                        <div className={`p-6 text-center rounded-2xl border ${quizScore.correct === quizScore.total ? 'bg-[#4CAF50]/10 border-[#4CAF50]/50 text-[#4CAF50]' : 'bg-secondary/10 border-secondary/50 text-secondary'}`}>
                            <h3 className="text-2xl font-bold mb-2">You scored {quizScore.correct} / {quizScore.total}!</h3>
                            <p>Returning to dialogues...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-4 md:p-8 min-h-[80vh] animate-fade-in pb-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
                <h2 className="text-2xl font-bold text-text flex items-center gap-3">
                    <span className="text-3xl bg-surface-hover p-2 rounded-xl border border-border">{SCENARIO_ILLUSTRATIONS[dialogue.id] || '💬'}</span>
                    {dialogue.title}
                </h2>
                <label className="flex items-center gap-3 cursor-pointer bg-surface px-4 py-2 rounded-xl shadow-sm border border-border self-start sm:self-auto hover:bg-surface-hover transition-colors mt-4 sm:mt-0">
                    <span className="text-sm font-semibold text-text">Transliteration</span>
                    <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only" checked={showTransliteration} onChange={e => setShowTransliteration(e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${showTransliteration ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showTransliteration ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 pb-32 hide-scrollbar">
                {dialogue.lines.slice(0, currentLineIndex + 1).map((line: any, idx: number) => {
                    const isCurrent = idx === currentLineIndex;
                    const isProductionActive = isCurrent && line.is_production_point && !productionAnswered;

                    return (
                        <div key={idx} className={`flex gap-4 p-4 rounded-2xl transition-all ${isCurrent ? 'bg-surface shadow-md border border-border ring-1 ring-primary/20' : 'opacity-60 grayscale-[0.3] bg-bg border border-transparent'}`}>
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center font-bold text-lg text-muted mt-1 border border-border">
                                {line.speaker}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                {isProductionActive ? (
                                    <div className="italic text-muted mb-4 font-semibold">You need to reply...</div>
                                ) : (
                                    <>
                                        <div lang="am" className="text-2xl fidel-char text-text mb-1">{line.amharic}</div>
                                        {showTransliteration && <div className="text-sm font-medium text-muted mb-2">{line.transliteration}</div>}
                                        <div className="text-muted text-sm">{line.english}</div>
                                    </>
                                )}

                                {(!isProductionActive && line.audio_key) && (
                                    <button onClick={() => playAudioKey(line.audio_key)} className="mt-3 self-start p-2 rounded-full text-secondary hover:bg-surface-hover transition-colors flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </button>
                                )}

                                {isProductionActive && (
                                    <div className="mt-4 flex flex-col gap-2 relative z-10">
                                        {line.production_options.map((opt: any, oIdx: number) => {
                                            const isWrongChoice = productionSelection === oIdx && !opt.correct;
                                            return (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleProductionSelect(oIdx, opt.correct)}
                                                    className={`p-3 border-2 rounded-xl text-left transition-all ${isWrongChoice
                                                        ? 'border-[#E63946] bg-[#E63946]/10 text-[#E63946]'
                                                        : 'border-border bg-surface hover:border-primary/50 text-text'
                                                        }`}
                                                >
                                                    <div lang="am" className="fidel-char text-lg mb-1 font-medium">{opt.amharic}</div>
                                                    <div className="text-sm text-muted">{opt.english}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {(!currentLine?.is_production_point || productionAnswered) && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg to-transparent z-10 flex justify-center pb-24 pt-12 pointer-events-none border-t border-transparent">
                    <button
                        onClick={handleNextLine}
                        className="px-8 py-4 rounded-full font-bold text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transform transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2 pointer-events-auto"
                    >
                        <span>Tap to Continue</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

export default function DialogueModule() {
    const [activeDialogue, setActiveDialogue] = useState<Dialogue | null>(null);
    const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadProgress();
    }, [activeDialogue]);

    const loadProgress = async () => {
        const map: Record<string, boolean> = {};
        for (const d of allDialogues) {
            const p = await getProgress(`dialog_${d.id}`);
            if (p?.status === 'complete') {
                map[d.id] = true;
            }
        }
        setCompletedMap(map);
    };

    const handleComplete = async (score: number) => {
        if (activeDialogue) {
            await putProgress({
                module_id: `dialog_${activeDialogue.id}`,
                status: 'complete',
                score,
                completed_at: new Date().toISOString()
            });
            setActiveDialogue(null);
        }
    };

    if (activeDialogue) {
        return (
            <div>
                <button onClick={() => setActiveDialogue(null)} className="absolute top-4 left-4 p-2 text-muted hover:text-text z-50 bg-surface rounded-full shadow-md border border-border">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <DialoguePlayer dialogue={activeDialogue} onComplete={handleComplete} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
            <SectionHeader title="Conversations" subtitle="Practice real-world dialogues" className="mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDialogues.map(dialogue => {
                    const isComplete = completedMap[dialogue.id];
                    return (
                        <Card
                            key={dialogue.id}
                            padding="none"
                            interactive
                            onClick={() => setActiveDialogue(dialogue)}
                            className="p-6 flex flex-col items-start transition-all hover:-translate-y-1 text-left group min-h-[220px]"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="text-5xl mb-4 relative z-10 drop-shadow-sm bg-surface-hover w-16 h-16 rounded-2xl flex items-center justify-center border border-border/50">
                                {SCENARIO_ILLUSTRATIONS[dialogue.id] || '💬'}
                            </div>

                            <h3 className="text-xl font-bold text-text mb-2 relative z-10">{dialogue.title}</h3>
                            <p className="text-muted text-sm mb-6 relative z-10 flex-1">{dialogue.scenario}</p>

                            <div className="flex items-center justify-between w-full mt-auto relative z-10">
                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                    {dialogue.lines.length} lines
                                </span>
                                {isComplete && (
                                    <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
