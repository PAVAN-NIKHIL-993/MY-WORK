import { formatTime, formatTimeForAria, isValidNumber } from '@/utils/formatTime';

describe('formatTime Utility', () => {
  it('should format 180 seconds as 3:00', () => {
    expect(formatTime(180)).toBe('3:00');
  });

  it('should format 60 seconds as 1:00', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('should format 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('should format 3661 seconds as 1:01:01 (with hours)', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('should format 150 seconds as 2:30', () => {
    expect(formatTime(150)).toBe('2:30');
  });

  it('should format with milliseconds when showMilliseconds is true', () => {
    expect(formatTime(180.5, true)).toBe('3:00.500');
  });

  it('should format with milliseconds for less than 1 minute', () => {
    expect(formatTime(30.123, true)).toBe('0:30.123');
  });

  it('should handle negative numbers by returning 00:00', () => {
    expect(formatTime(-10)).toBe('00:00');
  });

  it('should handle NaN by returning 00:00', () => {
    expect(formatTime(NaN)).toBe('00:00');
  });

  it('should handle very large numbers correctly', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(7200)).toBe('2:00:00');
  });
});

describe('formatTimeForAria Utility', () => {
  it('should format 180 seconds as "3 minutes"', () => {
    expect(formatTimeForAria(180)).toBe('3 minutes');
  });

  it('should format 60 seconds as "1 minute"', () => {
    expect(formatTimeForAria(60)).toBe('1 minute');
  });

  it('should format 3661 seconds as "1 hour, 1 minute"', () => {
    expect(formatTimeForAria(3661)).toBe('1 hour, 1 minute');
  });

  it('should format 45 seconds as "45 seconds"', () => {
    expect(formatTimeForAria(45)).toBe('45 seconds');
  });

  it('should format 90 seconds as "1 minute, 30 seconds"', () => {
    expect(formatTimeForAria(90)).toBe('1 minute, 30 seconds');
  });

  it('should handle 0 seconds as "0 minutes"', () => {
    expect(formatTimeForAria(0)).toBe('0 minutes');
  });

  it('should handle negative numbers by returning "0 minutes"', () => {
    expect(formatTimeForAria(-10)).toBe('0 minutes');
  });

  it('should handle NaN by returning "0 minutes"', () => {
    expect(formatTimeForAria(NaN)).toBe('0 minutes');
  });

  it('should use singular form for 1 hour', () => {
    expect(formatTimeForAria(3600)).toBe('1 hour');
  });

  it('should use plural form for multiple hours', () => {
    expect(formatTimeForAria(7200)).toBe('2 hours');
  });
});

describe('isValidNumber Utility', () => {
  it('should return true for valid numbers', () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(42)).toBe(true);
    expect(isValidNumber(-10)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
  });

  it('should return false for NaN', () => {
    expect(isValidNumber(NaN)).toBe(false);
  });

  it('should return false for Infinity', () => {
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(-Infinity)).toBe(false);
  });

  it('should return false for non-numbers', () => {
    expect(isValidNumber('42')).toBe(false);
    expect(isValidNumber(null)).toBe(false);
    expect(isValidNumber(undefined)).toBe(false);
    expect(isValidNumber({})).toBe(false);
    expect(isValidNumber([])).toBe(false);
  });
});
