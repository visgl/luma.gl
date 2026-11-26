// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {FramebufferProps} from '../../../index';
import {Framebuffer} from '../../../index';
import {GL} from '../../../webgl-constants/index';
import {assert} from '../../../api/utils/assert';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {WebGLDevice} from '../webgl-device';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLTextureView} from './webgl-texture-view';
import {
  getDepthStencilAttachmentWebGL,
  getTextureFormatWebGL
} from '../converters/webgl-texture-table';

export type Attachment = WEBGLTextureView | WEBGLTexture; // | WEBGLRenderbuffer;

/** luma.gl Framebuffer, WebGL implementation  */
export class WEBGLFramebuffer extends Framebuffer {
  readonly device: WebGLDevice;
  gl: WebGL2RenderingContext;
  readonly handle: WebGLFramebuffer;
  /** Private framebuffer used for multisample draws. */
  multisampleHandle: WebGLFramebuffer | null = null;
  /** Owned color and depth/stencil renderbuffers. */
  private multisampleStorage: WebGLRenderbuffer[] = [];

  colorAttachments: WEBGLTextureView[] = [];
  depthStencilAttachment: WEBGLTextureView | null = null;
  /** Owned stencil-only storage, allocated for the stencil8 framebuffer format. */
  private stencilRenderbuffer: WebGLRenderbuffer | null = null;

  /** Indicates that the framebuffer owns a stencil-only renderbuffer. */
  get hasStencilRenderbuffer(): boolean {
    return this.stencilRenderbuffer !== null;
  }

  constructor(device: WebGLDevice, props: FramebufferProps) {
    super(device, props);

    // WebGL default framebuffer handle is null
    const suppliedHandle = props.handle as WebGLFramebuffer | null | undefined;
    const isDefaultFramebuffer = suppliedHandle === null;

    this.device = device;
    this.gl = device.gl;
    this.handle = (
      suppliedHandle || isDefaultFramebuffer ? suppliedHandle : this.gl.createFramebuffer()
    )!;

    if (!isDefaultFramebuffer) {
      // default framebuffer handle is null, so we can't set debug metadata...
      device._setWebGLDebugMetadata(this.handle, this, {spector: this.props});

      if (!props.handle) {
        // Auto create textures for attachments if needed
        const attachment = this.props.depthStencilAttachment;
        this.autoCreateAttachmentTextures(
          this.props.samples === 4 || attachment === 'stencil8' ? null : attachment
        );

        try {
          this.updateAttachments();
        } catch (error) {
          this.destroy();
          throw error;
        }
      }
    }
  }

  /** destroys any auto created resources etc. */
  protected override destroyHandle(): void {
    if (this.stencilRenderbuffer) this.gl.deleteRenderbuffer(this.stencilRenderbuffer);
    for (const storage of this.multisampleStorage) this.gl.deleteRenderbuffer(storage);
    if (this.multisampleHandle) this.gl.deleteFramebuffer(this.multisampleHandle);
    if (this.handle !== null && this.ownsHandle) {
      this.gl.deleteFramebuffer(this.handle);
    }
  }

