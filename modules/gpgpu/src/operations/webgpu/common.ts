// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { SignedDataType, Device, Buffer, BufferLayout } from '@luma.gl/core';
import { Computation } from '../../transforms/computation';
import { GPUTable } from "../../operation/gpu-table";
import { bufferPool } from '../../utils/buffer-pool';

export function runComputation({inputs, output, outputBuffer}: {
  /** contains signature
   * void execute(in float x[], in float y[], ..., inout float result[]) {}
   */
  inputs: {[name: string]: GPUTable};
  output: GPUTable;
  outputBuffer: Buffer;
}): void {
  const workgroupSize = [4, 4, output.size];

  // https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html
  const source = /* wgsl */ `\
  override xSize = 2;
  override xStride = 8;
  override ySize = 2;
  override yStride = 8;

  @group(0) @binding(0) var<storage, read_write> ax: array<f32>;
  @group(0) @binding(1) var<storage, read_write> ay: array<f32>;
  @group(0) @binding(2) var<storage, read_write> result: array<f32>;

  fn add(x: u32, y: u32) -> u32 {
    return x + y;
  }
  fn add(x: i32, y: i32) -> i32 {
    return x + y;
  }
  fn add(x: f32, y: f32) -> f32 {
    return x + y;
  }

  fn get_x(globalIndex: u32, localIndex: u32) -> float {
    return ax[index * xStride / 4 + i];
  }

  fn get_y(globalIndex: u32, localIndex: u32) -> float {
    return ay[index * xStride / 4 + i];
  }

  @compute @workgroup_size(${workgroupSize}) fn execute(
    @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
    @builtin(global_invocation_id) global_invocation_id : vec3<u32>
  ) {
    let global_invocation_index = global_invocation_id.x * ${workgroupSize[1] * workgroupSize[2]} +
      global_invocation_id.y * ${workgroupSize[2]} +
      global_invocation_id.z -
      local_invocation_id.z;

    let x = get_x(global_invocation_index, local_invocation_id.z);
    let y = get_y(global_invocation_index, local_invocation_id.z);
    set_result(global_invocation_index, local_invocation_id.z, add(x, y));
  }
  `
}