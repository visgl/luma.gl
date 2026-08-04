// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
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
});
