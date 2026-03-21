// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants';
import {
  SharedRenderPipeline,
  log,
  type ShaderLayout,
  type SharedRenderPipelineProps
} from '@luma.gl/core';

import {getShaderLayoutFromGLSL} from '../helpers/get-shader-layout-from-glsl';
import {isGLSamplerType} from '../converters/webgl-shadertypes';
import type {WebGLDevice} from '../webgl-device';
import type {WEBGLShader} from './webgl-shader';

const LOG_PROGRAM_PERF_PRIORITY = 4;

export class WEBGLSharedRenderPipeline extends SharedRenderPipeline {
  readonly device: WebGLDevice;
  readonly handle: WebGLProgram;
  readonly vs: WEBGLShader;
  readonly fs: WEBGLShader;
  introspectedLayout: ShaderLayout = {attributes: [], bindings: [], uniforms: []};
  linkStatus: 'pending' | 'success' | 'error' = 'pending';

  constructor(
    device: WebGLDevice,
    props: SharedRenderPipelineProps & {
      handle?: WebGLProgram;
      vs: WEBGLShader;
      fs: WEBGLShader;
    }
  ) {
    super(device, props);
    this.device = device;
    this.handle = props.handle || this.device.gl.createProgram();
    this.vs = props.vs;
    this.fs = props.fs;

    if (props.varyings && props.varyings.length > 0) {
      this.device.gl.transformFeedbackVaryings(
        this.handle,
        props.varyings,
        props.bufferMode || GL.SEPARATE_ATTRIBS
      );
    }

    this._linkShaders();
    // Introspection happens after linking to build wrapper-facing layout metadata.
    // It is not a prerequisite for deciding whether a shared `WebGLProgram` can be
    // reused; that decision must remain based on the shared-pipeline cache key alone.
    log.time(3, `RenderPipeline ${this.id} - shaderLayout introspection`)();
    this.introspectedLayout = getShaderLayoutFromGLSL(this.device.gl, this.handle);
    log.timeEnd(3, `RenderPipeline ${this.id} - shaderLayout introspection`)();
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.device.gl.useProgram(null);
    this.device.gl.deleteProgram(this.handle);
    // @ts-expect-error
    this.handle.destroyed = true;
    this.destroyResource();
  }

  protected async _linkShaders() {
    const {gl} = this.device;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    log.time(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this.id}`)();
    gl.linkProgram(this.handle);
    log.timeEnd(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this.id}`)();

    if (!this.device.features.has('compilation-status-async-webgl')) {
      const status = this._getLinkStatus();
      this._reportLinkStatus(status);
      return;
    }

    log.once(1, 'RenderPipeline linking is asynchronous')();
    await this._waitForLinkComplete();
    log.info(2, `RenderPipeline ${this.id} - async linking complete: ${this.linkStatus}`)();
    const status = this._getLinkStatus();
    this._reportLinkStatus(status);
  }

  async _reportLinkStatus(status: 'success' | 'link-error' | 'validation-error'): Promise<void> {
    switch (status) {
      case 'success':
        return;

      default:
        const errorType = status === 'link-error' ? 'Link error' : 'Validation error';
        switch (this.vs.compilationStatus) {
          case 'error':
            this.vs.debugShader();
            throw new Error(`${this} ${errorType} during compilation of ${this.vs}`);
          case 'pending':
            await this.vs.asyncCompilationStatus;
            this.vs.debugShader();
            break;
          case 'success':
            break;
        }

        switch (this.fs?.compilationStatus) {
          case 'error':
            this.fs.debugShader();
            throw new Error(`${this} ${errorType} during compilation of ${this.fs}`);
          case 'pending':
            await this.fs.asyncCompilationStatus;
            this.fs.debugShader();
            break;
          case 'success':
            break;
        }

        const linkErrorLog = this.device.gl.getProgramInfoLog(this.handle);
        this.device.reportError(
          new Error(`${errorType} during ${status}: ${linkErrorLog}`),
          this
        )();
        this.device.debug();
    }
  }

  _getLinkStatus(): 'success' | 'link-error' | 'validation-error' {
    const {gl} = this.device;
    const linked = gl.getProgramParameter(this.handle, GL.LINK_STATUS);
    if (!linked) {
      this.linkStatus = 'error';
      return 'link-error';
    }

    this._initializeSamplerUniforms();
    gl.validateProgram(this.handle);
    const validated = gl.getProgramParameter(this.handle, GL.VALIDATE_STATUS);
    if (!validated) {
      this.linkStatus = 'error';
      return 'validation-error';
    }

    this.linkStatus = 'success';
    return 'success';
  }

  _initializeSamplerUniforms(): void {
    const {gl} = this.device;
    gl.useProgram(this.handle);

    let textureUnit = 0;
    const uniformCount = gl.getProgramParameter(this.handle, GL.ACTIVE_UNIFORMS);
    for (let uniformIndex = 0; uniformIndex < uniformCount; uniformIndex++) {
      const activeInfo = gl.getActiveUniform(this.handle, uniformIndex);
      if (activeInfo && isGLSamplerType(activeInfo.type)) {
        const isArray = activeInfo.name.endsWith('[0]');
        const uniformName = isArray ? activeInfo.name.slice(0, -3) : activeInfo.name;
        const location = gl.getUniformLocation(this.handle, uniformName);

        if (location !== null) {
          textureUnit = this._assignSamplerUniform(location, activeInfo, isArray, textureUnit);
        }
      }
    }
  }

  _assignSamplerUniform(
    location: WebGLUniformLocation,
    activeInfo: WebGLActiveInfo,
    isArray: boolean,
    textureUnit: number
  ): number {
    const {gl} = this.device;

    if (isArray && activeInfo.size > 1) {
      const textureUnits = Int32Array.from(
        {length: activeInfo.size},
        (_, arrayIndex) => textureUnit + arrayIndex
      );
      gl.uniform1iv(location, textureUnits);
      return textureUnit + activeInfo.size;
    }

    gl.uniform1i(location, textureUnit);
    return textureUnit + 1;
  }

  async _waitForLinkComplete(): Promise<void> {
    const waitMs = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms));
    const DELAY_MS = 10;

    if (!this.device.features.has('compilation-status-async-webgl')) {
      await waitMs(DELAY_MS);
      return;
    }

    const {gl} = this.device;
    for (;;) {
      const complete = gl.getProgramParameter(this.handle, GL.COMPLETION_STATUS_KHR);
      if (complete) {
        return;
      }
      await waitMs(DELAY_MS);
    }
  }
}
