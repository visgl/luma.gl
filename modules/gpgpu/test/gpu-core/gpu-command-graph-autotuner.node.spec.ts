// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraphAutotuner,
  type GPUCommandGraphAdapterIdentity,
  type GPUCommandGraphPreflightReport,
  type GPUCommandGraphTimingReport
} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';

const ADAPTER: GPUCommandGraphAdapterIdentity = Object.freeze({
  key: 'test-adapter',
  type: 'webgpu',
  vendor: 'test',
  renderer: 'test-gpu',
  version: '1',
  gpu: 'unknown',
  gpuType: 'discrete',
  features: Object.freeze(['subgroups']),
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupsPerDimension: 65535
});

const CANDIDATES = [{id: 'portable'}, {id: 'subgroups'}] as const;

test('GPUCommandGraphAutotuner explores then selects the measured faster kernel', t => {
  const autotuner = new GPUCommandGraphAutotuner({adapter: ADAPTER});
  const request = {operation: 'GPUScan', candidates: CANDIDATES, workloadSize: 1_000_000};

  const first = autotuner.selectKernel(request);
  t.equal(first.variant, 'portable', 'explores the first supported variant');
  t.equal(first.reason, 'exploration', 'reports exploration explicitly');
  autotuner.observeKernel({
    operation: 'GPUScan',
    variant: 'portable',
    workloadSize: request.workloadSize,
    durationMilliseconds: 4
  });

  const second = autotuner.selectKernel(request);
  t.equal(second.variant, 'subgroups', 'explores the remaining unmeasured variant');
  autotuner.observeKernel({
    operation: 'GPUScan',
    variant: 'subgroups',
    workloadSize: request.workloadSize,
    durationMilliseconds: 1
  });

  const selected = autotuner.selectKernel(request);
  t.equal(selected.variant, 'subgroups', 'selects the faster calibrated implementation');
  t.equal(selected.reason, 'calibrated', 'distinguishes an empirical decision');
  t.equal(selected.estimatedDurationMilliseconds, 1, 'reports the expected duration');
  t.end();
});

test('GPUCommandGraphAutotuner respects support and persists adapter-local calibration', t => {
  const autotuner = new GPUCommandGraphAutotuner({adapter: ADAPTER, explorationEnabled: false});
  autotuner.observeKernel({
    operation: 'GPUHistogram',
    variant: 'portable',
    workloadSize: 1024,
    durationMilliseconds: 3
  });
  autotuner.observeKernel({
    operation: 'GPUHistogram',
    variant: 'subgroups',
    workloadSize: 1024,
    durationMilliseconds: 1
  });
  const profile = autotuner.exportProfile();
  const restored = new GPUCommandGraphAutotuner({
    adapter: ADAPTER,
    profile,
    explorationEnabled: false
  });
  t.equal(
    restored.selectKernel({
      operation: 'GPUHistogram',
      candidates: CANDIDATES,
      workloadSize: 1024
    }).variant,
    'subgroups',
    'restores calibration for the matching adapter'
  );
  t.equal(
    restored.selectKernel({
      operation: 'GPUHistogram',
      candidates: [{id: 'portable'}, {id: 'subgroups', supported: false}],
      workloadSize: 1024
    }).variant,
    'portable',
    'never selects an unsupported candidate'
  );

  const mismatched = new GPUCommandGraphAutotuner({
    adapter: {...ADAPTER, key: 'another-adapter'},
    profile,
    explorationEnabled: false
  });
  t.equal(
    mismatched.selectKernel({
      operation: 'GPUHistogram',
      candidates: CANDIDATES,
      workloadSize: 1024
    }).reason,
    'fallback',
    'ignores measurements captured on another adapter'
  );
  t.end();
});

test('GPUCommandGraphAutotuner consumes annotated graph GPU timings', t => {
  const autotuner = new GPUCommandGraphAutotuner({adapter: ADAPTER});
  const preflight: GPUCommandGraphPreflightReport = {
    nodes: [
      {
        id: 'scan-level-0',
        type: 'compute',
        operation: 'GPUScan',
        variant: 'subgroups',
        commandCount: 1,
        maximumWorkgroupCount: 4,
        maximumInvocationCount: 1024,
        readByteLength: 4096,
        writeByteLength: 4096
      },
      {
        id: 'unannotated',
        type: 'compute',
        commandCount: 1,
        maximumWorkgroupCount: 1,
        maximumInvocationCount: 256,
        readByteLength: 0,
        writeByteLength: 0
      }
    ],
    annotatedNodeCount: 2,
    conditionalNodeCount: 0,
    commandCount: 2,
    maximumWorkgroupCount: 5,
    maximumInvocationCount: 1280,
    readByteLength: 4096,
    writeByteLength: 4096,
    largestBufferByteLength: 4096,
    largestStorageBufferBindingByteLength: 4096,
    maxBufferByteLength: 1_000_000,
    maxStorageBufferBindingByteLength: 1_000_000,
    fitsDeviceLimits: true
  };
  const timingReport: GPUCommandGraphTimingReport = {
    cpuEncodeTimeMilliseconds: 0.2,
    gpuTimeMilliseconds: 1.2,
    nodes: [
      {
        id: 'scan-level-0',
        type: 'compute',
        cpuEncodeTimeMilliseconds: 0.1,
        hasGPUTimestamps: true,
        gpuTimeMilliseconds: 1
      },
      {
        id: 'unannotated',
        type: 'compute',
        cpuEncodeTimeMilliseconds: 0.1,
        hasGPUTimestamps: true,
        gpuTimeMilliseconds: 0.2
      }
    ]
  };

  t.equal(
    autotuner.observeTimingReport(timingReport, preflight),
    1,
    'records only nodes with operation and variant annotations'
  );
  t.equal(autotuner.exportProfile().calibrations.length, 1, 'publishes one calibration entry');
  t.equal(
    autotuner.exportProfile().calibrations[0].meanWorkloadSize,
    1024,
    'uses the node invocation bound as the workload size'
  );
  t.end();
});
