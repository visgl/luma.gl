// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPUCommandGraphInspectorCounterSnapshot,
  GPUCommandGraphInspectorEncoding,
  GPUCommandGraphInspectorObservableGraph,
  GPUCommandGraphInspectorObservation
} from '@luma.gl/experimental';
import {expectTypeOf, test} from 'vitest';

type StrictParameters = {value: number};

test('GPUCommandGraphInspector observations preserve strict parameter types', () => {
  expectTypeOf<
    GPUCommandGraphInspectorObservableGraph<StrictParameters, GPUCommandGraphInspectorEncoding>
  >().not.toMatchTypeOf<
    GPUCommandGraphInspectorObservableGraph<unknown, GPUCommandGraphInspectorEncoding>
  >();
  expectTypeOf<
    GPUCommandGraphInspectorObservation<StrictParameters, GPUCommandGraphInspectorEncoding>
  >().not.toMatchTypeOf<
    GPUCommandGraphInspectorObservation<unknown, GPUCommandGraphInspectorEncoding>
  >();
  expectTypeOf<
    GPUCommandGraphInspectorObservation<StrictParameters>['recordCounters']
  >().toEqualTypeOf<(counters: Readonly<Record<string, number>>) => void>();
  expectTypeOf<GPUCommandGraphInspectorCounterSnapshot>().toMatchTypeOf<{
    readonly id: string;
    readonly latestValue: number;
    readonly p50Value: number;
    readonly p95Value: number;
  }>();
});
