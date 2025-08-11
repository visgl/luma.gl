// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// WEBGPU ADAPTER
export type {WebGPUAdapter} from './adapter/webgpu-adapter';
export {webgpuAdapter} from './adapter/webgpu-adapter';

// WEBGPU CLASSES (typically not accessed directly)
export {WebGPUDevice} from './adapter/webgpu-device';
export {WebGPUBuffer} from './adapter/resources/webgpu-buffer';
export {WebGPUTexture} from './adapter/resources/webgpu-texture';
export {WebGPUSampler} from './adapter/resources/webgpu-sampler';
export {WebGPUShader} from './adapter/resources/webgpu-shader';

export {getShaderLayoutFromWGSL} from './wgsl/get-shader-layout-wgsl';
