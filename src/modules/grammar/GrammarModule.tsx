import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import grammarData from '@/data/grammar-exercises.json';
import { getProgress, putProgress, getUserPrefs, putUserPrefs } from '@/lib/db';
import EthiopicKeyboard from '@/components/EthiopicKeyboard';


type Exercise = any;

const allExercises = grammarData as Exercise[];
const uniqueLessons = Array.from(new Set(allExercises.map(e => e.lesson)));

function ReorderExercise({ exercise, onComplete }: { exercise: Exercise, onComplete: (correct: boolean) => void }) {
    const [items, setItems] = useState<number[]>([]);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Randomize initial order to ensure it relies on the user sorting it
        const initial = exercise.words.map((_: any, i: number) => i);
        initial.sort(() => Math.random() - 0.5);
        setItems(initial);
    }, [exercise]);

    useEffect(() => {
        const handleUp = () => setDragIdx(null);
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (dragIdx === null || !listRef.current) return;
            e.preventDefault(); // prevent scroll
            const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
            const children = Array.from(listRef.current.children);
            const dropIdx = children.findIndex(c => {
                const r = c.getBoundingClientRect();
                return clientY >= r.top && clientY <= r.bottom;
            });
            if (dropIdx !== -1 && dropIdx !== dragIdx) {
                setItems(prev => {
                    const newItems = [...prev];
                    const item = newItems[dragIdx];
                    newItems.splice(dragIdx, 1);
                    newItems.splice(dropIdx, 0, item);
                    return newItems;
                });
                setDragIdx(dropIdx);
            }
        };

        if (dragIdx !== null) {
            document.addEventListener('mousemove', handleMove, { passive: false });
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchend', handleUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);
        };
    }, [dragIdx]);

    const handleSubmit = () => {
        const isCorrect = items.every((val, i) => val === exercise.correct_order[i]);
        onComplete(isCorrect);
    };

    return (
        <div className="flex flex-col gap-6">
            <div
                ref={listRef}
                className="flex flex-col gap-3 relative select-none"
            >
                {items.map((wordIdx, i) => {
                    const word = exercise.words[wordIdx];
                    const isDragging = dragIdx === i;
                    return (
                        <div
                            key={wordIdx}
                            onMouseDown={() => setDragIdx(i)}
                            onTouchStart={() => setDragIdx(i)}
                            className={`p-4 rounded-xl border flex items-center justify-between cursor-grab transition-all ${isDragging
                                ? 'bg-primary/10 border-primary z-10 shadow-lg scale-105'
                                : 'bg-surface border-border hover:border-primary/50 shadow-sm'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span lang="am" className="text-xl fidel-char text-text font-medium">{word.amharic}</span>
                                <span className="text-sm text-muted">{word.transliteration}</span>
                            </div>
                            <span className="text-sm font-medium text-muted bg-bg px-3 py-1 rounded-lg border border-border">
                                {word.english}
                            </span>
                        </div>
                    );
                })}
            </div>
            <button onClick={handleSubmit} className="py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg shadow-primary/20">
                Check Answer
            </button>
        </div>
    );
}

function FillBlankExercise({ exercise, onComplete }: { exercise: Exercise, onComplete: (correct: boolean) => void }) {
    const [input, setInput] = useState('');

    const correctAnswer = exercise.options[exercise.correct_option_index].amharic;

    const handleSubmit = () => {
        onComplete(input.trim() === correctAnswer);
    };

    return (
        <div className="flex flex-col gap-6">
            <div lang="am" className="text-2xl text-center fidel-char bg-surface p-6 rounded-2xl border border-border flex items-center justify-center flex-wrap gap-x-2 gap-y-4">
                {exercise.sentence_amharic.split('____').map((part: string, i: number, arr: string[]) => (
                    <React.Fragment key={i}>
                        <span className="text-text">{part}</span>
                        {i < arr.length - 1 && (
                            <span className="inline-block px-4 py-1 border-b-2 border-primary min-w-[80px] text-primary font-bold min-h-[40px] text-center bg-primary/5 rounded-t-sm">
                                {input}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <div className="text-center text-muted font-medium mb-2">{exercise.sentence_english}</div>

            <EthiopicKeyboard
                onCharacter={c => setInput(prev => prev + c)}
                onBackspace={() => setInput(prev => prev.slice(0, -1))}
            />

            <button onClick={handleSubmit} className="py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-colors shadow-lg shadow-primary/20">
                Check Answer
            </button>
        </div>
    );
}

function MultipleChoiceExercise({ exercise, onComplete }: { exercise: Exercise, onComplete: (correct: boolean) => void }) {
    const [selected, setSelected] = useState<number | null>(null);

    const handleSubmit = () => {
        if (selected === null) return;
        onComplete(selected === exercise.correct_index);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-xl font-medium text-text mb-4 text-center">{exercise.question}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exercise.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => setSelected(i)}
                        className={`p-4 rounded-xl border text-center sm:text-left transition-all ${selected === i
                            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/50 bg-surface'
                            }`}
                    >
                        <span lang="am" className="text-xl fidel-char text-text font-medium">{opt}</span>
                    </button>
                ))}
            </div>
            <button
                disabled={selected === null}
                onClick={handleSubmit}
                className="py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 disabled:bg-surface-hover disabled:text-muted disabled:border disabled:border-border text-white transition-colors shadow-lg shadow-primary/20"
            >
                Check Answer
            </button>
        </div>
    );
}

function MatchPairsExercise({ exercise, onComplete }: { exercise: Exercise, onComplete: (c: boolean) => void }) {
    const [leftSelected, setLeftSelected] = useState<number | null>(null);
    const [rightSelected, setRightSelected] = useState<number | null>(null);
    const [matches, setMatches] = useState<Record<number, number>>({});

    // Scramble indices
    const [leftIndices] = useState(() => exercise.pairs.map((_: any, i: number) => i).sort(() => Math.random() - 0.5));
    const [rightIndices] = useState(() => exercise.pairs.map((_: any, i: number) => i).sort(() => Math.random() - 0.5));

    useEffect(() => {
        if (leftSelected !== null && rightSelected !== null) {
            if (leftSelected === rightSelected) {
                setMatches(m => ({ ...m, [leftSelected]: rightSelected }));
                setLeftSelected(null);
                setRightSelected(null);
            } else {
                setTimeout(() => {
                    setLeftSelected(null);
                    setRightSelected(null);
                }, 500);
            }
        }
    }, [leftSelected, rightSelected]);

    const handleSubmit = () => {
        onComplete(Object.keys(matches).length === exercise.pairs.length);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6 relative">
                {/* Visual dividing line */}
                <div className="hidden sm:block absolute left-1/2 top-4 bottom-4 w-px bg-border -translate-x-1/2 rounded-full"></div>

                <div className="flex flex-col gap-3">
                    {leftIndices.map((i: number) => {
                        const isMatched = i in matches;
                        const isSelected = i === leftSelected;
                        return (
                            <button
                                key={`l-${i}`}
                                disabled={isMatched}
                                onClick={() => setLeftSelected(i)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center ${isMatched ? 'opacity-0 invisible' :
                                    isSelected ? 'border-primary bg-primary/10 ring-1 ring-primary/20 shadow-sm' :
                                        'border-border hover:border-primary/50 bg-surface shadow-sm'
                                    }`}
                            >
                                <span lang="am" className="text-2xl fidel-char mb-1 text-text">{exercise.pairs[i].left}</span>
                                <span className="text-xs font-medium text-muted">{exercise.pairs[i].left_gloss}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="flex flex-col gap-3">
                    {rightIndices.map((i: number) => {
                        const isMatched = Object.values(matches).includes(i);
                        const isSelected = i === rightSelected;
                        return (
                            <button
                                key={`r-${i}`}
                                disabled={isMatched}
                                onClick={() => setRightSelected(i)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center min-h-[88px] ${isMatched ? 'opacity-0 invisible' :
                                    isSelected ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/20 shadow-sm' :
                                        'border-border hover:border-secondary/50 bg-surface shadow-sm'
                                    }`}
                            >
                                <span lang="am" className="text-lg font-bold fidel-char text-text">{exercise.pairs[i].right}</span>
                                {exercise.pairs[i].right_gloss && (
                                    <span className="text-xs font-medium text-muted mt-1">{exercise.pairs[i].right_gloss}</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            <button
                disabled={Object.keys(matches).length !== exercise.pairs.length}
                onClick={handleSubmit}
                className="py-4 rounded-xl font-bold bg-primary hover:bg-primary/90 disabled:bg-surface-hover disabled:text-muted disabled:border disabled:border-border text-white transition-colors shadow-lg shadow-primary/20"
            >
                Finish Match
            </button>
        </div>
    );
}

export default function GrammarModule() {
    const navigate = useNavigate();
    const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
    const [currentLesson, setCurrentLesson] = useState<string | null>(null);

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exIndex, setExIndex] = useState(0);
    const [consecutiveCount, setConsecutiveCount] = useState(0);
    const [showReviewPrompt, setShowReviewPrompt] = useState(false);

    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        const unlocked = [uniqueLessons[0]];
        for (let i = 0; i < uniqueLessons.length; i++) {
            const p = await getProgress(`grammar_${uniqueLessons[i]}`);
            if (p?.status === 'complete' && i + 1 < uniqueLessons.length) {
                unlocked.push(uniqueLessons[i + 1]);
            }
        }
        setUnlockedLessons(unlocked);
    };

    const startLesson = (lesson: string) => {
        setCurrentLesson(lesson);
        setExercises(allExercises.filter(e => e.lesson === lesson));
        setExIndex(0);
        setResult(null);
    };

    const currentExercise = exercises[exIndex];

    const handleComplete = async (isCorrect: boolean) => {
        setResult(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            const prefs = await getUserPrefs();
            await putUserPrefs({ ...prefs, xp_total: prefs.xp_total + currentExercise.xp_reward });

            const newCount = consecutiveCount + 1;
            setConsecutiveCount(newCount);
            if (newCount >= 5) {
                setShowReviewPrompt(true);
                setConsecutiveCount(0);
            }
        } else {
            setConsecutiveCount(0);
        }
    };

    const handleNext = async () => {
        if (exIndex + 1 < exercises.length) {
            setExIndex(i => i + 1);
            setResult(null);
        } else {
            await putProgress({
                module_id: `grammar_${currentLesson}`,
                status: 'complete',
                score: 100,
                completed_at: new Date().toISOString()
            });
            loadProgress();
            setCurrentLesson(null);
        }
    };

    if (showReviewPrompt) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-in zoom-in">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-xl">
                    <div className="text-6xl mb-6">🎯</div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">You're on a roll!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">You've completed 5 exercises in a row. It's a great time to review your flashcards in the SRS module.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate('/srs')} className="py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">Go to Review Session</button>
                        <button onClick={() => setShowReviewPrompt(false)} className="py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">Continue Grammar</button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentLesson && currentExercise) {
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setCurrentLesson(null)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{currentLesson}</div>
                    <div className="text-sm font-semibold text-slate-500">{exIndex + 1} / {exercises.length}</div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{currentExercise.instruction}</h2>
                </div>

                {result ? (
                    <div className={`p-6 rounded-2xl mb-6 shadow-sm border ${result === 'correct' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div className={`text-2xl font-bold mb-2 ${result === 'correct' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {result === 'correct' ? 'Correct! 🎉' : 'Incorrect.'}
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 mb-6">{currentExercise.explanation}</div>
                        <button onClick={result === 'correct' ? handleNext : () => setResult(null)} className={`w-full py-4 rounded-xl font-bold text-white transition-colors ${result === 'correct' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700'}`}>
                            {result === 'correct' ? 'Continue' : 'Try Again'}
                        </button>
                    </div>
                ) : (
                    <div className="mb-12">
                        {currentExercise.type === 'reorder' && <ReorderExercise exercise={currentExercise} onComplete={handleComplete} key={currentExercise.id} />}
                        {currentExercise.type === 'fill_blank' && <FillBlankExercise exercise={currentExercise} onComplete={handleComplete} key={currentExercise.id} />}
                        {currentExercise.type === 'multiple_choice' && <MultipleChoiceExercise exercise={currentExercise} onComplete={handleComplete} key={currentExercise.id} />}
                        {currentExercise.type === 'match_pairs' && <MatchPairsExercise exercise={currentExercise} onComplete={handleComplete} key={currentExercise.id} />}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Grammar Lessons</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueLessons.map((lesson) => {
                    const isUnlocked = unlockedLessons.includes(lesson);
                    return (
                        <button
                            key={lesson}
                            disabled={!isUnlocked}
                            onClick={() => startLesson(lesson)}
                            className={`p-6 rounded-2xl flex items-center justify-between transition-all border-2 text-left ${isUnlocked
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 group'
                                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                }`}
                        >
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{lesson}</h3>
                                <p className="text-sm font-medium text-slate-500">
                                    {isUnlocked ? `${allExercises.filter(e => e.lesson === lesson).length} exercises` : 'Complete previous lesson to unlock'}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                }`}>
                                {isUnlocked ? (
                                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
