import React, { useEffect, useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ProgressRing } from '@/components/ProgressRing';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Instructions } from '@/components/Instructions';
import type { TimerStatus } from '@/types';

/**
 * Main Timer Lockout Application Component
 * 
 * Implements a production-quality timer with:
 * - 3-minute countdown
 * - Lockout period after completion
 * - Manual reset required
 * - Responsive design
 * - Accessibility features
 * - Professional UI/UX
 */
const App: React.FC = () => {
  const LOCKOUT_DURATION = 180; // 3 minutes in seconds
  const {
    state,
    start,
    reset,
    getProgress,
    getFormattedTime,
  } = useTimer(LOCKOUT_DURATION);

  const [showInstructions, setShowInstructions] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Track if timer has been started at least once
  useEffect(() => {
    if (state.status === 'running' && !hasStarted) {
      setHasStarted(true);
    }
  }, [state.status, hasStarted]);

  // Handle keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or Enter to start/reset when button is enabled
      if (state.isButtonEnabled && (e.key === ' ' || e.key === 'Enter')) {
        if (state.status === 'idle') {
          start();
        } else {
          reset();
        }
        e.preventDefault();
      }
      
      // Escape to reset
      if (e.key === 'Escape') {
        reset();
        e.preventDefault();
      }
      
      // 'i' key to toggle instructions
      if (e.key === 'i' || e.key === 'I') {
        setShowInstructions(prev => !prev);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, state.isButtonEnabled, start, reset]);

  // Get action button text based on state
  const getActionButtonText = (): string => {
    if (state.status === 'idle' && !hasStarted) {
      return 'Start Timer';
    }
    if (state.status === 'idle' && hasStarted) {
      return 'Start Again';
    }
    if (state.status === 'running') {
      return 'Reset Timer';
    }
    if (state.status === 'locked') {
      return 'Reset Timer';
    }
    return 'Start Timer';
  };

  // Get action button variant based on state
  const getActionButtonVariant = (): 'primary' | 'secondary' | 'danger' | 'outline' => {
    if (state.status === 'locked') {
      return 'danger';
    }
    if (state.status === 'running') {
      return 'secondary';
    }
    return 'primary';
  };

  // Determine if action button should be disabled
  const isActionButtonDisabled = !state.isButtonEnabled;

  // Handle action button click
  const handleActionClick = () => {
    if (state.status === 'idle') {
      start();
    } else {
      reset();
    }
  };

  // Get status message for screen readers
  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'idle':
        return hasStarted 
          ? 'Timer is ready to start again'
          : 'Timer is ready to start';
      case 'running':
        return `Timer is running with ${Math.floor(state.remainingTime / 60)} minutes and ${Math.floor(state.remainingTime % 60)} seconds remaining`;
      case 'locked':
        return 'Timer is locked. Press reset button to unlock.';
      case 'completed':
        return 'Timer completed. Lockout period active.';
      default:
        return 'Unknown timer state';
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
            Timer Lockout
          </h1>
          <p className="text-secondary-500 text-lg">
            3-Minute Delay with Manual Reset
          </p>
        </header>

        {/* Main Timer Card */}
        <Card className="mb-8">
          <div className="flex flex-col items-center gap-6">
            {/* Status Indicator */}
            <StatusIndicator status={state.status} />

            {/* Timer Display */}
            <TimerDisplay time={state.remainingTime} status={state.status} />

            {/* Progress Ring */}
            <ProgressRing 
              progress={getProgress()} 
              size={200}
              strokeWidth={10}
            />

            {/* Action Button */}
            <Button
              variant={getActionButtonVariant()}
              size="lg"
              disabled={isActionButtonDisabled}
              onClick={handleActionClick}
              aria-label={getActionButtonText()}
              className="w-full sm:w-auto min-w-[200px]"
              data-testid="action-button"
            >
              {getActionButtonText()}
            </Button>

            {/* Keyboard Shortcuts Help */}
            <p className="text-xs text-secondary-500 mt-2">
              Press Space/Enter to start/reset | Escape to reset | I for instructions
            </p>
          </div>
        </Card>

        {/* Instructions Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            aria-expanded={showInstructions}
            aria-controls="instructions-section"
          >
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
          </Button>
        </div>

        {/* Instructions Section */}
        {showInstructions && (
          <Instructions id="instructions-section" />
        )}

        {/* Technical Details Card */}
        <Card title="Technical Details" subtitle="Implementation Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Lockout Duration</p>
                <p className="font-medium">3 Minutes (180 seconds)</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 mb-1">Current State</p>
                <p className="font-medium capitalize">{state.status}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 mb-1">Remaining Time</p>
                <p className="font-medium">{getFormattedTime()}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 mb-1">Progress</p>
                <p className="font-medium">{Math.round(getProgress())}%</p>
              </div>
            </div>
            <div className="pt-4 border-t border-secondary-200">
              <p className="text-sm text-secondary-600">
                <strong>Implementation Note:</strong> This software timer implements the same logic as a hardware 
                timer circuit with a 3-minute monostable multivibrator followed by a latch that requires 
                manual reset via button press.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-secondary-500">
          <p>Production-Quality Timer Application | Built with React, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">
            <a 
              href="https://github.com/PAVAN-NIKHIL-993/MY-WORK" 
              className="text-primary-600 hover:text-primary-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source Code
            </a>
          </p>
        </footer>
      </div>

      {/* Screen Reader Status Announcement */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default App;
