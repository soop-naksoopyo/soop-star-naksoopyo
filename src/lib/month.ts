/** Returns the current month start date in Korea Standard Time. */
export function getCurrentMonthDate(baseDate: Date = new Date()): string {
  const kstTime = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
