// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumericArray, NumberArray4} from '@math.gl/types';
import type {
  Bindings,
  BindingsByGroup,
  RenderBundle,
  RenderPassBindingOptions,
  RenderPassDrawOptions,
  RenderPipeline,
  UniformValue,
  VertexArray
} from '@luma.gl/core';
import {
  flattenBindingsByGroup,
  normalizeBindingsByGroup,
  RenderPass,
  RenderPassProps,
  RenderPassParameters,
  log
} from '@luma.gl/core';
import {WebGLDevice} from '../webgl-device';
import {GL, GLParameters} from '@luma.gl/webgl/constants';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {setGLParameters} from '../../context/parameters/unified-parameter-api';
import {WEBGLQuerySet} from './webgl-query-set';
import {WEBGLFramebuffer} from './webgl-framebuffer';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLRenderPipeline} from './webgl-render-pipeline';
import {WEBGLTransformFeedback} from './webgl-transform-feedback';
import {getGLDrawMode} from '../helpers/webgl-topology-utils';
import {withDeviceAndGLParameters} from '../converters/device-parameters';

const COLOR_CHANNELS: NumberArray4 = [0x1, 0x2, 0x4, 0x8]; // GPUColorWrite RED, GREEN, BLUE, ALPHA

export class WEBGLRenderPass extends RenderPass {
  readonly device: WebGLDevice;
  readonly handle = null;

  /** Parameters that should be applied before each draw call */
  glParameters: GLParameters = {};

  /** Pipeline used by subsequent draw commands. */
  pipeline: WEBGLRenderPipeline | null = null;

  /** Complete binding set used by subsequent draw commands. */
  bindings: Bindings = {};
  private bindingsPipeline: WEBGLRenderPipeline | null = null;

  /** Vertex array used by subsequent draw commands. */
  vertexArray: VertexArray | null = null;

  constructor(device: WebGLDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;
    const webglFramebuffer = this.props.framebuffer as WEBGLFramebuffer | null;
    const isDefaultFramebuffer = !webglFramebuffer || webglFramebuffer.handle === null;

    if (isDefaultFramebuffer) {
      // Treat an explicit wrapper around the default framebuffer the same as the
      // implicit default path so draw buffer and viewport state stay valid.
      device.getDefaultCanvasContext()._resizeDrawingBufferIfNeeded();
    }

    // If no viewport is provided, apply reasonably defaults
    let viewport: NumberArray4 | undefined;
    if (!props?.parameters?.viewport) {
      if (!isDefaultFramebuffer && webglFramebuffer) {
        // Set the viewport to the size of the framebuffer
        const {width, height} = webglFramebuffer;
        viewport = [0, 0, width, height];
      } else {
        // Instead of using our own book-keeping, we can just read the values from the WebGL context
        const [width, height] = device.getDefaultCanvasContext().getDrawingBufferSize();
        viewport = [0, 0, width, height];
      }
    }

    // TODO - do parameters (scissorRect) affect the clear operation?
    this.device.pushState();
    this.setParameters({viewport, ...this.props.parameters});

    // Specify mapping of draw buffer locations to color attachments
    if (!isDefaultFramebuffer && webglFramebuffer?.colorAttachments.length) {
      const drawBuffers = webglFramebuffer.colorAttachments.map((_, i) => GL.COLOR_ATTACHMENT0 + i);
      this.device.gl.drawBuffers(drawBuffers);
    } else if (isDefaultFramebuffer) {
      // Default framebuffer only supports GL.BACK/GL.NONE draw buffers
      this.device.gl.drawBuffers([GL.BACK]);
    }

    // Hack - for now WebGL draws in "immediate mode" (instead of queueing the operations)...
    this.clear();

    if (this.props.timestampQuerySet && this.props.beginTimestampIndex !== undefined) {
      const webglQuerySet = this.props.timestampQuerySet as WEBGLQuerySet;
      webglQuerySet.writeTimestamp(this.props.beginTimestampIndex);
    }
  }

