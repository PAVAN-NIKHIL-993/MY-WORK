import React from 'react';
import Card from './Card';

/**
 * Instructions component explaining how the timer works
 */
export const Instructions: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Start Timer',
      description: 'Press the Start button to begin the 3-minute countdown.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      step: 2,
      title: 'Countdown',
      description: 'The timer counts down from 3:00 to 00:00. The progress ring shows elapsed time.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      step: 3,
      title: 'Lockout Period',
      description: 'After reaching 00:00, the timer enters a 3-minute lockout. The button is disabled.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      step: 4,
      title: 'Reset',
      description: 'Press the Reset button to clear the lockout and start a new timer.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  return (
    <Card title="How It Works" subtitle="Understanding the timer behavior">
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.step}
            className="flex items-start gap-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
              {step.step}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-secondary-900 mb-1">{step.title}</h4>
              <p className="text-secondary-600 text-sm">{step.description}</p>
            </div>
            <div className="flex-shrink-0 text-primary-500">{step.icon}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-sm text-primary-800">
          <strong>Note:</strong> This implements the hardware timer circuit logic you requested - 
          a 3-minute delay followed by a lockout period that requires manual reset.
        </p>
      </div>
    </Card>
  );
};

export default Instructions;
