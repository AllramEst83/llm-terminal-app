const KEYSTROKE_THROTTLE_MS = 50;
const KEYSTROKE_VOLUME = 0.2;
const BOOT_VOLUME = 0.7;
const FADE_STEPS = 30;

let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;
let lastKeystrokeTime = 0;

let bootAudio: HTMLAudioElement | null = null;
let keystrokeAudio: HTMLAudioElement | null = null;

const isMobileDevice = (): boolean => {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.9) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};

const debugLog = (message: string, ...args: unknown[]): void => {
  if (!isMobileDevice()) {
    console.debug(message, ...args);
  }
};

const createAudioElement = (
  src: string,
  volume: number,
  options: { loop?: boolean; preload?: 'auto' | 'none' } = {}
): HTMLAudioElement => {
  const audio = new Audio(src);
  audio.preload = options.preload ?? 'auto';
  audio.volume = volume;
  
  if (options.loop !== undefined) {
    audio.loop = options.loop;
  }

  audio.addEventListener('error', (e) => {
    debugLog(`Audio playback failed for ${src}:`, e);
  });

  return audio;
};

const playAudioSafely = async (audio: HTMLAudioElement): Promise<void> => {
  try {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch (error) {
    debugLog('Audio play() failed:', error);
  }
};

const fadeVolume = (
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs: number,
  onComplete?: () => void
): number => {
  const startVolume = audio.volume;
  const volumeDelta = targetVolume - startVolume;
  const stepDuration = durationMs / FADE_STEPS;
  const volumeStep = volumeDelta / FADE_STEPS;
  let currentStep = 0;

  const intervalId = window.setInterval(() => {
    if (!audio || audio.paused) {
      clearInterval(intervalId);
      return;
    }

    currentStep++;
    const newVolume = Math.max(0, Math.min(1, startVolume + volumeStep * currentStep));
    audio.volume = newVolume;

    if (currentStep >= FADE_STEPS || Math.abs(newVolume - targetVolume) < 0.01) {
      audio.volume = targetVolume;
      clearInterval(intervalId);
      onComplete?.();
    }
  }, stepDuration);

  return intervalId;
};

export function unlockAudio(): void {
  if (isAudioUnlocked && audioContext && audioContext.state !== 'closed') {
    return;
  }

  try {
    if (!audioContext || audioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }

    if (audioContext) {
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          isAudioUnlocked = true;
        }).catch((error) => {
          if (!isMobileDevice()) {
            console.warn('Failed to unlock audio context:', error);
          }
        });
      } else {
        isAudioUnlocked = true;
      }
    }
  } catch (error) {
    if (!isMobileDevice()) {
      console.warn('Failed to initialize audio context:', error);
    }
  }
}

function playSound(frequency: number, duration: number, audioEnabled: boolean = true): void {
  if (!audioEnabled || !isAudioUnlocked || !audioContext || audioContext.state === 'closed') {
    return;
  }

  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // Silently fail on mobile
      });
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    const now = audioContext.currentTime;
    const durationSeconds = duration / 1000;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + durationSeconds);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  } catch (error) {
    debugLog('Audio playback failed:', error);
  }
}

export function playErrorBeep(audioEnabled: boolean = true): void {
  playSound(450, 100, audioEnabled);
}

export function playSendMessageSound(audioEnabled: boolean = true): void {
  playSound(800, 30, audioEnabled);
}

export function playKeystrokeSound(audioEnabled: boolean = true): Promise<void> {
  return new Promise((resolve) => {
    if (!audioEnabled) {
      resolve();
      return;
    }

    const now = Date.now();
    if (now - lastKeystrokeTime < KEYSTROKE_THROTTLE_MS) {
      resolve();
      return;
    }
    lastKeystrokeTime = now;

    try {
      if (!keystrokeAudio) {
        keystrokeAudio = createAudioElement('/audio/keystroke-hit.mp3', KEYSTROKE_VOLUME);
        keystrokeAudio.addEventListener('error', () => {
          keystrokeAudio = null;
          resolve();
        });
      }

      const audioClone = keystrokeAudio.cloneNode() as HTMLAudioElement;
      audioClone.volume = KEYSTROKE_VOLUME;

      playAudioSafely(audioClone).then(() => {
        const onEnded = () => {
          audioClone.removeEventListener('ended', onEnded);
          audioClone.remove();
          resolve();
        };
        audioClone.addEventListener('ended', onEnded);
      }).catch(() => {
        resolve();
      });
    } catch (error) {
      debugLog('Keystroke audio initialization failed:', error);
      resolve();
    }
  });
}

export function playBootSound(audioEnabled: boolean = true): void {
  if (!audioEnabled) {
    return;
  }

  try {
    if (!bootAudio) {
      bootAudio = createAudioElement('/audio/terminal-boot-up.mp3', BOOT_VOLUME);
      bootAudio.addEventListener('error', () => {
        bootAudio = null;
      });
    }

    if (bootAudio.currentTime > 0) {
      bootAudio.currentTime = 0;
    }

    playAudioSafely(bootAudio);
  } catch (error) {
    debugLog('Boot audio initialization failed:', error);
  }
}

