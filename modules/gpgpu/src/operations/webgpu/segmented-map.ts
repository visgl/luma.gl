// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';
import {getGPUVectorBuffer, GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {
  getInputBinding,
  getOutputBinding,
  getOutputWriter,
  RANDOM_ACCESS_WORKGROUP_SIZE,
  getTableAccessor
} from './common/random-access-transform';

export const segmentedMap: OperationHandler<{
  segments: GPUTableEvaluator;
  vertexCount: number;
}> = async ({inputs, output, target}) => {
  const {segments} = inputs;
  const bindings = segments.isConstant ? [] : [{name: 'segments', input: segments, index: 0}];
  const source = /* wgsl */ `
${bindings.map(({name, input, index}) => getInputBinding(name, input, index)).join('\n')}
${getTableAccessor('segments', segments, 'uint32')}
${getOutputBinding(output, bindings.length)}
${getOutputWriter(output)}
${getSegmentedMapFunction(segments.length)}

@compute @workgroup_size(${RANDOM_ACCESS_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`;

  const computation = new Computation(target.device, {
    source,
    shaderLayout: {
      bindings: [
        ...bindings.map(({name, index}) => ({
          name,
          type: 'storage' as const,
          group: 0,
          location: index
        })),
        {name: 'result', type: 'storage' as const, group: 0, location: bindings.length}
      ]
    }
  });

  const computationBindings: Record<string, Buffer> = Object.fromEntries(
    bindings.map(({name, input}) => [name, getGPUVectorBuffer(input.gpuVector)])
  );
  computationBindings['result'] = target;
  computation.setBindings(computationBindings);

  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / RANDOM_ACCESS_WORKGROUP_SIZE));
  computePass.end();
  target.device.submit();
  computation.destroy();
  return {success: true};
};

function getSegmentedMapFunction(segmentsLength: number): string {
  return `fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
  var low = 0i;
  var high = ${segmentsLength}i;
  while (low < high) {
    let mid = low + (high - low) / 2i;
    let midStart = read_segments(u32(mid))[0];
    if (midStart <= vertexIndex) {
      low = mid + 1i;
    } else {
      high = mid;
    }
  }

  let segmentIndex = u32(max(low - 1i, 0i));
  let segmentStart = read_segments(segmentIndex)[0];
  return array<u32, 2>(segmentIndex, vertexIndex - segmentStart);
}`;
}
