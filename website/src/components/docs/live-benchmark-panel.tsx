import React, {type ReactNode, useEffect, useRef, useState} from 'react';

/** Shared, user-triggered presentation for benchmarks executed on the visitor's actual device. */
export type LiveBenchmarkPanelProps = {
  /** Accessible panel heading describing the benchmarked operation. */
  title: string;
  /** Short explanation of the workload and what its measurements include. */
  description?: string;
  /** Optional benchmark controls rendered beside the run action. */
  controls?: ReactNode;
  /** Places the benchmark in a single disclosure card instead of an always-open panel. */
  collapsible?: boolean;
  /** Optional action text; defaults to a WebGPU-oriented benchmark label. */
  runLabel?: string;
  /** Executes real benchmark work and returns the results to render. */
  onRun: () => Promise<ReactNode>;
  /** Optional stable placeholder rendered in the results area while work is in progress. */
  runningContent?: ReactNode;
  /** Optional stable table or preview rendered before the first benchmark run. */
  idleContent?: ReactNode;
  /** Explicit capability message that disables the benchmark without claiming synthetic results. */
  unsupportedReason?: string;
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
  controls,
  collapsible = false,
  runLabel = 'Run live WebGPU benchmark',
  onRun,
  runningContent,
  idleContent,
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

  const content = (
    <>
      {description ? <p className="luma-live-benchmark__description">{description}</p> : null}

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

      {isRunning && runningContent ? (
        <div aria-busy="true" aria-live="polite" style={{marginTop: '1rem', overflowX: 'auto'}}>
          {runningContent}
        </div>
      ) : results ? (
        <div aria-live="polite" style={{marginTop: '1rem', overflowX: 'auto'}}>
          {results}
        </div>
      ) : idleContent && !unsupportedReason ? (
        <div style={{marginTop: '1rem', overflowX: 'auto'}}>{idleContent}</div>
      ) : null}

      <div className="luma-live-benchmark__actions">
        {controls}
        <button
          className="button button--primary button--sm"
          disabled={isRunning || Boolean(unsupportedReason)}
          onClick={() => {
            void handleRun();
          }}
          type="button"
        >
          {isRunning ? 'Running…' : runLabel}
        </button>
      </div>
    </>
  );

  if (collapsible) {
    return (
      <details className="luma-live-benchmark" data-live-benchmark="true">
        <summary className="luma-live-benchmark__summary">
          <strong>{title}</strong>
        </summary>
        <div className="luma-live-benchmark__body">{content}</div>
      </details>
    );
  }

  return (
    <section
      aria-label={title}
      className="luma-live-benchmark luma-live-benchmark--panel"
      data-live-benchmark="true"
    >
      <h3>{title}</h3>
      {content}
    </section>
  );
}
