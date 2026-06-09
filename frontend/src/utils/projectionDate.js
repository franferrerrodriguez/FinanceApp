/** Projection date in table (e.g. 06/26). */
export function formatProjectionDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear() % 100).padStart(2, '0');
  return `${month}/${year}`;
}
