import { useEffect, useRef } from 'react';
import type { WaveformData } from '@/lib/audio';

interface WaveformDisplayProps {
  native_waveform: WaveformData | null;
  user_waveform: WaveformData | null;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 120;

function resolveCssColor(variable: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const value = rootStyles.getPropertyValue(variable).trim();
  return value.length > 0 ? value : fallback;
}

function clearCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (context === null) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  return context;
}

function drawWaveform(canvas: HTMLCanvasElement, waveform: WaveformData | null, color: string): void {
  const context = clearCanvas(canvas);
  if (context === null) {
    return;
  }

  const { width, height } = canvas;
  context.fillStyle = 'rgba(15, 15, 26, 0.35)';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  if (waveform === null || waveform.samples.length === 0) {
    return;
  }

  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();

  const denominator = waveform.samples.length > 1 ? waveform.samples.length - 1 : 1;
  for (let index = 0; index < waveform.samples.length; index += 1) {
    const x = (index / denominator) * width;
    const clampedSample = Math.max(-1, Math.min(1, waveform.samples[index]));
    const y = height / 2 - clampedSample * (height * 0.44);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.stroke();
}

function drawUserPlaceholder(canvas: HTMLCanvasElement): void {
  const context = clearCanvas(canvas);
  if (context === null) {
    return;
  }

  const { width, height } = canvas;
  context.fillStyle = 'rgba(15, 15, 26, 0.2)';
  context.fillRect(0, 0, width, height);

  context.setLineDash([8, 6]);
  context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  context.lineWidth = 1.5;
  context.strokeRect(8, 8, width - 16, height - 16);
  context.setLineDash([]);

  context.fillStyle = 'rgba(234, 234, 234, 0.9)';
  context.font = '600 14px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Record your attempt', width / 2, height / 2);
}

export default function WaveformDisplay({
  native_waveform,
  user_waveform,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
}: WaveformDisplayProps) {
  const nativeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const userCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = nativeCanvasRef.current;
    if (canvas === null) {
      return;
    }

    const accentColor = resolveCssColor('--color-accent', '#e94560');
    drawWaveform(canvas, native_waveform, accentColor);
  }, [native_waveform, width, height]);

  useEffect(() => {
    const canvas = userCanvasRef.current;
    if (canvas === null) {
      return;
    }

    if (user_waveform === null) {
      drawUserPlaceholder(canvas);
      return;
    }

    const userColor = resolveCssColor('--color-accent2', '#0f3460');
    drawWaveform(canvas, user_waveform, userColor);
  }, [user_waveform, width, height]);

  return (
    <section className="w-full rounded-xl border border-white/10 bg-[var(--color-surface)] p-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Native</p>
          <canvas
            ref={nativeCanvasRef}
            width={width}
            height={height}
            className="block w-full rounded-md border border-white/10 bg-black/10"
          />
        </div>
        <div className="space-y-1">
          <p className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">You</p>
          <canvas
            ref={userCanvasRef}
            width={width}
            height={height}
            className="block w-full rounded-md border border-white/10 bg-black/10"
          />
        </div>
      </div>
    </section>
  );
}
