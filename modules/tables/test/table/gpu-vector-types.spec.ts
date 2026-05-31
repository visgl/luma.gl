// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUVector, Interleaved} from '@luma.gl/tables';

type VertexFields = {
  colors: 'unorm8x4';
  positions: 'float32x3';
};

type VertexGPUVector = GPUVector<Interleaved<VertexFields>>;
type InterleavedVertexFields = NonNullable<VertexGPUVector['interleavedFields']>;

declare const colorsFormat: InterleavedVertexFields['colors'];
declare const positionsFormat: InterleavedVertexFields['positions'];

colorsFormat satisfies 'unorm8x4';
positionsFormat satisfies 'float32x3';

// @ts-expect-error invalid vertex format names are rejected
type _InvalidInterleavedFields = Interleaved<{colors: 'uint8x5'}>;
