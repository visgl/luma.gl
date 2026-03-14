// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Device, DeviceFeatures } from '@luma.gl/core';
import { NullDeviceInfo } from './null-device-info';
import { NullDeviceLimits } from './null-device-features';
import { NullCanvasContext } from './null-canvas-context';
import { NullBuffer } from './resources/null-buffer';
import { NullFramebuffer } from './resources/null-framebuffer';
import { NullShader } from './resources/null-shader';
import { NullCommandEncoder } from './resources/null-command-encoder';
import { NullSampler } from './resources/null-sampler';
import { NullTexture } from './resources/null-texture';
import { NullRenderPass } from './resources/null-render-pass';
import { NullRenderPipeline } from './resources/null-render-pipeline';
import { NullVertexArray } from './resources/null-vertex-array';
import { NullTransformFeedback } from './resources/null-transform-feedback';
import { NullQuerySet } from './resources/null-query-set';
import { NullFence } from './resources/null-fence';
/** Do-nothing device implementation for testing */
export class NullDevice extends Device {
    static isSupported() {
        return true;
    }
    type = 'null';
    handle = null;
    preferredColorFormat = 'rgba8unorm';
    preferredDepthFormat = 'depth24plus';
    features = new DeviceFeatures([], this.props._disabledFeatures);
    limits = new NullDeviceLimits();
    info = NullDeviceInfo;
    canvasContext;
    commandEncoder;
    lost;
    constructor(props) {
        super({ ...props, id: props.id || 'null-device' });
        const canvasContextProps = Device._getCanvasContextProps(props);
        this.canvasContext = new NullCanvasContext(this, canvasContextProps);
        this.lost = new Promise(resolve => { });
        this.commandEncoder = new NullCommandEncoder(this, { id: 'null-command-encoder' });
    }
    /**
     * Destroys the context
     * @note Has no effect for null contexts
     */
    destroy() { }
    get isLost() {
        return false;
    }
    // IMPLEMENTATION OF ABSTRACT DEVICE
    createCanvasContext(props) {
        return new NullCanvasContext(this, props);
    }
    createPresentationContext(_props) {
        throw new Error('PresentationContext is not supported on NullDevice');
    }
    createBuffer(props) {
        const newProps = this._normalizeBufferProps(props);
        return new NullBuffer(this, newProps);
    }
    getDefaultRenderPass() {
        return new NullRenderPass(this, {});
    }
    createTexture(props) {
        return new NullTexture(this, props);
    }
    createExternalTexture(props) {
        throw new Error('createExternalTexture() not implemented'); // return new Program(props);
    }
    createSampler(props) {
        return new NullSampler(this, props);
    }
    createShader(props) {
        return new NullShader(this, props);
    }
    createFramebuffer(props) {
        return new NullFramebuffer(this, props);
    }
    createVertexArray(props) {
        return new NullVertexArray(this, props);
    }
    createTransformFeedback(props) {
        return new NullTransformFeedback(this, props);
    }
    createQuerySet(props) {
        return new NullQuerySet(this, props);
    }
    createFence() {
        return new NullFence(this);
    }
    createRenderPipeline(props) {
        return new NullRenderPipeline(this, props);
    }
    createComputePipeline(props) {
        throw new Error('ComputePipeline not supported in WebGL');
    }
    createCommandEncoder(props = {}) {
        return new NullCommandEncoder(this, props);
    }
    submit() { }
    setParametersWebGL(parameters) { }
    getParametersWebGL(parameters) { }
    withParametersWebGL(parameters, func) {
        const { nocatch = true } = parameters;
        let value;
        if (nocatch) {
            // Avoid try catch to minimize stack size impact for safe execution paths
            return func();
        }
        // Wrap in a try-catch to ensure that parameters are restored on exceptions
        try {
            value = func();
        }
        catch {
            // ignore
        }
        return value;
    }
    _getDeviceSpecificTextureFormatCapabilities(format) {
        return format;
    }
}
