// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  RenderPipelineProps,
  RenderPipelineParameters,
  PrimitiveTopology,
  ShaderLayout,
  UniformValue,
  Bindings,
  BindingsByGroup,
  RenderPass,
  VertexArray
} from '@luma.gl/core';
import {RenderPipeline, flattenBindingsByGroup, log, normalizeBindingsByGroup} from '@luma.gl/core';
// import {getAttributeInfosFromLayouts} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';

import {withDeviceAndGLParameters} from '../converters/device-parameters';
import {setUniform} from '../helpers/set-uniform';
// import {copyUniform, checkUniformValues} from '../../classes/uniforms';

import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLShader} from './webgl-shader';
import {WEBGLFramebuffer} from './webgl-framebuffer';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLTextureView} from './webgl-texture-view';
import {WEBGLRenderPass} from './webgl-render-pass';
import {WEBGLTransformFeedback} from './webgl-transform-feedback';
import {getGLDrawMode} from '../helpers/webgl-topology-utils';
import {WEBGLSharedRenderPipeline} from './webgl-shared-render-pipeline';

/** Creates a new render pipeline */
export class WEBGLRenderPipeline extends RenderPipeline {
  /** The WebGL device that created this render pipeline */
  readonly device: WebGLDevice;
  /** Handle to underlying WebGL program */
  readonly handle: WebGLProgram;
  /** vertex shader */
  vs: WEBGLShader;
  /** fragment shader */
  fs: WEBGLShader;
  /** The layout extracted from shader by WebGL introspection APIs */
  introspectedLayout: ShaderLayout;

  /** Compatibility path for direct pipeline.setBindings() usage */
  bindings: Bindings = {};
  /** Compatibility path for direct pipeline.uniforms usage */
  uniforms: Record<string, UniformValue> = {};
  /** WebGL varyings */
  varyings: string[] | null = null;

  _uniformCount: number = 0;
  _uniformSetters: Record<string, Function> = {}; // TODO are these used?

  override get [Symbol.toStringTag]() {
    return 'WEBGLRenderPipeline';
  }

