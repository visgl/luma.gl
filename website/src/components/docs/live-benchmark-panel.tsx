import React, {type CSSProperties, type ReactNode, useEffect, useRef, useState} from 'react';

/** Shared, user-triggered presentation for benchmarks executed on the visitor's actual device. */
export type LiveBenchmarkPanelProps = {
  /** Accessible panel heading describing the benchmarked operation. */
  title: string;
  /** Short explanation of the workload and what its measurements include. */
  description: string;
  /** Optional action text; defaults to a WebGPU-oriented benchmark label. */
  runLabel?: string;
  /** Executes real benchmark work and returns the results to render. */
  onRun: () => Promise<ReactNode>;
  /** Explicit capability message that disables the benchmark without claiming synthetic results. */
  unsupportedReason?: string;
};

const PANEL_STYLE: CSSProperties = {
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 12,
  margin: '1.25rem 0 2rem',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
};

/**
 * Keeps documentation benchmarks opt-in, accessible, SSR-safe, and visibly device-specific.
 *
 * Work never starts during render or page hydration. A generation counter prevents a promise
 * finishing after navigation from updating a component that has already unmounted.
 */
export function LiveBenchmarkPanel({
  title,
  description,
  runLabel = 'Run live WebGPU benchmark',
  onRun,
  unsupportedReason
}: LiveBenchmarkPanelProps): ReactNode {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const runGeneration = useRef(0);

  useEffect(() => {
    return () => {
      runGeneration.current++;
    };
  }, []);

  const handleRun = async (): Promise<void> => {
    if (isRunning || unsupportedReason) {
      return;
    }

    const currentGeneration = ++runGeneration.current;
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const benchmarkResults = await onRun();
      if (runGeneration.current === currentGeneration) {
        setResults(benchmarkResults);
      }
    } catch (benchmarkError) {
      if (runGeneration.current === currentGeneration) {
        setError(benchmarkError instanceof Error ? benchmarkError.message : String(benchmarkError));
      }
    } finally {
      if (runGeneration.current === currentGeneration) {
        setIsRunning(false);
      }
    }
  };

  return (
    <section aria-label={title} data-live-benchmark="true" style={PANEL_STYLE}>
      <h3 style={{marginTop: 0}}>{title}</h3>
      <p>{description}</p>

      <button
        className="button button--primary"
        disabled={isRunning || Boolean(unsupportedReason)}
        onClick={() => {
          void handleRun();
        }}
        type="button"
      >
        {isRunning ? 'Running on your device…' : runLabel}
      </button>

      {unsupportedReason ? (
        <p aria-live="polite" style={{marginBottom: 0}}>
          {unsupportedReason}
        </p>
      ) : null}

      {error ? (
        <p role="alert" style={{color: 'var(--ifm-color-danger)', marginBottom: 0}}>
          {error}
        </p>
      ) : null}

      {results ? (
        <div aria-live="polite" style={{marginTop: '1rem', overflowX: 'auto'}}>
          {results}
        </div>
      ) : null}
    </section>
  );
}
