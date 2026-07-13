// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Read a fixture synchronously in either Node.js or a browser-backed Vitest project. */
export function loadBinaryFixture(url: URL): Uint8Array {
  if (url.protocol === 'file:') {
    const fileSystem = process.getBuiltinModule('node:fs');
    return fileSystem.readFileSync(url);
  }

  const request = new XMLHttpRequest();
  request.open('GET', url.href, false);
  request.overrideMimeType('text/plain; charset=x-user-defined');
  request.send();
  if (request.status < 200 || request.status >= 300) {
    throw new Error(`Failed to load fixture ${url.href}: HTTP ${request.status}`);
  }
  const responseText = request.responseText;
  const bytes = new Uint8Array(responseText.length);
  for (let index = 0; index < responseText.length; index++) {
    bytes[index] = responseText.charCodeAt(index) & 0xff;
  }
  return bytes;
}
