import { GL } from '@luma.gl/constants';
import { flipRows, scalePixels } from './pixel-data-utils';
/**
 * Reads pixels from a Framebuffer or Texture object into an HTML Image
 * @todo - can we move this to @luma.gl/core?
 * @param source
 * @param options options passed to copyToDataUrl
 * @returns
 */
export function copyTextureToImage(source, options) {
    const dataUrl = copyTextureToDataUrl(source, options);
    const targetImage = options?.targetImage || new Image();
    targetImage.src = dataUrl;
    return targetImage;
}
/**
 * Reads pixels from a Framebuffer or Texture object to a dataUrl
 * @todo - can we move this to @luma.gl/core?
 * @param source texture or framebuffer to read from
 * @param options
 */
export function copyTextureToDataUrl(source, options = {}) {
    const { sourceAttachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    targetMaxHeight = Number.MAX_SAFE_INTEGER } = options;
    let data = source.device.readPixelsToArrayWebGL(source, { sourceAttachment });
    // Scale down
    let { width, height } = source;
    while (height > targetMaxHeight) {
        ({ data, width, height } = scalePixels({ data, width, height }));
    }
    // Flip to top down coordinate system
    flipRows({ data, width, height });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    // Copy the pixels to a 2D canvas
    const imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}
