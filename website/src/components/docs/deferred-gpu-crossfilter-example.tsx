import React, {Suspense, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

const LazyMillionRowCrossfilterExample = React.lazy(async () => {
  const {MillionRowCrossfilterExample} = await import('../../examples');
  return {default: MillionRowCrossfilterExample};
});

/** Keeps the million-row GPU dashboard and example registry out of ordinary documentation loads. */
export function DeferredGPUCrossfilterExample({embeddedHeight = 900}: {embeddedHeight?: number}) {
  const [isRequested, setIsRequested] = useState(false);
  const previewImageUrl = useBaseUrl('/images/examples/showcase/million-row-crossfilter.jpg');

  if (isRequested) {
    return (
      <Suspense
        fallback={
          <div aria-live="polite" role="status" style={{padding: 32}}>
            Loading the interactive million-row crossfilter explorer…
          </div>
        }
      >
        <LazyMillionRowCrossfilterExample
          embedded
          embeddedHeight={embeddedHeight}
          showHeader={false}
          showStats={false}
        />
      </Suspense>
    );
  }

  return (
    <section
      aria-label="Interactive million-row crossfilter explorer"
      style={{
        minHeight: 320,
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'start',
        gap: 12,
        padding: 28,
        margin: '1.5rem 0',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: 12,
        background: `linear-gradient(90deg, rgba(4, 10, 20, 0.96), rgba(4, 10, 20, 0.58)), url("${previewImageUrl}") center / cover`,
        color: '#f8fafc'
      }}
    >
      <span
        style={{
          color: '#67e8f9',
          fontSize: 11,
          fontWeight: 750,
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }}
      >
        Optional interactive WebGPU explorer
      </span>
      <strong style={{fontSize: 22, lineHeight: 1.2}}>
        Explore one million linked GPU-resident rows.
      </strong>
      <span style={{maxWidth: 480, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6}}>
        Brush a map, scatterplot, or histogram and watch every linked view update together.
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
        Launch interactive explorer →
      </button>
    </section>
  );
}
