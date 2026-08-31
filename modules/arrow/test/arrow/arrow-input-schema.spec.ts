// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUVectorFromArrow, prepareArrowInput, type ArrowInputSchema} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {type GPUInputVectors} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type SourceVectors = {
  positions: arrow.Vector<arrow.Float32>;
};

type PreparedInput = {
  positions: GPUVector<'float32'>;
  rowIndices: GPUVector<'uint32'>;
};

it('ArrowInputSchema resolves, converts, generates internal vectors, and validates', async () => {
  const device = new NullDevice({});
  const sourcePositions = arrow.vectorFromArray([1, 2], new arrow.Float32());
  const sourceRowIndices = arrow.vectorFromArray([0, 1], new arrow.Uint32());
  const schema: ArrowInputSchema<SourceVectors, PreparedInput, {positions?: string}> = {
    name: 'TestArrowInput',
    gpuInputSchema: [
      {columnName: 'positions', kind: 'positions', required: true, formats: ['float32']},
      {
        columnName: 'rowIndices',
        kind: 'scalars',
        required: true,
        formats: ['uint32'],
        internal: true
      }
    ],
    resolveSourceVectors: () => ({positions: sourcePositions}),
    convertToGPUVectors: (inputDevice, sourceVectors) => ({
      positions: makeGPUVectorFromArrow(inputDevice, sourceVectors.positions, {
        columnName: 'positions',
        format: 'float32'
      }),
      rowIndices: makeGPUVectorFromArrow(inputDevice, sourceRowIndices, {
        columnName: 'rowIndices',
        format: 'uint32'
      })
    }),
    getGPUInputVectors: preparedInput =>
      ({
        positions: preparedInput.positions,
        rowIndices: preparedInput.rowIndices
      }) satisfies GPUInputVectors
  };

  const preparedInput = await prepareArrowInput(device, schema, {});

  expect(preparedInput.positions.format, 'keeps converted source vector format').toBe('float32');
  expect(preparedInput.rowIndices.format, 'keeps generated internal vector format').toBe('uint32');
  preparedInput.positions.destroy();
  preparedInput.rowIndices.destroy();
  void 0;
});

it('ArrowInputSchema rejects converted vectors outside the GPU input contract', async () => {
  const device = new NullDevice({});
  const sourcePositions = arrow.vectorFromArray([1, 2], new arrow.Float32());
  let preparedPositions: GPUVector<'float32'> | null = null;
  const schema: ArrowInputSchema<SourceVectors, {positions: GPUVector<'float32'>}> = {
    name: 'InvalidArrowInput',
    gpuInputSchema: [
      {columnName: 'positions', kind: 'positions', required: true, formats: ['uint32']}
    ],
    resolveSourceVectors: () => ({positions: sourcePositions}),
    convertToGPUVectors: (inputDevice, sourceVectors) => {
      const positions = makeGPUVectorFromArrow(inputDevice, sourceVectors.positions, {
        columnName: 'positions',
        format: 'float32'
      });
      preparedPositions = positions;
      return {positions};
    },
    getGPUInputVectors: preparedInput => preparedInput
  };

  try {
    await prepareArrowInput(device, schema, {});
    expect(false, 'invalid converted vector format should be rejected').toBe(true);
  } catch (error) {
    expect(
      Boolean(
        /positions GPUVector\.format "float32" must be one of uint32/.test((error as Error).message)
      ),
      'validates converter output against gpuInputSchema'
    ).toBe(true);
  }
  preparedPositions?.destroy();
  void 0;
});
