/**
 * Format seconds into a human-readable time string
 * @param seconds - Time in seconds
 * @param showMilliseconds - Whether to show milliseconds
 * @returns Formatted time string (HH:MM:SS or MM:SS)
 */
export function formatTime(seconds: number, showMilliseconds: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (showMilliseconds) {
    const ms = Math.floor((seconds % 1) * 1000);
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format time for accessibility (spoken format)
 * @param seconds - Time in seconds
 * @returns Human-readable spoken time
 */
export function formatTimeForAria(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0 minutes';
  }

  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];

  if (hrs > 0) {
    parts.push(`${hrs} ${hrs === 1 ? 'hour' : 'hours'}`);
  }

  if (mins > 0) {
    parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);
  }

  if (secs > 0 && hrs === 0) {
    parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }

  if (parts.length === 0) {
    return '0 minutes';
  }

  return parts.join(', ');
}

/**
 * Check if a value is a valid number
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
