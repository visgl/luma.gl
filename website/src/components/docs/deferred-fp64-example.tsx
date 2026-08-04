import React, {Suspense, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

const LazyFP64Example = React.lazy(async () => {
  const {FP64Example} = await import('../../examples');
  return {default: FP64Example};
});

/** Keeps the heavyweight precision scene and example registry out of ordinary documentation loads. */
export function DeferredFP64Example({embeddedHeight = 900}: {embeddedHeight?: number}) {
  const [isRequested, setIsRequested] = useState(false);
  const previewImageUrl = useBaseUrl('/images/examples/experimental/fp64.jpg');

  if (isRequested) {
    return (
      <Suspense
        fallback={
          <div aria-live="polite" role="status" style={{padding: 32}}>
            Loading the interactive GPU precision benchmark…
          </div>
        }
      >
        <LazyFP64Example autoStart embedded embeddedHeight={embeddedHeight} />
      </Suspense>
    );
  }

  return (
    <section
      aria-label="Interactive GPU precision benchmark"
      style={{
        minHeight: 280,
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'start',
        gap: 12,
        padding: 28,
        margin: '1.5rem 0',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: 12,
        background: `linear-gradient(90deg, rgba(4, 10, 20, 0.97), rgba(4, 10, 20, 0.68)), url("${previewImageUrl}") center / cover`,
        color: '#f8fafc'
      }}
    >
      <span
        style={{
          color: '#a5b4fc',
          fontSize: 11,
          fontWeight: 750,
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }}
      >
        Optional interactive GPU benchmark
      </span>
      <strong style={{fontSize: 22, lineHeight: 1.2}}>Explore floating-point precision.</strong>
      <span style={{maxWidth: 460, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6}}>
        Compare Mandelbrot rendering and compute precision when you are ready to use your GPU.
      </span>
      <button
        onClick={() => setIsRequested(true)}
        style={{
          border: 0,
          borderRadius: 999,
          background: '#e2e8f0',
          color: '#0f172a',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          padding: '10px 16px'
        }}
        type="button"
      >
        Launch precision benchmark →
      </button>
    </section>
  );
}
