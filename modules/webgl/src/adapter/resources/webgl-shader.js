// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Shader, log } from '@luma.gl/core';
import { GL } from '@luma.gl/constants';
import { parseShaderCompilerLog } from '../helpers/parse-shader-compiler-log';
/**
 * An immutable compiled shader program that execute portions of the GPU Pipeline
 */
export class WEBGLShader extends Shader {
    device;
    handle;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        switch (this.props.stage) {
            case 'vertex':
                this.handle = this.props.handle || this.device.gl.createShader(GL.VERTEX_SHADER);
                break;
            case 'fragment':
                this.handle = this.props.handle || this.device.gl.createShader(GL.FRAGMENT_SHADER);
                break;
            default:
                throw new Error(this.props.stage);
        }
        // default framebuffer handle is null, so we can't set spector metadata...
        device._setWebGLDebugMetadata(this.handle, this, { spector: this.props });
        this._compile(this.source);
    }
    destroy() {
        if (this.handle) {
            this.removeStats();
            this.device.gl.deleteShader(this.handle);
            this.destroyed = true;
            // @ts-expect-error
            this.handle.destroyed = true;
            // this.handle = null;
        }
    }
    get asyncCompilationStatus() {
        return this._waitForCompilationComplete().then(() => {
            this._getCompilationStatus();
            return this.compilationStatus;
        });
    }
    async getCompilationInfo() {
        await this._waitForCompilationComplete();
        return this.getCompilationInfoSync();
    }
    getCompilationInfoSync() {
        const shaderLog = this.device.gl.getShaderInfoLog(this.handle);
        return shaderLog ? parseShaderCompilerLog(shaderLog) : [];
    }
    getTranslatedSource() {
        const extensions = this.device.getExtension('WEBGL_debug_shaders');
        const ext = extensions.WEBGL_debug_shaders;
        return ext?.getTranslatedShaderSource(this.handle) || null;
    }
    // PRIVATE METHODS
    /** Compile a shader and get compilation status */
    async _compile(source) {
        source = source.startsWith('#version ') ? source : `#version 300 es\n${source}`;
        const { gl } = this.device;
        gl.shaderSource(this.handle, source);
        gl.compileShader(this.handle);
        // For performance reasons, avoid checking shader compilation errors on production
        if (!this.device.props.debug) {
            this.compilationStatus = 'pending';
            return;
        }
        // Sync case - slower, but advantage is that it throws in the constructor, making break on error more useful
        if (!this.device.features.has('compilation-status-async-webgl')) {
            this._getCompilationStatus();
            // The `Shader` base class will determine if debug window should be opened based on this.compilationStatus
            this.debugShader();
            if (this.compilationStatus === 'error') {
                throw new Error(`GLSL compilation errors in ${this.props.stage} shader ${this.props.id}`);
            }
            return;
        }
        // async case
        log.once(1, 'Shader compilation is asynchronous')();
        await this._waitForCompilationComplete();
        log.info(2, `Shader ${this.id} - async compilation complete: ${this.compilationStatus}`)();
        this._getCompilationStatus();
        // The `Shader` base class will determine if debug window should be opened based on this.compilationStatus
        this.debugShader();
    }
    /** Use KHR_parallel_shader_compile extension if available */
    async _waitForCompilationComplete() {
        const waitMs = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
        const DELAY_MS = 10; // Shader compilation is typically quite fast (with some exceptions)
        // If status polling is not available, we can't wait for completion. Just wait a little to minimize blocking
        if (!this.device.features.has('compilation-status-async-webgl')) {
            await waitMs(DELAY_MS);
            return;
        }
        const { gl } = this.device;
        for (;;) {
            const complete = gl.getShaderParameter(this.handle, GL.COMPLETION_STATUS_KHR);
            if (complete) {
                return;
            }
            await waitMs(DELAY_MS);
        }
    }
    /**
     * Get the shader compilation status
     * TODO - Load log even when no error reported, to catch warnings?
     * https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
     */
    _getCompilationStatus() {
        this.compilationStatus = this.device.gl.getShaderParameter(this.handle, GL.COMPILE_STATUS)
            ? 'success'
            : 'error';
    }
}
// TODO - Original code from luma.gl v8 - keep until new debug functionality has matured
// if (!compilationSuccess) {
//   const parsedLog = shaderLog ? parseShaderCompilerLog(shaderLog) : [];
//   const messages = parsedLog.filter(message => message.type === 'error');
//   const formattedLog = formatCompilerLog(messages, source, {showSourceCode: 'all', html: true});
//   const shaderDescription = `${this.stage} shader ${shaderName}`;
//   log.error(`GLSL compilation errors in ${shaderDescription}\n${formattedLog}`)();
//   displayShaderLog(parsedLog, source, shaderName);
// }
