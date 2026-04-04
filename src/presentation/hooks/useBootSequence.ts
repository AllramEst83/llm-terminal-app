import { useState, useEffect, useRef } from 'react';
import { BootSequenceService, MessageService } from '../../infrastructure/services';
import type { Message } from '../../domain/entities/message';

export function useBootSequence(
  isActive: boolean,
  isKeyReady: boolean,
  onBooted: (initialMessages: Message[]) => void
) {
  const [booting, setBooting] = useState(false);
  const [booted, setBooted] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const onBootedRef = useRef(onBooted);
  onBootedRef.current = onBooted;

  useEffect(() => {
    if (!isActive || !isKeyReady || booting || booted) return;

    const start = () => {
      setBooting(true);
      window.removeEventListener('keydown', start);
      window.removeEventListener('click', start);
    };

    window.addEventListener('keydown', start);
    window.addEventListener('click', start);

    return () => {
      window.removeEventListener('keydown', start);
      window.removeEventListener('click', start);
    };
  }, [isKeyReady, booting, booted, isActive]);

  useEffect(() => {
    if (!booting) return;

    const bootMessages = BootSequenceService.getBootMessages();
    let currentTimeout: number;

    const run = (index = 0) => {
      if (index < bootMessages.length) {
        currentTimeout = window.setTimeout(() => {
          setBootSequence(prev => [...prev, bootMessages[index].text]);
          run(index + 1);
        }, bootMessages[index].delay);
      } else {
        currentTimeout = window.setTimeout(() => {
          setBooting(false);
          setBooted(true);
          onBootedRef.current(MessageService.getInitialMessages());
        }, 500);
      }
    };

    run();
    return () => clearTimeout(currentTimeout);
  }, [booting]);

  const startBoot = () => setBooting(true);

  return { booting, booted, bootSequence, startBoot };
}
