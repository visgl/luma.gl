// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';

type LogRegistry = {
  implementation: Log | null;
  settings: Record<string, unknown>;
  level: number;
};

const LOG_REGISTRY_SYMBOL = Symbol.for('@luma.gl/core/log-registry');
const NOOP_LOG = () => NOOP_LOG;

const fallbackLog = {
  id: 'luma.gl',
  VERSION: '0.0.0',
  userData: {},
  get level(): number {
    return getLogRegistry().level;
  },
  set level(level: number) {
    getLogRegistry().level = level;
  },
  get priority(): number {
    return getLogRegistry().level;
  },
  set priority(level: number) {
    getLogRegistry().level = level;
  },
  isEnabled(): boolean {
    return getLogRegistry().settings['enabled'] !== false;
  },
  getLevel(): number {
    return getLogRegistry().level;
  },
  getTotal(): number {
    return 0;
  },
  getDelta(): number {
    return 0;
  },
  enable(enabled: boolean = true): Log {
    getLogRegistry().settings['enabled'] = enabled;
    return log;
  },
  setLevel(level: number): Log {
    getLogRegistry().level = level;
    return log;
  },
  get(setting: string): unknown {
    return setting === 'level' ? getLogRegistry().level : getLogRegistry().settings[setting];
  },
  set(setting: string, value: unknown): void {
    getLogRegistry().settings[setting] = value;
  },
  assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  },
  withGroup(_logLevel: number, _message: string, func: () => void): void {
    func();
  }
};

/** Global logging facade. Import `@luma.gl/core/diagnostics` to install Probe logging. */
export const log = new Proxy(fallbackLog, {
  get(target, property): unknown {
    const implementation = getLogRegistry().implementation;
    const source = implementation || target;
    const value = Reflect.get(source, property, source);
    return typeof value === 'function' ? value.bind(source) : (value ?? NOOP_LOG);
  },
  set(target, property, value): boolean {
    const implementation = getLogRegistry().implementation;
    return Reflect.set(implementation || target, property, value);
  }
}) as unknown as Log;

/** Install a full logging implementation behind the stable facade. */
export function registerLogImplementation(implementation: Log): void {
  const registry = getLogRegistry();
  implementation.level = registry.level;
  for (const [setting, value] of Object.entries(registry.settings)) {
    implementation.set(setting, value);
  }
  registry.implementation = implementation;
}

function getLogRegistry(): LogRegistry {
  const globalRegistry = globalThis as unknown as Record<symbol, LogRegistry | undefined>;
  globalRegistry[LOG_REGISTRY_SYMBOL] ||= {implementation: null, settings: {}, level: 0};
  return globalRegistry[LOG_REGISTRY_SYMBOL];
}
