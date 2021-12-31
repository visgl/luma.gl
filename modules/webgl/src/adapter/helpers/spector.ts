// luma.gl, MIT license
import {log, loadScript} from '@luma.gl/api';
import {document} from 'probe.gl/env';

/** Spector debug initialization options */
type SpectorProps = {
  /** Canvas to monitor */
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  /** Whether debug is enabled. Auto-detected if ommitted */
  debug?: boolean;
  /** Whether spector is disabled */
  spector?: boolean | String | object;
};

// https://github.com/BabylonJS/Spector.js#basic-usage
const SPECTOR_CDN_URL = 'https://spectorcdn.babylonjs.com/spector.bundle.js';
const LOG_LEVEL = 1;

const DEFAULT_SPECTOR_PROPS: SpectorProps = {
  // If URL contains a debug parameter
  debug: document?.location?.search?.includes('debug')
};

let spector = null;

/** Loads spector from CDN if not already installed */
export async function loadSpector(props?: SpectorProps) {
  if (!globalThis.SPECTOR) {
    try {
      const spectorScriptUrl = typeof props?.spector === 'string' ? props.spector : SPECTOR_CDN_URL;
      await loadScript(spectorScriptUrl);
    } catch(error) {
      log.warn(error)
    }
  }
}

export function initializeSpector(props?: SpectorProps) {
  if (!props?.debug || props?.spector === false) {
    return null;
  }

  if (!spector && globalThis.SPECTOR) {
    log.probe(LOG_LEVEL, "SPECTOR found and initialized")();
    spector = new globalThis.SPECTOR.Spector();
    if (globalThis.luma) {
      globalThis.luma.spector = spector;
    }
  }

  if (spector) {
    // Question - does this call add anything beyond explicit captureCanvas call?
    spector.spyCanvases();
    spector?.onCapture.add((capture) => log.info(`Spector:`, capture)()); 
  }

  if (spector && props?.canvas) {
    spector?.captureCanvas(props?.canvas);
    // spector.displayUI()    
  }

  return spector;
}
