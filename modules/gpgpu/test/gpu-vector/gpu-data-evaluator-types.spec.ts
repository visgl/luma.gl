// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  add,
  extent,
  fround,
  gather,
  getGPUDataEvaluator,
  GPUDataEvaluator,
  GPUVectorEvaluator,
  interleave,
  sequence,
  sqrt
} from '@luma.gl/gpgpu';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/tables';
import {test} from 'vitest';

test('GPUDataEvaluator type inference', () => {});

export function checkGPUDataEvaluatorTypes(
  device: Device,
  dynamicSize: number,
  float32Vector: GPUVector<'float32'>,
  float32x2Vector: GPUVector<'float32x2'>,
  float32x3Vector: GPUVector<'float32x3'>,
  uint32x4Vector: GPUVector<'uint32x4'>
): void {
  const evaluatorFromData = GPUDataEvaluator.fromGPUData(float32x3Vector.data[0]);
  evaluatorFromData satisfies GPUDataEvaluator<'float32x3'>;

  const evaluatorFromInput = getGPUDataEvaluator(float32x3Vector.data[0]);
  evaluatorFromInput satisfies GPUDataEvaluator<'float32x3'>;

  const evaluatedVector = evaluatorFromData.evaluate(device);
  evaluatedVector satisfies Promise<GPUVector<'float32x3'>>;

  const evaluatedOverrideVector = evaluatorFromData.evaluate(device, {format: 'float32x2'});
  evaluatedOverrideVector satisfies Promise<GPUVector<'float32x2'>>;

  const evaluatedInterleavedVector = evaluatorFromData.evaluate(device, {interleaved: true});
  evaluatedInterleavedVector satisfies Promise<GPUVector<GPUVectorFormat>>;

  const vectorEvaluator = GPUVectorEvaluator.fromGPUVector(float32x3Vector);
  vectorEvaluator satisfies GPUVectorEvaluator;

  const sequenceEvaluator = sequence(4);
  sequenceEvaluator satisfies GPUDataEvaluator<'sint32'>;

  const gatheredEvaluator = gather(sequenceEvaluator, float32x3Vector.data[0]);
  gatheredEvaluator satisfies GPUDataEvaluator<'float32x3'>;

  const extentEvaluator = extent(float32x3Vector.data[0]);
  extentEvaluator satisfies GPUDataEvaluator<'float32x2'>;

  const roundedEvaluator = fround(uint32x4Vector.data[0]);
  roundedEvaluator satisfies GPUDataEvaluator<'float32x4'>;

  const float32Evaluator = GPUDataEvaluator.fromGPUData(float32Vector.data[0]);
  const float32x2Evaluator = GPUDataEvaluator.fromGPUData(float32x2Vector.data[0]);
  const float32x3Evaluator = GPUDataEvaluator.fromGPUData(float32x3Vector.data[0]);

  const widenedArithmeticEvaluator = add(float32Evaluator, float32x3Evaluator);
  widenedArithmeticEvaluator satisfies GPUDataEvaluator<'float32x3'>;

  const sqrtEvaluator = sqrt(float32x2Evaluator);
  sqrtEvaluator satisfies GPUDataEvaluator<'float32x2'>;

  const normalizedEvaluator = GPUDataEvaluator.fromArray([0, 0, 0, 255], {
    type: 'uint8',
    size: 4,
    normalized: true
  });
  normalizedEvaluator satisfies GPUDataEvaluator<'unorm8x4'>;

  const normalizedArithmeticEvaluator = add(normalizedEvaluator, normalizedEvaluator);
  normalizedArithmeticEvaluator satisfies GPUDataEvaluator<'float32x4'>;

  const representableInterleaveEvaluator = interleave(float32Evaluator, float32x2Evaluator);
  representableInterleaveEvaluator satisfies GPUDataEvaluator<'float32x3'>;

  const wideInterleaveEvaluator = interleave(float32x3Evaluator, float32x3Evaluator);
  wideInterleaveEvaluator satisfies GPUDataEvaluator<GPUVectorFormat>;
  const wideInterleaveFormat = wideInterleaveEvaluator.format;
  wideInterleaveFormat satisfies GPUVectorFormat | undefined;
  // @ts-expect-error wide interleave output falls back to broad GPUVectorFormat
  wideInterleaveFormat satisfies 'float32x4' | undefined;

  const dynamicSizeEvaluator = GPUDataEvaluator.fromArray([1, 2, 3], {size: dynamicSize});
  dynamicSizeEvaluator satisfies GPUDataEvaluator<GPUVectorFormat>;
  const dynamicSizeFormat = dynamicSizeEvaluator.format;
  dynamicSizeFormat satisfies GPUVectorFormat | undefined;
  // @ts-expect-error non-literal sizes fall back to broad GPUVectorFormat
  dynamicSizeFormat satisfies 'float32x3' | undefined;
}
