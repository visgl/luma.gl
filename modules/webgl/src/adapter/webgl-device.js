// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Device, log } from '@luma.gl/core';
import { WebGLStateTracker } from '../context/state-tracker/webgl-state-tracker';
import { createBrowserContext } from '../context/helpers/create-browser-context';
import { getWebGLContextData } from '../context/helpers/webgl-context-data';
import { getDeviceInfo } from './device-helpers/webgl-device-info';
import { WebGLDeviceFeatures } from './device-helpers/webgl-device-features';
import { WebGLDeviceLimits } from './device-helpers/webgl-device-limits';
import { WebGLCanvasContext } from './webgl-canvas-context';
import { WebGLPresentationContext } from './webgl-presentation-context';
import { initializeSpectorJS } from '../context/debug/spector';
import { makeDebugContext } from '../context/debug/webgl-developer-tools';
import { getTextureFormatCapabilitiesWebGL } from './converters/webgl-texture-table';
import { uid } from '../utils/uid';
import { WEBGLBuffer } from './resources/webgl-buffer';
import { WEBGLShader } from './resources/webgl-shader';
import { WEBGLSampler } from './resources/webgl-sampler';
import { WEBGLTexture } from './resources/webgl-texture';
import { WEBGLFramebuffer } from './resources/webgl-framebuffer';
import { WEBGLRenderPipeline } from './resources/webgl-render-pipeline';
import { WEBGLCommandEncoder } from './resources/webgl-command-encoder';
import { WEBGLVertexArray } from './resources/webgl-vertex-array';
import { WEBGLTransformFeedback } from './resources/webgl-transform-feedback';
import { WEBGLQuerySet } from './resources/webgl-query-set';
import { WEBGLFence } from './resources/webgl-fence';
import { readPixelsToArray, readPixelsToBuffer } from './helpers/webgl-texture-utils';
import { setGLParameters, getGLParameters, resetGLParameters } from '../context/parameters/unified-parameter-api';
import { withGLParameters } from '../context/state-tracker/with-parameters';
import { getWebGLExtension } from '../context/helpers/webgl-extensions';
/** WebGPU style Device API for a WebGL context */
export class WebGLDevice extends Device {
    static getDeviceFromContext(gl) {
        if (!gl) {
            return null;
        }
        // @ts-expect-error Ingore WebGL2RenderingContext type
        return gl.luma?.device ?? null;
    }
    // Public `Device` API
    /** type of this device */
    type = 'webgl';
    // Use the ! assertion to handle the case where _reuseDevices causes the constructor to return early
    /** The underlying WebGL context */
    handle;
    features;
    limits;
    info;
    canvasContext;
    preferredColorFormat = 'rgba8unorm';
    preferredDepthFormat = 'depth24plus';
    commandEncoder;
    lost;
    _resolveContextLost;
    /** WebGL2 context. */
    gl;
    /** Store constants */
    // @ts-ignore TODO fix
    _constants;
    /** State used by luma.gl classes - TODO - not used? */
    extensions;
    _polyfilled = false;
    /** Instance of Spector.js (if initialized) */
    spectorJS;
    //
    // Public API
    //
    get [Symbol.toStringTag]() {
        return 'WebGLDevice';
    }
    toString() {
        return `${this[Symbol.toStringTag]}(${this.id})`;
    }
    isVertexFormatSupported(format) {
        switch (format) {
            case 'unorm8x4-bgra':
                return false;
            default:
                return true;
        }
    }
    constructor(props) {
        super({ ...props, id: props.id || uid('webgl-device') });
        const canvasContextProps = Device._getCanvasContextProps(props);
        // WebGL requires a canvas to be created before creating the context
        if (!canvasContextProps) {
            throw new Error('WebGLDevice requires props.createCanvasContext to be set');
        }
        // Check if the WebGL context is already associated with a device
        // Note that this can be avoided in webgl2adapter.create() if
        // DeviceProps._reuseDevices is set.
        // @ts-expect-error device is attached to context
        const existingContext = canvasContextProps.canvas?.gl ?? null;
        let device = WebGLDevice.getDeviceFromContext(existingContext);
        if (device) {
            throw new Error(`WebGL context already attached to device ${device.id}`);
        }
        // Create and instrument context
        this.canvasContext = new WebGLCanvasContext(this, canvasContextProps);
        this.lost = new Promise(resolve => {
            this._resolveContextLost = resolve;
        });
        const webglContextAttributes = { ...props.webgl };
        // Copy props from CanvasContextProps
        if (canvasContextProps.alphaMode === 'premultiplied') {
            webglContextAttributes.premultipliedAlpha = true;
        }
        if (props.powerPreference !== undefined) {
            webglContextAttributes.powerPreference = props.powerPreference;
        }
        if (props.failIfMajorPerformanceCaveat !== undefined) {
            webglContextAttributes.failIfMajorPerformanceCaveat = props.failIfMajorPerformanceCaveat;
        }
        // Check if we should attach to an externally created context or create a new context
        const externalGLContext = this.props._handle;
        const gl = externalGLContext ||
            createBrowserContext(this.canvasContext.canvas, {
                onContextLost: (event) => this._resolveContextLost?.({
                    reason: 'destroyed',
                    message: 'Entered sleep mode, or too many apps or browser tabs are using the GPU.'
                }),
                // eslint-disable-next-line no-console
                onContextRestored: (event) => console.log('WebGL context restored')
            }, webglContextAttributes);
        if (!gl) {
            throw new Error('WebGL context creation failed');
        }
        // Note that the browser will only create one WebGL context per canvas.
        // This means that a newly created gl context may already have a device attached to it.
        device = WebGLDevice.getDeviceFromContext(gl);
        if (device) {
            if (props._reuseDevices) {
                log.log(1, `Not creating a new Device, instead returning a reference to Device ${device.id} already attached to WebGL context`, device)();
                // Destroy the orphaned canvas context that was created above (line 149)
                // to prevent its ResizeObserver from firing callbacks with undefined device
                this.canvasContext.destroy();
                device._reused = true;
                return device;
            }
            throw new Error(`WebGL context already attached to device ${device.id}`);
        }
        this.handle = gl;
        this.gl = gl;
        // Add spector debug instrumentation to context
        // We need to trust spector integration to decide if spector should be initialized
        // We also run spector instrumentation first, otherwise spector can clobber luma instrumentation.
        this.spectorJS = initializeSpectorJS({ ...this.props, gl: this.handle });
        // Instrument context
        const contextData = getWebGLContextData(this.handle);
        contextData.device = this; // Update GL context: Link webgl context back to device
        this.extensions = contextData.extensions || (contextData.extensions = {});
        // initialize luma Device fields
        this.info = getDeviceInfo(this.gl, this.extensions);
        this.limits = new WebGLDeviceLimits(this.gl);
        this.features = new WebGLDeviceFeatures(this.gl, this.extensions, this.props._disabledFeatures);
        if (this.props._initializeFeatures) {
            this.features.initializeFeatures();
        }
        // Install context state tracking
        const glState = new WebGLStateTracker(this.gl, {
            log: (...args) => log.log(1, ...args)()
        });
        glState.trackState(this.gl, { copyState: false });
        // props.debug - instrument the WebGL context with Khronos debug tools
        // props.debugWebGL - activate WebGL context tracing, force log level to at least 1
        if (props.debug || props.debugWebGL) {
            this.gl = makeDebugContext(this.gl, { debugWebGL: true, traceWebGL: props.debugWebGL });
            log.warn('WebGL debug mode activated. Performance reduced.')();
        }
        if (props.debugWebGL) {
            log.level = Math.max(log.level, 1);
        }
        this.commandEncoder = new WEBGLCommandEncoder(this, { id: `${this}-command-encoder` });
    }
    /**
     * Destroys the device
     *
     * @note "Detaches" from the WebGL context unless _reuseDevices is true.
     *
     * @note The underlying WebGL context is not immediately destroyed,
     * but may be destroyed later through normal JavaScript garbage collection.
     * This is a fundamental limitation since WebGL does not offer any
     * browser API for destroying WebGL contexts.
     */
    destroy() {
        // Note that deck.gl (especially in React strict mode) depends on being able
        // to asynchronously create a Device against the same canvas (i.e. WebGL context)
        // multiple times and getting the same device back. Since deck.gl is not aware
        // of this sharing, it might call destroy() multiple times on the same device.
        // Therefore we must do nothing in destroy() if props._reuseDevices is true
        if (!this.props._reuseDevices && !this._reused) {
            // Delete the reference to the device that we store on the WebGL context
            const contextData = getWebGLContextData(this.handle);
            contextData.device = null;
        }
    }
    get isLost() {
        return this.gl.isContextLost();
    }
    // IMPLEMENTATION OF ABSTRACT DEVICE
    createCanvasContext(props) {
        throw new Error('WebGL only supports a single canvas');
    }
    createPresentationContext(props) {
        return new WebGLPresentationContext(this, props || {});
    }
    createBuffer(props) {
        const newProps = this._normalizeBufferProps(props);
        return new WEBGLBuffer(this, newProps);
    }
    createTexture(props) {
        return new WEBGLTexture(this, props);
    }
    createExternalTexture(props) {
        throw new Error('createExternalTexture() not implemented'); // return new Program(props);
    }
    createSampler(props) {
        return new WEBGLSampler(this, props);
    }
    createShader(props) {
        return new WEBGLShader(this, props);
    }
    createFramebuffer(props) {
        return new WEBGLFramebuffer(this, props);
    }
    createVertexArray(props) {
        return new WEBGLVertexArray(this, props);
    }
    createTransformFeedback(props) {
        return new WEBGLTransformFeedback(this, props);
    }
    createQuerySet(props) {
        return new WEBGLQuerySet(this, props);
    }
    createFence() {
        return new WEBGLFence(this);
    }
    createRenderPipeline(props) {
        return new WEBGLRenderPipeline(this, props);
    }
    createComputePipeline(props) {
        throw new Error('ComputePipeline not supported in WebGL');
    }
    createCommandEncoder(props = {}) {
        return new WEBGLCommandEncoder(this, props);
    }
    /**
     * Offscreen Canvas Support: Commit the frame
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/commit
     * Chrome's offscreen canvas does not require gl.commit
     */
    submit(commandBuffer) {
        if (!commandBuffer) {
            commandBuffer = this.commandEncoder.finish();
            this.commandEncoder.destroy();
            this.commandEncoder = this.createCommandEncoder({ id: `${this.id}-default-encoder` });
        }
        commandBuffer._executeCommands();
    }
    //
    // TEMPORARY HACKS - will be removed in v9.1
    //
    /** @deprecated - should use command encoder */
    readPixelsToArrayWebGL(source, options) {
        return readPixelsToArray(source, options);
    }
    /** @deprecated - should use command encoder */
    readPixelsToBufferWebGL(source, options) {
        return readPixelsToBuffer(source, options);
    }
    setParametersWebGL(parameters) {
        setGLParameters(this.gl, parameters);
    }
    getParametersWebGL(parameters) {
        return getGLParameters(this.gl, parameters);
    }
    withParametersWebGL(parameters, func) {
        return withGLParameters(this.gl, parameters, func);
    }
    resetWebGL() {
        log.warn('WebGLDevice.resetWebGL is deprecated, use only for debugging')();
        resetGLParameters(this.gl);
    }
    _getDeviceSpecificTextureFormatCapabilities(capabilities) {
        return getTextureFormatCapabilitiesWebGL(this.gl, capabilities, this.extensions);
    }
    //
    // WebGL-only API (not part of `Device` API)
    //
    /**
     * Triggers device (or WebGL context) loss.
     * @note primarily intended for testing how application reacts to device loss
     */
    loseDevice() {
        let deviceLossTriggered = false;
        const extensions = this.getExtension('WEBGL_lose_context');
        const ext = extensions.WEBGL_lose_context;
        if (ext) {
            deviceLossTriggered = true;
            ext.loseContext();
            // ext.loseContext should trigger context loss callback but the platform may not do this, so do it explicitly
        }
        this._resolveContextLost?.({
            reason: 'destroyed',
            message: 'Application triggered context loss'
        });
        return deviceLossTriggered;
    }
    /** Save current WebGL context state onto an internal stack */
    pushState() {
        const webglState = WebGLStateTracker.get(this.gl);
        webglState.push();
    }
    /** Restores previously saved context state */
    popState() {
        const webglState = WebGLStateTracker.get(this.gl);
        webglState.pop();
    }
    /**
     * Returns the GL.<KEY> constant that corresponds to a numeric value of a GL constant
     * Be aware that there are some duplicates especially for constants that are 0,
     * so this isn't guaranteed to return the right key in all cases.
     */
    getGLKey(value, options) {
        const number = Number(value);
        for (const key in this.gl) {
            // @ts-ignore expect-error depends on settings
            if (this.gl[key] === number) {
                return `GL.${key}`;
            }
        }
        // No constant found. Stringify the value and return it.
        return options?.emptyIfUnknown ? '' : String(value);
    }
    /**
     * Returns a map with any GL.<KEY> constants mapped to strings, both for keys and values
     */
    getGLKeys(glParameters) {
        const opts = { emptyIfUnknown: true };
        return Object.entries(glParameters).reduce((keys, [key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            keys[`${key}:${this.getGLKey(key, opts)}`] = `${value}:${this.getGLKey(value, opts)}`;
            return keys;
        }, {});
    }
    /**
     * Set a constant value for a location. Disabled attributes at that location will read from this value
     * @note WebGL constants are stored globally on the WebGL context, not the VertexArray
     * so they need to be updated before every render
     * @todo - remember/cache values to avoid setting them unnecessarily?
     */
    setConstantAttributeWebGL(location, constant) {
        const maxVertexAttributes = this.limits.maxVertexAttributes;
        this._constants = this._constants || new Array(maxVertexAttributes).fill(null);
        const currentConstant = this._constants[location];
        if (currentConstant && compareConstantArrayValues(currentConstant, constant)) {
            log.info(1, `setConstantAttributeWebGL(${location}) could have been skipped, value unchanged`)();
        }
        this._constants[location] = constant;
        switch (constant.constructor) {
            case Float32Array:
                setConstantFloatArray(this, location, constant);
                break;
            case Int32Array:
                setConstantIntArray(this, location, constant);
                break;
            case Uint32Array:
                setConstantUintArray(this, location, constant);
                break;
            default:
                throw new Error('constant');
        }
    }
    /** Ensure extensions are only requested once */
    getExtension(name) {
        getWebGLExtension(this.gl, name, this.extensions);
        return this.extensions;
    }
    // INTERNAL SUPPORT METHODS FOR WEBGL RESOURCES
    /**
     * Storing data on a special field on WebGLObjects makes that data visible in SPECTOR chrome debug extension
     * luma.gl ids and props can be inspected
     */
    _setWebGLDebugMetadata(handle, resource, options) {
        // @ts-expect-error
        handle.luma = resource;
        const spectorMetadata = { props: options.spector, id: options.spector['id'] };
        // @ts-expect-error
        // eslint-disable-next-line camelcase
        handle.__SPECTOR_Metadata = spectorMetadata;
    }
}
/** Set constant float array attribute */
function setConstantFloatArray(device, location, array) {
    switch (array.length) {
        case 1:
            device.gl.vertexAttrib1fv(location, array);
            break;
        case 2:
            device.gl.vertexAttrib2fv(location, array);
            break;
        case 3:
            device.gl.vertexAttrib3fv(location, array);
            break;
        case 4:
            device.gl.vertexAttrib4fv(location, array);
            break;
        default:
        // assert(false);
    }
}
/** Set constant signed int array attribute */
function setConstantIntArray(device, location, array) {
    device.gl.vertexAttribI4iv(location, array);
    // TODO - not clear if we need to use the special forms, more testing needed
    // switch (array.length) {
    //   case 1:
    //     gl.vertexAttribI1iv(location, array);
    //     break;
    //   case 2:
    //     gl.vertexAttribI2iv(location, array);
    //     break;
    //   case 3:
    //     gl.vertexAttribI3iv(location, array);
    //     break;
    //   case 4:
    //     break;
    //   default:
    //     assert(false);
    // }
}
/** Set constant unsigned int array attribute */
function setConstantUintArray(device, location, array) {
    device.gl.vertexAttribI4uiv(location, array);
    // TODO - not clear if we need to use the special forms, more testing needed
    // switch (array.length) {
    //   case 1:
    //     gl.vertexAttribI1uiv(location, array);
    //     break;
    //   case 2:
    //     gl.vertexAttribI2uiv(location, array);
    //     break;
    //   case 3:
    //     gl.vertexAttribI3uiv(location, array);
    //     break;
    //   case 4:
    //     gl.vertexAttribI4uiv(location, array);
    //     break;
    //   default:
    //     assert(false);
    // }
}
/**
 * Compares contents of two typed arrays
 * @todo max length?
 */
function compareConstantArrayValues(v1, v2) {
    if (!v1 || !v2 || v1.length !== v2.length || v1.constructor !== v2.constructor) {
        return false;
    }
    for (let i = 0; i < v1.length; ++i) {
        if (v1[i] !== v2[i]) {
            return false;
        }
    }
    return true;
}
