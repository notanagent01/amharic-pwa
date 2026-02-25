import React, { useState } from 'react';
import vocabData from '@/data/vocab.json';
import type { VocabWord, Card } from '@/types';
import { playAudioKey } from '@/lib/audio';
import { putCard, putSRSState } from '@/lib/db';
import { createInitialSRSState } from '@/lib/srs';

const themes = [
    { id: 'greetings', label: 'Greetings' },
    { id: 'numbers', label: 'Numbers' },
    { id: 'family', label: 'Family' },
    { id: 'food_and_cafe', label: 'Food & Cafe' },
    { id: 'directions', label: 'Directions' },
    { id: 'colors', label: 'Colors' },
    { id: 'days_of_week', label: 'Days' },
];

const allVocab = vocabData as VocabWord[];

function VocabCard({ word, isQuizMode }: { word: VocabWord, isQuizMode: boolean }) {
    const [revealed, setRevealed] = useState(!isQuizMode);
    const [addedToSrs, setAddedToSrs] = useState(false);

    // Sync reveal state when quiz mode toggles
    React.useEffect(() => {
        setRevealed(!isQuizMode);
    }, [isQuizMode]);

    const handleAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (word.audio_key) {
            playAudioKey(word.audio_key).catch(console.error);
        }
    };

    const handleAddToSRS = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (addedToSrs) return;
        try {
            const cardId = `custom_srs_${word.id}_${Date.now()}`;
            const card: Card = {
                id: cardId,
                front_fidel: word.amharic,
                front_roman: word.transliteration,
                fidel_confidence: 'ok',
                back: word.english,
                audio_key: word.audio_key,
                module_id: 'vocab',
            };
            // Inject example fields for the flashcard to pick up
            if ((word as any).example_amharic) {
                (card as any).example_amharic = (word as any).example_amharic;
                (card as any).example_english = (word as any).example_english;
                (card as any).example_transliteration = (word as any).example_transliteration;
            }

            await putCard(card);
            await putSRSState(createInitialSRSState(cardId));
            setAddedToSrs(true);
        } catch (err) {
            console.error('Failed to add to SRS:', err);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className="text-3xl fidel-char text-slate-900 dark:text-slate-100">{word.amharic}</div>
                {word.audio_key && (
                    <button
                        onClick={handleAudio}
                        className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Play Audio"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                )}
            </div>

            {revealed ? (
                <div className="mt-auto animate-in fade-in slide-in-from-top-2">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{word.transliteration}</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{word.english}</div>

                    {(word as any).example_amharic && (
                        <div className="mt-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                            <div className="fidel-char text-slate-700 dark:text-slate-300 font-medium">{(word as any).example_amharic}</div>
                            <div className="text-slate-500 mt-1">{(word as any).example_english}</div>
                        </div>
                    )}

                    {isQuizMode && (
                        <button
                            onClick={handleAddToSRS}
                            disabled={addedToSrs}
                            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${addedToSrs
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                                }`}
                        >
                            {addedToSrs ? 'Added to SRS ✓' : '+ Add to SRS'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="mt-auto pt-4 flex justify-center">
                    <button
                        onClick={() => setRevealed(true)}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
                    >
                        Reveal Translation
                    </button>
                </div>
            )}
        </div>
    );
}

export default function VocabModule() {
    const [activeTheme, setActiveTheme] = useState(themes[0].id);
    const [isQuizMode, setIsQuizMode] = useState(false);

    const displayedWords = allVocab.filter(w => w.theme === activeTheme);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vocabulary</h1>

                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 self-start md:self-auto hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quiz Mode</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isQuizMode} onChange={e => setIsQuizMode(e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isQuizMode ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isQuizMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {themes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => setActiveTheme(theme.id)}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${activeTheme === theme.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {theme.label}
                    </button>
                ))}
            </div>

            {displayedWords.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    No words found for this theme.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedWords.map(word => (
                        <VocabCard key={word.id} word={word} isQuizMode={isQuizMode} />
                    ))}
                </div>
            )}
        </div>
    );
}
