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
            <div className="flex flex-col max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Comprehension Quiz</h2>
                <div className="flex flex-col gap-8">
                    {dialogue.comprehension_questions.map((q: any, i: number) => {
                        return (
                            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{q.question_en}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt: string, optIdx: number) => {
                                        const isSelected = quizAnswers[i] === optIdx;
                                        const isCorrect = optIdx === q.correct_index;
                                        let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400';
                                        if (quizComplete) {
                                            if (isCorrect) btnClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold';
                                            else if (isSelected) btnClass = 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400';
                                            else btnClass = 'opacity-50';
                                        } else if (isSelected) {
                                            btnClass = 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500';
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
                            className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition-colors"
                        >
                            Submit Answers
                        </button>
                    ) : (
                        <div className={`p-6 text-center rounded-2xl border ${quizScore.correct === quizScore.total ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                            <h3 className="text-2xl font-bold mb-2">You scored {quizScore.correct} / {quizScore.total}!</h3>
                            <p>Returning to dialogues...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-4 md:p-8 min-h-[80vh] animate-in fade-in">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="text-3xl">{SCENARIO_ILLUSTRATIONS[dialogue.id] || '💬'}</span>
                    {dialogue.title}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <input type="checkbox" className="sr-only" checked={showTransliteration} onChange={e => setShowTransliteration(e.target.checked)} />
                    <span className="text-slate-600 dark:text-slate-400">Transliteration</span>
                    <div className={`block w-8 h-5 rounded-full transition-colors ${showTransliteration ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <div className={`mt-0.5 ml-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showTransliteration ? 'translate-x-3' : 'translate-x-0'}`}></div>
                    </div>
                </label>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 pb-32">
                {dialogue.lines.slice(0, currentLineIndex + 1).map((line: any, idx: number) => {
                    const isCurrent = idx === currentLineIndex;
                    const isProductionActive = isCurrent && line.is_production_point && !productionAnswered;

                    return (
                        <div key={idx} className={`flex gap-4 p-4 rounded-2xl transition-all ${isCurrent ? 'bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 ring-1 ring-blue-100 dark:ring-blue-900/30' : 'opacity-60 grayscale-[0.3]'}`}>
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-500">
                                {line.speaker}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                {isProductionActive ? (
                                    <div className="italic text-slate-400 mb-4">You need to reply...</div>
                                ) : (
                                    <>
                                        <div lang="am" className="text-2xl fidel-char text-slate-900 dark:text-slate-100 mb-1">{line.amharic}</div>
                                        {showTransliteration && <div className="text-sm font-medium text-slate-500 mb-2">{line.transliteration}</div>}
                                        <div className="text-slate-600 dark:text-slate-400 text-sm">{line.english}</div>
                                    </>
                                )}

                                {(!isProductionActive && line.audio_key) && (
                                    <button onClick={() => playAudioKey(line.audio_key)} className="mt-3 self-start p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </button>
                                )}

                                {isProductionActive && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        {line.production_options.map((opt: any, oIdx: number) => {
                                            const isWrongChoice = productionSelection === oIdx && !opt.correct;
                                            return (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleProductionSelect(oIdx, opt.correct)}
                                                    className={`p-3 border-2 rounded-xl text-left transition-all ${isWrongChoice
                                                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400'
                                                        }`}
                                                >
                                                    <div lang="am" className="fidel-char text-lg mb-1">{opt.amharic}</div>
                                                    <div className="text-sm text-slate-500">{opt.english}</div>
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
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 z-10 flex justify-center pb-8 pt-12">
                    <button
                        onClick={handleNextLine}
                        className="px-8 py-4 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transform transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                        <span>Tap to Continue</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

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
                <button onClick={() => setActiveDialogue(null)} className="absolute top-4 left-4 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 z-50 bg-white dark:bg-slate-800 rounded-full shadow-md">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <DialoguePlayer dialogue={activeDialogue} onComplete={handleComplete} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Conversations</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDialogues.map(dialogue => {
                    const isComplete = completedMap[dialogue.id];
                    return (
                        <button
                            key={dialogue.id}
                            onClick={() => setActiveDialogue(dialogue)}
                            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 text-left relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="text-5xl mb-4 relative z-10 drop-shadow-sm">
                                {SCENARIO_ILLUSTRATIONS[dialogue.id] || '💬'}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">{dialogue.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 relative z-10 flex-1">{dialogue.scenario}</p>

                            <div className="flex items-center justify-between w-full mt-auto relative z-10">
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                                    {dialogue.lines.length} lines
                                </span>
                                {isComplete && (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
