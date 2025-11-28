import { generateId } from '../../infrastructure/utils/id.utils';
import { getCurrentTimestamp } from '../../infrastructure/utils/date.utils';
import type { AttachedImage } from '../../types/ui/components';

export type QueueItemType = 'command' | 'message';
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export class QueueItem {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly type: QueueItemType,
    public readonly attachedImages: AttachedImage[],
    public status: QueueItemStatus,
    public readonly timestamp: string
  ) {}

  static create(
    text: string,
    type: QueueItemType,
    attachedImages: AttachedImage[] = []
  ): QueueItem {
    return new QueueItem(
      generateId(),
      text,
      type,
      attachedImages,
      'pending',
      getCurrentTimestamp()
    );
  }

  withStatus(status: QueueItemStatus): QueueItem {
    return new QueueItem(
      this.id,
      this.text,
      this.type,
      this.attachedImages,
      status,
      this.timestamp
    );
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isProcessing(): boolean {
    return this.status === 'processing';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isCancelled(): boolean {
    return this.status === 'cancelled';
  }
}