  end(): void {
    if (this.destroyed) {
      return;
    }
    if (this.props.timestampQuerySet && this.props.endTimestampIndex !== undefined) {
      const webglQuerySet = this.props.timestampQuerySet as WEBGLQuerySet;
      webglQuerySet.writeTimestamp(this.props.endTimestampIndex);
    }
    this.device.popState();
    // should add commands to CommandEncoder.
    this.destroy();
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;

  /** @throws Always throws because WebGL does not support render bundles. */
  executeBundles(_bundles: Iterable<RenderBundle>): void {
    throw new Error('Render bundles are only supported in WebGPU');
  }

  /**
   * Maps RenderPass parameters to GL parameters
   */
  setParameters(parameters: RenderPassParameters = {}): void {
    const glParameters: GLParameters = {...this.glParameters};

    // Framebuffers are specified using parameters in WebGL
    glParameters.framebuffer = this.props.framebuffer || null;

    if (this.props.depthReadOnly) {
      glParameters.depthMask = !this.props.depthReadOnly;
    }

    glParameters.stencilMask = this.props.stencilReadOnly ? 0 : 1;

    glParameters[GL.RASTERIZER_DISCARD] = this.props.discard;

    // Map the four renderpass parameters to WebGL parameters
    if (parameters.viewport) {
      // WebGPU viewports are 6 coordinates (X, Y, Z)
      if (parameters.viewport.length >= 6) {
        glParameters.viewport = parameters.viewport.slice(0, 4) as NumberArray4;
        glParameters.depthRange = [
          parameters.viewport[4] as number,
          parameters.viewport[5] as number
        ];
      } else {
        // WebGL viewports are 4 coordinates (X, Y)
        glParameters.viewport = parameters.viewport as NumberArray4;
      }
    }
    if (parameters.scissorRect) {
      glParameters.scissorTest = true;
      glParameters.scissor = parameters.scissorRect;
    }
    if (parameters.blendConstant) {
      glParameters.blendColor = parameters.blendConstant;
    }
    if (parameters.stencilReference !== undefined) {
      glParameters[GL.STENCIL_REF] = parameters.stencilReference;
      glParameters[GL.STENCIL_BACK_REF] = parameters.stencilReference;
    }

    if ('colorMask' in parameters) {
      glParameters.colorMask = COLOR_CHANNELS.map(channel =>
        Boolean(channel & (parameters.colorMask as number))
      );
    }

    this.glParameters = glParameters;

    setGLParameters(this.device.gl, glParameters);
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.pipeline = pipeline as WEBGLRenderPipeline;
  }

  setBindings(bindings: Bindings | BindingsByGroup, _options?: RenderPassBindingOptions): void {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before setBindings()');
    }
    this.bindings = flattenBindingsByGroup(
      normalizeBindingsByGroup(this.pipeline.shaderLayout, bindings)
    );
    this.bindingsPipeline = this.pipeline;
  }

  setVertexArray(vertexArray: VertexArray): void {
    this.vertexArray = vertexArray;
  }

