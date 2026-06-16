import { useEffect, useState } from 'react';

/** Lifts modals above the software keyboard on mobile browsers. */
export function useModalKeyboardInset(open) {
  const [state, setState] = useState({ keyboard: 0, viewportHeight: 0 });

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) {
      setState({ keyboard: 0, viewportHeight: 0 });
      return undefined;
    }

    const update = () => {
      const keyboard = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setState({
        keyboard: keyboard > 50 ? keyboard : 0,
        viewportHeight: viewport.height,
      });
    };

    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      setState({ keyboard: 0, viewportHeight: 0 });
    };
  }, [open]);

  return state;
}
