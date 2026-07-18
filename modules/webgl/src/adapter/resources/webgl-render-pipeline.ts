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

  /** @deprecated Set bindings on RenderPass instead. Will be removed in the next major release. */
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
    const webglRenderPass = options.renderPass as WEBGLRenderPass;
    const drawBindings = options.bindGroups
      ? flattenBindingsByGroup(options.bindGroups)
      : options.bindings || this.bindings;

    webglRenderPass.setPipeline(this);
    webglRenderPass.setBindings(drawBindings);
    webglRenderPass.setVertexArray(options.vertexArray);
    return webglRenderPass.draw({
      parameters: options.parameters,
      topology: options.topology,
      isInstanced: options.isInstanced,
      vertexCount: options.vertexCount,
      indexCount: options.indexCount,
      instanceCount: options.instanceCount,
      firstVertex: options.firstVertex,
      firstIndex: options.firstIndex,
      firstInstance: options.firstInstance,
      baseVertex: options.baseVertex,
      transformFeedback: options.transformFeedback,
      uniforms: options.uniforms
    });
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
    const boundTextureAspects = new Map<WEBGLTexture, string>();
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
          if (value instanceof WEBGLTextureView) {
            const previousAspect = boundTextureAspects.get(texture);
            if (previousAspect && previousAspect !== value.props.aspect) {
              throw new Error('WebGL cannot bind conflicting aspects of one texture in a draw');
            }
            boundTextureAspects.set(texture, value.props.aspect);
            value._applyAspectMode();
          }
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

  _syncLinkStatus(): void {
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
