import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractWaveform, getESpeakInstance } from './audio';

function createMockAudioBuffer(length: number, sampleRate: number = 48000): AudioBuffer {
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    samples[index] = Math.sin(index / 12);
  }

  const mock = {
    length,
    duration: length / sampleRate,
    numberOfChannels: 1,
    getChannelData: (_channelIndex: number): Float32Array => samples
  };

  return mock as unknown as AudioBuffer;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractWaveform', () => {
  it('returns the requested number of samples', () => {
    const audioBuffer = createMockAudioBuffer(1200);
    const waveform = extractWaveform(audioBuffer, 200);

    expect(waveform.samples).toHaveLength(200);
    expect(waveform.duration).toBeCloseTo(1200 / 48000);
  });
});

describe('getESpeakInstance', () => {
  it('loads once and reuses the same instance on subsequent calls', async () => {
    const wasmHeader = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(wasmHeader, { status: 200 }));

    const exportsObject: Record<string, unknown> = {};
    const instantiateSpy = vi.spyOn(WebAssembly, 'instantiate').mockResolvedValue(
      { exports: exportsObject } as unknown as WebAssembly.Instance
    );

    const first = await getESpeakInstance();
    const second = await getESpeakInstance();

    expect(first).toBe(exportsObject);
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(instantiateSpy).toHaveBeenCalledTimes(1);
  });
});
