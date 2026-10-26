// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Kernel} from '@luma.gl/engine';
import {OperationHandler} from '../../operation/operation';
import {getWebGPUDispatchLayout, getWebGPUDispatchRowIndex} from './common/dispatch';

const WORKGROUP_SIZE = 64;

export const sequence: OperationHandler<{start: number; step: number}> = ({
  inputs,
  output,
  target
}) => {
  const dispatchLayout = getWebGPUDispatchLayout(
    Math.ceil(output.length / WORKGROUP_SIZE),
    target.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${getWebGPUDispatchRowIndex(dispatchLayout, WORKGROUP_SIZE)};
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let rowOffset = ${output.offset / output.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${output.stride / output.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${inputs.start} + i32(rowIndex) * ${inputs.step};
}
`;

  const kernel = new Kernel(target.device, {
    source,
    shaderLayout: {
      bindings: [{name: 'result', type: 'storage' as const, group: 0, location: 0}]
    }
  });

  const kernelBindings = {result: target};
  const computePass = target.device.beginComputePass({});
  kernel.dispatch(computePass, {
    bindings: kernelBindings,
    x: dispatchLayout.x,
    y: dispatchLayout.y,
    z: dispatchLayout.z
  });
  computePass.end();
  target.device.submit();
  kernel.destroy();
  return {success: true};
};
