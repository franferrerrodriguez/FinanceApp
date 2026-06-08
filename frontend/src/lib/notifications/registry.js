/** @type {import('./types.js').NotificationSource[]} */
const notificationSources = [];

/** Register a notification source (call at module init or from plugins). */
export function registerNotificationSource(source) {
  if (notificationSources.some((s) => s.id === source.id)) {
    throw new Error(`Notification source already registered: ${source.id}`);
  }
  notificationSources.push(source);
}

/** @returns {readonly import('./types.js').NotificationSource[]} */
export function getNotificationSources() {
  return notificationSources;
}

/** @param {import('./types.js').NotificationContext} ctx */
export function collectNotifications(ctx) {
  return notificationSources.flatMap((source) => source.collect(ctx));
}
