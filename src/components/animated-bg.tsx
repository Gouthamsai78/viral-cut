'use client';

import React, { useEffect, useState } from 'react';

/**
 * Animated background with floating geometric shapes
 * Creates depth and visual interest without being distracting
 */
export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Gradient orb 1 - primary coral */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] transition-transform duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%)',
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
        }}
      />

      {/* Gradient orb 2 - secondary blue */}
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] transition-transform duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
          transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
        }}
      />

      {/* Gradient orb 3 - warm amber accent */}
      <div
        className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full blur-[80px] transition-transform duration-700"
        style={{
          background: 'radial-gradient(circle, rgba(255, 184, 0, 0.06) 0%, transparent 70%)',
          transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
        }}
      />

      {/* Floating geometric shapes */}
      {/* Circle 1 */}
      <div
        className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full border border-white/5 float"
        style={{ animationDelay: '0s' }}
      />

      {/* Circle 2 */}
      <div
        className="absolute bottom-[25%] left-[8%] w-24 h-24 rounded-full border border-white/5 float"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Square rotated */}
      <div
        className="absolute top-[60%] right-[15%] w-20 h-20 border border-white/5 float"
        style={{
          transform: 'rotate(45deg)',
          animationDelay: '2.5s',
        }}
      />

      {/* Triangle hint */}
      <div
        className="absolute top-[30%] left-[15%] w-0 h-0 float"
        style={{
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '26px solid rgba(255, 255, 255, 0.03)',
          animationDelay: '3s',
        }}
      />

      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
