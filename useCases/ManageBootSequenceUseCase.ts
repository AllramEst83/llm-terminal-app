import { BootSequenceService } from '../services/BootSequenceService';
import type { BootSequenceState } from '../domain/BootSequence';

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


