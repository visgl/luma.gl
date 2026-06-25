// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeGPUVectorFromArrow, prepareArrowInput, type ArrowInputSchema} from '@luma.gl/arrow';
import {GPUVector, type GPUInputVectors} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type SourceVectors = {
  positions: arrow.Vector<arrow.Float32>;
};

type PreparedInput = {
  positions: GPUVector<'float32'>;
  rowIndices: GPUVector<'uint32'>;
};

test('ArrowInputSchema resolves, converts, generates internal vectors, and validates', async t => {
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

  t.equal(preparedInput.positions.format, 'float32', 'keeps converted source vector format');
  t.equal(preparedInput.rowIndices.format, 'uint32', 'keeps generated internal vector format');
  preparedInput.positions.destroy();
  preparedInput.rowIndices.destroy();
  t.end();
});

test('ArrowInputSchema rejects converted vectors outside the GPU input contract', async t => {
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
    t.fail('invalid converted vector format should be rejected');
  } catch (error) {
    t.ok(
      /positions GPUVector\.format "float32" must be one of uint32/.test((error as Error).message),
      'validates converter output against gpuInputSchema'
    );
  }
  preparedPositions?.destroy();
  t.end();
});
