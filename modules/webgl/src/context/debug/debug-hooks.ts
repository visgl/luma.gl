// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {DeviceProps} from '@luma.gl/core';
import {log} from '@luma.gl/core';
import type {Spector} from './spector-types';

type DebugContextProps = {
  debugWebGL?: boolean;
  traceWebGL?: boolean;
};

type SpectorProps = Pick<DeviceProps, 'debugSpectorJS' | 'debugSpectorJSUrl'> & {
  gl?: WebGL2RenderingContext;
};

type WebGLDeveloperToolsHooks = {
  load(): Promise<void>;
  makeDebugContext(gl: WebGL2RenderingContext, props?: DebugContextProps): WebGL2RenderingContext;
};

type SpectorHooks = {
  load(props: SpectorProps): Promise<void>;
  initialize(props: SpectorProps): Spector | null;
};

let webglDeveloperToolsHooks: WebGLDeveloperToolsHooks | null = null;
let spectorHooks: SpectorHooks | null = null;
let debugImportWarningShown = false;

export function registerWebGLDeveloperTools(hooks: WebGLDeveloperToolsHooks): void {
  webglDeveloperToolsHooks = hooks;
}

export function registerSpectorJS(hooks: SpectorHooks): void {
  spectorHooks = hooks;
}

export async function loadRegisteredWebGLDeveloperTools(): Promise<void> {
  if (!webglDeveloperToolsHooks) {
    warnDebugImportRequired();
    return;
  }
  await webglDeveloperToolsHooks.load();
}

export function makeRegisteredDebugContext(
  gl: WebGL2RenderingContext,
  props: DebugContextProps
): WebGL2RenderingContext {
  if (!webglDeveloperToolsHooks) {
    warnDebugImportRequired();
    return gl;
  }
  return webglDeveloperToolsHooks.makeDebugContext(gl, props);
}

export async function loadRegisteredSpectorJS(props: SpectorProps): Promise<void> {
  if (!spectorHooks) {
    warnDebugImportRequired();
    return;
  }
  await spectorHooks.load(props);
}

export function initializeRegisteredSpectorJS(props: SpectorProps): Spector | null {
  return spectorHooks?.initialize(props) || null;
}

function warnDebugImportRequired(): void {
  if (!debugImportWarningShown) {
    debugImportWarningShown = true;
    log.warn('Import @luma.gl/webgl/debug before enabling WebGL debugging.')();
  }
}
