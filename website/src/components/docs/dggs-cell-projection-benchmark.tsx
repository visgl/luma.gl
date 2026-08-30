import React, {type ReactNode, useEffect, useId, useState} from 'react';

import type {DGGSCellFamily, DGGSCellProjectionKind} from '@luma.gl/gpgpu/gpu-dggs';
import {
  runGPUDGGSCellProjectionBenchmark,
  type GPUDGGSCellProjectionBenchmarkReport
} from '@luma.gl/gpgpu/gpu-dggs/benchmarks';

import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const CELL_COUNTS = [16_384, 65_536, 262_144, 1_048_576] as const;
const H3_CELLS = [
  0x089283082803ffffn,
  0x089754e64993ffffn,
  0x089194ad14d7ffffn,
  0x089be0e35c27ffffn,
  0x089005065cdbffffn,
  0x089ef0d126a7ffffn
];
const A5_CELLS = [
  0x0200000000000000n,
  0x0500000000000000n,
  0x1a38000000000000n,
  0x2628000000000000n,
  0x35bd75e8fee1100dn
];
// Precomputed with h3-js 4.4 and a5-js 0.8. Keeping the oracle out of the measured path also keeps
// those CPU implementations out of this live benchmark's browser bundle.
const H3_REFERENCE_LNGLATS: ReadonlyArray<readonly [number, number]> = [
  [-122.4182710369247, 37.773515097238146],
  [-0.0010418183700719888, 0.0005857701415174007],
  [-0.12145034273233364, 51.50008600604053],
  [151.19803529715963, -33.860401280822074],
  [19.985975059398097, 85.00014538237319],
  [-59.99596159336479, -79.99961280701646]
];
const A5_REFERENCE_LNGLATS: ReadonlyArray<readonly [number, number]> = [
  [-93, 90],
  [123, 69.09240188013534],
  [-120.36040534450211, 38.61273252471863],
  [-70.23755667780222, 43.618118491958555],
  [-122.41999998343744, 37.77999999438284]
];

