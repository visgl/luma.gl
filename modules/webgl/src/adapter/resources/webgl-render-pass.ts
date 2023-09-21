import {RenderPass, RenderPassProps, NumberArray, RenderPassParameters} from '@luma.gl/core';
import {WebGLDevice} from '../webgl-device';
import {GL, GLParameters} from '@luma.gl/constants';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {setGLParameters} from '../../context/parameters/unified-parameter-api';

// Should collapse during minification
const GL_DEPTH_BUFFER_BIT = 0x00000100;
const GL_STENCIL_BUFFER_BIT = 0x00000400;
const GL_COLOR_BUFFER_BIT = 0x00004000;

const GL_COLOR = 0x1800;

export class WEBGLRenderPass extends RenderPass {
  readonly device: WebGLDevice;

  /** Parameters that should be applied before each draw call */
  glParameters: GLParameters;

  constructor(device: WebGLDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;

    // TODO - do parameters (scissorRect) affect the clear operation?
    this.setParameters(this.props.parameters);

    // Hack - for now WebGL draws in "immediate mode" (instead of queueing the operations)...
    this.clear();
  }

  end(): void {
    // should add commands to CommandEncoder.
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  // writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;

  // beginOcclusionQuery(queryIndex: number): void;
  // endOcclusionQuery(): void;

  // executeBundles(bundles: Iterable<GPURenderBundle>): void;

  /**
   * Maps RenderPass parameters to GL parameters
   */
  setParameters(parameters: RenderPassParameters = {}): void {
    const glParameters: GLParameters = {};

    // Framebuffers are specified using parameters in WebGL
    if (this.props.framebuffer) {
      glParameters.framebuffer = this.props.framebuffer;
    }

    if (this.props.depthReadOnly) {
      glParameters.depthMask = !this.props.depthReadOnly;
    }

    glParameters.stencilMask = this.props.stencilReadOnly ? 0 : 1;

    glParameters[GL.RASTERIZER_DISCARD] = this.props.discard;

    // Map the four renderpass parameters to WebGL parameters
    if (parameters.viewport) {
      // WebGPU viewports are 6 coordinates (X, Y, Z)
      if (parameters.viewport.length >= 6) {
        glParameters.viewport = parameters.viewport.slice(0, 4);
        glParameters.depthRange = [parameters.viewport[4], parameters.viewport[5]];
      } else {
        // WebGL viewports are 4 coordinates (X, Y)
        glParameters.viewport = parameters.viewport;
      }
    }
    glParameters.scissorTest = Boolean(parameters.scissorRect);
    if (parameters.scissorRect) {
      glParameters.scissor = parameters.scissorRect;
    }
    if (parameters.blendConstant) {
      glParameters.blendColor = parameters.blendConstant;
    }
    if (parameters.stencilReference) {
      // eslint-disable-next-line no-console
      console.warn('RenderPassParameters.stencilReference not yet implemented in WebGL');
      // parameters.stencilFunc = [func, ref, mask];
      // Does this work?
      parameters[GL.STENCIL_REF] = parameters.stencilReference;
    }

    this.glParameters = glParameters;

    setGLParameters(this.device, glParameters);
  }

  // Internal

  /**
   * Optionally clears depth, color and stencil buffers based on parameters
   */
  protected clear(): void {
    const glParameters: GLParameters = {...this.glParameters};

    let clearMask = 0;

    if (this.props.clearColor !== false) {
      clearMask |= GL_COLOR_BUFFER_BIT;
      glParameters.clearColor = this.props.clearColor;
    }
    if (this.props.clearDepth !== false) {
      clearMask |= GL_DEPTH_BUFFER_BIT;
      glParameters.clearDepth = this.props.clearDepth;
    }
    if (this.props.clearStencil !== false) {
      clearMask |= GL_STENCIL_BUFFER_BIT;
      glParameters.clearStencil = this.props.clearStencil;
    }

    if (clearMask !== 0) {
      // Temporarily set any clear "colors" and call clear
      withGLParameters(this.device, glParameters, () => {
        this.device.gl.clear(clearMask);
      });

      // TODO - clear multiple color attachments
      // for (attachment of this.framebuffer.colorAttachments) {
      //   this.clearColorBuffer  
      // }
    }
  }

  /** 
   * WebGL2 - clear a specific color buffer 
   */
  protected clearColorBuffer(drawBuffer: number = 0, value: NumberArray = [0, 0, 0, 0]) {
    withGLParameters(this.device.gl2, {framebuffer: this.props.framebuffer}, () => {
      // Method selection per OpenGL ES 3 docs
      switch (value.constructor) {
        case Int32Array:
          this.device.gl2.clearBufferiv(GL_COLOR, drawBuffer, value);
          break;
        case Uint32Array:
          this.device.gl2.clearBufferuiv(GL_COLOR, drawBuffer, value);
          break;
        case Float32Array:
        default:
          this.device.gl2.clearBufferfv(GL_COLOR, drawBuffer, value);
          break;
      }
    });
  }

  // clearDepthStencil() {
  // const GL_DEPTH = 0x1801;
  // const GL_STENCIL = 0x1802;
  // const GL_DEPTH_STENCIL = 0x84f9;

  //     case GL_DEPTH:
  //       this.device.gl2.clearBufferfv(GL_DEPTH, 0, [value]);
  //       break;

  //     case GL_STENCIL:
  //       this.device.gl2.clearBufferiv(GL_STENCIL, 0, [value]);
  //       break;

  //     case GL_DEPTH_STENCIL:
  //       const [depth, stencil] = value;
  //       this.device.gl2.clearBufferfi(GL_DEPTH_STENCIL, 0, depth, stencil);
  //       break;

  //     default:
  //       assert(false, ERR_ARGUMENTS);
  //   }
  // });
}

