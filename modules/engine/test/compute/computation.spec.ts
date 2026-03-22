import {expect, test} from 'vitest';
import { getWebGPUTestDevice } from '@luma.gl/test-utils';
import { Buffer, Device } from '@luma.gl/core';
import { Computation } from '@luma.gl/engine';
const source = /* WGSL*/`\
@group(0) @binding(0) var<storage, read_write> data: array<i32>;

@compute @workgroup_size(1) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let i = id.x;
  data[i] = 2 * data[i];
}
`;
test('Computation#construct/delete', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    const computation = new Computation(webgpuDevice, {
      source
    });
    expect(computation instanceof Computation, 'ComputePipeline construction successful').toBeTruthy();
    computation.destroy();
    expect(computation instanceof Computation, 'ComputePipeline delete successful').toBeTruthy();
    computation.destroy();
    expect(computation instanceof Computation, 'ComputePipeline repeated delete successful').toBeTruthy();
  }
});
test('Computation#compute', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    if (isSoftwareBackedDevice(webgpuDevice)) {
      return;
    }
    const computation = new Computation(webgpuDevice, {
      source,
      shaderLayout: {
        bindings: [{
          name: 'data',
          type: 'storage',
          group: 0,
          location: 0
        }]
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
    computation.setBindings({
      data: workBuffer
    });
    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, 1);
    computePass.end();
    webgpuDevice.submit();
    const computedData = new Int32Array(await workBuffer.readAsync());
    expect(computedData[0], 'Computed data is correct').toBe(4);
    computation.destroy();
  }
});
function isSoftwareBackedDevice(device: Device): boolean {
  return device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback);
}
