// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Buffer, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';

const source = /* WGSL*/ `\
@group(0) @binding(0) var<storage, read_write> data: array<i32>;

@compute @workgroup_size(1) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let i = id.x;
  data[i] = 2 * data[i];
}
`;

const sharedSource = /* WGSL */ `\
${source}

@vertex
fn firstVertex(@location(0) firstPosition: vec2f) -> @builtin(position) vec4f {
  return vec4f(firstPosition, 0.0, 1.0);
}

@vertex
fn secondVertex(@location(1) secondPosition: vec3f) -> @builtin(position) vec4f {
  return vec4f(secondPosition, 1.0);
}
`;

it('Computation#construct/delete', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    let reflectionCount = 0;
    const originalGetShaderLayout = webgpuDevice.getShaderLayout;
    webgpuDevice.getShaderLayout = shaderSource => {
      reflectionCount++;
      return originalGetShaderLayout.call(webgpuDevice, shaderSource);
    };

    let computation: Computation;
    try {
      computation = new Computation(webgpuDevice, {source: sharedSource});
    } finally {
      webgpuDevice.getShaderLayout = originalGetShaderLayout;
    }

    expect(
      Boolean(computation instanceof Computation),
      'ComputePipeline construction successful'
    ).toBe(true);
    expect(
      reflectionCount,
      'computation scans bindings without resolving unrelated vertex entry points'
    ).toBe(0);
    computation.destroy();
    expect(Boolean(computation instanceof Computation), 'ComputePipeline delete successful').toBe(
      true
    );
    computation.destroy();
    expect(
      Boolean(computation instanceof Computation),
      'ComputePipeline repeated delete successful'
    ).toBe(true);
  }
  void 0;
});

it('Computation#compute', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    if (isSoftwareBackedDevice(webgpuDevice)) {
      void 0;
      void 0;
      return;
    }

    const computation = new Computation(webgpuDevice, {
      source,
      shaderLayout: {
        bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
      }
    });

    const workBuffer = webgpuDevice.createBuffer({
      id: 'work buffer',
      byteLength: 4,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });

    workBuffer.write(new Int32Array([2]));
    const inputData = new Int32Array(await workBuffer.readAsync());
    expect(inputData[0], 'Input data is correct').toBe(2);

    computation.setBindings({data: workBuffer});

    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, 1);
    computePass.end();

    webgpuDevice.submit();

    const computedData = new Int32Array(await workBuffer.readAsync());
    expect(computedData[0], 'Computed data is correct').toBe(4);

    computation.destroy();
  }
  void 0;
});

it('Computation#dispatchIndirect', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    if (isSoftwareBackedDevice(webgpuDevice)) {
      void 0;
      void 0;
      return;
    }

    const computation = new Computation(webgpuDevice, {
      source,
      shaderLayout: {
        bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
      }
    });
    const workBuffer = webgpuDevice.createBuffer({
      data: new Int32Array([1, 2, 3, 4]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const dispatchBuffer = webgpuDevice.createBuffer({
      data: new Uint32Array([4, 1, 1, 1, 1, 1]),
      usage: Buffer.INDIRECT
    });
    computation.setBindings({data: workBuffer});

    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatchIndirect(computePass, dispatchBuffer);
    computePass.end();
    webgpuDevice.submit();

    const computedBytes = await workBuffer.readAsync();
    const computedData = new Int32Array(
      computedBytes.buffer,
      computedBytes.byteOffset,
      computedBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    expect(Array.from(computedData), 'GPU-written dimensions drive dispatch').toEqual([2, 4, 6, 8]);

    const offsetWorkBuffer = webgpuDevice.createBuffer({
      data: new Int32Array([1, 2, 3, 4]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    computation.setBindings({data: offsetWorkBuffer});
    const offsetComputePass = webgpuDevice.beginComputePass({});
    computation.dispatchIndirect(
      offsetComputePass,
      dispatchBuffer,
      3 * Uint32Array.BYTES_PER_ELEMENT
    );
    offsetComputePass.end();
    webgpuDevice.submit();

    const offsetComputedBytes = await offsetWorkBuffer.readAsync();
    const offsetComputedData = new Int32Array(
      offsetComputedBytes.buffer,
      offsetComputedBytes.byteOffset,
      offsetComputedBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    expect(
      Array.from(offsetComputedData),
      'nonzero byte offset selects the requested dispatch record'
    ).toEqual([2, 2, 3, 4]);

    computation.destroy();
    workBuffer.destroy();
    offsetWorkBuffer.destroy();
    dispatchBuffer.destroy();
  }
  void 0;
});

it('Computation#plugins assemble WGSL contributions', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    const computation = new Computation(webgpuDevice, {
      source,
      plugins: [
        {
          name: 'compute-plugin',
          wgsl: {
            modules: [
              {
                name: 'compute-plugin-module',
                source: 'const COMPUTE_PLUGIN_MARKER: i32 = 1;'
              }
            ]
          }
        }
      ]
    });

    expect(
      Boolean(computation.source.includes('const COMPUTE_PLUGIN_MARKER: i32 = 1;')),
      'WGSL computation plugin injection is assembled'
    ).toBe(true);
    computation.destroy();

    expect(
      () =>
        new Computation(webgpuDevice, {
          source,
          plugins: [{name: 'vertex-input-plugin', vertexInputs: {filterValues: 'f32'}}]
        }),
      'compute pipelines reject plugin vertex inputs'
    ).toThrow(/does not support ShaderPlugin vertex inputs/);

    expect(
      () =>
        new Computation(webgpuDevice, {
          source,
          plugins: [
            {
              name: 'varying-plugin',
              varyings: {pluginValue: {type: 'f32'}}
            }
          ]
        }),
      'compute pipelines reject plugin varyings'
    ).toThrow(/does not support ShaderPlugin vertex inputs or varyings/);
  }
  void 0;
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
