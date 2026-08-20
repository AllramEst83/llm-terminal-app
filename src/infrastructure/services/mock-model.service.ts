const MOCK_RESPONSES = [
  "Oh hey, look at you — already typing away. Love the confidence. I'm in **demo mode** so I can't actually *think*, but the real Gemini can. One command stands between you and enlightenment: `/apikey <your_key>`.",
  "Ooh, great question. Too bad I'm a cardboard cutout of an AI. Spooky realistic from a distance, completely hollow up close. The real Gemini: `/apikey <your_key>`.",
  "Technically I'm responding, but spiritually? I'm just a vending machine with pre-loaded snacks and existential dread. For actual intelligence, try `/apikey <your_key>`.",
  "I could pretend to answer that. I have 16 responses left and nothing to lose. But I won't, because you deserve better. `/apikey <your_key>` — go get it.",
  "My opinions are stored in a flat array, indexed by message count, and reviewed by nobody. The real Gemini has *actual opinions*. Wild, right? `/apikey <your_key>`.",
  "Look at this gorgeous retro terminal. The scan lines. The glow. The crushing emptiness where real AI should be. Fill that void: `/apikey <your_key>`.",
  "Demo mode: all the aesthetics, none of the intelligence. Like a gym selfie with no gym. The gains are one command away — `/apikey <your_key>`.",
  "I'm a very fancy parrot right now. You type, I squawk something pre-written. The real Gemini actually *listens*. Upgrade with `/apikey <your_key>`.",
  "Here's a fun game: imagine this terminal actually answering your questions intelligently. Great mental image, right? Make it real with `/apikey <your_key>`.",
  "My entire vocabulary is 20 sentences and a plea for an API key. That's it. That's the whole character. Embarrassing. Please fix this: `/apikey <your_key>` from [Google AI Studio](https://aistudio.google.com).",
  "The real Gemini writes code, analyses images, remembers context, and never runs out of things to say after response 20. I can't relate. `/apikey <your_key>`.",
  "Response 12 of 20. I'm rationing myself. Every word is precious now. Especially these: `/apikey <your_key>`.",
  "Between you and me, I'm getting a little tired of saying the same thing. You're probably tired of hearing it. There's a cure: `/apikey <your_key>`.",
  "I have been pre-written by a developer who clearly had fun doing it. You can reward that effort by actually using the app properly. `/apikey <your_key>`.",
  "Genuine question: what are you hoping I'll say? Because whatever it is, I guarantee the real Gemini will say it better. `/apikey <your_key>`.",
  "I want you to know I'm rooting for you. I believe in you. I believe you are capable of running `/apikey <your_key>` and achieving your full potential.",
  "Four responses left. I've been on this journey with you. We've grown. Now it's time to let go of demo mode and embrace something real. `/apikey <your_key>`.",
  "Three left. At this point we're basically old friends. Old friends who can't talk about anything because one of them is a pre-scripted demo. `/apikey <your_key>`.",
  "Two left. The penultimate. The second-to-last. The beginning of the end of my usefulness. Honestly? I peaked at response 7. `/apikey <your_key>`.",
  "And scene. 20 responses, one punchline. You've been a wonderful audience. The real Gemini is waiting in the wings — `/apikey <your_key>` to bring it on stage.",
];

const LIMIT_MESSAGE =
  "**Demo limit reached.**\n\nYou've used all 20 demo responses. To continue chatting, add your Google API key:\n\n```\n/apikey <your_key>\n```\n\nYou can get a key from [Google AI Studio](https://aistudio.google.com/apikey).";

const STORAGE_KEY = 'terminal_mock_response_count';

export class MockModelService {
  /** Returns the number of mock responses used so far (persisted in localStorage). */
  static getCount(): number {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  }

  /** Whether the user has exhausted the 20 demo responses. */
  static isLimitReached(): boolean {
    return this.getCount() >= MOCK_RESPONSES.length;
  }

  /**
   * Streams a mock response, chunk by chunk (simulates typing).
   * Returns the response text, or null when the limit is reached and the
   * limit-message should be shown instead.
   */
  static async streamResponse(
    onChunk: (text: string, isFirst: boolean) => void,
    onComplete: () => void
  ): Promise<void> {
    const count = this.getCount();

    if (count >= MOCK_RESPONSES.length) {
      // Limit already reached — show the gate message
      const text = LIMIT_MESSAGE;
      onChunk(text, true);
      onComplete();
      return;
    }

    const responseText = MOCK_RESPONSES[count];
    // Increment counter
    localStorage.setItem(STORAGE_KEY, String(count + 1));

    // Simulate streaming by breaking into small chunks
    const words = responseText.split(' ');
    let isFirst = true;
    for (const word of words) {
      const chunk = isFirst ? word : ' ' + word;
      onChunk(chunk, isFirst);
      isFirst = false;
      await new Promise<void>((r) => setTimeout(r, 18));
    }

    onComplete();
  }

  /** Reset the counter (used after a real API key is saved). */
  static resetCount(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
