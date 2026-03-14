// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
// import { log } from '../../utils/log';
import { uid } from '../../utils/uid';
import { formatCompilerLog } from '../../adapter-utils/format-compiler-log';
/**
 * Immutable Shader object
 * In WebGPU the handle can be copied between threads
 */
export class Shader extends Resource {
    get [Symbol.toStringTag]() {
        return 'Shader';
    }
    /** The stage of this shader */
    stage;
    /** The source code of this shader */
    source;
    /** The compilation status of the shader. 'pending' if compilation is asynchronous, and on production */
    compilationStatus = 'pending';
    /** Create a new Shader instance */
    constructor(device, props) {
        props = { ...props, debugShaders: props.debugShaders || device.props.debugShaders || 'errors' };
        super(device, { id: getShaderIdFromProps(props), ...props }, Shader.defaultProps);
        this.stage = this.props.stage;
        this.source = this.props.source;
    }
    /** Get compiler log synchronously (WebGL only) */
    getCompilationInfoSync() {
        return null;
    }
    /** Get translated shader source in host platform's native language (HLSL, GLSL, and even GLSL ES), if available */
    getTranslatedSource() {
        return null;
    }
    // PORTABLE HELPERS
    /** In browser logging of errors */
    async debugShader() {
        const trigger = this.props.debugShaders;
        switch (trigger) {
            case 'never':
                return;
            case 'errors':
                // On WebGL - Don't extract the log unless errors
                if (this.compilationStatus === 'success') {
                    return;
                }
                break;
            case 'warnings':
            case 'always':
                break;
        }
        const messages = await this.getCompilationInfo();
        if (trigger === 'warnings' && messages?.length === 0) {
            return;
        }
        this._displayShaderLog(messages, this.id);
    }
    // PRIVATE
    /**
     * In-browser UI logging of errors
     * TODO - this HTML formatting code should not be in Device, should be pluggable
     */
    _displayShaderLog(messages, shaderId) {
        // Return if under Node.js / incomplete `document` polyfills
        if (typeof document === 'undefined' || !document?.createElement) {
            return;
        }
        const shaderName = shaderId; // getShaderName(this.source) || ;
        const shaderTitle = `${this.stage} shader "${shaderName}"`;
        const htmlLog = formatCompilerLog(messages, this.source, { showSourceCode: 'all', html: true });
        // Show translated source if available
        const translatedSource = this.getTranslatedSource();
        const container = document.createElement('div');
        container.innerHTML = `\
<h1>Compilation error in ${shaderTitle}</h1>
<div style="display:flex;position:fixed;top:10px;right:20px;gap:2px;">
<button id="copy">Copy source</button><br/>
<button id="close">Close</button>
</div>
<code><pre>${htmlLog}</pre></code>`;
        if (translatedSource) {
            container.innerHTML += `<br /><h1>Translated Source</h1><br /><br /><code><pre>${translatedSource}</pre></code>`;
        }
        container.style.top = '0';
        container.style.left = '0';
        container.style.background = 'white';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        container.style.maxWidth = '100vw';
        container.style.maxHeight = '100vh';
        container.style.overflowY = 'auto';
        document.body.appendChild(container);
        const error = container.querySelector('.luma-compiler-log-error');
        error?.scrollIntoView();
        container.querySelector('button#close').onclick = () => {
            container.remove();
        };
        container.querySelector('button#copy').onclick = () => {
            navigator.clipboard.writeText(this.source);
        };
    }
    static defaultProps = {
        ...Resource.defaultProps,
        language: 'auto',
        stage: undefined,
        source: '',
        sourceMap: null,
        entryPoint: 'main',
        debugShaders: undefined
    };
}
// HELPERS
/** Deduce an id, from shader source, or supplied id, or shader type */
function getShaderIdFromProps(props) {
    return getShaderName(props.source) || props.id || uid(`unnamed ${props.stage}-shader`);
}
/** Extracts GLSLIFY style naming of shaders: `#define SHADER_NAME ...` */
function getShaderName(shader, defaultName = 'unnamed') {
    const SHADER_NAME_REGEXP = /#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/;
    const match = SHADER_NAME_REGEXP.exec(shader);
    return match?.[1] ?? defaultName;
}
