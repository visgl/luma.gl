// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Device } from './device';
import { lumaStats } from '../utils/stats-manager';
import { log } from '../utils/log';
const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';
const ERROR_MESSAGE = 'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.';
/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export class Luma {
    static defaultProps = {
        ...Device.defaultProps,
        type: 'best-available',
        adapters: undefined,
        waitForPageLoad: true
    };
    /** Global stats for all devices */
    stats = lumaStats;
    /**
     * Global log
     *
     * Assign luma.log.level in console to control logging: \
     * 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
     * luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;
     */
    log = log;
    /** Version of luma.gl */
    VERSION = 
    // Version detection using build plugin
    // @ts-expect-error no-undef
    typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'running from source';
    spector;
    preregisteredAdapters = new Map();
    constructor() {
        if (globalThis.luma) {
            if (globalThis.luma.VERSION !== this.VERSION) {
                log.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)();
                log.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)();
                throw new Error(`luma.gl - multiple versions detected: see console log`);
            }
            log.error('This version of luma.gl has already been initialized')();
        }
        log.log(1, `${this.VERSION} - ${STARTUP_MESSAGE}`)();
        globalThis.luma = this;
    }
    /** Creates a device. Asynchronously. */
    async createDevice(props_ = {}) {
        const props = { ...Luma.defaultProps, ...props_ };
        const adapter = this.selectAdapter(props.type, props.adapters);
        if (!adapter) {
            throw new Error(ERROR_MESSAGE);
        }
        // Wait for page to load so that CanvasContext's can access the DOM.
        if (props.waitForPageLoad) {
            await adapter.pageLoaded;
        }
        return await adapter.create(props);
    }
    /**
     * Attach to an existing GPU API handle (WebGL2RenderingContext or GPUDevice).
     * @param handle Externally created WebGL context or WebGPU device
     */
    async attachDevice(handle, props) {
        const type = this._getTypeFromHandle(handle, props.adapters);
        const adapter = type && this.selectAdapter(type, props.adapters);
        if (!adapter) {
            throw new Error(ERROR_MESSAGE);
        }
        return await adapter?.attach?.(handle, props);
    }
    /**
     * Global adapter registration.
     * @deprecated Use props.adapters instead
     */
    registerAdapters(adapters) {
        for (const deviceClass of adapters) {
            this.preregisteredAdapters.set(deviceClass.type, deviceClass);
        }
    }
    /** Get type strings for supported Devices */
    getSupportedAdapters(adapters = []) {
        const adapterMap = this._getAdapterMap(adapters);
        return Array.from(adapterMap)
            .map(([, adapter]) => adapter)
            .filter(adapter => adapter.isSupported?.())
            .map(adapter => adapter.type);
    }
    /** Get type strings for best available Device */
    getBestAvailableAdapterType(adapters = []) {
        const KNOWN_ADAPTERS = ['webgpu', 'webgl', 'null'];
        const adapterMap = this._getAdapterMap(adapters);
        for (const type of KNOWN_ADAPTERS) {
            if (adapterMap.get(type)?.isSupported?.()) {
                return type;
            }
        }
        return null;
    }
    /** Select adapter of type from registered adapters */
    selectAdapter(type, adapters = []) {
        let selectedType = type;
        if (type === 'best-available') {
            selectedType = this.getBestAvailableAdapterType(adapters);
        }
        const adapterMap = this._getAdapterMap(adapters);
        return (selectedType && adapterMap.get(selectedType)) || null;
    }
    /**
     * Override `HTMLCanvasContext.getCanvas()` to always create WebGL2 contexts with additional WebGL1 compatibility.
     * Useful when attaching luma to a context from an external library does not support creating WebGL2 contexts.
     */
    enforceWebGL2(enforce = true, adapters = []) {
        const adapterMap = this._getAdapterMap(adapters);
        const webgl2Adapter = adapterMap.get('webgl');
        if (!webgl2Adapter) {
            log.warn('enforceWebGL2: webgl adapter not found')();
        }
        webgl2Adapter?.enforceWebGL2?.(enforce);
    }
    // DEPRECATED
    /** @deprecated */
    setDefaultDeviceProps(props) {
        Object.assign(Luma.defaultProps, props);
    }
    // HELPERS
    /** Convert a list of adapters to a map */
    _getAdapterMap(adapters = []) {
        const map = new Map(this.preregisteredAdapters);
        for (const adapter of adapters) {
            map.set(adapter.type, adapter);
        }
        return map;
    }
    /** Get type of a handle (for attachDevice) */
    _getTypeFromHandle(handle, adapters = []) {
        // TODO - delegate handle identification to adapters
        // WebGL
        if (handle instanceof WebGL2RenderingContext) {
            return 'webgl';
        }
        if (typeof GPUDevice !== 'undefined' && handle instanceof GPUDevice) {
            return 'webgpu';
        }
        // TODO - WebGPU does not yet seem to have a stable in-browser API, so we "sniff" for members instead
        if (handle?.queue) {
            return 'webgpu';
        }
        // null
        if (handle === null) {
            return 'null';
        }
        if (handle instanceof WebGLRenderingContext) {
            log.warn('WebGL1 is not supported', handle)();
        }
        else {
            log.warn('Unknown handle type', handle)();
        }
        return null;
    }
}
/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export const luma = new Luma();
