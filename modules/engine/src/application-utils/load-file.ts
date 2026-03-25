// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

let pathPrefix = '';

/**
 * Set a relative path prefix
 */
export function setPathPrefix(prefix: string) {
  pathPrefix = prefix;
}

/**
 * Loads ImageBitmap asynchronously. Respects setPathPrefix.
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * @returns a promise tracking the load
 */
export async function loadImageBitmap(
  url: string,
  opts?: {crossOrigin?: string} & ImageBitmapOptions
): Promise<ImageBitmap> {
  const image = new Image();
  const resolvedUrl = url.startsWith('http') ? url : pathPrefix + url;
  image.crossOrigin = opts?.crossOrigin || 'anonymous';
  image.src = resolvedUrl;

  try {
    await image.decode();
  } catch (error) {
    throw createImageBitmapLoadError('decode', resolvedUrl, error);
  }

  try {
    return opts ? await createImageBitmap(image, opts) : await createImageBitmap(image);
  } catch (error) {
    throw createImageBitmapLoadError('create', resolvedUrl, error);
  }
}

/**
 * Loads image asynchronously. Respects setPathPrefix.
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * @returns a promise tracking the load
 * @deprecated Use `loadImageBitmap()` unless you are supporting old versions of Safari.
 */
export async function loadImage(
  url: string,
  opts?: {crossOrigin?: string}
): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}.`));
      image.crossOrigin = opts?.crossOrigin || 'anonymous';
      image.src = url.startsWith('http') ? url : pathPrefix + url;
    } catch (error) {
      reject(error);
    }
  });
}

function createImageBitmapLoadError(
  phase: 'decode' | 'create',
  resolvedUrl: string,
  error: unknown
): Error {
  const reason = error instanceof Error ? error.message : String(error);
  const phaseLabel =
    phase === 'decode' ? 'decode source image' : 'create ImageBitmap from decoded image';
  return new Error(`Could not ${phaseLabel} "${resolvedUrl}": ${reason}`);
}
