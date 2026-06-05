import { Keyboard } from '@capacitor/keyboard';
import { useEffect, useState } from 'react';
import { isNativeApp } from '../lib/platform';

/** Lifts modals above the software keyboard on iOS/Android (Capacitor). */
export function useModalKeyboardInset(open) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!open || !isNativeApp()) {
      setInset(0);
      return undefined;
    }

    const handles = [];
    let cancelled = false;

    (async () => {
      try {
        handles.push(
          await Keyboard.addListener('keyboardWillShow', (e) => {
            if (!cancelled) setInset(e.keyboardHeight ?? 0);
          }),
        );
        handles.push(
          await Keyboard.addListener('keyboardWillHide', () => {
            if (!cancelled) setInset(0);
          }),
        );
        handles.push(
          await Keyboard.addListener('keyboardDidShow', (e) => {
            if (!cancelled) setInset(e.keyboardHeight ?? 0);
          }),
        );
        handles.push(
          await Keyboard.addListener('keyboardDidHide', () => {
            if (!cancelled) setInset(0);
          }),
        );
      } catch {
        // Keyboard plugin unavailable
      }
    })();

    return () => {
      cancelled = true;
      handles.forEach((h) => h.remove());
    };
  }, [open]);

  return inset;
}
