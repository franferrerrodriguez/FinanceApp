/**
 * True only on a real iOS Safari session (not Chrome/Firefox/Opera on iOS,
 * not desktop DevTools device emulation).
 * window.navigator.standalone is defined only on real iOS — DevTools spoofs
 * the UA but never sets that property, so it's the reliable gate.
 */
export function isIosSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const iosDevice = /iPhone|iPad|iPod/.test(ua);
  const notWrapper = !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  const realIos = typeof window.navigator.standalone !== 'undefined';
  return iosDevice && notWrapper && realIos;
}

/** Installed PWA (standalone / iOS home screen). */
export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}
