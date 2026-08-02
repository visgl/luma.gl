// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {VertexFormat} from '@luma.gl/core';
import {createTransientView} from '@luma.gl/experimental';
import {expectTypeOf, test} from 'vitest';

test('createTransientView accepts fixed-width formats only', () => {
  type TransientFormat = Parameters<typeof createTransientView>[2];

  expectTypeOf<TransientFormat>().toEqualTypeOf<VertexFormat>();
  expectTypeOf<'vertex-list<float32x3>'>().not.toMatchTypeOf<TransientFormat>();
  expectTypeOf<'value-list<uint32>'>().not.toMatchTypeOf<TransientFormat>();
});
