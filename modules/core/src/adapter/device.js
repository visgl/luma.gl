// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { lumaStats } from '../utils/stats-manager';
import { log } from '../utils/log';
import { uid } from '../utils/uid';
import { Buffer } from './resources/buffer';
import { getVertexFormatInfo } from '../shadertypes/vertex-arrays/decode-vertex-format';
import { textureFormatDecoder } from '../shadertypes/textures/texture-format-decoder';
import { getTextureFormatTable } from '../shadertypes/textures/texture-format-table';
import { isExternalImage, getExternalImageSize } from '../image-utils/image-types';
/** Limits for a device (max supported sizes of resources, max number of bindings etc) */
export class DeviceLimits {
}
/** Set-like class for features (lets apps check for WebGL / WebGPU extensions) */
export class DeviceFeatures {
    features;
    disabledFeatures;
    constructor(features = [], disabledFeatures) {
        this.features = new Set(features);
        this.disabledFeatures = disabledFeatures || {};
    }
    *[Symbol.iterator]() {
        yield* this.features;
    }
    has(feature) {
        return !this.disabledFeatures?.[feature] && this.features.has(feature);
    }
}
/**
 * WebGPU Device/WebGL context abstraction
 */
export class Device {
    static defaultProps = {
        id: null,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        createCanvasContext: undefined,
        // WebGL specific
        webgl: {},
        // Callbacks
        // eslint-disable-next-line handle-callback-err
        onError: (error, context) => { },
        onResize: (context, info) => {
            const [width, height] = context.getDevicePixelSize();
            log.log(1, `${context} resized => ${width}x${height}px`)();
        },
        onPositionChange: (context, info) => {
            const [left, top] = context.getPosition();
            log.log(1, `${context} repositioned => ${left},${top}`)();
        },
        onVisibilityChange: (context) => log.log(1, `${context} Visibility changed ${context.isVisible}`)(),
        onDevicePixelRatioChange: (context, info) => log.log(1, `${context} DPR changed ${info.oldRatio} => ${context.devicePixelRatio}`)(),
        // Debug flags
        debug: log.get('debug') || undefined,
        debugShaders: log.get('debug-shaders') || undefined,
        debugFramebuffers: Boolean(log.get('debug-framebuffers')),
        debugFactories: Boolean(log.get('debug-factories')),
        debugWebGL: Boolean(log.get('debug-webgl')),
        debugSpectorJS: undefined, // Note: log setting is queried by the spector.js code
        debugSpectorJSUrl: undefined,
        // Experimental
        _reuseDevices: false,
        _requestMaxLimits: true,
        _cacheShaders: false,
        _cachePipelines: false,
        _cacheDestroyPolicy: 'unused',
        // TODO - Change these after confirming things work as expected
        _initializeFeatures: true,
        _disabledFeatures: {
            'compilation-status-async-webgl': true
        },
        // INTERNAL
        _handle: undefined
    };
    get [Symbol.toStringTag]() {
        return 'Device';
    }
    toString() {
        return `Device(${this.id})`;
    }
    /** id of this device, primarily for debugging */
    id;
    /** A copy of the device props  */
    props;
    /** Available for the application to store data on the device */
    userData = {};
    /** stats */
    statsManager = lumaStats;
    /** An abstract timestamp used for change tracking */
    timestamp = 0;
    /** True if this device has been reused during device creation (app has multiple references) */
    _reused = false;
    /** Used by other luma.gl modules to store data on the device */
    _moduleData = {};
    _textureCaps = {};
    constructor(props) {
        this.props = { ...Device.defaultProps, ...props };
        this.id = this.props.id || uid(this[Symbol.toStringTag].toLowerCase());
    }
    getVertexFormatInfo(format) {
        return getVertexFormatInfo(format);
    }
    isVertexFormatSupported(format) {
        return true;
    }
    /** Returns information about a texture format, such as data type, channels, bits per channel, compression etc */
    getTextureFormatInfo(format) {
        return textureFormatDecoder.getInfo(format);
    }
    /** Determines what operations are supported on a texture format on this particular device (checks against supported device features) */
    getTextureFormatCapabilities(format) {
        let textureCaps = this._textureCaps[format];
        if (!textureCaps) {
            const capabilities = this._getDeviceTextureFormatCapabilities(format);
            textureCaps = this._getDeviceSpecificTextureFormatCapabilities(capabilities);
            this._textureCaps[format] = textureCaps;
        }
        return textureCaps;
    }
    /** Calculates the number of mip levels for a texture of width, height and in case of 3d textures only, depth */
    getMipLevelCount(width, height, depth3d = 1) {
        const maxSize = Math.max(width, height, depth3d);
        return 1 + Math.floor(Math.log2(maxSize));
    }
    /** Check if data is an external image */
    isExternalImage(data) {
        return isExternalImage(data);
    }
    /** Get the size of an external image */
    getExternalImageSize(data) {
        return getExternalImageSize(data);
    }
    /** Check if device supports a specific texture format (creation and `nearest` sampling) */
    isTextureFormatSupported(format) {
        return this.getTextureFormatCapabilities(format).create;
    }
    /** Check if linear filtering (sampler interpolation) is supported for a specific texture format */
    isTextureFormatFilterable(format) {
        return this.getTextureFormatCapabilities(format).filter;
    }
    /** Check if device supports rendering to a framebuffer color attachment of a specific texture format */
    isTextureFormatRenderable(format) {
        return this.getTextureFormatCapabilities(format).render;
    }
    /** Check if a specific texture format is GPU compressed */
    isTextureFormatCompressed(format) {
        return textureFormatDecoder.isCompressed(format);
    }
    /** Returns the compressed texture formats that can be created and sampled on this device */
    getSupportedCompressedTextureFormats() {
        const supportedFormats = [];
        for (const format of Object.keys(getTextureFormatTable())) {
            if (this.isTextureFormatCompressed(format) && this.isTextureFormatSupported(format)) {
                supportedFormats.push(format);
            }
        }
        return supportedFormats;
    }
    // DEBUG METHODS
    pushDebugGroup(groupLabel) {
        this.commandEncoder.pushDebugGroup(groupLabel);
    }
    popDebugGroup() {
        this.commandEncoder?.popDebugGroup();
    }
    insertDebugMarker(markerLabel) {
        this.commandEncoder?.insertDebugMarker(markerLabel);
    }
    /**
     * Trigger device loss.
     * @returns `true` if context loss could actually be triggered.
     * @note primarily intended for testing how application reacts to device loss
     */
    loseDevice() {
        return false;
    }
    /** A monotonic counter for tracking buffer and texture updates */
    incrementTimestamp() {
        return this.timestamp++;
    }
    /**
     * Reports Device errors in a way that optimizes for developer experience / debugging.
     * - Logs so that the console error links directly to the source code that generated the error.
     * - Includes the object that reported the error in the log message, even if the error is asynchronous.
     *
     * Conventions when calling reportError():
     * - Always call the returned function - to ensure error is logged, at the error site
     * - Follow with a call to device.debug() - to ensure that the debugger breaks at the error site
     *
     * @param error - the error to report. If needed, just create a new Error object with the appropriate message.
     * @param context - pass `this` as context, otherwise it may not be available in the debugger for async errors.
     * @returns the logger function returned by device.props.onError() so that it can be called from the error site.
     *
     * @example
     *   device.reportError(new Error(...), this)();
     *   device.debug();
     */
    reportError(error, context, ...args) {
        // Call the error handler
        const isHandled = this.props.onError(error, context);
        if (!isHandled) {
            // Note: Returns a function that must be called: `device.reportError(...)()`
            return log.error(this.type === 'webgl' ? '%cWebGL' : '%cWebGPU', 'color: white; background: red; padding: 2px 6px; border-radius: 3px;', error.message, context, ...args);
        }
        return () => { };
    }
    /** Break in the debugger - if device.props.debug is true */
    debug() {
        if (this.props.debug) {
            // @ts-ignore
            debugger; // eslint-disable-line
        }
        else {
            // TODO(ibgreen): Does not appear to be printed in the console
            const message = `\
'Type luma.log.set({debug: true}) in console to enable debug breakpoints',
or create a device with the 'debug: true' prop.`;
            log.once(0, message)();
        }
    }
    /** Returns the default / primary canvas context. Throws an error if no canvas context is available (a WebGPU compute device) */
    getDefaultCanvasContext() {
        if (!this.canvasContext) {
            throw new Error('Device has no default CanvasContext. See props.createCanvasContext');
        }
        return this.canvasContext;
    }
    /** Create a fence sync object */
    createFence() {
        throw new Error('createFence() not implemented');
    }
    /** Create a RenderPass using the default CommandEncoder */
    beginRenderPass(props) {
        return this.commandEncoder.beginRenderPass(props);
    }
    /** Create a ComputePass using the default CommandEncoder*/
    beginComputePass(props) {
        return this.commandEncoder.beginComputePass(props);
    }
    // DEPRECATED METHODS
    /** @deprecated Use getDefaultCanvasContext() */
    getCanvasContext() {
        return this.getDefaultCanvasContext();
    }
    // WebGL specific HACKS - enables app to remove webgl import
    // Use until we have a better way to handle these
    /** @deprecated - will be removed - should use command encoder */
    readPixelsToArrayWebGL(source, options) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use command encoder */
    readPixelsToBufferWebGL(source, options) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
    setParametersWebGL(parameters) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
    getParametersWebGL(parameters) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
    withParametersWebGL(parameters, func) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use clear arguments in RenderPass */
    clearWebGL(options) {
        throw new Error('not implemented');
    }
    /** @deprecated - will be removed - should use for debugging only */
    resetWebGL() {
        throw new Error('not implemented');
    }
    // INTERNAL LUMA.GL METHODS
    getModuleData(moduleName) {
        this._moduleData[moduleName] ||= {};
        return this._moduleData[moduleName];
    }
    // INTERNAL HELPERS
    // IMPLEMENTATION
    /** Helper to get the canvas context props */
    static _getCanvasContextProps(props) {
        return props.createCanvasContext === true ? {} : props.createCanvasContext;
    }
    _getDeviceTextureFormatCapabilities(format) {
        const genericCapabilities = textureFormatDecoder.getCapabilities(format);
        // Check standard features
        const checkFeature = (feature) => (typeof feature === 'string' ? this.features.has(feature) : feature) ?? true;
        const supported = checkFeature(genericCapabilities.create);
        return {
            format,
            create: supported,
            render: supported && checkFeature(genericCapabilities.render),
            filter: supported && checkFeature(genericCapabilities.filter),
            blend: supported && checkFeature(genericCapabilities.blend),
            store: supported && checkFeature(genericCapabilities.store)
        };
    }
    /** Subclasses use this to support .createBuffer() overloads */
    _normalizeBufferProps(props) {
        if (props instanceof ArrayBuffer || ArrayBuffer.isView(props)) {
            props = { data: props };
        }
        // TODO(ibgreen) - fragile, as this is done before we merge with default options
        // inside the Buffer constructor
        const newProps = { ...props };
        // Deduce indexType
        const usage = props.usage || 0;
        if (usage & Buffer.INDEX) {
            if (!props.indexType) {
                if (props.data instanceof Uint32Array) {
                    newProps.indexType = 'uint32';
                }
                else if (props.data instanceof Uint16Array) {
                    newProps.indexType = 'uint16';
                }
                else if (props.data instanceof Uint8Array) {
                    // Convert uint8 to uint16 for WebGPU compatibility (WebGPU doesn't support uint8 indices)
                    newProps.data = new Uint16Array(props.data);
                    newProps.indexType = 'uint16';
                }
            }
            if (!newProps.indexType) {
                throw new Error('indices buffer content must be of type uint16 or uint32');
            }
        }
        return newProps;
    }
}
