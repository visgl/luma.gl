import {
  PipelineLayout,
  PipelineLayoutProps,
  StorageBufferBindingLayout,
  StorageTextureBindingLayout
} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';

export class WebGPUPipelineLayout extends PipelineLayout {
  device: WebGPUDevice;
  handle: GPUPipelineLayout;

  constructor(device: WebGPUDevice, props: PipelineLayoutProps) {
    super(device, props);

    this.device = device;

    const bindGroupEntries = this.mapShaderLayoutToBindGroupEntries();

    this.handle = this.device.handle.createPipelineLayout({
      label: props?.id ?? 'unnamed-pipeline-layout',
      bindGroupLayouts: [
        // TODO (kaapp): We can cache these to re-use them across
        // layers, particularly if using a separate group for injected
        // bindings (e.g. project/lighting)
        this.device.handle.createBindGroupLayout({
          label: 'bind-group-layout',
          entries: bindGroupEntries
        })
      ]
    });
  }

  override destroy(): void {
    // WebGPUPipelineLayout has no destroy method.
    // @ts-expect-error
    this.handle = null;
  }

  protected mapShaderLayoutToBindGroupEntries(): GPUBindGroupLayoutEntry[] {
    // Set up the pipeline layout
    // TODO (kaapp): This only supports the first group, but so does the rest of the code
    const bindGroupEntries: GPUBindGroupLayoutEntry[] = [];

    for (let i = 0; i < this.props.shaderLayout.bindings.length; i++) {
      const binding = this.props.shaderLayout.bindings[i];
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
          console.warn('unhandled binding type when creating pipeline descriptor');
        }
      }

      const VISIBILITY_ALL =
        GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

      bindGroupEntries.push({
        binding: binding.location,
        visibility: binding.visibility || VISIBILITY_ALL,
        ...bindingTypeInfo
      });
    }

    return bindGroupEntries;
  }
}

const isStorageTextureBindingLayout = (
  maybe: StorageBufferBindingLayout | StorageTextureBindingLayout
): maybe is StorageTextureBindingLayout => {
  return (maybe as StorageTextureBindingLayout).format !== undefined;
};
