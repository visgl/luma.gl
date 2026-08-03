// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

type WebGL1CompatibilityHooks = {
  enforceWebGL2(enable?: boolean): void;
};

const WEBGL1_COMPATIBILITY_HOOKS_SYMBOL = Symbol.for('@luma.gl/webgl/webgl1-compatibility-hooks');

export function registerWebGL1Compatibility(hooks: WebGL1CompatibilityHooks): void {
  getGlobalHooksRegistry()[WEBGL1_COMPATIBILITY_HOOKS_SYMBOL] = hooks;
}

export function enforceRegisteredWebGL2(enable: boolean): void {
  const webgl1CompatibilityHooks = getGlobalHooksRegistry()[WEBGL1_COMPATIBILITY_HOOKS_SYMBOL];
  if (!webgl1CompatibilityHooks) {
    // Preload @luma.gl/webgl/webgl1 before using the legacy luma.enforceWebGL2() facade.
    throw new Error('WebGL1 compatibility not registered');
  }
  webgl1CompatibilityHooks.enforceWebGL2(enable);
}

function getGlobalHooksRegistry(): Record<symbol, WebGL1CompatibilityHooks | undefined> {
  return globalThis as unknown as Record<symbol, WebGL1CompatibilityHooks | undefined>;
}
