// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {loadScript} from '../../utils/load-script';

import type {Spector} from './spector-types';

/** Spector debug initialization options */
type SpectorProps = {
  /** Whether spector.js is enabled */
  debugSpectorJS?: boolean;
  /** URL to load spector script from. Typically a CDN URL */
  debugSpectorJSUrl?: string;
  /** Canvas to monitor */
  gl?: WebGL2RenderingContext;
};

const LOG_LEVEL = 1;

let spector: Spector = null;
let initialized: boolean = false;

declare global {
  // @ts-ignore
  // eslint-disable-next-line no-var
  var SPECTOR: Spector;
}

export const DEFAULT_SPECTOR_PROPS: Required<SpectorProps> = {
  debugSpectorJS: log.get('debug-spectorjs'),
  // https://github.com/BabylonJS/Spector.js#basic-usage
  // https://forum.babylonjs.com/t/spectorcdn-is-temporarily-off/48241
  // spectorUrl: 'https://spectorcdn.babylonjs.com/spector.bundle.js';
  debugSpectorJSUrl: 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js',
  gl: undefined!
};

/** Loads spector from CDN if not already installed */
export async function loadSpectorJS(props: {debugSpectorJSUrl?: string}): Promise<void> {
  if (!globalThis.SPECTOR) {
    try {
      await loadScript(props.debugSpectorJSUrl || DEFAULT_SPECTOR_PROPS.debugSpectorJSUrl);
    } catch (error) {
      log.warn(String(error));
    }
  }
}

export function initializeSpectorJS(props: SpectorProps): Spector | null {
  props = {...DEFAULT_SPECTOR_PROPS, ...props};
  if (!props.debugSpectorJS) {
    return null;
  }

  if (!spector && globalThis.SPECTOR && !globalThis.luma?.spector) {
    log.probe(LOG_LEVEL, 'SPECTOR found and initialized. Start with `luma.spector.displayUI()`')();
    const {Spector: SpectorJS} = globalThis.SPECTOR as any;
    spector = new SpectorJS();
    if (globalThis.luma) {
      (globalThis.luma as any).spector = spector;
    }
  }

  if (!spector) {
    return null;
  }

  if (!initialized) {
    initialized = true;

    // enables recording some extra information merged in the capture like texture memory sizes and formats
    spector.spyCanvases();
    // A callback when results are ready
    spector?.onCaptureStarted.add((capture: unknown) =>
      log.info('Spector capture started:', capture)()
    );
    spector?.onCapture.add((capture: unknown) => {
      log.info('Spector capture complete:', capture)();
      // Use undocumented Spector API to open the UI with our capture
      // See https://github.com/BabylonJS/Spector.js/blob/767ad1195a25b85a85c381f400eb50a979239eca/src/spector.ts#L124
      spector?.getResultUI();
      // @ts-expect-error private
      spector?.resultView.display();
      // @ts-expect-error private
      spector?.resultView.addCapture(capture);
    });
  }

  if (props.gl) {
    // capture startup
    const gl = props.gl;
    // @ts-expect-error
    const device = gl.device;
    spector?.startCapture(props.gl, 500); // 500 commands
    // @ts-expect-error
    gl.device = device;

    new Promise(resolve => setTimeout(resolve, 2000)).then(_ => {
      log.info('Spector capture stopped after 2 seconds')();
      spector?.stopCapture();
      // spector?.displayUI();
    });
  }

  return spector;
}
