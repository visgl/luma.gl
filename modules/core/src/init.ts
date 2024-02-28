// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@probe.gl/env';
import {log} from './utils/log';
import {lumaStats} from './utils/stats-manager';

declare global {
  // eslint-disable-next-line no-var
  var luma: any;
}

/**
 * By adding the result of init() to Device.VERSION we guarantee it will be called
 * @returns version
 */
function initializeLuma(): string {
  // Version detection using babel plugin
  // @ts-expect-error
  const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'running from source';

  const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';
  // Assign luma.log.level in console to control logging: \
  // 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
  // luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

  if (globalThis.luma && globalThis.luma.VERSION !== VERSION) {
    throw new Error(
      `luma.gl - multiple VERSIONs detected: ${globalThis.luma.VERSION} vs ${VERSION}`
    );
  }

  if (!globalThis.luma) {
    if (isBrowser()) {
      log.log(1, `${VERSION} - ${STARTUP_MESSAGE}`)();
    }

    globalThis.luma = globalThis.luma || {
      VERSION,
      version: VERSION,
      log,

      // A global stats object that various components can add information to
      // E.g. see webgl/resource.js
      stats: lumaStats
    };
  }

  return VERSION;
}

export const VERSION = initializeLuma();