  protected updateAttachments(): void {
    /** Attach from a map of attachments */
    // @ts-expect-error native bindFramebuffer is overridden by our state tracker
    const prevHandle: WebGLFramebuffer | null = this.gl.bindFramebuffer(
      GL.FRAMEBUFFER,
      this.handle
    );

    try {
      // Walk the attachments
      for (let i = 0; i < this.colorAttachments.length; ++i) {
        const attachment = this.colorAttachments[i];
        if (attachment) {
          const attachmentPoint = GL.COLOR_ATTACHMENT0 + i;
          this._attachTextureView(attachmentPoint, attachment);
        }
      }

      if (this.depthStencilAttachment) {
        const attachmentPoint = getDepthStencilAttachmentWebGL(
          this.depthStencilAttachment.props.format
        );
        this._attachTextureView(attachmentPoint, this.depthStencilAttachment);
      }

      if (this.props.samples !== 4 && this.props.depthStencilAttachment === 'stencil8') {
        this.attachStencilRenderbuffer();
      }

      if (
        this.hasStencilRenderbuffer ||
        (this.device.props.debug && (this.props.samples !== 4 || this.colorAttachments.length))
      ) {
        const status = this.gl.checkFramebufferStatus(GL.FRAMEBUFFER) as GL;
        if (status !== GL.FRAMEBUFFER_COMPLETE) {
          throw new Error(`Framebuffer ${_getFrameBufferStatus(status)}`);
        }
      }

      if (this.props.samples === 4) this.updateMultisampleStorage();
    } finally {
      this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle);
    }
  }

  /** Allocates or resizes stencil-only storage and restores the renderbuffer binding. */
  private attachStencilRenderbuffer(): void {
    const {gl} = this;
    this.stencilRenderbuffer ??= gl.createRenderbuffer();
    const renderbuffer = this.stencilRenderbuffer;
    // Allocation can fail if the context is lost.
    assert(renderbuffer);
    withGLParameters(gl, {[GL.RENDERBUFFER_BINDING]: renderbuffer}, () => {
      gl.renderbufferStorage(GL.RENDERBUFFER, GL.STENCIL_INDEX8, this.width, this.height);
    });
    gl.framebufferRenderbuffer(
      GL.FRAMEBUFFER,
      GL.STENCIL_ATTACHMENT,
      GL.RENDERBUFFER,
      renderbuffer
    );
  }

  /** Allocates or resizes the private renderbuffers using the public attachment formats. */
  private updateMultisampleStorage(): void {
    const {gl} = this;
    this.multisampleHandle ??= gl.createFramebuffer();
    // Native allocation can fail if the context is lost.
    assert(this.multisampleHandle);
    gl.bindFramebuffer(GL.FRAMEBUFFER, this.multisampleHandle);
    const previousStorage = gl.getParameter(GL.RENDERBUFFER_BINDING);
    try {
      const attachments = this.colorAttachments.map((view, index) => ({
        format: view.props.format ?? view.texture.format,
        point: GL.COLOR_ATTACHMENT0 + index
      }));
      const format = this.props.depthStencilAttachment;
      if (typeof format === 'string') {
        attachments.push({format, point: getDepthStencilAttachmentWebGL(format)});
      }
      for (const [index, {format, point}] of attachments.entries()) {
        const storage = this.multisampleStorage[index] ?? gl.createRenderbuffer();
        // Native allocation can fail if the context is lost.
        assert(storage);
        this.multisampleStorage[index] = storage;
        gl.bindRenderbuffer(GL.RENDERBUFFER, storage);
        const {internalFormat} = getTextureFormatWebGL(format);
        if (
          !gl.getInternalformatParameter(GL.RENDERBUFFER, internalFormat, GL.SAMPLES).includes(4)
        ) {
          throw new Error(`Four renderbuffer samples are unavailable for ${format}`);
        }
        gl.renderbufferStorageMultisample(
          GL.RENDERBUFFER,
          4,
          internalFormat,
          this.width,
          this.height
        );
        gl.framebufferRenderbuffer(GL.FRAMEBUFFER, point, GL.RENDERBUFFER, storage);
      }
      if (gl.checkFramebufferStatus(GL.FRAMEBUFFER) !== GL.FRAMEBUFFER_COMPLETE) {
        throw new Error('Incomplete multisample framebuffer');
      }
    } finally {
      gl.bindRenderbuffer(GL.RENDERBUFFER, previousStorage);
    }
  }

  /** Resolves the private color buffers into the public single-sample textures. */
  resolveMultisampleColors(): void {
    if (!this.multisampleHandle || !this.colorAttachments.length) return;
    const {gl, width, height} = this;
    this.device.pushState();
    try {
      gl.disable(GL.SCISSOR_TEST);
      gl.bindFramebuffer(GL.READ_FRAMEBUFFER, this.multisampleHandle);
      gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, this.handle);
      const drawBuffers = this.colorAttachments.map((_, index) => GL.COLOR_ATTACHMENT0 + index);
      for (const [index, attachment] of drawBuffers.entries()) {
        gl.readBuffer(attachment);
        gl.drawBuffers(drawBuffers.map((point, slot) => (slot === index ? point : GL.NONE)));
        gl.blitFramebuffer(
          0,
          0,
          width,
          height,
          0,
          0,
          width,
          height,
          GL.COLOR_BUFFER_BIT,
          GL.NEAREST
        );
      }
      gl.drawBuffers(drawBuffers);
    } finally {
      this.device.popState();
    }
  }

  // PRIVATE

  /**
   * @param attachment
   * @param texture
   * @param layer = 0 - index into WEBGLTextureArray and Texture3D or face for `TextureCubeMap`
   * @param level = 0 - mipmapLevel
   */
  protected _attachTextureView(attachment: GL, textureView: WEBGLTextureView): void {
    const {gl} = this.device;
    const {texture} = textureView;
    const level = textureView.props.baseMipLevel;
    const layer = textureView.props.baseArrayLayer;

    gl.bindTexture(texture.glTarget, texture.handle);

    switch (texture.glTarget) {
      case GL.TEXTURE_2D_ARRAY:
      case GL.TEXTURE_3D:
        gl.framebufferTextureLayer(GL.FRAMEBUFFER, attachment, texture.handle, level, layer);
        break;

      case GL.TEXTURE_CUBE_MAP:
        // layer must be a cubemap face (or if index, converted to cube map face)
        const face = mapIndexToCubeMapFace(layer);
        gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, face, texture.handle, level);
        break;

      case GL.TEXTURE_2D:
        gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, texture.handle, level);
        break;

      default:
        throw new Error('Illegal texture type');
    }

    gl.bindTexture(texture.glTarget, null);
  }

  /** Default framebuffer resize is managed by canvas size and should be a no-op. */
  protected override resizeAttachments(width: number, height: number): void {
    if (this.handle === null) {
      this.width = width;
      this.height = height;
      return;
    }

    super.resizeAttachments(width, height);
  }
}

