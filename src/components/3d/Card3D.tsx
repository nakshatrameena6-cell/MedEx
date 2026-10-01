import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion';

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  specularColor?: string;
  depth?: number;
  maxTilt?: number;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glowColor,
  specularColor,
  depth = 8,
  maxTilt = 2,
  interactive = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for normalized cursor coordinates (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery-smooth tilt interpolation
  const springConfig = { damping: 22, stiffness: 280, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Tilt range in degrees based on maxTilt
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);


  const glareX = useTransform(smoothX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(smoothY, [-0.5, 0.5], [0, 100]);
  const sheenColor = specularColor || glowColor || 'rgba(140, 191, 255, 0.08)';
  const sheen = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, ${sheenColor}, transparent 65%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normalizedX = clientX / width - 0.5;
    const normalizedY = clientY / height - 0.5;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);

  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: prefersReduced ? 'none' : 1100,
        transformStyle: prefersReduced ? 'flat' : 'preserve-3d',
      }}
      className={`relative group ${className}`}
    >
      <motion.div
        style={{
          rotateX: prefersReduced ? 0 : rotateX,
          rotateY: prefersReduced ? 0 : rotateY,
          transformStyle: prefersReduced ? 'flat' : 'preserve-3d',
        }}
        whileHover={prefersReduced || !interactive ? undefined : { scale: 1.01 }}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="surface-card w-full h-full relative transition-colors duration-300 group-hover:border-theme-border-control text-theme-text"
      >
        {/* Dynamic Specular Sheen (follows cursor spotlight) */}
        {!prefersReduced && interactive && isHovered && (
          <motion.div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-100 z-10"
            style={{
              background: sheen,
            }}
          />
        )}

        {/* Tactical Edge Specular Border Line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

        {/* Content with 3D Z-Depth Translation */}
        <div
          style={{
            transform: prefersReduced ? 'none' : `translateZ(${depth}px)`,
            transformStyle: prefersReduced ? 'flat' : 'preserve-3d',
          }}
          className="relative z-20 h-full"
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Card3D;
