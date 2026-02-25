import React, { useState } from 'react';
import vocabData from '@/data/vocab.json';
import type { VocabWord, Card as CardType } from '@/types';
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

import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

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
            const card: CardType = {
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
        <Card padding="lg" className="flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <div lang="am" className="text-3xl fidel-char text-text font-bold">{word.amharic}</div>
                {word.audio_key && (
                    <button
                        onClick={handleAudio}
                        className="p-2 rounded-full text-secondary hover:bg-surface-hover transition-colors"
                        title="Play Audio"
                    >
                        <Icon name="volume-2" size={20} />
                    </button>
                )}
            </div>

            {revealed ? (
                <div className="mt-auto animate-fade-in flex flex-col h-full">
                    <div>
                        <div className="text-sm font-medium text-muted mb-1">{word.transliteration}</div>
                        <div className="text-lg font-bold text-text mb-4">{word.english}</div>

                        {(word as any).example_amharic && (
                            <div className="mt-3 mb-4 p-3 bg-surface border border-border rounded-lg text-sm">
                                <div lang="am" className="fidel-char text-text font-medium">{(word as any).example_amharic}</div>
                                <div className="text-muted mt-1">{(word as any).example_english}</div>
                            </div>
                        )}
                    </div>

                    {isQuizMode && (
                        <div className="mt-auto pt-4">
                            <button
                                onClick={handleAddToSRS}
                                disabled={addedToSrs}
                                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${addedToSrs
                                    ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                                    }`}
                            >
                                {addedToSrs ? 'Added to SRS ✓' : '+ Add to SRS'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-auto pt-4 flex justify-center">
                    <button
                        onClick={() => setRevealed(true)}
                        className="px-6 py-2 bg-surface-hover text-text font-semibold rounded-xl hover:bg-border transition-colors w-full"
                    >
                        Reveal Translation
                    </button>
                </div>
            )}
        </Card>
    );
}

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function VocabModule() {
    const [activeTheme, setActiveTheme] = useState(themes[0].id);
    const [isQuizMode, setIsQuizMode] = useState(false);

    const displayedWords = allVocab.filter(w => w.theme === activeTheme);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <SectionHeader title="Vocabulary" subtitle="Expand your word bank" className="mb-0" />

                <label className="flex items-center gap-3 cursor-pointer bg-surface px-4 py-2 rounded-xl shadow-sm border border-border self-start md:self-auto hover:bg-surface-hover transition-colors">
                    <span className="text-sm font-semibold text-text">Quiz Mode</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isQuizMode} onChange={e => setIsQuizMode(e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isQuizMode ? 'bg-primary' : 'bg-surface-hover'}`}></div>
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
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-surface text-muted hover:bg-surface-hover hover:text-text border border-border'
                            }`}
                    >
                        {theme.label}
                    </button>
                ))}
            </div>

            {displayedWords.length === 0 ? (
                <div className="text-center py-20 text-muted">
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