// Helper functions

// Map an index to a cube map face constant
function mapIndexToCubeMapFace(layer: number | GL): GL {
  // TEXTURE_CUBE_MAP_POSITIVE_X is a big value (0x8515)
  // if smaller assume layer is index, otherwise assume it is already a cube map face constant
  return layer < (GL.TEXTURE_CUBE_MAP_POSITIVE_X as number)
    ? layer + GL.TEXTURE_CUBE_MAP_POSITIVE_X
    : layer;
}

// Helper METHODS
// Get a string describing the framebuffer error if installed
function _getFrameBufferStatus(status: GL) {
  switch (status) {
    case GL.FRAMEBUFFER_COMPLETE:
      return 'success';
    case GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return 'Mismatched attachments';
    case GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return 'No attachments';
    case GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return 'Height/width mismatch';
    case GL.FRAMEBUFFER_UNSUPPORTED:
      return 'Unsupported or split attachments';
    // WebGL2
    case GL.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return 'Samples mismatch';
    // OVR_multiview2 extension
    // case GL.FRAMEBUFFER_INCOMPLETE_VIEW_TARGETS_OVR: return 'baseViewIndex mismatch';
    default:
      return `${status}`;
  }
}

/**
 * Attachment resize is expected to be a noop if size is same
 *
protected override resizeAttachments(width: number, height: number): this {
  // for default framebuffer, just update the stored size
  if (this.handle === null) {
    // assert(width === undefined && height === undefined);
    this.width = this.gl.drawingBufferWidth;
    this.height = this.gl.drawingBufferHeight;
    return this;
  }

  if (width === undefined) {
    width = this.gl.drawingBufferWidth;
  }
  if (height === undefined) {
    height = this.gl.drawingBufferHeight;
  }

  // TODO Not clear that this is better than default destroy/create implementation

  for (const colorAttachment of this.colorAttachments) {
    colorAttachment.texture.clone({width, height});
  }
  if (this.depthStencilAttachment) {
    this.depthStencilAttachment.texture.resize({width, height});
  }
  return this;
}
*/
