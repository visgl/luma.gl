// luma.gl, MIT license
import type {ShaderLayout, Binding} from '@luma.gl/api';
import {Buffer, Sampler, Texture, log, cast} from '@luma.gl/api';
import type WebGPUBuffer from '../resources/webgpu-buffer';
import type WebGPUSampler from '../resources/webgpu-sampler';
import type WebGPUTexture from '../resources/webgpu-texture';

/**
 * Create a WebGPU bind group from an array of luma.gl bindings
 */
export function getBindGroup(
  device: GPUDevice,
  bindGroupLayout: GPUBindGroupLayout,
  layout: ShaderLayout,
  bindings: Record<string, Binding>
): GPUBindGroup {
  const entries = getBindGroupEntries(bindings, layout);
  return device.createBindGroup({
    layout: bindGroupLayout,
    entries
  });
}

/**
 * @param bindings
 * @returns
 */
function getBindGroupEntries(bindings: Record<string, Binding>, layout: ShaderLayout): GPUBindGroupEntry[] {
  const entries: GPUBindGroupEntry[] = [];

  for (const [bindingName, value] of Object.entries(bindings)) {
    const bindingLayout = layout.bindings[bindingName];
    if (!bindingLayout) {
      log.warn(`Binding ${bindingName} not set: Not found in shader layout.`)();
    }
    entries.push(getBindGroupEntry(value, bindingLayout.location));
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
