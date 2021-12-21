
// Initialize any global state
import '@luma.gl/api';
import './init'

// WEBGPU ADAPTER
export {default as WebGPUDevice} from './adapter/webgpu-device';

// WEBGPU CLASSES (typically not accessed directly)
export {default as WebGPUBuffer} from './adapter/resources/webgpu-buffer';
export {default as WebGPUTexture} from './adapter/resources/webgpu-texture';
export {default as WebGPUSampler} from './adapter/resources/webgpu-sampler';
export {default as WebGPUShader} from './adapter/resources/webgpu-shader';

// WEBGPU ENGINE CLASSES (until we can make the engine module truly platform independent)
export type {ModelProps} from './engine/webgpu-model';
export {default as Model} from './engine/webgpu-model';
