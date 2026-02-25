import React, { useState, useRef, useEffect } from 'react';
import type { FidelChar, Progress } from '@/types';
import { getGroup } from '@/lib/fidel';
import { playAudioKey } from '@/lib/audio';
import { getAllProgress, putProgress } from '@/lib/db';
import { compareStroke, renderCharacterOutline, renderStrokeHint, clearTracingLayer } from '@/lib/tracing';
import type { ReferenceStroke, Stroke, StrokeResult } from '@/lib/tracing';
import ConfettiAnimation from '@/components/ConfettiAnimation';

// --- Placeholder SVGs for group animations ---
const SVGAnimations: Record<string, React.ReactNode> = {
    A: (
        <svg width="400" height="400" viewBox="0 0 100 100" className="mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
            <path d="M 20 80 L 20 20 L 80 20 L 80 80 M 20 50 L 80 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="300" strokeDashoffset="300" className="text-emerald-500">
                <animate attributeName="stroke-dashoffset" values="300;0" dur="2.4s" fill="freeze" />
            </path>
        </svg>
    ),
    B: (
        <svg width="400" height="400" viewBox="0 0 100 100" className="mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
            <path d="M 20 20 L 20 80 L 80 80 L 80 20 M 60 80 L 60 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="300" strokeDashoffset="300" className="text-blue-500">
                <animate attributeName="stroke-dashoffset" values="300;0" dur="2.4s" fill="freeze" />
            </path>
        </svg>
    ),
    C: (
        <svg width="400" height="400" viewBox="0 0 100 100" className="mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
            <path d="M 20 20 L 20 80 L 80 80 L 80 20 M 20 50 L 80 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="300" strokeDashoffset="300" className="text-purple-500">
                <animate attributeName="stroke-dashoffset" values="300;0" dur="2.4s" fill="freeze" />
            </path>
        </svg>
    ),
    LAB: (
        <svg width="400" height="400" viewBox="0 0 100 100" className="mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
            <path d="M 50 20 L 50 80 M 20 50 L 80 50 M 35 35 L 35 35.1 M 65 35 L 65 35.1" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="300" strokeDashoffset="300" className="text-amber-500">
                <animate attributeName="stroke-dashoffset" values="300;0" dur="2.4s" fill="freeze" />
            </path>
        </svg>
    ),
};

// Generic reference strokes for tracing canvas
function getReferenceStrokes(): ReferenceStroke[] {
    return [
        { points: [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }], stroke_index: 0, stroke_count: 2 },
        { points: [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 }], stroke_index: 1, stroke_count: 2 }
    ];
}

