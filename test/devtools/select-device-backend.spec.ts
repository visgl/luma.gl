import {describe, expect, test} from 'vitest';

import {
  selectDeviceBackend,
  selectPreferredDeviceBackend
} from '../../dev-modules/devtools-extensions/playwright/select-device-backend.mjs';

describe('selectDeviceBackend', () => {
  test('returns false when a rendered device tab is disabled', async () => {
    const page = makeDeviceTabsPage({
      'webgpu-max': {disabled: true}
    });

    expect(await selectDeviceBackend(page, 'webgpu-max')).toBe(false);
    expect(page.getTab('webgpu-max').clickCount).toBe(0);
  });
});

describe('selectPreferredDeviceBackend', () => {
  test('falls back when the requested max WebGPU tab is disabled', async () => {
    const page = makeDeviceTabsPage({
      'webgpu-max': {disabled: true},
      'webgpu-core': {},
      webgl: {}
    });

    expect(await selectPreferredDeviceBackend(page, 'webgpu-max')).toBe('webgpu-core');
    expect(page.getTab('webgpu-max').clickCount).toBe(0);
    expect(page.getTab('webgpu-core').selected).toBe(true);
  });
});

type DeviceTabState = {
  clickCount: number;
  disabled: boolean;
  selected: boolean;
};

function makeDeviceTabsPage(
  tabs: Partial<Record<string, Partial<Omit<DeviceTabState, 'clickCount'>>>>
) {
  const tabStates = new Map<string, DeviceTabState>();
  for (const [backend, tab] of Object.entries(tabs)) {
    tabStates.set(backend, {
      clickCount: 0,
      disabled: false,
      selected: false,
      ...tab
    });
  }

  return {
    getTab(backend: string): DeviceTabState {
      const tab = tabStates.get(backend);
      if (!tab) {
        throw new Error(`Missing test tab "${backend}"`);
      }
      return tab;
    },
    locator(selector: string) {
      const backend = selector.match(/data-luma-device-tab="([^"]+)"/)?.[1];
      return makeDeviceTabLocator(backend ? tabStates.get(backend) : undefined, tabStates);
    },
    async waitForFunction(
      _predicate: unknown,
      backend: string,
      _options: {timeout: number}
    ): Promise<void> {
      if (!tabStates.get(backend)?.selected) {
        throw new Error(`Device tab "${backend}" was not selected`);
      }
    },
    async waitForLoadState(): Promise<void> {}
  };
}

function makeDeviceTabLocator(
  tab: DeviceTabState | undefined,
  tabStates: Map<string, DeviceTabState>
) {
  return {
    async count(): Promise<number> {
      return tab ? 1 : 0;
    },
    first() {
      return this;
    },
    async click(): Promise<void> {
      if (!tab) {
        throw new Error('Cannot click a missing device tab');
      }
      tab.clickCount++;
      if (tab.disabled) {
        return;
      }
      for (const nextTab of tabStates.values()) {
        nextTab.selected = false;
      }
      tab.selected = true;
    },
    async getAttribute(attributeName: string): Promise<string | null> {
      if (!tab) {
        return null;
      }
      if (attributeName === 'aria-disabled') {
        return tab.disabled ? 'true' : null;
      }
      if (attributeName === 'data-luma-device-tab-selected') {
        return tab.selected ? 'true' : null;
      }
      return null;
    }
  };
}
