export interface BootMessage {
  text: string;
  delay: number;
}

export interface BootSequenceState {
  isBooting: boolean;
  isBooted: boolean;
  bootSequence: string[];
}
