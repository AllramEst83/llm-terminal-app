import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageService } from '../../infrastructure/services';
import type { Message } from '../../domain/entities/message';

export function useBootSequence(
  isActive: boolean,
  isKeyReady: boolean,
  onBooted: (initialMessages: Message[]) => void
) {
  const [booted, setBooted] = useState(false);
  const onBootedRef = useRef(onBooted);
  onBootedRef.current = onBooted;

  const startBoot = useCallback(() => {
    setBooted(true);
    onBootedRef.current(MessageService.getInitialMessages());
  }, []);

  useEffect(() => {
    if (!isKeyReady) {
      setBooted(false);
      return;
    }
    if (!isActive || booted) return;
    startBoot();
  }, [isKeyReady, booted, isActive, startBoot]);

  return { booting: false, booted, bootSequence: [], startBoot };
}
