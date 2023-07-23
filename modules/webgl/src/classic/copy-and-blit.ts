// luma.gl, MIT license
import {assert, Texture, Framebuffer, FramebufferProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';

import {ClassicBuffer as Buffer} from './buffer';
import {WEBGLTexture}  from  '../adapter/resources/webgl-texture';
import {WEBGLFramebuffer} from '../adapter/resources/webgl-framebuffer';
import {withParameters} from '../context/state-tracker/with-parameters';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from './typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from './format-utils';

/**
 * Copies data from a type  or a Texture object into ArrayBuffer object.
 * App can provide targetPixelArray or have it auto allocated by this method
 *  newly allocated by this method unless provided by app.
 * @deprecated Use CommandEncoder.copyTextureToBuffer and Buffer.read
 * @note Slow requires roundtrip to GPU
 *
 * @param source
 * @param options
 * @returns pixel array,
 */
export function readPixelsToArray(
  source: Framebuffer | Texture,
  options?: {
    sourceX?: number;
    sourceY?: number;
    sourceFormat?: number;
    sourceAttachment?: number;
    target?: Uint8Array | Uint16Array | Float32Array;
    // following parameters are auto deduced if not provided
    sourceWidth?: number;
    sourceHeight?: number;
    sourceType?: number;
  }
): Uint8Array | Uint16Array | Float32Array {
  const {sourceX = 0, sourceY = 0, sourceFormat = GL.RGBA} = options || {};
  let {
    sourceAttachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    target = null,
    // following parameters are auto deduced if not provided
    sourceWidth,
    sourceHeight,
    sourceType
  } = options || {};

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const {gl, handle} = framebuffer as WEBGLFramebuffer;
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // TODO - Set and unset gl.readBuffer
  if (sourceAttachment === GL.COLOR_ATTACHMENT0 && handle === null) {
    sourceAttachment = GL.FRONT;
  }

  const attachment = sourceAttachment - GL.COLOR_ATTACHMENT0;
  // assert(attachments[sourceAttachment]);

  // Deduce the type from color attachment if not provided.
  sourceType = sourceType || (framebuffer.colorAttachments[attachment] as WEBGLTexture).type;

  // Deduce type and allocated pixelArray if needed
  target = getPixelArray(target, sourceType, sourceFormat, sourceWidth, sourceHeight);

  // Pixel array available, if necessary, deduce type from it.
  sourceType = sourceType || getGLTypeFromTypedArray(target);

  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  gl.readPixels(sourceX, sourceY, sourceWidth, sourceHeight, sourceFormat, sourceType, target);
  // @ts-expect-error
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) {
    framebuffer.destroy();
  }
  return target;
}

/**
 * Copies data from a Framebuffer or a Texture object into a Buffer object.
 * NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
 * @param source
 * @param options
 */
export function readPixelsToBuffer(
  source: Framebuffer | Texture,
  options?: {
    sourceX?: number;
    sourceY?: number;
    sourceFormat?: number;
    target?: Buffer; // A new Buffer object is created when not provided.
    targetByteOffset?: number; // byte offset in buffer object
    // following parameters are auto deduced if not provided
    sourceWidth?: number;
    sourceHeight?: number;
    sourceType?: number;
  }
): Buffer {
  const {sourceX = 0, sourceY = 0, sourceFormat = GL.RGBA, targetByteOffset = 0} = options || {};
  // following parameters are auto deduced if not provided
  let {target, sourceWidth, sourceHeight, sourceType} = options || {};
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // Asynchronous read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  const webglFramebuffer = framebuffer as WEBGLFramebuffer;
  const gl2 = webglFramebuffer.device.assertWebGL2();

  // deduce type if not available.
  sourceType = sourceType || (target ? target.type : GL.UNSIGNED_BYTE);

  if (!target) {
    // Create new buffer with enough size
    const components = glFormatToComponents(sourceFormat);
    const byteCount = glTypeToBytes(sourceType);
    const byteLength = targetByteOffset + sourceWidth * sourceHeight * components * byteCount;
    target = new Buffer(gl2, {byteLength, accessor: {type: sourceType, size: components}});
  }

  // @ts-expect-error
  target.bind({target: GL.PIXEL_PACK_BUFFER});
  withParameters(gl2, {framebuffer}, () => {
    gl2.readPixels(
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      sourceFormat,
      sourceType,
      targetByteOffset
    );
  });
  target.unbind({target: GL.PIXEL_PACK_BUFFER});
  if (deleteFramebuffer) {
    framebuffer.destroy();
  }

  return target;
}

function getFramebuffer(source: Texture | Framebuffer): {
  framebuffer: Framebuffer;
  deleteFramebuffer: boolean;
} {
  if (!(source instanceof Framebuffer)) {
    return {framebuffer: toFramebuffer(source), deleteFramebuffer: true};
  }
  return {framebuffer: source, deleteFramebuffer: false};
}

/**
 * Wraps a given texture into a framebuffer object, that can be further used
 * to read data from the texture object.
 */
export function toFramebuffer(texture: Texture, props?: FramebufferProps): Framebuffer {
  const {device, width, height, id} = texture;
  const framebuffer = device.createFramebuffer({
    ...props,
    id: `framebuffer-for-${id}`,
    width,
    height,
    colorAttachments: [
      texture
    ]
  }
  );
  return framebuffer;
}

function getPixelArray(
  pixelArray,
  type,
  format,
  width: number,
  height: number
): Uint8Array | Uint16Array | Float32Array {
  if (pixelArray) {
    return pixelArray;
  }
  // Allocate pixel array if not already available, using supplied type
  type = type || GL.UNSIGNED_BYTE;
  const ArrayType = getTypedArrayFromGLType(type, {clamped: false});
  const components = glFormatToComponents(format);
  // TODO - check for composite type (components = 1).
  return new ArrayType(width * height * components) as Uint8Array | Uint16Array | Float32Array;
}
