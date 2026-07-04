'use client';

import dynamic from 'next/dynamic';

const CircuitScene = dynamic(() => import('./circuit-scene'), {
  ssr: false,
  loading: () => null,
});

export function HeroCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <CircuitScene />
    </div>
  );
}
