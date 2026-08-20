import React, {useEffect, useState, type ReactNode} from 'react';

import {createWebMercatorProjection} from '@luma.gl/experimental/gpu-project';
import {
  runGPUProjectionBenchmark,
  type GPUProjectionBenchmarkPathReport,
  type GPUProjectionBenchmarkReport,
  type ProjectionBenchmarkPathReport
} from '@luma.gl/experimental/gpu-project/benchmarks';

import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const PROJECTION_BENCHMARK_ROW_COUNTS = [4_096, 16_384, 65_536, 262_144] as const;

/** Runs the documented projection benchmark against the reader's actual browser and GPU. */
export function ProjectionBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice || store.device);
  const [coordinateCount, setCoordinateCount] = useState<number>(16_384);
  const [webGPUUnavailable, setWebGPUUnavailable] = useState(false);

  useEffect(() => {
    setWebGPUUnavailable(typeof navigator === 'undefined' || !('gpu' in navigator));
  }, []);

  return (
    <div>
      <label
        htmlFor="projection-benchmark-coordinate-count"
        style={{alignItems: 'center', display: 'flex', gap: 10, marginBottom: 12}}
      >
        Coordinates per run
        <select
          id="projection-benchmark-coordinate-count"
          onChange={event => setCoordinateCount(Number(event.target.value))}
          value={coordinateCount}
        >
          {PROJECTION_BENCHMARK_ROW_COUNTS.map(rowCount => (
            <option key={rowCount} value={rowCount}>
              {rowCount.toLocaleString()}
            </option>
          ))}
        </select>
      </label>

      <LiveBenchmarkPanel
        title="Live CPU versus WebGPU projection"
        description="Project the same deterministic WGS84 coordinates into Web Mercator using direct CPU calls, compiled CPU patches, and four real WebGPU execution paths."
        runLabel="Run projection benchmark"
        unsupportedReason={
          webGPUUnavailable
            ? 'WebGPU is unavailable in this browser. Use a WebGPU-capable browser and a secure origin.'
            : undefined
        }
        onRun={async () => {
          const device =
            selectedDevice?.type === 'webgpu' ? selectedDevice : await createDevice('webgpu-core');
          const report = await runGPUProjectionBenchmark(device, {
            projection: createWebMercatorProjection(),
            bounds: [-123, 37, -122, 38],
            degree: 2,
            tolerance: 0.03,
            maxDepth: 5,
            coordinateCount,
            warmupIterations: 1,
            measuredIterations: 3
          });

          return (
            <ProjectionBenchmarkResults
              report={report}
              deviceLabel={device.info.renderer || device.info.vendor || device.info.gpu}
            />
          );
        }}
      />
    </div>
  );
}

function ProjectionBenchmarkResults({
  report,
  deviceLabel
}: {
  report: GPUProjectionBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  const providerThroughput = report.cpu.paths[0].coordinatesPerSecond;

  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{report.cpu.coordinateCount.toLocaleString()}</strong> coordinates ·{' '}
        <strong>{report.cpu.patchCount}</strong> adaptive patches ·{' '}
        <strong>{report.cpu.measuredIterations}</strong> measured iterations · {deviceLabel}
      </p>

      <div style={{overflowX: 'auto'}}>
        <table style={{fontSize: 13, minWidth: 760, width: '100%'}}>
          <thead>
            <tr>
              <th>Execution</th>
              <th>Source precision</th>
              <th>Patch lookup</th>
              <th>Median</th>
              <th>Throughput</th>
              <th>Versus CPU</th>
              <th>Maximum error</th>
            </tr>
          </thead>
          <tbody>
            {report.cpu.paths.map(path => (
              <ProjectionCPUBenchmarkRow
                key={path.strategy}
                path={path}
                providerThroughput={providerThroughput}
                maxError={report.cpu.maxError}
              />
            ))}
            {report.paths.map(path => (
              <ProjectionGPUBenchmarkRow
                key={`${path.inputFormat}-${path.patchStrategy}`}
                path={path}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p style={{fontSize: 12, margin: '10px 0 0'}}>
        GPU times include command submission and a completion fence. Uploads, graph compilation,
        correctness readback, and output validation are excluded. Every GPU row is checked against
        the same CPU oracle before timings are reported.
      </p>

      {report.timestampQueries ? (
        <p style={{fontSize: 12, margin: '8px 0 0'}}>
          Timestamp-query compute-only rates:{' '}
          {report.paths
            .filter(path => path.gpuCoordinatesPerSecond !== undefined)
            .map(
              path =>
                `${formatProjectionInputFormat(path.inputFormat)} / ${formatProjectionPatchStrategy(path.patchStrategy)}: ${formatProjectionThroughput(path.gpuCoordinatesPerSecond!)}`
            )
            .join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

function ProjectionCPUBenchmarkRow({
  path,
  providerThroughput,
  maxError
}: {
  path: ProjectionBenchmarkPathReport;
  providerThroughput: number;
  maxError: number;
}): ReactNode {
  return (
    <tr>
      <td>{path.strategy === 'provider' ? 'CPU provider' : 'CPU compiled plan'}</td>
      <td>Float64</td>
      <td>
        {path.strategy === 'provider'
          ? 'Not applicable'
          : formatProjectionPatchStrategy(path.strategy === 'plan-scan' ? 'scan' : 'patch-ids')}
      </td>
      <td>{path.durationMilliseconds.median.toFixed(3)} ms</td>
      <td>{formatProjectionThroughput(path.coordinatesPerSecond)}</td>
      <td>{(path.coordinatesPerSecond / providerThroughput).toFixed(2)}×</td>
      <td>{path.strategy === 'provider' ? 'Reference' : formatProjectionError(maxError)}</td>
    </tr>
  );
}

function ProjectionGPUBenchmarkRow({path}: {path: GPUProjectionBenchmarkPathReport}): ReactNode {
  return (
    <tr>
      <td>WebGPU</td>
      <td>{formatProjectionInputFormat(path.inputFormat)}</td>
      <td>{formatProjectionPatchStrategy(path.patchStrategy)}</td>
      <td>{path.synchronizedTimeMilliseconds.median.toFixed(3)} ms</td>
      <td>{formatProjectionThroughput(path.synchronizedCoordinatesPerSecond)}</td>
      <td>{path.synchronizedSpeedupOverCPUProvider.toFixed(2)}×</td>
      <td>{formatProjectionError(path.maxError)}</td>
    </tr>
  );
}

function formatProjectionInputFormat(inputFormat: GPUProjectionBenchmarkPathReport['inputFormat']) {
  return inputFormat === 'float32x2' ? 'Float32' : 'Raw Float64';
}

function formatProjectionPatchStrategy(
  patchStrategy: GPUProjectionBenchmarkPathReport['patchStrategy']
) {
  return patchStrategy === 'scan' ? 'Patch scan' : 'Explicit IDs';
}

function formatProjectionThroughput(coordinatesPerSecond: number): string {
  return `${(coordinatesPerSecond / 1_000_000).toFixed(2)}M rows/s`;
}

function formatProjectionError(errorInMeters: number): string {
  return `${(errorInMeters * 100).toFixed(2)} cm`;
}
