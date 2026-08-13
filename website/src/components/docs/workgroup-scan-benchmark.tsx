import React, {type ReactNode, useEffect, useId, useState} from 'react';

import {
  runGPUWorkgroupScanBenchmark,
  type GPUWorkgroupScanBenchmarkPathReport,
  type GPUWorkgroupScanBenchmarkReport
} from '@luma.gl/experimental';

import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const WORKGROUP_COUNTS = [256, 1024, 4096] as const;
const ROUND_COUNTS = [1, 8, 32, 128] as const;

/** Compares portable and subgroup workgroup scans on the reader's actual WebGPU adapter. */
export function WorkgroupScanBenchmark(): ReactNode {
  const selectedDevice = useStore(store => store.presentationDevice || store.device);
  const [workgroupCount, setWorkgroupCount] = useState<number>(4096);
  const [roundCount, setRoundCount] = useState<number>(32);
  const [webGPUUnavailable, setWebGPUUnavailable] = useState(false);
  const workgroupCountId = useId();
  const roundCountId = useId();

  useEffect(() => {
    setWebGPUUnavailable(typeof navigator === 'undefined' || !('gpu' in navigator));
  }, []);

  return (
    <div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 12}}>
        <label
          htmlFor={workgroupCountId}
          style={{alignItems: 'center', display: 'flex', gap: 8}}
        >
          Workgroups
          <select
            id={workgroupCountId}
            onChange={event => setWorkgroupCount(Number(event.target.value))}
            value={workgroupCount}
          >
            {WORKGROUP_COUNTS.map(count => (
              <option key={count} value={count}>
                {count.toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={roundCountId} style={{alignItems: 'center', display: 'flex', gap: 8}}>
          Local scan rounds
          <select
            id={roundCountId}
            onChange={event => setRoundCount(Number(event.target.value))}
            value={roundCount}
          >
            {ROUND_COUNTS.map(count => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
      </div>

      <LiveBenchmarkPanel
        title="Live portable versus subgroup workgroup scan"
        description="Run equivalent GPUCommandGraph compute nodes that repeatedly scan generated lane values. The workload keeps data inside each workgroup so global-memory bandwidth does not hide synchronization costs."
        runLabel="Run workgroup scan benchmark"
        unsupportedReason={
          webGPUUnavailable
            ? 'WebGPU is unavailable in this browser. Use a WebGPU-capable browser and a secure origin.'
            : undefined
        }
        onRun={async () => {
          // Subgroups are optional device features and must be requested when the device is created.
          const device =
            selectedDevice?.type === 'webgpu' && selectedDevice.info.featureLevel === 'max'
              ? selectedDevice
              : await createDevice('webgpu-max');
          const report = await runGPUWorkgroupScanBenchmark(device, {
            workgroupCount,
            roundCount
          });
          return (
            <WorkgroupScanBenchmarkResults
              report={report}
              deviceLabel={device.info.renderer || device.info.vendor || device.info.gpu}
            />
          );
        }}
      />
    </div>
  );
}

function WorkgroupScanBenchmarkResults({
  report,
  deviceLabel
}: {
  report: GPUWorkgroupScanBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  const portablePath = report.paths.find(path => path.strategy === 'portable')!;
  const portableMedian = getPrimaryMedian(portablePath);

  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{report.workgroupCount.toLocaleString()}</strong> workgroups ×{' '}
        <strong>{report.workgroupSize}</strong> lanes × <strong>{report.roundCount}</strong> rounds ·{' '}
        <strong>{report.dispatchCount}</strong> dispatches/sample · {deviceLabel}
      </p>

      <table style={{fontSize: 13, minWidth: 620, width: '100%'}}>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Barriers / round</th>
            <th>GPU median</th>
            <th>GPU p95</th>
            <th>Relative speed</th>
            <th>CPU encode median</th>
          </tr>
        </thead>
        <tbody>
          {report.paths.map(path => (
            <tr key={path.strategy}>
              <td>{path.strategy === 'subgroups' ? 'Subgroup scan' : 'Portable workgroup scan'}</td>
              <td>{path.barrierCountPerRound}</td>
              <td>{formatOptionalMilliseconds(path.gpuTimeMilliseconds?.median)}</td>
              <td>{formatOptionalMilliseconds(path.gpuTimeMilliseconds?.percentile95)}</td>
              <td>{formatRelativeSpeed(portableMedian, getPrimaryMedian(path))}</td>
              <td>{formatMilliseconds(path.cpuEncodeTimeMilliseconds.median)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{fontSize: 12, margin: '10px 0 0'}}>
        {report.subgroupAvailable
          ? `The max-feature device exposes subgroups${formatSubgroupSize(report)}.`
          : 'This adapter/browser does not expose both required subgroup capabilities, so only the portable path was measured.'}{' '}
        Every path passed the same CPU checksum oracle before and after measurement. Results are
        local to this browser, adapter, and current system load.
      </p>
    </div>
  );
}

function getPrimaryMedian(path: GPUWorkgroupScanBenchmarkPathReport): number {
  return path.gpuTimeMilliseconds?.median ?? path.cpuEncodeTimeMilliseconds.median;
}

function formatRelativeSpeed(portableMedian: number, pathMedian: number): string {
  return pathMedian > 0 ? `${(portableMedian / pathMedian).toFixed(2)}×` : 'Unavailable';
}

function formatMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(3)} ms`;
}

function formatOptionalMilliseconds(milliseconds: number | undefined): string {
  return milliseconds === undefined ? 'Unavailable' : formatMilliseconds(milliseconds);
}

function formatSubgroupSize(report: GPUWorkgroupScanBenchmarkReport): string {
  if (report.subgroupMinSize === undefined || report.subgroupMaxSize === undefined) {
    return '';
  }
  return report.subgroupMinSize === report.subgroupMaxSize
    ? ` with ${report.subgroupMinSize} lanes`
    : ` with ${report.subgroupMinSize}–${report.subgroupMaxSize} lanes`;
}