// --- FidelTracing Component ---
function FidelTracing({ char, onBack }: { char: FidelChar, onBack: () => void }) {
    const [phase, setPhase] = useState<'intro' | 'tracing' | 'result'>('intro');
    const [strokeIndex, setStrokeIndex] = useState(0);
    const [results, setResults] = useState<StrokeResult[]>([]);
    const [hintProgress, setHintProgress] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentStrokeRef = useRef<Stroke>([]);
    const isDrawingRef = useRef(false);
    // hintIntervalRef removed
    const lastActivityRef = useRef<number>(Date.now());

    const refStrokes = getReferenceStrokes();

    useEffect(() => {
        if (phase === 'intro') {
            const timer = setTimeout(() => setPhase('tracing'), 3000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Hint timer logic
    useEffect(() => {
        if (phase !== 'tracing') return;

        const tick = () => {
            const now = Date.now();
            if (now - lastActivityRef.current > 2000 && !isDrawingRef.current) {
                setHintProgress(p => (p + 0.02) % 1);
                redrawCanvas();
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && strokeIndex < refStrokes.length) {
                    renderStrokeHint(ctx, refStrokes[strokeIndex], 400, 400, hintProgress);
                }
            }
        };
        const id = window.setInterval(tick, 50);
        return () => window.clearInterval(id);
    }, [phase, strokeIndex, hintProgress]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        clearTracingLayer(ctx, canvas.width, canvas.height);
        renderCharacterOutline(ctx, refStrokes, canvas.width, canvas.height);

        // iteration removed

        if (currentStrokeRef.current.length > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const st = currentStrokeRef.current;
            ctx.moveTo(st[0].x, st[0].y);
            for (let i = 1; i < st.length; i++) {
                ctx.lineTo(st[i].x, st[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX;
            clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawingRef.current = true;
        lastActivityRef.current = Date.now();
        currentStrokeRef.current = [getPos(e)];
        redrawCanvas();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current) return;
        lastActivityRef.current = Date.now();
        currentStrokeRef.current.push(getPos(e));
        redrawCanvas();
    };

    const endDraw = async () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        lastActivityRef.current = Date.now();

        const canvas = canvasRef.current;
        if (!canvas || currentStrokeRef.current.length < 2) {
            currentStrokeRef.current = [];
            redrawCanvas();
            return;
        }

        const refStroke = refStrokes[strokeIndex];
        const res = compareStroke(currentStrokeRef.current, refStroke, canvas.width, canvas.height);

        currentStrokeRef.current = [];
        setResults(prev => [...prev, res]);

        if (strokeIndex + 1 >= refStrokes.length) {
            setPhase('result');
            const allRes = [...results, res];
            const avgScore = allRes.reduce((sum, r) => sum + r.score, 0) / allRes.length;
            if (avgScore >= 0.65) {
                await putProgress({
                    module_id: `char_${char.id}`,
                    status: 'complete',
                    score: Math.round(avgScore * 100),
                    completed_at: new Date().toISOString()
                });
            }
            playAudioKey(`char_${char.base_consonant_romanization}_ord1`).catch(console.error);
        } else {
            setStrokeIndex(i => i + 1);
            redrawCanvas();
        }
    };

    useEffect(() => {
        if (phase === 'tracing') {
            redrawCanvas();
        }
    }, [phase]);

    if (phase === 'intro') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in">
                <h2 className="text-2xl font-bold mb-8 text-text">Watch Stroke Order</h2>
                <div className="w-full max-w-[400px] aspect-square bg-surface border border-border rounded-xl">
                    {SVGAnimations[char.group] || SVGAnimations.A}
                </div>
            </div>
        );
    }

    if (phase === 'result') {
        const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
        const isSuccess = avgScore >= 0.65;
        const showConfetti = avgScore >= 0.90;

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in">
                {showConfetti && <ConfettiAnimation />}
                <div lang="am" className="text-8xl mb-8 font-bold text-center fidel-char text-text">{char.display_name}</div>
                <div className={`text-3xl font-bold mb-6 ${isSuccess ? 'text-[#4CAF50]' : 'text-secondary'}`}>
                    {isSuccess ? 'Mastered!' : 'Keep Practicing'}
                </div>
                <div className="text-lg mb-12 text-muted">
                    Accuracy: {Math.round(avgScore * 100)}%
                </div>
                <div className="flex gap-4">
                    <button onClick={() => {
                        setPhase('tracing');
                        setStrokeIndex(0);
                        setResults([]);
                    }} className="px-6 py-3 rounded-xl font-semibold bg-surface border border-border text-text hover:bg-surface-hover transition">
                        Retry
                    </button>
                    <button onClick={onBack} className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-lg shadow-primary/30">
                        Next Character
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4 max-w-lg mx-auto w-full pb-24">
            <div className="flex w-full items-center justify-between mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-text transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-bold font-mono text-text">{char.base_consonant_romanization.toUpperCase()}</h2>
                <div className="w-10"></div>
            </div>

            <div className="w-full max-w-[400px] aspect-square bg-surface border border-border rounded-2xl shadow-inner relative touch-none overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                    onTouchCancel={endDraw}
                />
                <div className="absolute top-4 right-4 flex gap-1">
                    {refStrokes.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < strokeIndex ? (results[i]?.is_correct ? 'bg-[#4CAF50]' : 'bg-primary') :
                            i === strokeIndex ? 'bg-secondary animate-pulse' : 'bg-surface-hover'
                            }`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

import { SectionHeader } from '@/components/ui/SectionHeader';

// --- FidelChart Component ---
export default function FidelModule() {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'LAB'>('A');
    const [tracingChar, setTracingChar] = useState<FidelChar | null>(null);
    const [progresses, setProgresses] = useState<Record<string, Progress>>({});

    useEffect(() => {
        getAllProgress().then(p => {
            const map: Record<string, Progress> = {};
            p.forEach(prog => map[prog.module_id] = prog);
            setProgresses(map);
        }).catch(console.error);
    }, [tracingChar]); // Refresh on return to chart

    if (tracingChar) {
        return <FidelTracing char={tracingChar} onBack={() => setTracingChar(null)} />;
    }

    const chars = getGroup(activeTab);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
            <SectionHeader title="Fidel Script" subtitle="Master the Ethiopic alphabet" />

            <div className="flex space-x-2 mb-8 bg-surface/50 p-1.5 rounded-xl overflow-x-auto hide-scrollbar border border-border">
                {(['A', 'B', 'C', 'LAB'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-sm ${activeTab === tab
                            ? 'bg-surface text-primary shadow-md ring-1 ring-border'
                            : 'text-muted hover:bg-surface-hover hover:text-text'
                            }`}
                    >
                        Group {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chars.map(char => {
                    // Check for fake fidel_confidence prop as requested
                    const isPending = (char as any).fidel_confidence === 'pending';
                    const prog = progresses[`char_${char.id}`];
                    const badgeColor = prog?.status === 'complete' ? 'bg-[#4CAF50]' : prog ? 'bg-secondary' : 'bg-surface-hover';

                    return (
                        <button
                            key={char.id}
                            disabled={isPending}
                            onClick={() => !isPending && setTracingChar(char)}
                            className={`relative flex flex-col p-4 rounded-2xl border transition-all text-left overflow-hidden ${isPending
                                ? 'border-border/50 bg-surface/30 opacity-60 cursor-not-allowed'
                                : 'border-border bg-surface hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-sm font-mono font-bold tracking-widest ${isPending ? 'italic text-muted/50' : 'text-muted'}`}>
                                    {char.base_consonant_romanization.toUpperCase()}
                                </span>
                                {isPending ? (
                                    <span className="text-secondary text-sm" title="Pending content">⚠️</span>
                                ) : (
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${badgeColor}`} />
                                )}
                            </div>

                            <div className="flex justify-between items-end gap-1 mt-auto">
                                {char.orders.map(o => (
                                    <div key={o.order} className="flex flex-col items-center gap-1 group">
                                        <span lang="am" className="text-2xl md:text-3xl fidel-char text-text group-hover:text-primary transition-colors">
                                            {o.char}
                                        </span>
                                        <span className="text-[10px] text-muted font-medium">
                                            {o.romanization}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
