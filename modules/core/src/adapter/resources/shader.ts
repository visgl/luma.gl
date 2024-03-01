// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';
// import { log } from '../../utils/log';
import {uid} from '../../utils/utils';
import {CompilerMessage} from '../../lib/compiler-log/compiler-message';
import {formatCompilerLog} from '../../lib/compiler-log/format-compiler-log';
import {getShaderInfo} from '../../lib/compiler-log/get-shader-info';

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
  /** Show shader source in browser? */
  debug?: 'never' | 'errors' | 'warnings' | 'always';
};

/**
 * Immutable Shader object
 * In WebGPU the handle can be copied between threads
 */
export abstract class Shader extends Resource<ShaderProps> {
  static override defaultProps: Required<ShaderProps> = {
    ...Resource.defaultProps,
    language: 'auto',
    stage: undefined,
    source: '',
    sourceMap: null,
    entryPoint: 'main',
    debug: 'errors'
  };

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
    super(device, {id: getShaderIdFromProps(props), ...props}, Shader.defaultProps);
    this.stage = this.props.stage;
    this.source = this.props.source;
  }

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
  async debugShader(trigger = this.props.debug): Promise<void> {
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
    if (this.props.debug === 'warnings' && messages?.length === 0) {
      return;
    }
    this._displayShaderLog(messages);
  }

  // PRIVATE

  /** In-browser UI logging of errors */
  protected _displayShaderLog(messages: readonly CompilerMessage[]): void {
    // Return if under Node.js / incomplete `document` polyfills
    if (typeof document === 'undefined' || !document?.createElement) {
      return;
    }

    const shaderName: string = getShaderInfo(this.source).name;
    const shaderTitle: string = `${this.stage} ${shaderName}`;
    let htmlLog = formatCompilerLog(messages, this.source, {showSourceCode: 'all', html: true});
    // Show translated source if available
    const translatedSource = this.getTranslatedSource();
    if (translatedSource) {
      htmlLog += `<br /><br /><h1>Translated Source</h1><br /><br /><code style="user-select:text;"><pre>${translatedSource}</pre></code>`;
    }
    // Make it clickable so we can copy to clipboard
    const button = document.createElement('Button');
    button.innerHTML = `
<h1>Shader Compilation Error in ${shaderTitle}</h1><br /><br />
<code style="user-select:text;"><pre>
${htmlLog}
</pre></code>`;
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.position = 'absolute';
    button.style.zIndex = '9999';
    button.style.width = '100%';
    button.style.textAlign = 'left';
    document.body.appendChild(button);

    const errors = document.getElementsByClassName('luma-compiler-log-error');
    if (errors[0]?.scrollIntoView) {
      errors[0].scrollIntoView();
    }

    // TODO - add a small embedded copy button (instead of main button)
    button.onclick = () => {
      // const source = this.source.replaceAll('\n', '<br />');
      const dataURI = `data:text/plain,${encodeURIComponent(this.source)}`;
      navigator.clipboard.writeText(dataURI);
    };

    // TODO - add a small embedded close button
  }
}

// HELPERS

/** Deduce an id, from shader source, or supplied id, or shader type */
function getShaderIdFromProps(props: ShaderProps): string {
  return getShaderInfo(props.source).name || props.id || uid(`unnamed ${props.stage}-shader`);
}
