import { useCallback, useEffect, useRef, useState } from 'react';

/** Tiny per-screen toast: show(message) displays it briefly, then clears. */
export function useToast(durationMs = 1900) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { message, show };
}
