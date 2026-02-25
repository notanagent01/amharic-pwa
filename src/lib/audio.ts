const AUDIO_BASE_PATH = '/audio';
const AUDIO_FILE_EXTENSION = '.webm';
const DEFAULT_PLAYBACK_RATE = 1;
const DEFAULT_WAVEFORM_SAMPLES = 200;
const RECORDING_MIME_TYPE = 'audio/webm;codecs=opus';
const ESPEAK_WASM_PATH = '/espeak-ng.wasm';
const DEFAULT_ESPEAK_SAMPLE_RATE = 22050;

type PlaybackRate = 1 | 0.75;
type SynthesizedAudioPayload =
  | ArrayBuffer
  | Float32Array
  | Int16Array
  | Uint8Array
  | {
      pcm?: ArrayBuffer | Float32Array | Int16Array | Uint8Array;
      audioData?: ArrayBuffer | Float32Array | Int16Array | Uint8Array;
      sampleRate?: number;
    };

export interface ESpeakInstance {
  sampleRate?: number;
  synthesize?: (text: string, voice: string) => Promise<SynthesizedAudioPayload> | SynthesizedAudioPayload;
  synthesizeAmharic?: (text: string) => Promise<SynthesizedAudioPayload> | SynthesizedAudioPayload;
}

// ── Playback ──────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
const audioCache = new Map<string, AudioBuffer>();
const audioLoadInFlight = new Map<string, Promise<AudioBuffer>>();

export function getAudioContext(): AudioContext {
  if (audioCtx === null) {
    const AudioContextConstructor = globalThis.AudioContext;
    if (AudioContextConstructor === undefined) {
      throw new Error('AUDIO_CONTEXT_UNSUPPORTED');
    }

    audioCtx = new AudioContextConstructor();
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => undefined);
  }

  return audioCtx;
}

