import { BootSequenceService } from '../../infrastructure/services/boot-sequence.service';
import type { BootSequenceState, BootMessage } from '../../domain/entities/boot-sequence';

export class ManageBootSequenceUseCase {
  private bootMessages = BootSequenceService.getBootMessages();

  startBootSequence(): BootSequenceState {
    return {
      isBooting: true,
      isBooted: false,
      bootSequence: [],
    };
  }

  getBootMessages(): BootMessage[] {
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

