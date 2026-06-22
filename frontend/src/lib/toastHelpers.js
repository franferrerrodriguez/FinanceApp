/** Cloud save without success toast; surfaces save errors only. */
export async function saveToCloudQuiet({ toast, t, saveFn }) {
  if (!saveFn) return { ok: true };
  const result = await saveFn();
  if (result && result.ok === false) {
    toast.error(t('toast.saveError'));
  }
  return result;
}

/** Success toast for explicit actions + optional cloud save; surfaces save errors. */
export async function notifyAfterSave({ toast, t, actionKey, saveFn }) {
  if (actionKey) toast.success(t(actionKey));
  return saveToCloudQuiet({ toast, t, saveFn });
}
