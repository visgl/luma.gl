// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test} from 'vitest';
import {getNextKeyboardTab} from '../../website/src/react-luma/components/tab-navigation';

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