export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AUDIO_FETCH_FAILED:${response.status}`);
  }

  const encodedAudio = await response.arrayBuffer();
  return arrayBufferToAudioBuffer(encodedAudio);
}

export function playBuffer(buffer: AudioBuffer, playback_rate: PlaybackRate): { stop: () => void } {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined);
  }

  const sourceNode = context.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.playbackRate.value = playback_rate;
  sourceNode.connect(context.destination);

  let hasStopped = false;
  const cleanup = (): void => {
    sourceNode.disconnect();
    sourceNode.onended = null;
  };

  sourceNode.onended = cleanup;
  sourceNode.start(0);

  return {
    stop: (): void => {
      if (hasStopped) {
        return;
      }

      hasStopped = true;
      try {
        sourceNode.stop();
      } catch {
        // ignore InvalidStateError if the source already ended naturally
      }
      cleanup();
    }
  };
}

async function getCachedAudioBuffer(audioKey: string): Promise<AudioBuffer> {
  const cached = audioCache.get(audioKey);
  if (cached !== undefined) {
    return cached;
  }

  const inFlight = audioLoadInFlight.get(audioKey);
  if (inFlight !== undefined) {
    return inFlight;
  }

  const audioPath = `${AUDIO_BASE_PATH}/${encodeURIComponent(audioKey)}${AUDIO_FILE_EXTENSION}`;
  const loadingPromise = loadAudioBuffer(audioPath)
    .then((buffer) => {
      audioCache.set(audioKey, buffer);
      audioLoadInFlight.delete(audioKey);
      return buffer;
    })
    .catch((error: unknown) => {
      audioLoadInFlight.delete(audioKey);
      throw error;
    });

  audioLoadInFlight.set(audioKey, loadingPromise);
  return loadingPromise;
}

export async function playAudioKey(
  audio_key: string,
  playback_rate: PlaybackRate = DEFAULT_PLAYBACK_RATE
): Promise<{ stop: () => void }> {
  const buffer = await getCachedAudioBuffer(audio_key);
  return playBuffer(buffer, playback_rate);
}

// ── Recording ─────────────────────────────────────────────────────────────────

export interface RecordingSession {
  stop: () => Promise<ArrayBuffer>;
  getWaveformData: () => Float32Array;
}

function isMicPermissionDenied(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.name === 'SecurityError')
  );
}

function resolveRecordingMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return RECORDING_MIME_TYPE;
  }

  if (MediaRecorder.isTypeSupported(RECORDING_MIME_TYPE)) {
    return RECORDING_MIME_TYPE;
  }

  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm';
  }

  return '';
}

export async function startRecording(): Promise<RecordingSession> {
  if (typeof navigator === 'undefined' || navigator.mediaDevices?.getUserMedia === undefined) {
    throw new Error('MIC_UNAVAILABLE');
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error: unknown) {
    if (isMicPermissionDenied(error)) {
      throw new Error('MIC_PERMISSION_DENIED');
    }
    throw error;
  }

  const mimeType = resolveRecordingMimeType();
  const recorderOptions = mimeType.length > 0 ? { mimeType } : undefined;
  const mediaRecorder = recorderOptions === undefined ? new MediaRecorder(stream) : new MediaRecorder(stream, recorderOptions);
  const chunks: BlobPart[] = [];

  mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const context = getAudioContext();
  const analyserNode = context.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.smoothingTimeConstant = 0.85;

  const sourceNode = context.createMediaStreamSource(stream);
  sourceNode.connect(analyserNode);
  const waveformScratch = new Float32Array(analyserNode.fftSize);

  try {
    mediaRecorder.start(100);
  } catch (error: unknown) {
    sourceNode.disconnect();
    analyserNode.disconnect();
    for (const track of stream.getTracks()) {
      track.stop();
    }
    throw error;
  }

  let stopPromise: Promise<ArrayBuffer> | null = null;
  let cleanedUp = false;

  const cleanup = (): void => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;

    sourceNode.disconnect();
    analyserNode.disconnect();
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };

  const stop = (): Promise<ArrayBuffer> => {
    if (stopPromise !== null) {
      return stopPromise;
    }

    stopPromise = (async (): Promise<ArrayBuffer> => {
      if (mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve, reject) => {
          const onStop = (): void => {
            mediaRecorder.removeEventListener('error', onError);
            resolve();
          };

          const onError = (): void => {
            mediaRecorder.removeEventListener('stop', onStop);
            reject(new Error('RECORDING_ERROR'));
          };

          mediaRecorder.addEventListener('stop', onStop, { once: true });
          mediaRecorder.addEventListener('error', onError, { once: true });
          mediaRecorder.stop();
        });
      }

      cleanup();
      const outputType = mediaRecorder.mimeType.length > 0 ? mediaRecorder.mimeType : mimeType || RECORDING_MIME_TYPE;
      const recordingBlob = new Blob(chunks, { type: outputType });
      return recordingBlob.arrayBuffer();
    })();

    return stopPromise;
  };

  const getWaveformData = (): Float32Array => {
    analyserNode.getFloatTimeDomainData(waveformScratch);
    return new Float32Array(waveformScratch);
  };

  return { stop, getWaveformData };
}

export async function arrayBufferToAudioBuffer(buffer: ArrayBuffer): Promise<AudioBuffer> {
  const context = getAudioContext();
  const copy = buffer.slice(0);
  return context.decodeAudioData(copy);
}

// ── Waveform ──────────────────────────────────────────────────────────────────

export interface WaveformData {
  samples: Float32Array;
  duration: number;
}

export function extractWaveform(buffer: AudioBuffer, sample_count: number = DEFAULT_WAVEFORM_SAMPLES): WaveformData {
  const safeSampleCount = Math.max(1, Math.floor(sample_count));
  const samples = new Float32Array(safeSampleCount);
  const duration = buffer.duration;

  if (buffer.length === 0 || buffer.numberOfChannels === 0) {
    return { samples, duration };
  }

  const channels: Float32Array[] = [];
  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    channels.push(buffer.getChannelData(channelIndex));
  }

  const framesPerSample = buffer.length / safeSampleCount;

  for (let sampleIndex = 0; sampleIndex < safeSampleCount; sampleIndex += 1) {
    const startFrame = Math.floor(sampleIndex * framesPerSample);
    const nextFrame = Math.floor((sampleIndex + 1) * framesPerSample);
    const endFrame = Math.max(startFrame + 1, Math.min(buffer.length, nextFrame));

    let peak = 0;
    for (let frame = startFrame; frame < endFrame; frame += 1) {
      let mixedSample = 0;
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
        mixedSample += channels[channelIndex][frame];
      }
      mixedSample /= channels.length;

      if (Math.abs(mixedSample) > Math.abs(peak)) {
        peak = mixedSample;
      }
    }

    samples[sampleIndex] = Math.max(-1, Math.min(1, peak));
  }

  return { samples, duration };
}

// ── eSpeak-NG WASM TTS Fallback ───────────────────────────────────────────────

let eSpeakInstancePromise: Promise<ESpeakInstance | null> | null = null;

interface ESpeakFactory {
  (options: { wasmBinary: ArrayBuffer }): Promise<ESpeakInstance> | ESpeakInstance;
}

interface ESpeakFactories {
  createESpeakModule?: ESpeakFactory;
  createESpeakNG?: ESpeakFactory;
}

function getESpeakFactory(): ESpeakFactory | null {
  const factories = globalThis as unknown as ESpeakFactories;
  if (typeof factories.createESpeakModule === 'function') {
    return factories.createESpeakModule;
  }
  if (typeof factories.createESpeakNG === 'function') {
    return factories.createESpeakNG;
  }
  return null;
}

function clampPcmFloat(value: number): number {
  if (value > 1) {
    return 1;
  }
  if (value < -1) {
    return -1;
  }
  return value;
}

function int16ToFloat32(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    output[i] = clampPcmFloat(input[i] / 32768);
  }
  return output;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new Uint8Array(bytes.byteLength);
  output.set(bytes);
  return output.buffer;
}

function toOwnedFloat32Array(input: Float32Array<ArrayBufferLike>): Float32Array<ArrayBuffer> {
  const copy = new Float32Array(input.length);
  copy.set(input);
  return copy;
}

function pcmToAudioBuffer(pcm: Float32Array<ArrayBufferLike>, sampleRate: number): AudioBuffer {
  const context = getAudioContext();
  const safeSampleRate = Number.isFinite(sampleRate) && sampleRate > 0 ? Math.round(sampleRate) : context.sampleRate;
  const audioBuffer = context.createBuffer(1, pcm.length, safeSampleRate);
  audioBuffer.copyToChannel(toOwnedFloat32Array(pcm), 0);
  return audioBuffer;
}

async function decodeEncodedAudio(encoded: ArrayBuffer): Promise<AudioBuffer | null> {
  try {
    return await arrayBufferToAudioBuffer(encoded);
  } catch {
    return null;
  }
}

async function payloadToAudioBuffer(payload: SynthesizedAudioPayload, fallbackSampleRate: number): Promise<AudioBuffer | null> {
  if (payload instanceof Float32Array) {
    return pcmToAudioBuffer(payload, fallbackSampleRate);
  }

  if (payload instanceof Int16Array) {
    return pcmToAudioBuffer(int16ToFloat32(payload), fallbackSampleRate);
  }

  if (payload instanceof ArrayBuffer) {
    return decodeEncodedAudio(payload);
  }

  if (payload instanceof Uint8Array) {
    return decodeEncodedAudio(bytesToArrayBuffer(payload));
  }

  const sampleRate = payload.sampleRate ?? fallbackSampleRate;
  if (payload.pcm instanceof Float32Array) {
    return pcmToAudioBuffer(payload.pcm, sampleRate);
  }

  if (payload.pcm instanceof Int16Array) {
    return pcmToAudioBuffer(int16ToFloat32(payload.pcm), sampleRate);
  }

  if (payload.pcm instanceof Uint8Array) {
    const alignedLength = payload.pcm.byteLength - (payload.pcm.byteLength % 2);
    if (alignedLength === 0) {
      return null;
    }
    const pcmBytes = payload.pcm.buffer.slice(payload.pcm.byteOffset, payload.pcm.byteOffset + alignedLength);
    return pcmToAudioBuffer(int16ToFloat32(new Int16Array(pcmBytes)), sampleRate);
  }

  if (payload.pcm instanceof ArrayBuffer) {
    return decodeEncodedAudio(payload.pcm);
  }

  if (payload.audioData instanceof Float32Array) {
    return pcmToAudioBuffer(payload.audioData, sampleRate);
  }

  if (payload.audioData instanceof Int16Array) {
    return pcmToAudioBuffer(int16ToFloat32(payload.audioData), sampleRate);
  }

  if (payload.audioData instanceof Uint8Array) {
    return decodeEncodedAudio(bytesToArrayBuffer(payload.audioData));
  }

  if (payload.audioData instanceof ArrayBuffer) {
    return decodeEncodedAudio(payload.audioData);
  }

  return null;
}

async function instantiateESpeak(): Promise<ESpeakInstance | null> {
  const response = await fetch(ESPEAK_WASM_PATH);
  if (!response.ok) {
    return null;
  }

  const wasmBinary = await response.arrayBuffer();
  const factory = getESpeakFactory();
  if (factory !== null) {
    return factory({ wasmBinary });
  }

  const instantiated = (await WebAssembly.instantiate(
    wasmBinary,
    {}
  )) as WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance;
  if ('instance' in instantiated) {
    return instantiated.instance.exports as unknown as ESpeakInstance;
  }
  return instantiated.exports as unknown as ESpeakInstance;
}

export async function getESpeakInstance(): Promise<ESpeakInstance | null> {
  if (eSpeakInstancePromise === null) {
    eSpeakInstancePromise = instantiateESpeak().catch(() => null);
  }
  return eSpeakInstancePromise;
}

export async function synthesizeAmharic(text: string): Promise<AudioBuffer | null> {
  const phrase = text.trim();
  if (phrase.length === 0) {
    return null;
  }

  const eSpeak = await getESpeakInstance();
  if (eSpeak === null) {
    return null;
  }

  let payload: SynthesizedAudioPayload | null = null;
  if (typeof eSpeak.synthesizeAmharic === 'function') {
    payload = await eSpeak.synthesizeAmharic(phrase);
  } else if (typeof eSpeak.synthesize === 'function') {
    payload = await eSpeak.synthesize(phrase, 'am');
  }

  if (payload === null) {
    return null;
  }

  const sampleRate = eSpeak.sampleRate ?? DEFAULT_ESPEAK_SAMPLE_RATE;
  return payloadToAudioBuffer(payload, sampleRate);
}
