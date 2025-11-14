import { BootSequenceService } from '../services/BootSequenceService';

export interface BootSequenceState {
  isBooting: boolean;
  isBooted: boolean;
  bootSequence: string[];
}

export class ManageBootSequenceUseCase {
  private bootMessages = BootSequenceService.getBootMessages();

  startBootSequence(): BootSequenceState {
    return {
      isBooting: true,
      isBooted: false,
      bootSequence: [],
    };
  }

  getBootMessages(): Array<{ text: string; delay: number }> {
    return this.bootMessages;
  }

  completeBootSequence(): BootSequenceState {
    return {
      isBooting: false,
      isBooted: true,
      bootSequence: [],
    };
  }
}

