import React, {type ReactNode, useEffect, useId, useState} from 'react';

import {
  runGPUWorkgroupReductionBenchmark,
  type GPUWorkgroupReductionBenchmarkPathReport,
  type GPUWorkgroupReductionBenchmarkReport
} from '@luma.gl/experimental';

import {createDevice, useStore} from '../../react-luma/store/device-store';
import {LiveBenchmarkPanel} from './live-benchmark-panel';

const WORKGROUP_COUNTS = [256, 1024, 4096] as const;
const ROUND_COUNTS = [1, 8, 32, 128] as const;

/** Compares portable and subgroup workgroup reductions on the reader's WebGPU adapter. */
export function WorkgroupReductionBenchmark(): ReactNode {
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
      title="GPUReduction compute benchmark"
      description="Each round sums 256 generated uint32 input elements using the same workgroup-local operation as a GPUReduction level. Throughput is reported as input elements reduced per second."
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
      runningContent={<RunningTable workgroupCount={workgroupCount} roundCount={roundCount} />}
      unsupportedReason={
        webGPUUnavailable
          ? 'WebGPU is unavailable in this browser. Use a WebGPU-capable browser and a secure origin.'
          : undefined
      }
      onRun={async () => {
        const device =
          selectedDevice?.type === 'webgpu' && selectedDevice.info.featureLevel === 'max'
            ? selectedDevice
            : await createDevice('webgpu-max');
        const report = await runGPUWorkgroupReductionBenchmark(device, {
          workgroupCount,
          roundCount
        });
        return (
          <ResultsTable
            report={report}
            deviceLabel={device.info.renderer || device.info.vendor || device.info.gpu}
          />
        );
      }}
    />
  );
}

function RunningTable(props: {workgroupCount: number; roundCount: number}): ReactNode {
  return (
    <div>
      <WorkloadSummary {...props} />
      <BenchmarkTable>
        {['GPUReduction', 'Subgroup optimization'].map((label, rowIndex) => (
          <tr key={label}>
            <td className={rowIndex === 1 ? 'luma-live-benchmark__secondary-label' : undefined}>
              {label}
            </td>
            {[0, 1, 2, 3, 4].map(column => (
              <td key={column}>
                <span aria-label="Measuring" className="luma-live-benchmark-spinner" role="status" />
              </td>
            ))}
          </tr>
        ))}
      </BenchmarkTable>
    </div>
  );
}

function ResultsTable({
  report,
  deviceLabel
}: {
  report: GPUWorkgroupReductionBenchmarkReport;
  deviceLabel: string;
}): ReactNode {
  return (
    <div>
      <WorkloadSummary
        workgroupCount={report.workgroupCount}
        roundCount={report.roundCount}
        suffix={`${report.dispatchCount} dispatches/sample · ${deviceLabel}`}
      />
      <BenchmarkTable>
        <ResultRow
          label="GPUReduction"
          path={report.paths.find(path => path.strategy === 'portable')!}
          report={report}
          supported
        />
        <ResultRow
          label="Subgroup optimization"
          path={report.paths.find(path => path.strategy === 'subgroups')}
          report={report}
          secondary
          supported={report.subgroupAvailable}
        />
      </BenchmarkTable>
      <p style={{fontSize: 12, margin: '10px 0 0'}}>
        {report.subgroupAvailable ? `Subgroups expose ${formatSubgroupSize(report)} lanes. ` : ''}
        Measured paths passed the same CPU checksum oracle. Results are local to this browser,
        adapter, and current system load.
      </p>
    </div>
  );
}

function WorkloadSummary({
  workgroupCount,
  roundCount,
  suffix
}: {
  workgroupCount: number;
  roundCount: number;
  suffix?: string;
}): ReactNode {
  return (
    <p style={{margin: '14px 0 10px'}}>
      <strong>{formatElementCount(workgroupCount, roundCount)}</strong> uint32 elements/dispatch ·{' '}
      <strong>{(workgroupCount * roundCount).toLocaleString()}</strong> reduction blocks
      {suffix ? ` · ${suffix}` : '…'}
    </p>
  );
}

function BenchmarkTable({children}: {children: ReactNode}): ReactNode {
  return (
    <table style={{fontSize: 13, minWidth: 620, width: '100%'}}>
      <thead>
        <tr>
          <th>Implementation</th>
          <th>Supported</th>
          <th>Barriers / reduction</th>
          <th>GPU median</th>
          <th>GPU p95</th>
          <th>Element throughput</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function ResultRow({
  label,
  path,
  report,
  secondary = false,
  supported
}: {
  label: string;
  path?: GPUWorkgroupReductionBenchmarkPathReport;
  report: GPUWorkgroupReductionBenchmarkReport;
  secondary?: boolean;
  supported: boolean;
}): ReactNode {
  return (
    <tr>
      <td className={secondary ? 'luma-live-benchmark__secondary-label' : undefined}>{label}</td>
      <td>
        <span
          aria-label={supported ? 'Supported' : 'Not supported'}
          className={`luma-live-benchmark__support luma-live-benchmark__support--${supported ? 'yes' : 'no'}`}
          title={supported ? 'Supported' : 'Not supported'}
        >
          {supported ? '✓' : '×'}
        </span>
      </td>
      <td>{path?.barrierCountPerRound ?? '—'}</td>
      <td>{path ? formatMilliseconds(path.gpuTimeMilliseconds?.median) : '—'}</td>
      <td>{path ? formatMilliseconds(path.gpuTimeMilliseconds?.percentile95) : '—'}</td>
      <td>{path ? formatThroughput(report, path) : '—'}</td>
    </tr>
  );
}

function formatElementCount(workgroupCount: number, roundCount: number): string {
  const count = workgroupCount * roundCount * 256;
  return count >= 1e6 ? `${(count / 1e6).toFixed(2)}M` : count.toLocaleString();
}

function formatMilliseconds(value?: number): string {
  return value === undefined ? 'CPU timing only' : `${value.toFixed(3)} ms`;
}

function formatThroughput(
  report: GPUWorkgroupReductionBenchmarkReport,
  path: GPUWorkgroupReductionBenchmarkPathReport
): string {
  const milliseconds = path.gpuTimeMilliseconds?.median;
  if (!milliseconds) return '—';
  const elements = report.workgroupCount * report.roundCount * report.workgroupSize;
  return `${(elements / (milliseconds / 1000) / 1e9).toFixed(2)} G elements/s`;
}

function formatSubgroupSize(report: GPUWorkgroupReductionBenchmarkReport): string {
  if (report.subgroupMinSize === undefined || report.subgroupMaxSize === undefined) return 'unknown';
  return report.subgroupMinSize === report.subgroupMaxSize
    ? `${report.subgroupMinSize}`
    : `${report.subgroupMinSize}–${report.subgroupMaxSize}`;
}
