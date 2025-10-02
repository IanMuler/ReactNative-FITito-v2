/**
 * Date Helpers Utility
 * Handles timezone operations for Argentina (UTC-3)
 */

/* Constants */
export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const TIMEZONE_OFFSET = '-03:00';

/**
 * Get current date/time in Argentina timezone
 */
export function getCurrentDateArgentina(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
}

/**
 * Get current date as YYYY-MM-DD string in Argentina timezone
 */
export function getCurrentDateStringArgentina(): string {
  const date = getCurrentDateArgentina();
  return formatDateToYYYYMMDD(date);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to ISO string with Argentina timezone
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00' + TIMEZONE_OFFSET);
}

/**
 * Get start of day in Argentina timezone
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const argDate = new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
  argDate.setHours(0, 0, 0, 0);
  return argDate;
}

/**
 * Get end of day in Argentina timezone
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const argDate = new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
  argDate.setHours(23, 59, 59, 999);
  return argDate;
}

/**
 * Get start of week in Argentina timezone (Monday)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const argDate = new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
  const day = argDate.getDay();
  const diff = argDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  argDate.setDate(diff);
  return getStartOfDay(argDate);
}

/**
 * Get end of week in Argentina timezone (Sunday)
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return getEndOfDay(endOfWeek);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateToYYYYMMDD(date1) === formatDateToYYYYMMDD(date2);
}

/**
 * Check if date is today in Argentina timezone
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, getCurrentDateArgentina());
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtract days from date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(date: Date = new Date()): number {
  const argDate = new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
  return argDate.getDay();
}

/**
 * Get day of week name in Spanish
 */
export function getDayNameSpanish(dayIndex: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex] || 'Desconocido';
}

/**
 * Convert backend day of week (1-7, Monday-Sunday) to JS day (0-6, Sunday-Saturday)
 */
export function backendDayToJSDay(backendDay: number): number {
  // Backend: 1=Monday, 2=Tuesday, ..., 7=Sunday
  // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
  return backendDay === 7 ? 0 : backendDay;
}

/**
 * Convert JS day of week to backend day of week
 */
export function jsDayToBackendDay(jsDay: number): number {
  // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
  // Backend: 1=Monday, 2=Tuesday, ..., 7=Sunday
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Format timestamp for logging
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}
