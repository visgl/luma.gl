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
 * Reads raw file data. Respects setPathPrefix.
 */
export async function loadFile(
  url: string,
  options?: {dataType?: 'text' | 'arrayBuffer'} & RequestInit
): Promise<any> {
  url = url.startsWith('http') ? url : pathPrefix + url;
  const dataType = options?.dataType || 'text';
  const response = await fetch(url, options);
  return await response[dataType]();
}

/**
 * Loads ImageBitmap asynchronously. Respects setPathPrefix.
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * @returns a promise tracking the load
 */
export async function loadImageBitmap(
  url: string,
  opts?: {crossOrigin?: string}
): Promise<ImageBitmap> {
  const image = new Image();
  image.crossOrigin = opts?.crossOrigin || 'anonymous';
  image.src = url.startsWith('http') ? url : pathPrefix + url;
  await image.decode();
  return await createImageBitmap(image);
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

/**
 * Load a script (identified by an url). When the url returns, the
 * content of this file is added into a new script element, attached to the DOM (body element)
 * @param scriptUrl defines the url of the script to laod
 * @param scriptId defines the id of the script element
 */
export async function loadScript(scriptUrl: string, scriptId?: string): Promise<Event> {
  const head = document.getElementsByTagName('head')[0];
  if (!head) {
    throw new Error('loadScript');
  }

  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', scriptUrl);
  if (scriptId) {
    script.id = scriptId;
  }

  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = error =>
      reject(new Error(`Unable to load script '${scriptUrl}': ${error as string}`));
    head.appendChild(script);
  });
}
