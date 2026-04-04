// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';
import {log} from '../../utils/log';
import {uid} from '../../utils/uid';
import {CompilerMessage} from '../types/compiler-message';
import {formatCompilerLog} from '../../adapter-utils/format-compiler-log';

/**
 * Properties for a Shader
 */
export type ShaderProps = ResourceProps & {
  /** Shader language (defaults to auto) */
  language?: 'glsl' | 'wgsl' | 'auto';
  /** Which stage are we compiling? Required for GLSL. Ignored for WGSL. */
  stage?: 'vertex' | 'fragment' | 'compute';
  /** Shader source code */
  source: string;
  /** Optional shader source map (WebGPU only) */
  sourceMap?: string | null;
  /** Optional shader entry point (WebGPU only) */
  entryPoint?: string;
  /** Show shader source in browser? Overrides the device.props.debugShaders setting */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';
};

/**
 * Immutable Shader object
 * In WebGPU the handle can be copied between threads
 */
export abstract class Shader extends Resource<ShaderProps> {
  override get [Symbol.toStringTag](): string {
    return 'Shader';
  }

  /** The stage of this shader */
  readonly stage: 'vertex' | 'fragment' | 'compute';
  /** The source code of this shader */
  readonly source: string;
  /** The compilation status of the shader. 'pending' if compilation is asynchronous, and on production */
  compilationStatus: 'pending' | 'success' | 'error' = 'pending';

  /** Create a new Shader instance */
  constructor(device: Device, props: ShaderProps) {
    props = {...props, debugShaders: props.debugShaders || device.props.debugShaders || 'errors'};
    super(device, {id: getShaderIdFromProps(props), ...props}, Shader.defaultProps);
    this.stage = this.props.stage;
    this.source = this.props.source;
  }

  abstract get asyncCompilationStatus(): Promise<'pending' | 'success' | 'error'>;

  /** Get compiler log asynchronously */
  abstract getCompilationInfo(): Promise<readonly CompilerMessage[]>;

  /** Get compiler log synchronously (WebGL only) */
  getCompilationInfoSync(): readonly CompilerMessage[] | null {
    return null;
  }

  /** Get translated shader source in host platform's native language (HLSL, GLSL, and even GLSL ES), if available */
  getTranslatedSource(): string | null {
    return null;
  }

  // PORTABLE HELPERS

  /** In browser logging of errors */
  async debugShader(): Promise<void> {
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

    try {
      const messages = await this.getCompilationInfo();
      if (trigger === 'warnings' && messages?.length === 0) {
        return;
      }
      this._displayShaderLog(messages, this.id);
    } catch (error) {
      log.warn(`Shader ${this.id}: failed to fetch compilation info during debug logging`, error)();
    }
  }

  // PRIVATE

  /**
   * In-browser UI logging of errors
   * TODO - this HTML formatting code should not be in Device, should be pluggable
   */
  protected _displayShaderLog(messages: readonly CompilerMessage[], shaderId: string): void {
    // Return if under Node.js / incomplete `document` polyfills
    if (typeof document === 'undefined' || !document?.createElement) {
      return;
    }

    const shaderName: string = shaderId; // getShaderName(this.source) || ;
    const shaderTitle: string = `${this.stage} shader "${shaderName}"`;
    const htmlLog = formatCompilerLog(messages, this.source, {showSourceCode: 'all', html: true});
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
    (container.querySelector('button#close') as HTMLButtonElement).onclick = () => {
      container.remove();
    };
    (container.querySelector('button#copy') as HTMLButtonElement).onclick = () => {
      navigator.clipboard.writeText(this.source);
    };
  }

  static override defaultProps: Required<ShaderProps> = {
    ...Resource.defaultProps,
    language: 'auto',
    stage: undefined!,
    source: '',
    sourceMap: null,
    entryPoint: 'main',
    debugShaders: undefined!
  };
}

// HELPERS

/** Deduce an id, from shader source, or supplied id, or shader type */
function getShaderIdFromProps(props: ShaderProps): string {
  return getShaderName(props.source) || props.id || uid(`unnamed ${props.stage}-shader`);
}

/** Extracts GLSLIFY style naming of shaders: `#define SHADER_NAME ...` */
function getShaderName(shader: string, defaultName: string = 'unnamed'): string {
  const SHADER_NAME_REGEXP = /#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/;
  const match = SHADER_NAME_REGEXP.exec(shader);
  return match?.[1] ?? defaultName;
}