  constructor(device: WebGLDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    const webglSharedRenderPipeline =
      (this.sharedRenderPipeline as WEBGLSharedRenderPipeline | null) ||
      (this.device._createSharedRenderPipelineWebGL(props) as WEBGLSharedRenderPipeline);

    this.sharedRenderPipeline = webglSharedRenderPipeline;
    this.handle = webglSharedRenderPipeline.handle;
    this.vs = webglSharedRenderPipeline.vs;
    this.fs = webglSharedRenderPipeline.fs;
    this.linkStatus = webglSharedRenderPipeline.linkStatus;
    this.introspectedLayout = webglSharedRenderPipeline.introspectedLayout;
    this.device._setWebGLDebugMetadata(this.handle, this, {spector: {id: this.props.id}});

    // WebGL only honors shaderLayout overrides for attributes that already exist in the
    // linked program, and only the `type` / `stepMode` fields participate in the merge.
    // Bindings and unknown attributes are ignored. If WebGL cache keys ever depend on
    // `shaderLayout`, they need to match these merge semantics rather than the raw prop.
    this.shaderLayout = props.shaderLayout
      ? mergeShaderLayout(this.introspectedLayout, props.shaderLayout)
      : this.introspectedLayout;
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }
    if (this.sharedRenderPipeline && !this.props._sharedRenderPipeline) {
      this.sharedRenderPipeline.destroy();
    }
    this.destroyResource();
  }

  /**
   * Compatibility shim for code paths that still set bindings on the pipeline.
   * Shared-model draws pass bindings per draw and do not rely on this state.
   */
  setBindings(bindings: Bindings | BindingsByGroup, options?: {disableWarnings?: boolean}): void {
    const flatBindings = flattenBindingsByGroup(
      normalizeBindingsByGroup(this.shaderLayout, bindings)
    );
    for (const [name, value] of Object.entries(flatBindings)) {
      const binding = getShaderLayoutBindingByName(this.shaderLayout, name);

      if (!binding) {
        const validBindings = this.shaderLayout.bindings
          .map(binding_ => `"${binding_.name}"`)
          .join(', ');
        if (!options?.disableWarnings) {
          log.warn(
            `No binding "${name}" in render pipeline "${this.id}", expected one of ${validBindings}`,
            value
          )();
        }
      } else {
        if (!value) {
          log.warn(`Unsetting binding "${name}" in render pipeline "${this.id}"`)();
        }
        switch (binding.type) {
          case 'uniform':
            // @ts-expect-error
            if (!(value instanceof WEBGLBuffer) && !(value.buffer instanceof WEBGLBuffer)) {
              throw new Error('buffer value');
            }
            break;
          case 'texture':
            if (
              !(
                value instanceof WEBGLTextureView ||
                value instanceof WEBGLTexture ||
                value instanceof WEBGLFramebuffer
              )
            ) {
              throw new Error(`${this} Bad texture binding for ${name}`);
            }
            break;
          case 'sampler':
            log.warn(`Ignoring sampler ${name}`)();
            break;
          default:
            throw new Error(binding.type);
        }

        this.bindings[name] = value;
      }
    }
  }

  /** @todo needed for portable model
   * @note The WebGL API is offers many ways to draw things
   * This function unifies those ways into a single call using common parameters with sane defaults
   */
  draw(options: {
    renderPass: RenderPass;
    parameters?: RenderPipelineParameters;
    topology?: PrimitiveTopology;
    vertexArray: VertexArray;
    isInstanced?: boolean;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
    transformFeedback?: WEBGLTransformFeedback;
    bindings?: Bindings;
    bindGroups?: BindingsByGroup;
    _bindGroupCacheKeys?: Partial<Record<number, object>>;
    uniforms?: Record<string, UniformValue>;
  }): boolean {
    this._syncLinkStatus();
    const drawBindings = options.bindGroups
      ? flattenBindingsByGroup(options.bindGroups)
      : options.bindings || this.bindings;

    const {
      renderPass,
      parameters = this.props.parameters,
      topology = this.props.topology,
      vertexArray,
      vertexCount,
      // indexCount,
      instanceCount,
      isInstanced = false,
      firstVertex = 0,
      // firstIndex,
      // firstInstance,
      // baseVertex,
      transformFeedback,
      uniforms = this.uniforms
    } = options;

    const glDrawMode = getGLDrawMode(topology);
    const isIndexed: boolean = Boolean(vertexArray.indexBuffer);
    const glIndexType = (vertexArray.indexBuffer as WEBGLBuffer)?.glIndexType;
    // Note that we sometimes get called with 0 instances

    // If we are using async linking, we need to wait until linking completes
    if (this.linkStatus !== 'success') {
      log.info(2, `RenderPipeline:${this.id}.draw() aborted - waiting for shader linking`)();
      return false;
    }

    // Avoid WebGL draw call when not rendering any data or values are incomplete
    // Note: async textures set as uniforms might still be loading.
    // Now that all uniforms have been updated, check if any texture
    // in the uniforms is not yet initialized, then we don't draw
    if (!this._areTexturesRenderable(drawBindings)) {
      log.info(2, `RenderPipeline:${this.id}.draw() aborted - textures not yet loaded`)();
      //  Note: false means that the app needs to redraw the pipeline again.
      return false;
    }

    // (isInstanced && instanceCount === 0)
    // if (vertexCount === 0) {
    //   log.info(2, `RenderPipeline:${this.id}.draw() aborted - no vertices to draw`)();
    //   Note: false means that the app needs to redraw the pipeline again.
    //   return true;
    // }

    this.device.gl.useProgram(this.handle);

    // Note: Rebinds constant attributes before each draw call
    vertexArray.bindBeforeRender(renderPass);

    if (transformFeedback) {
      transformFeedback.begin(this.props.topology);
    }

    // We have to apply bindings before every draw call since other draw calls will overwrite
    this._applyBindings(drawBindings, {disableWarnings: this.props.disableWarnings});
    this._applyUniforms(uniforms);

    const webglRenderPass = renderPass as WEBGLRenderPass;

    withDeviceAndGLParameters(this.device, parameters, webglRenderPass.glParameters, () => {
      if (isIndexed && isInstanced) {
        this.device.gl.drawElementsInstanced(
          glDrawMode,
          vertexCount || 0, // indexCount?
          glIndexType,
          firstVertex,
          instanceCount || 0
        );
        // } else if (isIndexed && this.device.isWebGL2 && !isNaN(start) && !isNaN(end)) {
        //   this.device.gldrawRangeElements(glDrawMode, start, end, vertexCount, glIndexType, offset);
      } else if (isIndexed) {
        this.device.gl.drawElements(glDrawMode, vertexCount || 0, glIndexType, firstVertex); // indexCount?
      } else if (isInstanced) {
        this.device.gl.drawArraysInstanced(
          glDrawMode,
          firstVertex,
          vertexCount || 0,
          instanceCount || 0
        );
      } else {
        this.device.gl.drawArrays(glDrawMode, firstVertex, vertexCount || 0);
      }

      if (transformFeedback) {
        transformFeedback.end();
      }
    });

    vertexArray.unbindAfterRender(renderPass);

    return true;
  }

  /**
   * Checks if all texture-values uniforms are renderable (i.e. loaded)
   * Update a texture if needed (e.g. from video)
   * Note: This is currently done before every draw call
   */
  _areTexturesRenderable(bindings: Bindings) {
    let texturesRenderable = true;

    for (const bindingInfo of this.shaderLayout.bindings) {
      if (!getBindingValueForLayoutBinding(bindings, bindingInfo.name)) {
        log.warn(`Binding ${bindingInfo.name} not found in ${this.id}`)();
        texturesRenderable = false;
      }
    }

    // TODO - remove this should be handled by ExternalTexture
    // for (const [, texture] of Object.entries(this.bindings)) {
    //   if (texture instanceof WEBGLTexture) {
    //     texture.update();
    //   }
    // }

    return texturesRenderable;
  }

  /** Apply any bindings (before each draw call) */
  _applyBindings(bindings: Bindings, _options?: {disableWarnings?: boolean}) {
    this._syncLinkStatus();

    // If we are using async linking, we need to wait until linking completes
    if (this.linkStatus !== 'success') {
      return;
    }

    const {gl} = this.device;
    gl.useProgram(this.handle);

    let textureUnit = 0;
    let uniformBufferIndex = 0;
    for (const binding of this.shaderLayout.bindings) {
      const value = getBindingValueForLayoutBinding(bindings, binding.name);
      if (!value) {
        throw new Error(`No value for binding ${binding.name} in ${this.id}`);
      }
      switch (binding.type) {
        case 'uniform':
          // Set buffer
          const {name} = binding;
          const location = gl.getUniformBlockIndex(this.handle, name);
          if ((location as GL) === GL.INVALID_INDEX) {
            throw new Error(`Invalid uniform block name ${name}`);
          }
          gl.uniformBlockBinding(this.handle, location, uniformBufferIndex);
          if (value instanceof WEBGLBuffer) {
            gl.bindBufferBase(GL.UNIFORM_BUFFER, uniformBufferIndex, value.handle);
          } else {
            const bufferBinding = value as {buffer: WEBGLBuffer; offset?: number; size?: number};
            gl.bindBufferRange(
              GL.UNIFORM_BUFFER,
              uniformBufferIndex,
              bufferBinding.buffer.handle,
              bufferBinding.offset || 0,
              bufferBinding.size || bufferBinding.buffer.byteLength - (bufferBinding.offset || 0)
            );
          }
          uniformBufferIndex += 1;
          break;

        case 'texture':
          if (
            !(
              value instanceof WEBGLTextureView ||
              value instanceof WEBGLTexture ||
              value instanceof WEBGLFramebuffer
            )
          ) {
            throw new Error('texture');
          }
          let texture: WEBGLTexture;
          if (value instanceof WEBGLTextureView) {
            texture = value.texture;
          } else if (value instanceof WEBGLTexture) {
            texture = value;
          } else if (
            value instanceof WEBGLFramebuffer &&
            value.colorAttachments[0] instanceof WEBGLTextureView
          ) {
            log.warn(
              'Passing framebuffer in texture binding may be deprecated. Use fbo.colorAttachments[0] instead'
            )();
            texture = value.colorAttachments[0].texture;
          } else {
            throw new Error('No texture');
          }

          gl.activeTexture(GL.TEXTURE0 + textureUnit);
          gl.bindTexture(texture.glTarget, texture.handle);
          // gl.bindSampler(textureUnit, sampler.handle);
          textureUnit += 1;
          break;

        case 'sampler':
          // ignore
          break;

        case 'storage':
        case 'read-only-storage':
          throw new Error(`binding type '${binding.type}' not supported in WebGL`);
      }
    }
  }

  /**
   * Due to program sharing, uniforms need to be reset before every draw call
   * (though caching will avoid redundant WebGL calls)
   */
  _applyUniforms(uniforms: Record<string, UniformValue>) {
    for (const uniformLayout of this.shaderLayout.uniforms || []) {
      const {name, location, type, textureUnit} = uniformLayout;
      const value = uniforms[name] ?? textureUnit;
      if (value !== undefined) {
        setUniform(this.device.gl, location, type, value);
      }
    }
  }

  private _syncLinkStatus(): void {
    this.linkStatus = (this.sharedRenderPipeline as WEBGLSharedRenderPipeline).linkStatus;
  }
}

