/**
 * Timer state types
 */
export type TimerStatus = 'idle' | 'running' | 'locked' | 'completed';

export interface TimerState {
  status: TimerStatus;
  remainingTime: number; // in seconds
  startTime: number | null;
  lockoutEndTime: number | null;
  isButtonEnabled: boolean;
}

/**
 * Application configuration types
 */
export interface AppConfig {
  lockoutDuration: number; // in seconds (default: 180 = 3 minutes)
  appTitle: string;
  appVersion: string;
}

/**
 * API response types (for future extensibility)
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Event types
 */
export type TimerEvent = 
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'COMPLETE' }
  | { type: 'LOCKOUT_START' }
  | { type: 'LOCKOUT_END' };

/**
 * Component props types
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export interface TimerDisplayProps {
  time: number; // in seconds
  status: TimerStatus;
  showMilliseconds?: boolean;
}

/**
 * Loading spinner props
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Skeleton props
 */
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}
