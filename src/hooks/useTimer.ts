import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerState, TimerEvent } from '@/types';

/**
 * Default lockout duration: 3 minutes (180 seconds)
 */
const DEFAULT_LOCKOUT_DURATION = 180;

/**
 * Custom hook for managing timer state with lockout functionality
 * 
 * Features:
 * - 3-minute lockout period after timer completes
 * - Button is disabled during lockout
 * - Automatic state transitions
 * - Cleanup on unmount
 */
export function useTimer(lockoutDuration: number = DEFAULT_LOCKOUT_DURATION) {
  const [state, setState] = useState<TimerState>({
    status: 'idle',
    remainingTime: lockoutDuration,
    startTime: null,
    lockoutEndTime: null,
    isButtonEnabled: true,
  });

  const timerRef = useRef<number | null>(null);
  const eventListeners = useRef<Set<(event: TimerEvent) => void>>(new Set());

  /**
   * Subscribe to timer events
   */
  const subscribe = useCallback((callback: (event: TimerEvent) => void) => {
    eventListeners.current.add(callback);
    return () => {
      eventListeners.current.delete(callback);
    };
  }, []);

  /**
   * Emit timer event to all subscribers
   */
  const emitEvent = useCallback((event: TimerEvent) => {
    eventListeners.current.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in timer event listener:', error);
      }
    });
  }, []);

  /**
   * Clear the active timer
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Start the timer
   */
  const start = useCallback(() => {
    clearTimer();
    
    const newStartTime = Date.now();
    const newState: TimerState = {
      status: 'running',
      remainingTime: lockoutDuration,
      startTime: newStartTime,
      lockoutEndTime: null,
      isButtonEnabled: false,
    };

    setState(newState);
    emitEvent({ type: 'START' });

    timerRef.current = window.setInterval(() => {
      setState(prev => {
        const elapsed = (Date.now() - (prev.startTime || newStartTime)) / 1000;
        const remaining = lockoutDuration - elapsed;

        if (remaining <= 0) {
          clearTimer();
          const lockoutEndTime = Date.now() + lockoutDuration * 1000;
          const completedState: TimerState = {
            status: 'locked',
            remainingTime: 0,
            startTime: null,
            lockoutEndTime,
            isButtonEnabled: false,
          };
          emitEvent({ type: 'COMPLETE' });
          emitEvent({ type: 'LOCKOUT_START' });
          return completedState;
        }

        return {
          ...prev,
          remainingTime: remaining,
        };
      });
    }, 100);
  }, [clearTimer, lockoutDuration, emitEvent]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    clearTimer();
    setState(prev => {
      if (prev.status === 'running') {
        emitEvent({ type: 'PAUSE' });
        return {
          ...prev,
          status: 'idle',
          startTime: null,
          isButtonEnabled: false,
        };
      }
      return prev;
    });
  }, [clearTimer, emitEvent]);

  /**
   * Reset the timer to initial state
   */
  const reset = useCallback(() => {
    clearTimer();
    const newState: TimerState = {
      status: 'idle',
      remainingTime: lockoutDuration,
      startTime: null,
      lockoutEndTime: null,
      isButtonEnabled: true,
    };
    setState(newState);
    emitEvent({ type: 'RESET' });
  }, [clearTimer, lockoutDuration, emitEvent]);

  /**
   * Force unlock the timer (bypass lockout)
   */
  const unlock = useCallback(() => {
    clearTimer();
    const newState: TimerState = {
      status: 'idle',
      remainingTime: lockoutDuration,
      startTime: null,
      lockoutEndTime: null,
      isButtonEnabled: true,
    };
    setState(newState);
    emitEvent({ type: 'LOCKOUT_END' });
  }, [clearTimer, lockoutDuration, emitEvent]);

  /**
   * Check if lockout period has expired
   */
  useEffect(() => {
    if (state.status === 'locked' && state.lockoutEndTime) {
      const checkLockout = () => {
        const now = Date.now();
        if (now >= state.lockoutEndTime!) {
          unlock();
        }
      };

      const interval = window.setInterval(checkLockout, 1000);
      checkLockout(); // Check immediately

      return () => window.clearInterval(interval);
    }
  }, [state.status, state.lockoutEndTime, unlock]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    const listeners = eventListeners.current;
    return () => {
      clearTimer();
      listeners.clear();
    };
  }, [clearTimer]);

  /**
   * Get progress percentage (0-100)
   */
  const getProgress = useCallback((): number => {
    if (state.status !== 'running' || lockoutDuration <= 0) {
      return 0;
    }
    const elapsed = lockoutDuration - state.remainingTime;
    return (elapsed / lockoutDuration) * 100;
  }, [state.status, state.remainingTime, lockoutDuration]);

  /**
   * Get formatted remaining time
   */
  const getFormattedTime = useCallback((): string => {
    if (state.status === 'locked') {
      return '00:00';
    }
    return `${Math.floor(state.remainingTime / 60)}:${String(Math.floor(state.remainingTime % 60)).padStart(2, '0')}`;
  }, [state.status, state.remainingTime]);

  return {
    state,
    start,
    pause,
    reset,
    unlock,
    subscribe,
    getProgress,
    getFormattedTime,
  };
}

export default useTimer;
