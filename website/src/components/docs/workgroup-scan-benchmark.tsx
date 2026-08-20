import React, {type ReactNode, useEffect, useId, useState} from 'react';

import {runGPUWorkgroupScanBenchmark, type GPUWorkgroupScanBenchmarkPathReport, type GPUWorkgroupScanBenchmarkReport} from '@luma.gl/gpgpu/gpu-core';

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
    <LiveBenchmarkPanel
      collapsible
      title="GPUScan compute benchmark"
      runLabel="Run benchmark"
      controls={
        <div className="luma-live-benchmark__controls">
          <label htmlFor={workgroupCountId}>
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

          <label htmlFor={roundCountId}>
            Rounds
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
      }
      idleContent={
        <WorkgroupScanBenchmarkIdle workgroupCount={workgroupCount} roundCount={roundCount} />
      }
      runningContent={
        <WorkgroupScanBenchmarkRunning
          workgroupCount={workgroupCount}
          roundCount={roundCount}
        />
      }
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
  );
}

function WorkgroupScanBenchmarkIdle({
  workgroupCount,
  roundCount
}: {
  workgroupCount: number;
  roundCount: number;
}): ReactNode {
  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{formatElementCount(workgroupCount, roundCount)}</strong> uint32 elements/dispatch ·{' '}
        <strong>{formatWorkgroupScanCount(workgroupCount, roundCount)}</strong> local scan blocks
      </p>
      <ScanBenchmarkTable>
        <IdleRow barriers={17} label="GPUScan" relative="1.00×" supported />
        <IdleRow label="Subgroup optimization" secondary />
      </ScanBenchmarkTable>
      <ScanBenchmarkNotes />
    </div>
  );
}

function WorkgroupScanBenchmarkRunning({
  workgroupCount,
  roundCount
}: {
  workgroupCount: number;
  roundCount: number;
}): ReactNode {
  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        Measuring <strong>{formatElementCount(workgroupCount, roundCount)}</strong> uint32
        elements/dispatch across{' '}
        <strong>{formatWorkgroupScanCount(workgroupCount, roundCount)}</strong> local scan blocks…
      </p>

      <ScanBenchmarkTable>
        {['GPUScan', 'Subgroup optimization'].map((implementation, rowIndex) => (
          <tr key={implementation}>
            <td className={rowIndex === 1 ? 'luma-live-benchmark__secondary-label' : undefined}>
              {implementation}
            </td>
            {[0, 1, 2, 3, 4].map(column => (
              <td key={column}>
                <BenchmarkSpinner />
              </td>
            ))}
          </tr>
        ))}
      </ScanBenchmarkTable>
      <ScanBenchmarkNotes />
    </div>
  );
}

function BenchmarkSpinner(): ReactNode {
  return (
    <span aria-label="Measuring" className="luma-live-benchmark-spinner" role="status" />
  );
}