/** Measures H3 and A5 cell-center projection on the reader's actual WebGPU adapter. */
export function DGGSCellProjectionBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice || store.device);
  const [family, setFamily] = useState<DGGSCellFamily>('h3');
  const [projection, setProjection] = useState<DGGSCellProjectionKind>('unit-vector');
  const [cellCount, setCellCount] = useState<number>(262_144);
  const [webGPUUnavailable, setWebGPUUnavailable] = useState(false);
  const familyId = useId();
  const projectionId = useId();
  const cellCountId = useId();

  useEffect(() => {
    setWebGPUUnavailable(typeof navigator === 'undefined' || !('gpu' in navigator));
  }, []);

  return (
    <LiveBenchmarkPanel
      title="Live DGGS cell-center projection"
      description="Decode a repeated, globally distributed set of valid H3 or A5 indexes with the public command-graph primitive. Correctness checks, upload, compilation, and readback stay outside measured submissions."
      runLabel="Run cell projection benchmark"
      controls={
        <div className="luma-live-benchmark__controls">
          <label htmlFor={familyId}>
            Grid
            <select
              id={familyId}
              onChange={event => setFamily(event.target.value as DGGSCellFamily)}
              value={family}
            >
              <option value="h3">H3</option>
              <option value="a5">A5</option>
            </select>
          </label>
          <label htmlFor={projectionId}>
            Output
            <select
              id={projectionId}
              onChange={event =>
                setProjection(event.target.value as DGGSCellProjectionKind)
              }
              value={projection}
            >
              <option value="unit-vector">Unit vector</option>
              <option value="lnglat">Longitude / latitude</option>
            </select>
          </label>
          <label htmlFor={cellCountId}>
            Cells
            <select
              id={cellCountId}
              onChange={event => setCellCount(Number(event.target.value))}
              value={cellCount}
            >
              {CELL_COUNTS.map(count => (
                <option key={count} value={count}>
                  {count.toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      idleContent={<DGGSBenchmarkIdle cellCount={cellCount} family={family} projection={projection} />}
      runningContent={<DGGSBenchmarkRunning cellCount={cellCount} family={family} />}
      unsupportedReason={
        webGPUUnavailable
          ? 'WebGPU is unavailable in this browser. Use a WebGPU-capable browser and a secure origin.'
          : undefined
      }
      onRun={async () => {
        const device =
          selectedDevice?.type === 'webgpu' ? selectedDevice : await createDevice('webgpu-core');
        const cells = makeRepeatedCellWords(family, cellCount);
        const report = await runGPUDGGSCellProjectionBenchmark(device, {
          family,
          projection,
          cells,
          referenceValues: makeRepeatedReferenceValues(family, projection, cellCount),
          warmupIterations: 2,
          measuredIterations: 7
        });
        return (
          <DGGSBenchmarkResults
            report={report}
            deviceLabel={device.info.renderer || device.info.vendor || device.info.gpu}
          />
        );
      }}
    />
  );
}

function DGGSBenchmarkIdle({
  cellCount,
  family,
  projection
}: {
  cellCount: number;
  family: DGGSCellFamily;
  projection: DGGSCellProjectionKind;
}): ReactNode {
  return (
    <p style={{margin: '14px 0 4px'}}>
      Ready to decode <strong>{cellCount.toLocaleString()}</strong> {family.toUpperCase()} indexes
      into <strong>{projection === 'unit-vector' ? 'normalized vectors' : 'geographic centers'}</strong>.
    </p>
  );
}

function DGGSBenchmarkRunning({
  cellCount,
  family
}: {
  cellCount: number;
  family: DGGSCellFamily;
}): ReactNode {
  return (
    <p style={{margin: '14px 0 4px'}}>
      Validating and measuring <strong>{cellCount.toLocaleString()}</strong>{' '}
      {family.toUpperCase()} indexes…
    </p>
  );
}

function DGGSBenchmarkResults({
  report,
  deviceLabel
}: {
  report: GPUDGGSCellProjectionBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{report.cellCount.toLocaleString()}</strong> {report.family.toUpperCase()} indexes ·{' '}
        <strong>{formatBytes(report.memoryByteLength)}</strong> working buffers ·{' '}
        <strong>{report.measuredIterations}</strong> measured submissions · {deviceLabel}
      </p>
      <div style={{overflowX: 'auto'}}>
        <table style={{fontSize: 13, minWidth: 650, width: '100%'}}>
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Median</th>
              <th>p95</th>
              <th>Throughput</th>
              <th>Includes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Portable synchronized</td>
              <td>{formatMilliseconds(report.synchronizedTimeMilliseconds.median)}</td>
              <td>{formatMilliseconds(report.synchronizedTimeMilliseconds.percentile95)}</td>
              <td>{formatThroughput(report.synchronizedCellsPerSecond)}</td>
              <td>Submit + completion fence</td>
            </tr>
            {report.gpuTimeMilliseconds && report.gpuCellsPerSecond ? (
              <tr>
                <td>GPU timestamp</td>
                <td>{formatMilliseconds(report.gpuTimeMilliseconds.median)}</td>
                <td>{formatMilliseconds(report.gpuTimeMilliseconds.percentile95)}</td>
                <td>{formatThroughput(report.gpuCellsPerSecond)}</td>
                <td>Compute pass only</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p style={{fontSize: 12, margin: '10px 0 0'}}>
        Every output component is checked against precomputed CPU reference centers within{' '}
        {report.referenceTolerance}. Geographic output is also range-checked; unit vectors must be
        normalized. The validation readback took{' '}
        {formatMilliseconds(report.validationReadbackTimeMilliseconds)} and is not included above.
      </p>
      {!report.timestampQueries ? (
        <p style={{fontSize: 12, margin: '8px 0 0'}}>
          This adapter does not expose timestamp queries, so only the portable completion-fence
          measurement is shown.
        </p>
      ) : null}
    </div>
  );
}

function makeRepeatedCellWords(family: DGGSCellFamily, cellCount: number): Uint32Array {
  const sourceCells = family === 'h3' ? H3_CELLS : A5_CELLS;
  const words = new Uint32Array(cellCount * 2);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const cell = sourceCells[cellIndex % sourceCells.length];
    words[cellIndex * 2] = Number(cell & 0xffffffffn);
    words[cellIndex * 2 + 1] = Number(cell >> 32n);
  }
  return words;
}

function makeRepeatedReferenceValues(
  family: DGGSCellFamily,
  projection: DGGSCellProjectionKind,
  cellCount: number
): Float32Array {
  const sourceLongitudeLatitudes =
    family === 'h3' ? H3_REFERENCE_LNGLATS : A5_REFERENCE_LNGLATS;
  const componentCount = projection === 'lnglat' ? 2 : 3;
  const values = new Float32Array(cellCount * componentCount);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const longitudeLatitude =
      sourceLongitudeLatitudes[cellIndex % sourceLongitudeLatitudes.length];
    if (projection === 'lnglat') {
      values.set(longitudeLatitude, cellIndex * componentCount);
    } else {
      const longitude = longitudeLatitude[0] * (Math.PI / 180);
      const latitude = longitudeLatitude[1] * (Math.PI / 180);
      const cosLatitude = Math.cos(latitude);
      values.set(
        [
          cosLatitude * Math.cos(longitude),
          cosLatitude * Math.sin(longitude),
          Math.sin(latitude)
        ],
        cellIndex * componentCount
      );
    }
  }
  return values;
}

function formatMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(3)} ms`;
}

function formatThroughput(cellsPerSecond: number): string {
  return `${(cellsPerSecond / 1_000_000).toFixed(2)}M cells/s`;
}

function formatBytes(byteLength: number): string {
  return `${(byteLength / 1024 / 1024).toFixed(1)} MiB`;
}
