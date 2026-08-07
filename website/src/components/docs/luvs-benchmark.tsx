import React, {type ReactNode, useEffect, useId, useState} from 'react';
import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';
import {
  LUVS_BENCHMARK_MEASURED_ITERATIONS,
  LUVS_BENCHMARK_WARMUP_ITERATIONS,
  runLuvsBenchmark,
  type LuvsBenchmarkReport
} from './luvs-benchmark-runtime';

const DATASET_ROW_COUNTS = [512, 2_048, 8_192] as const;
const EMBEDDING_DIMENSIONS = [32, 128, 384, 768, 1_536] as const;
const QUERY_COUNTS = [1, 4, 8] as const;
const RESULT_COUNTS = [1, 5, 10, 20] as const;
const FILTER_PERCENTAGES = [5, 25, 50, 100] as const;
const IVF_LIST_COUNTS = [4, 8, 16] as const;
const IVF_PROBE_COUNTS = [1, 2, 4, 8, 16] as const;

/** Compares real CPU, exact WebGPU, filtered WebGPU, and IVF-flat embedding searches. */
export function LuvsBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice || store.device);
  const [datasetRowCount, setDatasetRowCount] = useState(2_048);
  const [dimensions, setDimensions] = useState(128);
  const [queryCount, setQueryCount] = useState(4);
  const [resultCount, setResultCount] = useState(10);
  const [filterPercentage, setFilterPercentage] = useState(25);
  const [listCount, setListCount] = useState(8);
  const [probeCount, setProbeCount] = useState(2);
  const [unsupportedReason, setUnsupportedReason] = useState<string>();
  const identifier = useId();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      setUnsupportedReason('WebGPU is unavailable in this browser or secure context.');
    }
  }, []);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          marginBottom: 16
        }}
      >
        <LuvsBenchmarkControl
          identifier={`${identifier}-dataset`}
          label="Dataset rows"
          options={DATASET_ROW_COUNTS}
          value={datasetRowCount}
          onChange={setDatasetRowCount}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-dimensions`}
          label="Dimensions"
          options={EMBEDDING_DIMENSIONS}
          value={dimensions}
          onChange={setDimensions}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-queries`}
          label="Queries"
          options={QUERY_COUNTS}
          value={queryCount}
          onChange={setQueryCount}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-results`}
          label="Nearest neighbors (K)"
          options={RESULT_COUNTS}
          value={resultCount}
          onChange={setResultCount}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-filter`}
          label="Selected rows (%)"
          options={FILTER_PERCENTAGES}
          value={filterPercentage}
          onChange={setFilterPercentage}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-lists`}
          label="IVF lists"
          options={IVF_LIST_COUNTS}
          value={listCount}
          onChange={nextListCount => {
            setListCount(nextListCount);
            setProbeCount(Math.min(probeCount, nextListCount));
          }}
        />
        <LuvsBenchmarkControl
          identifier={`${identifier}-probes`}
          label="IVF probes"
          options={IVF_PROBE_COUNTS.filter(count => count <= listCount)}
          value={probeCount}
          onChange={setProbeCount}
        />
      </div>

      <LiveBenchmarkPanel
        title="Live luVS: exact and approximate embedding search"
        description="Compare independently verified CPU exact, WebGPU exact, filtered WebGPU exact, and filtered IVF-flat search over the same deterministic Float32 embedding chunks."
        runLabel="Run live CPU and WebGPU vector benchmark"
        unsupportedReason={unsupportedReason}
        onRun={async () => {
          const device =
            selectedDevice?.type === 'webgpu' ? selectedDevice : await createDevice('webgpu-core');
          const report = await runLuvsBenchmark(device, {
            datasetRowCount,
            dimensions,
            queryCount,
            resultCount,
            filterPercentage,
            listCount,
            probeCount
          });
          return <LuvsBenchmarkResults report={report} />;
        }}
      />
    </div>
  );
}

function LuvsBenchmarkControl({
  identifier,
  label,
  options,
  value,
  onChange
}: {
  identifier: string;
  label: string;
  options: readonly number[];
  value: number;
  onChange: (value: number) => void;
}): ReactNode {
  return (
    <label htmlFor={identifier} style={{display: 'grid', gap: 4}}>
      {label}
      <select
        id={identifier}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option.toLocaleString()}
          </option>
        ))}
      </select>
    </label>
  );
}

function LuvsBenchmarkResults({report}: {report: LuvsBenchmarkReport}): ReactNode {
  const {
    results,
    uploadMilliseconds,
    indexBuildMilliseconds,
    indexByteLength,
    options,
    timestampQueries,
    deviceLabel
  } = report;
  const cpuMilliseconds = results[0].medianMilliseconds;

  return (
    <>
      <p>
        <strong>{options.datasetRowCount.toLocaleString()}</strong> rows ×{' '}
        <strong>{options.dimensions.toLocaleString()}</strong> dimensions ·{' '}
        <strong>{options.queryCount}</strong> queries · K = <strong>{options.resultCount}</strong> ·{' '}
        {deviceLabel}
      </p>
      <table style={{fontSize: 13, minWidth: 900, width: '100%'}}>
        <thead>
          <tr>
            <th>Execution</th>
            <th>Median query</th>
            <th>CPU encode</th>
            <th>Candidate GPU</th>
            <th>Readback</th>
            <th>CPU comparison</th>
            <th>Candidate evaluations</th>
            <th>Recall@K</th>
          </tr>
        </thead>
        <tbody>
          {results.map(result => (
            <tr key={result.label}>
              <td>{result.label}</td>
              <td>{formatLuvsMilliseconds(result.medianMilliseconds)}</td>
              <td>{formatOptionalLuvsMilliseconds(result.encodeMilliseconds)}</td>
              <td>{formatOptionalLuvsMilliseconds(result.rerankMilliseconds)}</td>
              <td>{formatOptionalLuvsMilliseconds(result.readbackMilliseconds)}</td>
              <td>
                {(cpuMilliseconds / Math.max(result.medianMilliseconds, Number.EPSILON)).toFixed(2)}
                ×
              </td>
              <td>{result.candidateCount.toLocaleString()}</td>
              <td>
                {result.recall === undefined ? 'Exact' : `${(result.recall * 100).toFixed(1)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        One-time source upload: <strong>{formatLuvsMilliseconds(uploadMilliseconds)}</strong>;
        {` ${options.listCount}-list IVF training and index build: `}
        <strong>{formatLuvsMilliseconds(indexBuildMilliseconds)}</strong>; reusable index storage:{' '}
        <strong>{(indexByteLength / 1024).toFixed(1)} KiB</strong>. The approximate query probes{' '}
        <strong>{options.probeCount}</strong> lists without fallback expansion.
      </p>
      <p>
        Candidate evaluations sum eligible candidates across all selected queries. Query medians
        include encoding, submission, and an explicit GPU completion fence, but exclude upload,
        graph compilation, index training, and the separately reported correctness readback. Medians
        use {LUVS_BENCHMARK_WARMUP_ITERATIONS} warmup and {LUVS_BENCHMARK_MEASURED_ITERATIONS}{' '}
        measured runs.
        {timestampQueries
          ? ' Candidate GPU time uses available per-pass timestamp queries.'
          : ' Candidate GPU timing is unavailable because this adapter has no timestamp queries.'}
      </p>
    </>
  );
}

function formatLuvsMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(3)} ms`;
}

function formatOptionalLuvsMilliseconds(milliseconds: number | undefined): string {
  return milliseconds === undefined ? '—' : formatLuvsMilliseconds(milliseconds);
}