function WorkgroupScanBenchmarkResults({
  report,
  deviceLabel
}: {
  report: GPUWorkgroupScanBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  return (
    <div>
      <p style={{margin: '14px 0 10px'}}>
        <strong>{formatElementCount(report.workgroupCount, report.roundCount)}</strong> uint32
        elements/dispatch ·{' '}
        <strong>{formatWorkgroupScanCount(report.workgroupCount, report.roundCount)}</strong> local
        scan blocks ·{' '}
        <strong>{report.dispatchCount}</strong> dispatches/sample · {deviceLabel}
      </p>

      <ScanBenchmarkTable>
        <BenchmarkResultRow
          label="GPUScan"
          path={report.paths.find(path => path.strategy === 'portable')!}
          report={report}
          supported
        />
        <BenchmarkResultRow
          label="Subgroup optimization"
          path={report.paths.find(path => path.strategy === 'subgroups')}
          report={report}
          secondary
          supported={report.subgroupAvailable}
        />
      </ScanBenchmarkTable>

      <ul className="luma-live-benchmark__notes">
        <li>
          Each round applies the 256-element exclusive prefix operation used inside GPUScan.
        </li>
        {report.subgroupAvailable ? (
          <li>Subgroups use {formatSubgroupSize(report)} lanes on this adapter.</li>
        ) : null}
        <li>Both paths passed the same CPU checksum oracle.</li>
        <li>Results reflect this browser, adapter, and current system load.</li>
      </ul>
    </div>
  );
}

function ScanBenchmarkTable({children}: {children: ReactNode}): ReactNode {
  return (
    <table style={{fontSize: 13, minWidth: 620, width: '100%'}}>
      <thead>
        <tr>
          <th>Implementation</th>
          <th>Supported</th>
          <th title="Workgroup barriers per scan round">Barriers</th>
          <th>GPU median</th>
          <th>Relative</th>
          <th>Element throughput</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function ScanBenchmarkNotes(): ReactNode {
  return (
    <ul className="luma-live-benchmark__notes">
      <li>Each round applies the 256-element exclusive prefix operation used inside GPUScan.</li>
      <li>Throughput is uint32 input elements processed per second.</li>
    </ul>
  );
}

function BenchmarkResultRow({
  label,
  path,
  report,
  secondary = false,
  supported
}: {
  label: string;
  path: GPUWorkgroupScanBenchmarkPathReport | undefined;
  report: GPUWorkgroupScanBenchmarkReport;
  secondary?: boolean;
  supported: boolean;
}): ReactNode {
  return (
    <tr>
      <td className={secondary ? 'luma-live-benchmark__secondary-label' : undefined}>{label}</td>
      <td>
        <SupportedIndicator supported={supported} />
      </td>
      <td>{path?.barrierCountPerRound ?? '—'}</td>
      <td>{path ? formatOptionalMilliseconds(path.gpuTimeMilliseconds?.median) : '—'}</td>
      <td>{path ? formatRelativeSpeed(report, path) : '—'}</td>
      <td>{path ? formatScanThroughput(report, path) : '—'}</td>
    </tr>
  );
}

function SupportedIndicator({supported}: {supported: boolean}): ReactNode {
  return (
    <span
      aria-label={supported ? 'Supported' : 'Not supported'}
      className={
        supported
          ? 'luma-live-benchmark__support luma-live-benchmark__support--yes'
          : 'luma-live-benchmark__support luma-live-benchmark__support--no'
      }
      title={supported ? 'Supported' : 'Not supported'}
    >
      {supported ? '✓' : '×'}
    </span>
  );
}

function IdleRow({
  barriers,
  label,
  relative = '—',
  secondary = false,
  supported = false
}: {
  barriers?: number;
  label: string;
  relative?: string;
  secondary?: boolean;
  supported?: boolean;
}): ReactNode {
  return (
    <tr>
      <td className={secondary ? 'luma-live-benchmark__secondary-label' : undefined}>{label}</td>
      <td>{supported ? <SupportedIndicator supported /> : '—'}</td>
      <td>{barriers ?? '—'}</td>
      <td>—</td>
      <td>{relative}</td>
      <td>—</td>
    </tr>
  );
}

function formatWorkgroupScanCount(workgroupCount: number, roundCount: number): string {
  return (workgroupCount * roundCount).toLocaleString();
}

function formatElementCount(workgroupCount: number, roundCount: number): string {
  const elementCount = workgroupCount * roundCount * 256;
  return elementCount >= 1e6
    ? `${(elementCount / 1e6).toFixed(2)}M`
    : elementCount.toLocaleString();
}

function formatScanThroughput(
  report: GPUWorkgroupScanBenchmarkReport,
  path: GPUWorkgroupScanBenchmarkPathReport
): string {
  const gpuMedianMilliseconds = path.gpuTimeMilliseconds?.median;
  if (!gpuMedianMilliseconds || gpuMedianMilliseconds <= 0) {
    return 'Unavailable';
  }
  const elementsPerSecond =
    (report.workgroupCount * report.roundCount * report.workgroupSize * 1000) /
    gpuMedianMilliseconds;
  return `${(elementsPerSecond / 1e9).toFixed(2)}G elements/s`;
}

function formatMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(3)} ms`;
}

function formatOptionalMilliseconds(milliseconds: number | undefined): string {
  return milliseconds === undefined ? 'Unavailable' : formatMilliseconds(milliseconds);
}

function formatRelativeSpeed(
  report: GPUWorkgroupScanBenchmarkReport,
  path: GPUWorkgroupScanBenchmarkPathReport
): string {
  if (path.strategy === 'portable') return '1.00×';
  const portableMilliseconds = report.paths.find(
    candidate => candidate.strategy === 'portable'
  )?.gpuTimeMilliseconds?.median;
  const pathMilliseconds = path.gpuTimeMilliseconds?.median;
  return portableMilliseconds && pathMilliseconds
    ? `${(portableMilliseconds / pathMilliseconds).toFixed(2)}×`
    : '—';
}

function formatSubgroupSize(report: GPUWorkgroupScanBenchmarkReport): string {
  if (report.subgroupMinSize === undefined || report.subgroupMaxSize === undefined) {
    return 'an adapter-defined number of';
  }
  return report.subgroupMinSize === report.subgroupMaxSize
    ? `${report.subgroupMinSize}`
    : `${report.subgroupMinSize}–${report.subgroupMaxSize}`;
}
