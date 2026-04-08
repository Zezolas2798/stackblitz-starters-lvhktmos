/**
 * NutriDev GxP - Centralized Date Utilities
 * Ensures consistent timezone handling and formatting.
 */

/**
 * Formats a date to local string (DD/MM/YYYY)
 */
export const formatLocalDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formats a date to local time (HH:mm)
 */
export const formatLocalTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a date to local full string (DD/MM/YYYY HH:mm)
 */
export const formatLocalDateTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  
  return `${formatLocalDate(date)} ${formatLocalTime(date)}`;
};

/**
 * Returns the current timestamp in ISO format (UTC)
 */
export const getNowISO = (): string => {
  return new Date().toISOString();
};

/**
 * Returns a Brazil-formatted date for titles
 */
export const getAuditTitleDate = (): string => {
  return new Date().toLocaleDateString('pt-BR');
};
