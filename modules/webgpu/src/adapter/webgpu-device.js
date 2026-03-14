// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Device, DeviceFeatures } from '@luma.gl/core';
import { WebGPUBuffer } from './resources/webgpu-buffer';
import { WebGPUTexture } from './resources/webgpu-texture';
import { WebGPUExternalTexture } from './resources/webgpu-external-texture';
import { WebGPUSampler } from './resources/webgpu-sampler';
import { WebGPUShader } from './resources/webgpu-shader';
import { WebGPURenderPipeline } from './resources/webgpu-render-pipeline';
import { WebGPUFramebuffer } from './resources/webgpu-framebuffer';
import { WebGPUComputePipeline } from './resources/webgpu-compute-pipeline';
import { WebGPUVertexArray } from './resources/webgpu-vertex-array';
import { WebGPUCanvasContext } from './webgpu-canvas-context';
import { WebGPUPresentationContext } from './webgpu-presentation-context';
import { WebGPUCommandEncoder } from './resources/webgpu-command-encoder';
import { WebGPUQuerySet } from './resources/webgpu-query-set';
import { WebGPUPipelineLayout } from './resources/webgpu-pipeline-layout';
import { WebGPUFence } from './resources/webgpu-fence';
import { getShaderLayoutFromWGSL } from '../wgsl/get-shader-layout-wgsl';
/** WebGPU Device implementation */
export class WebGPUDevice extends Device {
    /** The underlying WebGPU device */
    handle;
    /* The underlying WebGPU adapter */
    adapter;
    /* The underlying WebGPU adapter's info */
    adapterInfo;
    /** type of this device */
    type = 'webgpu';
    preferredColorFormat = navigator.gpu.getPreferredCanvasFormat();
    preferredDepthFormat = 'depth24plus';
    features;
    info;
    limits;
    lost;
    canvasContext = null;
    _isLost = false;
    commandEncoder;
    get [Symbol.toStringTag]() {
        return 'WebGPUDevice';
    }
    toString() {
        return `WebGPUDevice(${this.id})`;
    }
    constructor(props, device, adapter, adapterInfo) {
        super({ ...props, id: props.id || 'webgpu-device' });
        this.handle = device;
        this.adapter = adapter;
        this.adapterInfo = adapterInfo;
        this.info = this._getInfo();
        this.features = this._getFeatures();
        this.limits = this.handle.limits;
        // Listen for uncaptured WebGPU errors
        device.addEventListener('uncapturederror', (event) => {
            event.preventDefault();
            // TODO is this the right way to make sure the error is an Error instance?
            const errorMessage = event instanceof GPUUncapturedErrorEvent ? event.error.message : 'Unknown WebGPU error';
            this.reportError(new Error(errorMessage), this)();
            this.debug();
        });
        // "Context" loss handling
        this.lost = new Promise(async (resolve) => {
            const lostInfo = await this.handle.lost;
            this._isLost = true;
            resolve({ reason: 'destroyed', message: lostInfo.message });
        });
        // Note: WebGPU devices can be created without a canvas, for compute shader purposes
        const canvasContextProps = Device._getCanvasContextProps(props);
        if (canvasContextProps) {
            this.canvasContext = new WebGPUCanvasContext(this, this.adapter, canvasContextProps);
        }
        this.commandEncoder = this.createCommandEncoder({});
    }
    // TODO
    // Load the glslang module now so that it is available synchronously when compiling shaders
    // const {glsl = true} = props;
    // this.glslang = glsl && await loadGlslangModule();
    destroy() {
        this.handle.destroy();
    }
    get isLost() {
        return this._isLost;
    }
    getShaderLayout(source) {
        return getShaderLayoutFromWGSL(source);
    }
    isVertexFormatSupported(format) {
        const info = this.getVertexFormatInfo(format);
        return !info.webglOnly;
    }
    createBuffer(props) {
        const newProps = this._normalizeBufferProps(props);
        return new WebGPUBuffer(this, newProps);
    }
    createTexture(props) {
        return new WebGPUTexture(this, props);
    }
    createExternalTexture(props) {
        return new WebGPUExternalTexture(this, props);
    }
    createShader(props) {
        return new WebGPUShader(this, props);
    }
    createSampler(props) {
        return new WebGPUSampler(this, props);
    }
    createRenderPipeline(props) {
        return new WebGPURenderPipeline(this, props);
    }
    createFramebuffer(props) {
        return new WebGPUFramebuffer(this, props);
    }
    createComputePipeline(props) {
        return new WebGPUComputePipeline(this, props);
    }
    createVertexArray(props) {
        return new WebGPUVertexArray(this, props);
    }
    createCommandEncoder(props) {
        return new WebGPUCommandEncoder(this, props);
    }
    // WebGPU specifics
    createTransformFeedback(props) {
        throw new Error('Transform feedback not supported in WebGPU');
    }
    createQuerySet(props) {
        return new WebGPUQuerySet(this, props);
    }
    createFence() {
        return new WebGPUFence(this);
    }
    createCanvasContext(props) {
        return new WebGPUCanvasContext(this, this.adapter, props);
    }
    createPresentationContext(props) {
        return new WebGPUPresentationContext(this, props);
    }
    createPipelineLayout(props) {
        return new WebGPUPipelineLayout(this, props);
    }
    submit(commandBuffer) {
        if (!commandBuffer) {
            commandBuffer = this.commandEncoder.finish();
            this.commandEncoder.destroy();
            this.commandEncoder = this.createCommandEncoder({ id: `${this.id}-default-encoder` });
        }
        this.pushErrorScope('validation');
        this.handle.queue.submit([commandBuffer.handle]);
        this.popErrorScope((error) => {
            this.reportError(new Error(`${this} command submission: ${error.message}`), this)();
            this.debug();
        });
    }
    // WebGPU specific
    pushErrorScope(scope) {
        this.handle.pushErrorScope(scope);
    }
    popErrorScope(handler) {
        this.handle.popErrorScope().then((error) => {
            if (error) {
                handler(error);
            }
        });
    }
    // PRIVATE METHODS
    _getInfo() {
        const [driver, driverVersion] = (this.adapterInfo.driver || '').split(' Version ');
        // See https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates
        const vendor = this.adapterInfo.vendor || this.adapter.__brand || 'unknown';
        const renderer = driver || '';
        const version = driverVersion || '';
        const gpu = vendor === 'apple' ? 'apple' : 'unknown'; // 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown',
        const gpuArchitecture = this.adapterInfo.architecture || 'unknown';
        const gpuBackend = this.adapterInfo.backend || 'unknown';
        const gpuType = (this.adapterInfo.type || '').split(' ')[0].toLowerCase() || 'unknown';
        return {
            type: 'webgpu',
            vendor,
            renderer,
            version,
            gpu,
            gpuType,
            gpuBackend,
            gpuArchitecture,
            shadingLanguage: 'wgsl',
            shadingLanguageVersion: 100
        };
    }
    _getFeatures() {
        // Initialize with actual WebGPU Features (note that unknown features may not be in DeviceFeature type)
        const features = new Set(this.handle.features);
        // Fixups for pre-standard names: https://github.com/webgpu-native/webgpu-headers/issues/133
        // @ts-expect-error Chrome Canary v99
        if (features.has('depth-clamping')) {
            // @ts-expect-error Chrome Canary v99
            features.delete('depth-clamping');
            features.add('depth-clip-control');
        }
        // Some subsets of WebGPU extensions correspond to WebGL extensions
        if (features.has('texture-compression-bc')) {
            features.add('texture-compression-bc5-webgl');
        }
        if (this.handle.features.has('chromium-experimental-norm16-texture-formats')) {
            features.add('norm16-renderable-webgl');
        }
        if (this.handle.features.has('chromium-experimental-snorm16-texture-formats')) {
            features.add('snorm16-renderable-webgl');
        }
        const WEBGPU_ALWAYS_FEATURES = [
            'timer-query-webgl',
            'compilation-status-async-webgl',
            'float32-renderable-webgl',
            'float16-renderable-webgl',
            'norm16-renderable-webgl',
            'texture-filterable-anisotropic-webgl',
            'shader-noperspective-interpolation-webgl'
        ];
        for (const feature of WEBGPU_ALWAYS_FEATURES) {
            features.add(feature);
        }
        return new DeviceFeatures(Array.from(features), this.props._disabledFeatures);
    }
    _getDeviceSpecificTextureFormatCapabilities(capabilities) {
        const { format } = capabilities;
        if (format.includes('webgl')) {
            return { format, create: false, render: false, filter: false, blend: false, store: false };
        }
        return capabilities;
    }
}
