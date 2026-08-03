// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, MipmapGenerator, Texture} from '@luma.gl/core';
import type {WebGPUDevice} from './adapter/webgpu-device';
import {generateMipmapsWebGPU} from './adapter/helpers/generate-mipmaps-webgpu';

export {generateMipmapsWebGPU} from './adapter/helpers/generate-mipmaps-webgpu';

/** Optional WebGPU mipmap generation capability for DeviceProps. */
export const webgpuMipmapGenerator: MipmapGenerator = {
  generateMipmaps(device: Device, texture: Texture): void {
    generateMipmapsWebGPU(device as WebGPUDevice, texture);
  }
};
