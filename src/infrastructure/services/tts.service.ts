import { GoogleGenAI } from "@google/genai";

const TTS_MODEL = "gemini-2.5-pro-preview-tts";
const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function pcmToWavBlob(pcmBase64: string): Blob {
  const pcmData = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, NUM_CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([buffer], { type: "audio/wav" });
}

export type TtsState = "idle" | "loading" | "playing";

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export class TtsService {
  static stopCurrent(): void {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  static async speak(
    text: string,
    apiKey: string,
    onStateChange: (state: TtsState) => void
  ): Promise<void> {
    this.stopCurrent();
    onStateChange("loading");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Read the following at a normal, natural speaking pace. Do not speak slowly:\n\n${text}`;
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const audioData =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error("No audio data received from TTS model");
      }

      const wavBlob = pcmToWavBlob(audioData);
      const url = URL.createObjectURL(wavBlob);
      currentObjectUrl = url;

      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        onStateChange("idle");
        this.stopCurrent();
      };

      audio.onerror = () => {
        onStateChange("idle");
        this.stopCurrent();
      };

      onStateChange("playing");
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      onStateChange("idle");
      this.stopCurrent();
    }
  }
}
