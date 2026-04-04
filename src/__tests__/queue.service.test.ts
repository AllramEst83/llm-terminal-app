import { describe, it, expect } from 'vitest';
import { QueueService } from '../infrastructure/services/queue.service';
import { QueueItem } from '../domain/entities/queue-item';

function createItem(text: string, type: 'command' | 'message' = 'message'): QueueItem {
  return QueueItem.create(text, type);
}

describe('QueueService', () => {
  describe('addItem', () => {
    it('appends an item to an empty queue', () => {
      const item = createItem('hello');
      const result = QueueService.addItem([], item);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('hello');
    });

    it('appends to the end of an existing queue', () => {
      const a = createItem('first');
      const b = createItem('second');
      const queue = QueueService.addItem([a], b);
      expect(queue).toHaveLength(2);
      expect(queue[1].text).toBe('second');
    });

    it('does not mutate the original array', () => {
      const original = [createItem('a')];
      const result = QueueService.addItem(original, createItem('b'));
      expect(original).toHaveLength(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('removes an item by id', () => {
      const a = createItem('a');
      const b = createItem('b');
      const result = QueueService.removeItem([a, b], a.id);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(b.id);
    });

    it('returns the same items when id is not found', () => {
      const a = createItem('a');
      const result = QueueService.removeItem([a], 'nonexistent');
      expect(result).toHaveLength(1);
    });
  });

  describe('clearQueue', () => {
    it('returns an empty array', () => {
      const queue = [createItem('a'), createItem('b')];
      expect(QueueService.clearQueue(queue)).toEqual([]);
    });
  });

  describe('getNextPendingItem', () => {
    it('returns the first pending item', () => {
      const a = createItem('a');
      const b = createItem('b');
      const result = QueueService.getNextPendingItem([a, b]);
      expect(result?.id).toBe(a.id);
    });

    it('returns undefined when no pending items', () => {
      const a = createItem('a').withStatus('completed');
      expect(QueueService.getNextPendingItem([a])).toBeUndefined();
    });

    it('returns undefined for an empty queue', () => {
      expect(QueueService.getNextPendingItem([])).toBeUndefined();
    });
  });

  describe('updateItemStatus', () => {
    it('updates the status of a specific item', () => {
      const a = createItem('a');
      const b = createItem('b');
      const result = QueueService.updateItemStatus([a, b], a.id, 'processing');
      expect(result[0].status).toBe('processing');
      expect(result[1].status).toBe('pending');
    });

    it('leaves items unchanged when id is not found', () => {
      const a = createItem('a');
      const result = QueueService.updateItemStatus([a], 'nonexistent', 'completed');
      expect(result[0].status).toBe('pending');
    });
  });

  describe('hasPendingItems', () => {
    it('returns true when pending items exist', () => {
      expect(QueueService.hasPendingItems([createItem('a')])).toBe(true);
    });

    it('returns false when no pending items', () => {
      const item = createItem('a').withStatus('completed');
      expect(QueueService.hasPendingItems([item])).toBe(false);
    });

    it('returns false for empty queue', () => {
      expect(QueueService.hasPendingItems([])).toBe(false);
    });
  });

  describe('hasProcessingItems', () => {
    it('returns true when processing items exist', () => {
      const item = createItem('a').withStatus('processing');
      expect(QueueService.hasProcessingItems([item])).toBe(true);
    });

    it('returns false when no processing items', () => {
      expect(QueueService.hasProcessingItems([createItem('a')])).toBe(false);
    });
  });

  describe('removeCompletedItems', () => {
    it('removes completed items and keeps others', () => {
      const a = createItem('a').withStatus('completed');
      const b = createItem('b');
      const c = createItem('c').withStatus('processing');
      const result = QueueService.removeCompletedItems([a, b, c]);
      expect(result).toHaveLength(2);
      expect(result.map(i => i.status)).toEqual(['pending', 'processing']);
    });
  });
});

describe('QueueItem', () => {
  it('creates with pending status by default', () => {
    const item = QueueItem.create('test', 'message');
    expect(item.status).toBe('pending');
    expect(item.text).toBe('test');
    expect(item.type).toBe('message');
    expect(item.id).toBeTruthy();
    expect(item.timestamp).toBeTruthy();
  });

  it('withStatus returns a new instance', () => {
    const item = QueueItem.create('test', 'command');
    const updated = item.withStatus('processing');
    expect(updated.status).toBe('processing');
    expect(updated.id).toBe(item.id);
    expect(item.status).toBe('pending');
  });

  it('isPending/isProcessing/isCompleted/isCancelled work correctly', () => {
    const item = QueueItem.create('x', 'message');
    expect(item.isPending()).toBe(true);
    expect(item.isProcessing()).toBe(false);

    const processing = item.withStatus('processing');
    expect(processing.isProcessing()).toBe(true);

    const completed = item.withStatus('completed');
    expect(completed.isCompleted()).toBe(true);

    const cancelled = item.withStatus('cancelled');
    expect(cancelled.isCancelled()).toBe(true);
  });
});
