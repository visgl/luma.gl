//
import {Binding, Buffer, Sampler, Texture, cast} from '@luma.gl/api';
import type WebGPUBuffer from '../resources/webgpu-buffer';
import type WebGPUSampler from '../resources/webgpu-sampler';
import type WebGPUTexture from '../resources/webgpu-texture';

/**
 * Create a WebGPU bind group from an array of luma.gl bindings
 */
export function makeBindGroup(device: GPUDevice, layout: GPUBindGroupLayout, bindings: Binding[]): GPUBindGroup {
  return device.createBindGroup({
    layout,
    entries: getBindGroupEntries(bindings)
  })
}

/**
 * @param bindings
 * @returns
 */
function getBindGroupEntries(bindings: Binding[]): GPUBindGroupEntry[] {
  const entries: GPUBindGroupEntry[] = [];

  for (let index = 0; index < bindings.length; index++) {
    const binding = bindings[index];
    entries.push(getBindGroupEntry(binding, index));
  }

  return entries;
}

function getBindGroupEntry(binding: Binding, index: number): GPUBindGroupEntry {
  if (binding instanceof Buffer) {
    return {
      binding: index,
      resource: {
        buffer: cast<WebGPUBuffer>(binding).handle
      }
    };
  }
  if (binding instanceof Sampler) {
    return {
      binding: index,
      resource: cast<WebGPUSampler>(binding).handle
    };
  } else if (binding instanceof Texture) {
    return {
      binding: index,
      resource: cast<WebGPUTexture>(binding).handle.createView()
    };
  }
  throw new Error('invalid binding');
}
