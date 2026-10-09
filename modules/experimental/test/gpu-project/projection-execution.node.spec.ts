// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  compileProjectionProgram,
  selectProjectionExecution
} from '@luma.gl/experimental/gpu-project';
import type {
  ProjectionProgramBenchmarkPathReport,
  ProjectionProgramBenchmarkReport
} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  getProjectionProgramSignature,
  getProjectionDeviceSignature
} from '../../src/gpu-project/projection-execution';

function fixture() {
  const device = new NullDevice({});
  const info = {...device.info};
  device.destroy();
  const projection = compileProjectionProgram(
    {precision: 'double-single', operations: [{type: 'unit', factor: 2}]},
    {inputFormat: 'uint32x4'}
  );
  const duration = {minimum: 1, median: 1.5, percentile95: 2, maximum: 2};
  const path: ProjectionProgramBenchmarkPathReport = {
    id: 'same-program',
    programSignature: getProjectionProgramSignature(projection),
    mode: 'inline',
    metadata: projection.metadata,
    maximumAllowedError: 0.001,
    maximumObservedError: 0.0001,
    validRows: 100,
    adaptiveStages: [],
    projectionsPerRow: 4,
    dispatchCount: 4,
    parameterByteLength: 24,
    intermediateByteLength: 0,
    bufferByteLength: 9600,
    planningTimeMilliseconds: duration,
    programCompilationTimeMilliseconds: duration,
    graphCompilationTimeMilliseconds: 1,
    resourcePreparationTimeMilliseconds: 1,
    uploadDrainTimeMilliseconds: 1,
    validationReadbackTimeMilliseconds: 1,
    firstUseTimeMilliseconds: 1,
    cpuEncodeTimeMilliseconds: duration,
    synchronizedTimeMilliseconds: duration,
    synchronizedCoordinatesPerSecond: 100,
    encodeAndSynchronizedTimeMilliseconds: duration,
    residentSpeedupOverCPU: 1,
    cpuComparisons: []
  };
  const report: ProjectionProgramBenchmarkReport = {
    deviceSignature: getProjectionDeviceSignature(device),
    device: info,
    workloadKey: 'points-v1',
    environment: 'browser-driver-v1',
    inputFormat: 'uint32x4',
    consumer: 'axis-swap',
    consumerCount: 4,
    timestampQueries: false,
    comparison: 'equal-error-budget',
    coordinateCount: 100,
    warmupIterations: 2,
    measuredIterations: 5,
    oracleTimeMilliseconds: duration,
    oracleChecksum: 1,
    cpuProvider: 'test',
    cpuPaths: [],
    paths: [
      path,
      {
        ...path,
        mode: 'materialized',
        bufferByteLength: 11600,
        intermediateByteLength: 2000,
        projectionsPerRow: 1,
        encodeAndSynchronizedTimeMilliseconds: {
          minimum: 0.1,
          median: 0.2,
          percentile95: 0.3,
          maximum: 0.3
        }
      }
    ]
  };
  return {
    report,
    projection,
    device: {info, features: device.features, limits: device.limits},
    environment: report.environment!,
    workloadKey: report.workloadKey!,
    consumer: report.consumer,
    coordinateCount: 100,
    consumerCount: 4,
    maximumError: 0.001,
    maximumBufferByteLength: 12000
  };
}

it('selects a measured materialization win and respects a tighter memory budget', () => {
  const options = fixture();
  expect(selectProjectionExecution(options)).toMatchObject({
    status: 'selected',
    mode: 'materialized'
  });
  expect(selectProjectionExecution({...options, maximumBufferByteLength: 10000})).toMatchObject({
    status: 'selected',
    mode: 'inline'
  });
  expect(selectProjectionExecution({...options, maximumBufferByteLength: 1}).status).toBe(
    'unqualified'
  );
  expect(selectProjectionExecution({...options, maximumError: 1e-5}).status).toBe('unqualified');
});

it('prefers lower allocation when observed timing ranges overlap', () => {
  const options = fixture();
  options.report.paths[1].encodeAndSynchronizedTimeMilliseconds = {
    minimum: 0.9,
    median: 1.1,
    percentile95: 1.8,
    maximum: 1.8
  };
  expect(selectProjectionExecution(options)).toMatchObject({
    status: 'selected',
    mode: 'inline',
    reason: 'timing ranges overlap; prefer lower measured memory'
  });
});

it('declines changes to device, runtime, row distribution, count, reuse, parameters or precision', () => {
  const options = fixture();
  for (const change of [
    {workloadKey: 'points-v2'},
    {workloadKey: ''},
    {environment: 'new-driver'},
    {coordinateCount: 101},
    {consumerCount: 1},
    {device: {...options.device, info: {...options.device.info, gpu: 'different'}}},
    {
      device: {
        ...options.device,
        limits: {...options.device.limits, maxStorageBufferBindingSize: 1}
      }
    }
  ])
    expect(selectProjectionExecution({...options, ...change}).status).toBe('unqualified');
  for (const projection of [
    compileProjectionProgram(
      {precision: 'double-single', operations: [{type: 'unit', factor: 3}]},
      {inputFormat: 'uint32x4'}
    ),
    compileProjectionProgram(
      {precision: 'local-f32', operations: [{type: 'unit', factor: 2}]},
      {inputFormat: 'uint32x4'}
    ),
    compileProjectionProgram(
      {precision: 'double-single', operations: [{type: 'unit', factor: 2}]},
      {inputFormat: 'float32x4'}
    )
  ])
    expect(selectProjectionExecution({...options, projection}).status).toBe('unqualified');
  for (const change of [{timestampQueries: true}, {warmupIterations: 0}, {measuredIterations: 1}])
    expect(
      selectProjectionExecution({...options, report: {...options.report, ...change}}).status
    ).toBe('unqualified');
});

it('does not select failed accuracy gates or unresolved timers', () => {
  const options = fixture();
  options.report.paths.forEach(path => {
    path.maximumObservedError = NaN;
  });
  expect(selectProjectionExecution(options).status).toBe('unqualified');
  options.report.paths.forEach(path => {
    path.maximumObservedError = 0;
    path.encodeAndSynchronizedTimeMilliseconds.minimum = 0;
  });
  expect(selectProjectionExecution(options).status).toBe('unqualified');
});
