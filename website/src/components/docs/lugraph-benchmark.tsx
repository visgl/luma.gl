import React, {useEffect, useState, type ReactNode} from 'react';

import {
  runLuGraphBenchmark,
  type LuGraphBenchmarkAlgorithm,
  type LuGraphBenchmarkDatasetKind,
  type LuGraphBenchmarkPathReport,
  type LuGraphBenchmarkReport
} from '@luma.gl/experimental/lugraph/benchmarks';

import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const GRAPH_BENCHMARK_VERTEX_COUNTS = [32, 64, 128, 256] as const;
const GRAPH_BENCHMARK_DATASETS: {
  kind: LuGraphBenchmarkDatasetKind;
  label: string;
}[] = [
  {kind: 'sparse', label: 'Sparse'},
  {kind: 'dense', label: 'Dense'},
  {kind: 'scale-free', label: 'Scale-free'},
  {kind: 'disconnected', label: 'Disconnected'},
  {kind: 'high-degree', label: 'High-degree hub'}
];

/** Runs honest CPU and fence-synchronized WebGPU graph workloads only after an explicit click. */
export function LuGraphBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice || store.device);
  const [datasetKind, setDatasetKind] = useState<LuGraphBenchmarkDatasetKind>('scale-free');
  const [vertexCount, setVertexCount] = useState<number>(128);
  const [webGPUUnavailable, setWebGPUUnavailable] = useState(false);

  useEffect(() => {
    setWebGPUUnavailable(typeof navigator === 'undefined' || !('gpu' in navigator));
  }, []);

  return (
    <div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 12}}>
        <label
          htmlFor="lugraph-benchmark-dataset"
          style={{alignItems: 'center', display: 'flex', gap: 8}}
        >
          Graph dataset
          <select
            id="lugraph-benchmark-dataset"
            onChange={event =>
              setDatasetKind(event.target.value as LuGraphBenchmarkDatasetKind)
            }
            value={datasetKind}
          >
            {GRAPH_BENCHMARK_DATASETS.map(dataset => (
              <option key={dataset.kind} value={dataset.kind}>
                {dataset.label}
              </option>
            ))}
          </select>
        </label>

        <label
          htmlFor="lugraph-benchmark-vertex-count"
          style={{alignItems: 'center', display: 'flex', gap: 8}}
        >
          Vertices
          <select
            id="lugraph-benchmark-vertex-count"
            onChange={event => setVertexCount(Number(event.target.value))}
            value={vertexCount}
          >
            {GRAPH_BENCHMARK_VERTEX_COUNTS.map(count => (
              <option key={count} value={count}>
                {count.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <LiveBenchmarkPanel
        title="Live CPU versus WebGPU graph analytics"
        description="Run the same deterministic graph through real CPU and GPU adjacency, neighborhood search, weak components, PageRank, exact force layout, and explicitly approximate spatial force layout."
        runLabel="Run graph benchmark on this device"
        unsupportedReason={
          webGPUUnavailable
            ? 'WebGPU is unavailable in this browser. Use a WebGPU-capable browser and a secure origin.'
            : undefined
        }
        onRun={async () => {
          const device =
            selectedDevice?.type === 'webgpu' ? selectedDevice : await createDevice('webgpu-core');
          const report = await runLuGraphBenchmark(device, {
            kind: datasetKind,
            vertexCount,
            seed: 42,
            warmupIterations: 1,
            measuredIterations: 3,
            pageRankIterations: 20,
            forceIterations: 1,
            maxDepth: 6,
            theta: 0.6,
            gridSize: [8, 8]
          });

          return (
            <LuGraphBenchmarkResults
              report={report}
              deviceLabel={device.info.renderer || device.info.vendor || device.info.gpu}
            />
          );
        }}
      />
    </div>
  );
}

function LuGraphBenchmarkResults({
  report,
  deviceLabel
}: {
  report: LuGraphBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{report.datasetKind}</strong> · <strong>{report.vertexCount.toLocaleString()}</strong>{' '}
        vertices · <strong>{report.edgeCount.toLocaleString()}</strong> edges ·{' '}
        <strong>{report.measuredIterations}</strong> measured iterations · {deviceLabel}
      </p>

      <div style={{overflowX: 'auto'}}>
        <table style={{fontSize: 13, minWidth: 880, width: '100%'}}>
          <thead>
            <tr>
              <th>Graph operation</th>
              <th>CPU median</th>
              <th>CPU encode</th>
              <th>Fenced GPU median</th>
              {report.timestampQueries ? <th>GPU timestamp</th> : null}
              <th>GPU versus CPU</th>
              <th>Oracle error</th>
              <th>GPU working memory</th>
            </tr>
          </thead>
          <tbody>
            {report.paths.map(path => (
              <LuGraphBenchmarkRow
                key={path.algorithm}
                path={path}
                showTimestamp={report.timestampQueries}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p style={{fontSize: 12, margin: '10px 0 0'}}>
        Source upload: {formatMilliseconds(report.uploadTimeMilliseconds)} · graph compilation:{' '}
        {formatMilliseconds(report.compilationTimeMilliseconds)} · explicit validation readback:{' '}
        {formatMilliseconds(report.readbackTimeMilliseconds)}. These phases are reported separately
        and are excluded from fenced operation measurements.
      </p>

      <p style={{fontSize: 12, margin: '8px 0 0'}}>
        Standalone spatial-grid rebuild: {formatMilliseconds(report.spatialIndexBuildTimeMilliseconds.median)} median ·
        caller-owned grid storage: {formatBytes(report.indexMemoryBytes)} · accelerated-versus-exact
        maximum coordinate error: {formatError(report.approximationMaxAbsoluteError)}.
      </p>

      <p style={{fontSize: 12, margin: '8px 0 0'}}>
        Every GPU submission completes through an explicit fence before its timer stops. Each result
        is checked against an independent CPU oracle; spatial approximation error is additionally
        compared with the exact force reference. Measurements describe this browser and adapter,
        not cross-device performance guarantees.
      </p>
    </div>
  );
}

function LuGraphBenchmarkRow({
  path,
  showTimestamp
}: {
  path: LuGraphBenchmarkPathReport;
  showTimestamp: boolean;
}): ReactNode {
  const cpuMedian = path.cpuTimeMilliseconds.median;
  const gpuMedian = path.synchronizedTimeMilliseconds.median;
  const speedup = gpuMedian > 0 ? cpuMedian / gpuMedian : 0;

  return (
    <tr>
      <td>{formatAlgorithm(path.algorithm)}</td>
      <td>{formatMilliseconds(cpuMedian)}</td>
      <td>{formatMilliseconds(path.cpuEncodeTimeMilliseconds.median)}</td>
      <td>{formatMilliseconds(gpuMedian)}</td>
      {showTimestamp ? (
        <td>
          {path.gpuTimeMilliseconds
            ? formatMilliseconds(path.gpuTimeMilliseconds.median)
            : 'Unavailable'}
        </td>
      ) : null}
      <td>{speedup.toFixed(2)}×</td>
      <td>{formatError(path.maxAbsoluteError)}</td>
      <td>
        {formatBytes(path.importedBufferBytes)} source · {formatBytes(path.transientBufferBytes)}{' '}
        scratch
      </td>
    </tr>
  );
}

function formatAlgorithm(algorithm: LuGraphBenchmarkAlgorithm): string {
  const labels: Record<LuGraphBenchmarkAlgorithm, string> = {
    topology: 'CSR adjacency',
    'breadth-first-search': 'Neighborhood search',
    'connected-components': 'Weak components',
    'page-rank': 'PageRank',
    'exact-layout': 'Exact force layout',
    'spatial-layout': 'Approximate spatial layout'
  };
  return labels[algorithm];
}

function formatMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(3)} ms`;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KiB` : `${bytes} B`;
}

function formatError(error: number): string {
  return error === 0 ? 'Exact' : error.toExponential(2);
}
