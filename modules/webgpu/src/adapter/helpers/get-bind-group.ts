// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ComputeShaderLayout, BindingDeclaration, Binding} from '@luma.gl/core';
import {Buffer, Sampler, Texture, log} from '@luma.gl/core';
import type {WebGPUBuffer} from '../resources/webgpu-buffer';
import type {WebGPUSampler} from '../resources/webgpu-sampler';
import type {WebGPUTexture} from '../resources/webgpu-texture';

/**
 * Create a WebGPU "bind group layout" from an array of luma.gl bindings
 * @note bind groups can be automatically generated by WebGPU.
 */
export function makeBindGroupLayout(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  bindings: Binding[]
): GPUBindGroupLayout {
  throw new Error('not implemented');
  // return device.createBindGroupLayout({
  //   layout,
  //   entries: getBindGroupEntries(bindings)
  // })
}

/**
 * Create a WebGPU "bind group" from an array of luma.gl bindings
 */
export function getBindGroup(
  device: GPUDevice,
  bindGroupLayout: GPUBindGroupLayout,
  shaderLayout: ComputeShaderLayout,
  bindings: Record<string, Binding>
): GPUBindGroup {
  const entries = getBindGroupEntries(bindings, shaderLayout);
  return device.createBindGroup({
    layout: bindGroupLayout,
    entries
  });
}

export function getShaderLayoutBinding(
  shaderLayout: ComputeShaderLayout,
  bindingName: string
): BindingDeclaration {
  const bindingLayout = shaderLayout.bindings.find(
    binding =>
      binding.name === bindingName || `${binding.name}uniforms` === bindingName.toLocaleLowerCase()
  );
  if (!bindingLayout) {
    log.warn(`Binding ${bindingName} not set: Not found in shader layout.`)();
  }
  return bindingLayout;
}

/**
 * @param bindings
 * @returns
 */
function getBindGroupEntries(
  bindings: Record<string, Binding>,
  shaderLayout: ComputeShaderLayout
): GPUBindGroupEntry[] {
  const entries: GPUBindGroupEntry[] = [];

  for (const [bindingName, value] of Object.entries(bindings)) {
    const bindingLayout = getShaderLayoutBinding(shaderLayout, bindingName);
    if (bindingLayout) {
      entries.push(getBindGroupEntry(value, bindingLayout.location));
    }
  }

  return entries;
}

function getBindGroupEntry(binding: Binding, index: number): GPUBindGroupEntry {
  if (binding instanceof Buffer) {
    return {
      binding: index,
      resource: {
        buffer: (binding as WebGPUBuffer).handle
      }
    };
  }
  if (binding instanceof Sampler) {
    return {
      binding: index,
      resource: (binding as WebGPUSampler).handle
    };
  } else if (binding instanceof Texture) {
    return {
      binding: index,
      resource: (binding as WebGPUTexture).handle.createView({label: 'bind-group-auto-created'})
    };
  }
  throw new Error('invalid binding');
}
