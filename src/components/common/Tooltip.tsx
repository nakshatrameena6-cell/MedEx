import React, { useState } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-1.5 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-1.5 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-1.5 top-1/2 -translate-y-1/2';
      default:
        return 'bottom-full mb-1.5 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-2xs font-mono text-medex-primary bg-medex-elevated border border-medex-border shadow-lg rounded whitespace-nowrap pointer-events-none ${getPositionClasses()} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
