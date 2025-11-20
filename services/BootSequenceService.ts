import type { BootMessage } from '../domain/BootSequence';

export class BootSequenceService {
  static readonly BOOT_MESSAGES: BootMessage[] = [
    { text: 'GEMINI BIOS v1.5.0 (c) 1988 Google AI Corp.', delay: 200 },
    { text: 'Initializing...', delay: 500 },
    { text: 'Checking Memory: 640K RAM...... OK', delay: 800 },
    { text: 'Initializing Network Card...', delay: 300 },
    { text: '  - MAC Address: 00:DE:AD:BE:EF:00', delay: 150 },
    { text: '  - Establishing connection to host...', delay: 1000 },
    { text: 'Connection Established.', delay: 200 },
    { text: 'Loading GEMINI OS...', delay: 600 },
    { text: 'Welcome.', delay: 400 },
  ];

  static getBootMessages(): BootMessage[] {
    return [...this.BOOT_MESSAGES];
  }

  static getTotalBootDuration(): number {
    return this.BOOT_MESSAGES.reduce((total, msg) => total + msg.delay, 0) + 500; // +500 for final delay
  }
}





