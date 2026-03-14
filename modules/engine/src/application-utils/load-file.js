// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
let pathPrefix = '';
/**
 * Set a relative path prefix
 */
export function setPathPrefix(prefix) {
    pathPrefix = prefix;
}
/**
 * Loads ImageBitmap asynchronously. Respects setPathPrefix.
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * @returns a promise tracking the load
 */
export async function loadImageBitmap(url, opts) {
    const image = new Image();
    image.crossOrigin = opts?.crossOrigin || 'anonymous';
    image.src = url.startsWith('http') ? url : pathPrefix + url;
    await image.decode();
    return opts ? await createImageBitmap(image, opts) : await createImageBitmap(image);
}
/**
 * Loads image asynchronously. Respects setPathPrefix.
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * @returns a promise tracking the load
 * @deprecated Use `loadImageBitmap()` unless you are supporting old versions of Safari.
 */
export async function loadImage(url, opts) {
    return await new Promise((resolve, reject) => {
        try {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Could not load image ${url}.`));
            image.crossOrigin = opts?.crossOrigin || 'anonymous';
            image.src = url.startsWith('http') ? url : pathPrefix + url;
        }
        catch (error) {
            reject(error);
        }
    });
}
