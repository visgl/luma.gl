// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BufferTransform} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {createTableTexture, getSourceValuesTextureModule} from './common/random-access-transform';
import {getTextureDataType} from './common/helper';
import {getOutputModule} from './common/row-transform';

export const segmentedMap: OperationHandler<{
  segments: GPUDataEvaluator;
  vertexCount: number;
}> = async ({inputs, output, target}) => {
  const {segments} = inputs;
  const device = target.device;
  const outputModule = getOutputModule('result', output.type, output.size);
  const textureDataType = getTextureDataType(segments.type);
  const segmentsTexture = createTableTexture(segments, textureDataType, device);

  const transform = new BufferTransform(device, {
    vs: `\
#version 300 es

void main() {
  TYPE result[RESULT_LEN];
  segmentedMap(result);
  set_result(result);
}
`,
    defines: {
      TYPE: 'uint',
      RESULT_LEN: output.size.toString(),
      SEGMENTS_LENGTH: segments.length.toString()
    } as any,
    modules: [
      getSourceValuesTextureModule(segments, output.type, textureDataType),
      getSegmentedMapModule(),
      outputModule
    ],
    bindings: {source_values_texture: segmentsTexture},
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs: outputModule.varyings
  });

  try {
    transform.run({
      outputBuffers: {[outputModule.varyings[0]]: target}
    });
    return {success: true};
  } finally {
    transform.destroy();
    segmentsTexture.destroy();
  }
};

function getSegmentedMapModule() {
  return {
    name: 'segmentedMap',
    vs: `
uint read_segment_start(int segmentIndex) {
  TYPE value[1];
  read_source_values(segmentIndex, value);
  return uint(value[0]);
}

void segmentedMap(out TYPE result[RESULT_LEN]) {
  uint vertexIndex = uint(gl_InstanceID);
  int low = 0;
  int high = SEGMENTS_LENGTH;

  while (low < high) {
    int mid = low + (high - low) / 2;
    uint midStart = read_segment_start(mid);
    if (midStart <= vertexIndex) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  uint segmentIndex = uint(max(low - 1, 0));
  uint segmentStart = read_segment_start(int(segmentIndex));
  result[0] = segmentIndex;
  result[1] = vertexIndex - segmentStart;
}
`
  };
}
