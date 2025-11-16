// Audio service using Web Audio API with mobile device fallback support

// ============================================================================
// Constants
// ============================================================================

const KEYSTROKE_THROTTLE_MS = 50;
const KEYSTROKE_VOLUME = 0.2;
const BOOT_VOLUME = 0.7;
const FADE_STEPS = 30;

// ============================================================================
// State
// ============================================================================

let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;
let lastKeystrokeTime = 0;

// Audio elements (cached for reuse)
let bootAudio: HTMLAudioElement | null = null;
let keystrokeAudio: HTMLAudioElement | null = null;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Detect if the current device is mobile.
 */
const isMobileDevice = (): boolean => {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.9) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};

/**
 * Log debug message only on non-mobile devices.
 */
const debugLog = (message: string, ...args: any[]): void => {
  if (!isMobileDevice()) {
    console.debug(message, ...args);
  }
};

/**
 * Create an audio element with error handling.
 */
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

/**
 * Safely play an audio element with promise handling.
 */
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

/**
 * Perform a volume fade animation.
 */
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

// ============================================================================
// Audio Context Management
// ============================================================================

/**
 * Initialize and unlock audio context.
 * Must be called on user interaction to comply with browser autoplay policies.
 * This is especially important on mobile devices.
 */
export function unlockAudio(): void {
  if (isAudioUnlocked && audioContext && audioContext.state !== 'closed') {
    return;
  }

  try {
    // Create audio context if it doesn't exist
    if (!audioContext || audioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }

    // Resume audio context if it's suspended (common on mobile)
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

// ============================================================================
// Web Audio API Sound Generation
// ============================================================================

/**
 * Play a sound using Web Audio API.
 */
function playSound(frequency: number, duration: number, audioEnabled: boolean = true): void {
  if (!audioEnabled || !isAudioUnlocked || !audioContext || audioContext.state === 'closed') {
    return;
  }

  try {
    // Resume context if suspended (mobile devices)
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

    // Envelope: quick attack, quick release
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

/**
 * Play an error beep sound.
 */
export function playErrorBeep(audioEnabled: boolean = true): void {
  playSound(450, 100, audioEnabled);
}

/**
 * Play a sound when sending a message (legacy function, kept for compatibility).
 */
export function playSendMessageSound(audioEnabled: boolean = true): void {
  playSound(800, 30, audioEnabled);
}

// ============================================================================
// Audio File Playback
// ============================================================================

/**
 * Play a keystroke sound when typing using the keystroke-hit.mp3 file.
 * Includes throttling to prevent audio spam.
 * Returns a promise that resolves when the sound finishes playing.
 */
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
      // Create base audio element if it doesn't exist
      if (!keystrokeAudio) {
        keystrokeAudio = createAudioElement('/audio/keystroke-hit.mp3', KEYSTROKE_VOLUME);
        keystrokeAudio.addEventListener('error', () => {
          keystrokeAudio = null;
          resolve();
        });
      }

      // Clone the audio element to allow overlapping playback
      const audioClone = keystrokeAudio.cloneNode() as HTMLAudioElement;
      audioClone.volume = KEYSTROKE_VOLUME;

      // Play the cloned audio
      playAudioSafely(audioClone).then(() => {
        // Resolve when the audio finishes playing using the 'ended' event
        // This is reliable and doesn't require setTimeout
        const onEnded = () => {
          audioClone.removeEventListener('ended', onEnded);
          audioClone.remove();
          resolve();
        };
        audioClone.addEventListener('ended', onEnded);
      }).catch(() => {
        resolve(); // Resolve immediately on error
      });
    } catch (error) {
      debugLog('Keystroke audio initialization failed:', error);
      resolve();
    }
  });
}

/**
 * Play a boot sequence sound using the terminal-boot-up.mp3 file.
 */
export function playBootSound(audioEnabled: boolean = true): void {
  if (!audioEnabled) {
    return;
  }

  try {
    // Create audio element if it doesn't exist
    if (!bootAudio) {
      bootAudio = createAudioElement('/audio/terminal-boot-up.mp3', BOOT_VOLUME);
      bootAudio.addEventListener('error', () => {
        bootAudio = null;
      });
    }

    // Reset to beginning if already played
    if (bootAudio.currentTime > 0) {
      bootAudio.currentTime = 0;
    }

    // Play the audio
    playAudioSafely(bootAudio);
  } catch (error) {
    debugLog('Boot audio initialization failed:', error);
  }
}

