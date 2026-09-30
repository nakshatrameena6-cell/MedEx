import React from 'react';

interface PriorityBadgeProps {
  score: number; // 0 to 1 or 0 to 100
  label?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ score, label }) => {
  // Normalize score if 0-1 vs 0-100
  const normalizedScore = score <= 1 ? Math.round(score * 100) : score;

  const getPriorityTheme = () => {
    if (normalizedScore >= 80) {
      return {
        bg: 'bg-medex-red/15 border-medex-red/40 text-medex-red-light',
        tag: 'P1 CRITICAL',
      };
    } else if (normalizedScore >= 50) {
      return {
        bg: 'bg-medex-amber/15 border-medex-amber/40 text-medex-amber-light',
        tag: 'P2 HIGH',
      };
    } else {
      return {
        bg: 'bg-medex-cyan/15 border-medex-cyan/40 text-medex-cyan-light',
        tag: 'P3 NORMAL',
      };
    }
  };

  const theme = getPriorityTheme();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-mono font-semibold border ${theme.bg}`}
    >
      <span>{label || theme.tag}</span>
      <span className="opacity-60">|</span>
      <span>{score <= 1 ? score.toFixed(2) : score}</span>
    </span>
  );
};