/**
 * Merges an provided shader layout into a base shader layout
 * In WebGL, this allows the auto generated shader layout to be overridden by the application
 * Typically to change the format of the vertex attributes (from float32x4 to uint8x4 etc).
 * @todo Drop this? Aren't all use cases covered by mergeBufferLayout()?
 */
function mergeShaderLayout(baseLayout: ShaderLayout, overrideLayout: ShaderLayout): ShaderLayout {
  // Deep clone the base layout
  const mergedLayout: ShaderLayout = {
    ...baseLayout,
    attributes: baseLayout.attributes.map(attribute => ({...attribute})),
    bindings: baseLayout.bindings.map(binding => ({...binding}))
  };
  // Merge the attributes
  for (const attribute of overrideLayout?.attributes || []) {
    const baseAttribute = mergedLayout.attributes.find(attr => attr.name === attribute.name);
    if (!baseAttribute) {
      log.warn(`shader layout attribute ${attribute.name} not present in shader`);
    } else {
      baseAttribute.type = attribute.type || baseAttribute.type;
      baseAttribute.stepMode = attribute.stepMode || baseAttribute.stepMode;
    }
  }

  for (const binding of overrideLayout?.bindings || []) {
    const baseBinding = getShaderLayoutBindingByName(mergedLayout, binding.name);
    if (!baseBinding) {
      log.warn(`shader layout binding ${binding.name} not present in shader`);
      continue;
    }
    Object.assign(baseBinding, binding);
  }
  return mergedLayout;
}

function getShaderLayoutBindingByName(
  shaderLayout: ShaderLayout,
  bindingName: string
): ShaderLayout['bindings'][number] | undefined {
  return shaderLayout.bindings.find(
    binding =>
      binding.name === bindingName ||
      binding.name === `${bindingName}Uniforms` ||
      `${binding.name}Uniforms` === bindingName
  );
}

function getBindingValueForLayoutBinding(
  bindings: Bindings,
  bindingName: string
): Bindings[string] | undefined {
  return (
    bindings[bindingName] ||
    bindings[`${bindingName}Uniforms`] ||
    bindings[bindingName.replace(/Uniforms$/, '')]
  );
}