  draw(options: RenderPassDrawOptions): boolean {
    const pipeline = this.pipeline;
    const vertexArray = this.vertexArray;
    if (!pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before draw()');
    }
    if (!vertexArray) {
      throw new Error('RenderPass.setVertexArray() must be called before draw()');
    }
    if (pipeline.shaderLayout.bindings.length > 0 && this.bindingsPipeline !== pipeline) {
      throw new Error('RenderPass.setBindings() must be called after setPipeline() before draw()');
    }

    pipeline._syncLinkStatus();
    const {
      parameters = pipeline.props.parameters,
      topology = pipeline.props.topology,
      vertexCount,
      indexCount,
      instanceCount,
      isInstanced = false,
      firstVertex = 0,
      transformFeedback,
      uniforms = pipeline.uniforms
    } = options;

    const glDrawMode = getGLDrawMode(topology);
    const isIndexed = Boolean(vertexArray.indexBuffer);
    const glIndexType = (vertexArray.indexBuffer as WEBGLBuffer)?.glIndexType;
    const indexedDrawCount = indexCount ?? vertexCount ?? 0;

    if (pipeline.linkStatus !== 'success') {
      log.info(2, `RenderPipeline:${pipeline.id}.draw() aborted - waiting for shader linking`)();
      return false;
    }
    if (!pipeline._areTexturesRenderable(this.bindings)) {
      log.info(2, `RenderPipeline:${pipeline.id}.draw() aborted - textures not yet loaded`)();
      return false;
    }

    this.device.gl.useProgram(pipeline.handle);
    vertexArray.bindBeforeRender(this);

    const webglTransformFeedback = transformFeedback as WEBGLTransformFeedback | undefined;
    if (webglTransformFeedback) {
      webglTransformFeedback.begin(pipeline.props.topology);
    }

    pipeline._applyBindings(this.bindings, {disableWarnings: pipeline.props.disableWarnings});
    pipeline._applyUniforms(uniforms as Record<string, UniformValue>);

    withDeviceAndGLParameters(this.device, parameters, this.glParameters, () => {
      if (isIndexed && isInstanced) {
        this.device.gl.drawElementsInstanced(
          glDrawMode,
          indexedDrawCount,
          glIndexType,
          firstVertex,
          instanceCount || 0
        );
      } else if (isIndexed) {
        this.device.gl.drawElements(glDrawMode, indexedDrawCount, glIndexType, firstVertex);
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

      if (webglTransformFeedback) {
        webglTransformFeedback.end();
      }
    });

    vertexArray.unbindAfterRender(this);
    return true;
  }

  beginOcclusionQuery(queryIndex: number): void {
    const webglQuerySet = this.props.occlusionQuerySet as WEBGLQuerySet;
    webglQuerySet?.beginOcclusionQuery();
  }

  override endOcclusionQuery(): void {
    const webglQuerySet = this.props.occlusionQuerySet as WEBGLQuerySet;
    webglQuerySet?.endOcclusionQuery();
  }

  // PRIVATE

  /**
   * Optionally clears depth, color and stencil buffers based on parameters
   */
  protected clear(): void {
    const glParameters: GLParameters = {...this.glParameters};

    let clearMask = 0;

    if (this.props.clearColors) {
      this.props.clearColors.forEach((color, drawBufferIndex) => {
        if (color) {
          this.clearColorBuffer(drawBufferIndex, color);
        }
      });
    }

    if (this.props.clearColor !== false && this.props.clearColors === undefined) {
      clearMask |= GL.COLOR_BUFFER_BIT;
      glParameters.clearColor = this.props.clearColor;
    }
    if (this.props.clearDepth !== false) {
      clearMask |= GL.DEPTH_BUFFER_BIT;
      glParameters.clearDepth = this.props.clearDepth;
    }
    if (this.props.clearStencil !== false) {
      clearMask |= GL.STENCIL_BUFFER_BIT;
      glParameters.clearStencil = this.props.clearStencil;
    }

    if (clearMask !== 0) {
      // Temporarily set any clear "colors" and call clear
      withGLParameters(this.device.gl, glParameters, () => {
        this.device.gl.clear(clearMask);
      });
    }
  }

  /**
   * WebGL2 - clear a specific color buffer
   */
  protected clearColorBuffer(drawBuffer: number = 0, value: NumericArray = [0, 0, 0, 0]) {
    withGLParameters(this.device.gl, {framebuffer: this.props.framebuffer}, () => {
      // Method selection per OpenGL ES 3 docs
      switch (value.constructor) {
        case Int8Array:
        case Int16Array:
        case Int32Array:
          this.device.gl.clearBufferiv(GL.COLOR, drawBuffer, value);
          break;
        case Uint8Array:
        case Uint8ClampedArray:
        case Uint16Array:
        case Uint32Array:
          this.device.gl.clearBufferuiv(GL.COLOR, drawBuffer, value);
          break;
        case Float32Array:
          this.device.gl.clearBufferfv(GL.COLOR, drawBuffer, value);
          break;
        default:
          throw new Error('clearColorBuffer: color must be typed array');
      }
    });
  }

  /*
  clearDepthStencil() {
      case GL.DEPTH:
        this.device.gl.clearBufferfv(GL.DEPTH, 0, [value]);
        break;

      case GL_STENCIL:
        this.device.gl.clearBufferiv(GL.STENCIL, 0, [value]);
        break;

      case GL.DEPTH_STENCIL:
        const [depth, stencil] = value;
        this.device.gl.clearBufferfi(GL.DEPTH_STENCIL, 0, depth, stencil);
        break;

      default:
        assert(false, ERR_ARGUMENTS);
    }
  });
  */
}
