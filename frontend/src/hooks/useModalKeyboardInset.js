import { useEffect, useState } from 'react';

/** Lifts modals above the software keyboard on mobile browsers. */
export function useModalKeyboardInset(open) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) {
      setInset(0);
      return undefined;
    }

    const update = () => {
      const keyboard = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setInset(keyboard > 50 ? keyboard : 0);
    };

    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      setInset(0);
    };
  }, [open]);

  return inset;
}
