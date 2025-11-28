import type { QueueItem } from '../../domain/entities/queue-item';

export class QueueService {
  /**
   * Add an item to the queue
   */
  static addItem(queue: QueueItem[], item: QueueItem): QueueItem[] {
    return [...queue, item];
  }

  /**
   * Remove an item from the queue by ID
   */
  static removeItem(queue: QueueItem[], itemId: string): QueueItem[] {
    return queue.filter(item => item.id !== itemId);
  }

  /**
   * Clear all items from the queue
   */
  static clearQueue(queue: QueueItem[]): QueueItem[] {
    return [];
  }

  /**
   * Get the next pending item from the queue
   */
  static getNextPendingItem(queue: QueueItem[]): QueueItem | undefined {
    return queue.find(item => item.isPending());
  }

  /**
   * Update an item's status in the queue
   */
  static updateItemStatus(
    queue: QueueItem[],
    itemId: string,
    status: QueueItem['status']
  ): QueueItem[] {
    return queue.map(item =>
      item.id === itemId ? item.withStatus(status) : item
    );
  }

  /**
   * Check if queue has any pending items
   */
  static hasPendingItems(queue: QueueItem[]): boolean {
    return queue.some(item => item.isPending());
  }

  /**
   * Check if queue has any processing items
   */
  static hasProcessingItems(queue: QueueItem[]): boolean {
    return queue.some(item => item.isProcessing());
  }

  /**
   * Remove completed items from the queue
   */
  static removeCompletedItems(queue: QueueItem[]): QueueItem[] {
    return queue.filter(item => !item.isCompleted());
  }
}

