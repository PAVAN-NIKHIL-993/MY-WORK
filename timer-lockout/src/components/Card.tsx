import React from 'react';
import type { CardProps } from '@/types';

/**
 * Reusable Card component with consistent styling
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  footer,
}) => {
  return (
    <div className={`card ${className}`} role="region" aria-label={title || 'Card'}>
      {(title || subtitle) && (
        <div className="p-6 pb-0">
          {title && (
            <h3 className="text-xl font-semibold text-secondary-900" id={title.toLowerCase().replace(/\s+/g, '-')}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="p-6 pt-0 border-t border-secondary-200">{footer}</div>}
    </div>
  );
};

export default Card;
