// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  add,
  extent,
  fround,
  gather,
  getGPUTableEvaluator,
  GPUTableEvaluator,
  interleave,
  sequence,
  sqrt
} from '@luma.gl/gpgpu';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/tables';

declare const device: Device;
declare const dynamicSize: number;
declare const float32Vector: GPUVector<'float32'>;
declare const float32x2Vector: GPUVector<'float32x2'>;
declare const float32x3Vector: GPUVector<'float32x3'>;
declare const uint32x4Vector: GPUVector<'uint32x4'>;

const evaluatorFromVector = GPUTableEvaluator.fromGPUVector(float32x3Vector);
evaluatorFromVector satisfies GPUTableEvaluator<'float32x3'>;

const evaluatorFromInput = getGPUTableEvaluator(float32x3Vector);
evaluatorFromInput satisfies GPUTableEvaluator<'float32x3'>;

const evaluatedVector = evaluatorFromVector.evaluate(device);
evaluatedVector satisfies Promise<GPUVector<'float32x3'>>;

const evaluatedOverrideVector = evaluatorFromVector.evaluate(device, {format: 'float32x2'});
evaluatedOverrideVector satisfies Promise<GPUVector<'float32x2'>>;

const evaluatedInterleavedVector = evaluatorFromVector.evaluate(device, {interleaved: true});
evaluatedInterleavedVector satisfies Promise<GPUVector<GPUVectorFormat>>;

const sequenceEvaluator = sequence(4);
sequenceEvaluator satisfies GPUTableEvaluator<'sint32'>;

const gatheredEvaluator = gather(sequenceEvaluator, float32x3Vector);
gatheredEvaluator satisfies GPUTableEvaluator<'float32x3'>;

const extentEvaluator = extent(float32x3Vector);
extentEvaluator satisfies GPUTableEvaluator<'float32x2'>;

const roundedEvaluator = fround(uint32x4Vector);
roundedEvaluator satisfies GPUTableEvaluator<'float32x4'>;

const float32Evaluator = GPUTableEvaluator.fromGPUVector(float32Vector);
const float32x2Evaluator = GPUTableEvaluator.fromGPUVector(float32x2Vector);
const float32x3Evaluator = GPUTableEvaluator.fromGPUVector(float32x3Vector);

const widenedArithmeticEvaluator = add(float32Evaluator, float32x3Evaluator);
widenedArithmeticEvaluator satisfies GPUTableEvaluator<'float32x3'>;

const sqrtEvaluator = sqrt(float32x2Evaluator);
sqrtEvaluator satisfies GPUTableEvaluator<'float32x2'>;

const normalizedEvaluator = GPUTableEvaluator.fromArray([0, 0, 0, 255], {
  type: 'uint8',
  size: 4,
  normalized: true
});
normalizedEvaluator satisfies GPUTableEvaluator<'unorm8x4'>;

const normalizedArithmeticEvaluator = add(normalizedEvaluator, normalizedEvaluator);
normalizedArithmeticEvaluator satisfies GPUTableEvaluator<'float32x4'>;

const representableInterleaveEvaluator = interleave(float32Evaluator, float32x2Evaluator);
representableInterleaveEvaluator satisfies GPUTableEvaluator<'float32x3'>;

const wideInterleaveEvaluator = interleave(float32x3Evaluator, float32x3Evaluator);
wideInterleaveEvaluator satisfies GPUTableEvaluator<GPUVectorFormat>;
const wideInterleaveFormat = wideInterleaveEvaluator.format;
wideInterleaveFormat satisfies GPUVectorFormat | undefined;
// @ts-expect-error wide interleave output falls back to broad GPUVectorFormat
wideInterleaveFormat satisfies 'float32x4' | undefined;

const dynamicSizeEvaluator = GPUTableEvaluator.fromArray([1, 2, 3], {size: dynamicSize});
dynamicSizeEvaluator satisfies GPUTableEvaluator<GPUVectorFormat>;
const dynamicSizeFormat = dynamicSizeEvaluator.format;
dynamicSizeFormat satisfies GPUVectorFormat | undefined;
// @ts-expect-error non-literal sizes fall back to broad GPUVectorFormat
dynamicSizeFormat satisfies 'float32x3' | undefined;
