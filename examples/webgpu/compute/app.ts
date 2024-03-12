// Inspired by https://web.dev/gpu-compute/
// @ts-nocheck
/* eslint-disable */

import {Buffer, RenderPipelineParameters} from '@luma.gl/core';
import {Model, WebGPUDevice} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

// import updateSprites from './update-sprites.wgsl?raw';
// import sprites from './sprites.wgsl?raw';

export const name = 'Compute';
export const description = 'A pure GPU compute shader for matrix multiplication';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  compute: `
    @block struct Matrix {
      size : vec2<f32>;
      numbers: array<f32>;
    };

    @group(0) binding(0) var<storage, read> firstMatrix : Matrix;
    @group(0) binding(1) var<storage, read> secondMatrix : Matrix;
    @group(0) binding(2) var<storage, write> resultMatrix : Matrix;

    @compute workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
      // Guard against out-of-bounds work group sizes.
      if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {
        return;
      }

      resultMatrix.size = vec2<f32>(firstMatrix.size.x, secondMatrix.size.y);

      let resultCell = vec2<u32>(global_id.x, global_id.y);
      var result = 0.0;
      for (var i = 0u; i < u32(firstMatrix.size.y); i = i + 1u) {
        let a = i + resultCell.x * u32(firstMatrix.size.y);
        let b = resultCell.y + i * u32(secondMatrix.size.y);
        result = result + firstMatrix.numbers[a] * secondMatrix.numbers[b];
      }

      let index = resultCell.y + resultCell.x * u32(secondMatrix.size.y);
      resultMatrix.numbers[index] = result;
    }
  `
};

async function init(canvas: HTMLCanvasElement) {
  const device = await WebGPUDevice.create({canvas});

  // First Matrix

  const firstMatrix = new Float32Array([2 /* rows */, 4 /* columns */, 1, 2, 3, 4, 5, 6, 7, 8]);

  // Second Matrix

  const secondMatrix = new Float32Array([4 /* rows */, 2 /* columns */, 1, 2, 3, 4, 5, 6, 7, 8]);

  const gpuBufferFirstMatrix = device.createBuffer({usage: Buffer.STORAGE, data: firstMatrix});
  const gpuBufferSecondMatrix = device.createBuffer({usage: Buffer.STORAGE, data: secondMatrix});

  // Result Matrix
  const resultMatrixBufferSize =
    Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
  const resultMatrixBuffer = device.createBuffer({
    size: resultMatrixBufferSize,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });

  // Compute shader code

  const computeShader = device.createShader({
    stage: 'compute',
    source: SHADERS.wgsl.compute
  });

  // Pipeline setup

  const computePipeline = device.createComputePipeline({
    cs: computeShader,
    bindings: {
      firstMatrix,
      secondMatrix,
      resultMatrix
    }
  });

  // Commands submission

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  const x = Math.ceil(firstMatrix[0] / 8); // X dimension of the grid of workgroups to dispatch.
  const y = Math.ceil(secondMatrix[1] / 8); // Y dimension of the grid of workgroups to dispatch.
  passEncoder.dispatch(x, y);
  passEncoder.endPass();

  // Get a GPU buffer for reading in an unmapped state.
  const gpuReadBuffer = device.createBuffer({
    size: resultMatrixBufferSize,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  // Encode commands for copying buffer to buffer.
  commandEncoder.copyBufferToBuffer(
    resultMatrixBuffer /* source buffer */,
    0 /* source offset */,
    gpuReadBuffer /* destination buffer */,
    0 /* destination offset */,
    resultMatrixBufferSize /* size */
  );

  // Submit GPU commands.
  const gpuCommands = commandEncoder.finish();
  device.queue.submit([gpuCommands]);

  // Read buffer.
  await gpuReadBuffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = gpuReadBuffer.getMappedRange();
  console.log(new Float32Array(arrayBuffer));
}

init(document.getElementById('canvas') as HTMLCanvasElement);
