import { useCallback, useEffect, useRef } from 'react';

export function useAutoScroll(deps: unknown[]) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight - container.clientHeight,
          behavior: 'smooth',
        });
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { scrollRef, scrollToBottom };
}
