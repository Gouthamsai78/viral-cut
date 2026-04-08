'use client';

/**
 * Film grain noise texture overlay
 * Adds subtle analog film feel to prevent "clean AI" look
 */
export function FilmGrain({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div
      className="film-grain"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
