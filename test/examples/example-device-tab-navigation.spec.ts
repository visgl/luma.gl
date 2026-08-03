// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  getNextKeyboardTab,
  handleKeyboardTabNavigation
} from '../../website/src/react-luma/components/tab-navigation';

let tabList: HTMLDivElement | null = null;

afterEach(() => {
  tabList?.remove();
  tabList = null;
});

describe('example graphics backend keyboard navigation', () => {
  test('moves right past unavailable backends to the next enabled backend', () => {
    const [firstTab, , lastTab] = makeBackendTabs();

    expect(getNextKeyboardTab(firstTab, 'ArrowRight')).toBe(lastTab);
  });

  test('wraps in both directions without focusing unavailable backends', () => {
    const [firstTab, , lastTab] = makeBackendTabs();

    expect(getNextKeyboardTab(firstTab, 'ArrowLeft')).toBe(lastTab);
    expect(getNextKeyboardTab(lastTab, 'ArrowRight')).toBe(firstTab);
  });

  test('supports Home and End for first and last enabled backends', () => {
    const [firstTab, , lastTab] = makeBackendTabs();

    expect(getNextKeyboardTab(firstTab, 'End')).toBe(lastTab);
    expect(getNextKeyboardTab(lastTab, 'Home')).toBe(firstTab);
  });

  test('ignores unrelated keys, unavailable tabs, and detached buttons', () => {
    const [firstTab, disabledTab] = makeBackendTabs();
    const detachedButton = document.createElement('button');

    expect(getNextKeyboardTab(firstTab, 'Tab')).toBeNull();
    expect(getNextKeyboardTab(disabledTab, 'ArrowRight')).toBeNull();
    expect(getNextKeyboardTab(detachedButton, 'ArrowRight')).toBeNull();
  });

  test.each([
    ['Home', 'webgpu-core'],
    ['End', 'webgl']
  ])('prevents %s without reactivating the already targeted backend', (pressedKey, backend) => {
    const onSelection = vi.fn();
    const [firstTab, , lastTab] = renderInteractiveBackendTabs({
      selectedBackend: backend,
      onSelection
    });
    const currentTab = backend === 'webgpu-core' ? firstTab : lastTab;
    currentTab.focus();
    const focus = vi.spyOn(currentTab, 'focus');
    const click = vi.spyOn(currentTab, 'click');

    const keyboardEvent = pressNavigationKey(currentTab, pressedKey);

    expect(keyboardEvent.defaultPrevented).toBe(true);
    expect(focus).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(onSelection).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(currentTab);
  });

  test.each([
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End'
  ])('prevents %s without reactivating the only available backend', pressedKey => {
    const onSelection = vi.fn();
    const [onlyEnabledTab, unavailableWebGPU, unavailableWebGL] = renderInteractiveBackendTabs({
      enabledBackends: ['webgpu-core'],
      onSelection
    });
    onlyEnabledTab.focus();
    const focus = vi.spyOn(onlyEnabledTab, 'focus');
    const click = vi.spyOn(onlyEnabledTab, 'click');

    const keyboardEvent = pressNavigationKey(onlyEnabledTab, pressedKey);

    expect(keyboardEvent.defaultPrevented).toBe(true);
    expect(focus).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(onSelection).not.toHaveBeenCalled();
    expect(onlyEnabledTab.tabIndex).toBe(0);
    expect(unavailableWebGPU.tabIndex).toBe(-1);
    expect(unavailableWebGL.tabIndex).toBe(-1);
  });

  test('moves focus and selection once while skipping disabled tabs and updating roving focus', () => {
    const onSelection = vi.fn();
    const [firstTab, disabledTab, lastTab] = renderInteractiveBackendTabs({onSelection});
    firstTab.focus();

    const keyboardEvent = pressNavigationKey(firstTab, 'ArrowRight');

    expect(keyboardEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(lastTab);
    expect(onSelection).toHaveBeenCalledExactlyOnceWith('webgl');
    expect(firstTab.tabIndex).toBe(-1);
    expect(disabledTab.tabIndex).toBe(-1);
    expect(lastTab.tabIndex).toBe(0);
    expect(lastTab.getAttribute('aria-selected')).toBe('true');
  });

  test('leaves native Tab handling untouched', () => {
    const onSelection = vi.fn();
    const [firstTab] = renderInteractiveBackendTabs({onSelection});
    firstTab.focus();

    const keyboardEvent = pressNavigationKey(firstTab, 'Tab');

    expect(keyboardEvent.defaultPrevented).toBe(false);
    expect(onSelection).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(firstTab);
  });
});

function makeBackendTabs(): [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement] {
  tabList = document.createElement('div');
  tabList.setAttribute('role', 'tablist');
  document.body.appendChild(tabList);

  const backends = ['webgpu-core', 'webgpu-max', 'webgl'].map((backend, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = index === 1;
    button.setAttribute('role', 'tab');
    button.setAttribute('data-luma-device-tab', backend);
    tabList?.appendChild(button);
    return button;
  });

  return backends as [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement];
}

function renderInteractiveBackendTabs({
  selectedBackend = 'webgpu-core',
  enabledBackends = ['webgpu-core', 'webgl'],
  onSelection
}: {
  selectedBackend?: string;
  enabledBackends?: string[];
  onSelection?: (selectedBackend: string) => void;
} = {}): [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement] {
  const backendTabs = makeBackendTabs();

  for (const backendTab of backendTabs) {
    const backend = backendTab.getAttribute('data-luma-device-tab') || '';
    backendTab.disabled = !enabledBackends.includes(backend);
    backendTab.tabIndex = backend === selectedBackend && !backendTab.disabled ? 0 : -1;
    backendTab.setAttribute('aria-selected', String(backend === selectedBackend));
    backendTab.addEventListener('keydown', keyboardEvent => {
      handleKeyboardTabNavigation({
        currentTarget: backendTab,
        key: keyboardEvent.key,
        preventDefault: () => keyboardEvent.preventDefault()
      });
    });
    backendTab.addEventListener('click', () => {
      onSelection?.(backend);
      for (const otherBackendTab of backendTabs) {
        const isSelected = otherBackendTab === backendTab;
        otherBackendTab.tabIndex = isSelected ? 0 : -1;
        otherBackendTab.setAttribute('aria-selected', String(isSelected));
      }
    });
  }

  return backendTabs;
}

function pressNavigationKey(currentTab: HTMLButtonElement, pressedKey: string): KeyboardEvent {
  const keyboardEvent = new KeyboardEvent('keydown', {
    key: pressedKey,
    bubbles: true,
    cancelable: true
  });

  currentTab.dispatchEvent(keyboardEvent);

  return keyboardEvent;
}
