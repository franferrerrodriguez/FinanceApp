import { useEffect, useRef, useState } from 'react';

/**
 * Handles decimal inputs robustly on iOS/Android where the locale decimal
 * separator may be "," instead of ".". Keeps a local draft during editing
 * so intermediate states like "2," or "2." are preserved.
 *
 * @param {number|null} value - canonical decimal value from parent
 * @param {(v: number|null) => void} onChange - callback with parsed value
 * @param {object} opts
 * @param {boolean} [opts.nullable] - allow null (empty string maps to null)
 * @param {(v: number|null) => string} opts.toDisplay - value → display string
 * @param {(s: string) => number|null} opts.fromDisplay - display string → value
 */
export function useDecimalInput(value, onChange, { nullable = false, toDisplay, fromDisplay }) {
  const focused = useRef(false);
  const [local, setLocal] = useState(() => {
    if (nullable && value == null) return '';
    const d = toDisplay(value);
    return d == null ? '' : String(d);
  });

  useEffect(() => {
    if (!focused.current) {
      if (nullable && value == null) {
        setLocal('');
      } else {
        const d = toDisplay(value);
        setLocal(d == null ? '' : String(d));
      }
    }
  }, [value, nullable, toDisplay]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setLocal(raw);
    const normalized = raw.replace(',', '.');
    if (nullable && (normalized === '' || normalized === '.')) {
      onChange(null);
      return;
    }
    const parsed = fromDisplay(normalized);
    if (parsed != null) onChange(parsed);
  };

  const handleFocus = () => {
    focused.current = true;
  };

  const handleBlur = () => {
    focused.current = false;
    const normalized = local.replace(',', '.');
    const parsed = fromDisplay(normalized);
    if (nullable && (local === '' || parsed == null)) {
      onChange(null);
      setLocal('');
    } else if (parsed != null) {
      onChange(parsed);
      const d = toDisplay(parsed);
      setLocal(d == null ? '' : String(d));
    }
  };

  return { inputValue: local, handleChange, handleFocus, handleBlur };
}
