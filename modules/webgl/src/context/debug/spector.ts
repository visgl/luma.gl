// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log, loadScript} from '@luma.gl/core';

/** Spector debug initialization options */
type SpectorProps = {
  /** Canvas to monitor */
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  /** Whether debug is enabled. Auto-detected if ommitted */
  debug?: boolean;
  /** Whether spector is disabled */
  spector?: boolean | string | object;
};

const DEFAULT_SPECTOR_PROPS: SpectorProps = {
  spector: log.get('spector') || log.get('spectorjs')
};

// https://github.com/BabylonJS/Spector.js#basic-usage
const SPECTOR_CDN_URL = 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js';
const LOG_LEVEL = 1;

let spector: any = null;
let initialized: boolean = false;

declare global {
  // eslint-disable-next-line no-var
  var SPECTOR: any;
}

/** Loads spector from CDN if not already installed */
export async function loadSpectorJS(props?: SpectorProps) {
  if (!globalThis.SPECTOR) {
    try {
      await loadScript(SPECTOR_CDN_URL);
    } catch (error) {
      log.warn(String(error));
    }
  }
}

export function initializeSpectorJS(props?: SpectorProps) {
  props = {...DEFAULT_SPECTOR_PROPS, ...props};
  if (!props?.spector) {
    return null;
  }

  if (!spector && globalThis.SPECTOR) {
    log.probe(LOG_LEVEL, 'SPECTOR found and initialized')();
    spector = new globalThis.SPECTOR.Spector();
    if (globalThis.luma) {
      globalThis.luma.spector = spector;
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
      spector?.resultView.display();
      spector?.resultView.addCapture(capture);
    });
  }

  if (props?.canvas) {
    // @ts-expect-error If spector is specified as a canvas id, only monitor that canvas
    if (typeof props.spector === 'string' && props.spector !== props.canvas.id) {
      return spector;
    }

    // capture startup
    // spector?.captureCanvas(props?.canvas);
    spector?.startCapture(props?.canvas, 500); // 500 commands
    new Promise(resolve => setTimeout(resolve, 2000)).then(_ => {
      log.info('Spector capture stopped after 2 seconds')();
      spector?.stopCapture();
      // spector?.displayUI();
    });
  }

  return spector;
}
