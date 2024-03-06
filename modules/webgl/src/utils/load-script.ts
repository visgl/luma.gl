// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
