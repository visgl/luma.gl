// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

type WebGLDebugHooksRegistry = {
  webglDeveloperToolsHooks: WebGLDeveloperToolsHooks | null;
  spectorHooks: SpectorHooks | null;
  debugImportWarningShown: boolean;
};

const WEBGL_DEBUG_HOOKS_SYMBOL = Symbol.for('@luma.gl/webgl/debug-hooks');

export function registerWebGLDeveloperTools(hooks: WebGLDeveloperToolsHooks): void {
  getWebGLDebugHooksRegistry().webglDeveloperToolsHooks = hooks;
}

export function registerSpectorJS(hooks: SpectorHooks): void {
  getWebGLDebugHooksRegistry().spectorHooks = hooks;
}

export async function loadRegisteredWebGLDeveloperTools(): Promise<void> {
  const {webglDeveloperToolsHooks} = getWebGLDebugHooksRegistry();
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
  const {webglDeveloperToolsHooks} = getWebGLDebugHooksRegistry();
  if (!webglDeveloperToolsHooks) {
    warnDebugImportRequired();
    return gl;
  }
  return webglDeveloperToolsHooks.makeDebugContext(gl, props);
}

export async function loadRegisteredSpectorJS(props: SpectorProps): Promise<void> {
  const {spectorHooks} = getWebGLDebugHooksRegistry();
  if (!spectorHooks) {
    warnDebugImportRequired();
    return;
  }
  await spectorHooks.load(props);
}

export function initializeRegisteredSpectorJS(props: SpectorProps): Spector | null {
  const {spectorHooks} = getWebGLDebugHooksRegistry();
  return spectorHooks?.initialize(props) || null;
}

function warnDebugImportRequired(): void {
  const registry = getWebGLDebugHooksRegistry();
  if (!registry.debugImportWarningShown) {
    registry.debugImportWarningShown = true;
    log.warn('Import @luma.gl/webgl/debug before enabling WebGL debugging.')();
  }
}

function getWebGLDebugHooksRegistry(): WebGLDebugHooksRegistry {
  const globalRegistry = globalThis as unknown as Record<
    symbol,
    WebGLDebugHooksRegistry | undefined
  >;
  globalRegistry[WEBGL_DEBUG_HOOKS_SYMBOL] ||= {
    webglDeveloperToolsHooks: null,
    spectorHooks: null,
    debugImportWarningShown: false
  };
  return globalRegistry[WEBGL_DEBUG_HOOKS_SYMBOL];
}
