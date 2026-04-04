// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  log,
  PipelineLayout,
  PipelineLayoutProps,
  StorageBufferBindingLayout,
  StorageTextureBindingLayout
} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';

export class WebGPUPipelineLayout extends PipelineLayout {
  readonly device: WebGPUDevice;
  readonly handle: GPUPipelineLayout;

  constructor(device: WebGPUDevice, props: PipelineLayoutProps) {
    super(device, props);

    this.device = device;

    const bindGroupEntriesByGroup = this.mapShaderLayoutToBindGroupEntriesByGroup();

    this.handle = this.device.handle.createPipelineLayout({
      label: props?.id ?? 'unnamed-pipeline-layout',
      bindGroupLayouts: bindGroupEntriesByGroup.map((entries, group) =>
        this.device.handle.createBindGroupLayout({
          label: `bind-group-layout-${group}`,
          entries
        })
      )
    });
  }

  override destroy(): void {
    // WebGPUPipelineLayout has no destroy method.
    // @ts-expect-error
    this.handle = null;
  }

  protected mapShaderLayoutToBindGroupEntriesByGroup(): GPUBindGroupLayoutEntry[][] {
    const maxGroup = this.props.shaderLayout.bindings.reduce(
      (highestGroup, binding) => Math.max(highestGroup, binding.group),
      -1
    );
    const bindGroupEntriesByGroup: GPUBindGroupLayoutEntry[][] = Array.from(
      {length: maxGroup + 1},
      () => []
    );

    for (const binding of this.props.shaderLayout.bindings) {
      const bindingTypeInfo: Omit<GPUBindGroupLayoutEntry, 'binding' | 'visibility'> = {};

      switch (binding.type) {
        case 'uniform': {
          bindingTypeInfo.buffer = {
            type: 'uniform',
            hasDynamicOffset: binding.hasDynamicOffset,
            minBindingSize: binding.minBindingSize
          };
          break;
        }

        case 'read-only-storage': {
          bindingTypeInfo.buffer = {
            type: 'read-only-storage',
            hasDynamicOffset: binding.hasDynamicOffset,
            minBindingSize: binding.minBindingSize
          };
          break;
        }

        case 'sampler': {
          bindingTypeInfo.sampler = {
            type: binding.samplerType
          };
          break;
        }

        case 'storage': {
          if (isStorageTextureBindingLayout(binding)) {
            bindingTypeInfo.storageTexture = {
              // TODO (kaapp): Not all formats in the binding layout are supported
              // by WebGPU, but at least it will provide a clear error for now.
              format: binding.format as GPUTextureFormat,
              access: binding.access,
              viewDimension: binding.viewDimension
            };
          } else {
            bindingTypeInfo.buffer = {
              type: 'storage',
              hasDynamicOffset: binding.hasDynamicOffset,
              minBindingSize: binding.minBindingSize
            };
          }
          break;
        }

        case 'texture': {
          bindingTypeInfo.texture = {
            multisampled: binding.multisampled,
            sampleType: binding.sampleType,
            viewDimension: binding.viewDimension
          };
          break;
        }

        default: {
          log.warn('unhandled binding type when creating pipeline descriptor')();
        }
      }

      const VISIBILITY_ALL =
        GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

      bindGroupEntriesByGroup[binding.group].push({
        binding: binding.location,
        visibility: binding.visibility || VISIBILITY_ALL,
        ...bindingTypeInfo
      });
    }

    return bindGroupEntriesByGroup;
  }
}

const isStorageTextureBindingLayout = (
  maybe: StorageBufferBindingLayout | StorageTextureBindingLayout
): maybe is StorageTextureBindingLayout => {
  return (maybe as StorageTextureBindingLayout).format !== undefined;
};
