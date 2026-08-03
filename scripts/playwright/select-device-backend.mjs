const DEVICE_TAB_LABELS = {
  'webgpu-core': 'WebGPU',
  'webgpu-max': 'WebGPU',
  'webgpu-compatibility': 'WebGPU',
  webgl: 'WebGL2',
  webgl2: 'WebGL2',
  webgpu: 'WebGPU'
};
const SELECTED_DEVICE_TAB_ATTRIBUTE = 'data-luma-device-tab-selected';
const DEVICE_TAB_READY_TIMEOUT_MILLISECONDS = 15_000;

export function normalizeBackend(backend) {
  if (!backend) {
    return null;
  }

  const normalizedBackend = backend.toLowerCase();
  switch (normalizedBackend) {
    case 'webgl':
    case 'webgl2':
      return 'webgl';
    case 'webgpu':
    case 'webgpu-core':
    case 'core':
      return 'webgpu-core';
    case 'webgpu-max':
    case 'max':
      return 'webgpu-max';
    case 'webgpu-compatibility':
      return 'webgpu-compatibility';
    default:
      return normalizedBackend;
  }
}

export async function selectDeviceBackend(page, backend) {
  const normalizedBackend = normalizeBackend(backend);
  if (!normalizedBackend) {
    return false;
  }

  const tabLabel = DEVICE_TAB_LABELS[normalizedBackend];
  if (!tabLabel) {
    throw new Error(`Unsupported backend "${backend}"`);
  }

  const tabSelector = `[data-luma-device-tab="${normalizedBackend}"]`;
  if (typeof page.waitForSelector === 'function') {
    await page
      .waitForSelector(tabSelector, {
        state: 'attached',
        timeout: DEVICE_TAB_READY_TIMEOUT_MILLISECONDS
      })
      .catch(() => {});
    await page
      .waitForFunction(
        selector =>
          document.querySelector(selector)?.getAttribute('aria-disabled') !== 'true',
        tabSelector,
        {timeout: DEVICE_TAB_READY_TIMEOUT_MILLISECONDS}
      )
      .catch(() => {});
  }

  const tab = page.locator(tabSelector);
  if ((await tab.count()) === 0) {
    return false;
  }

  // Some MDX pages render a standalone ExampleHeader before LumaExample's own header. The later
  // tab is the topmost interactive copy; clicking the first one is intercepted by that overlay.
  const deviceTab = tab.last();
  if (await isDisabledDeviceTab(deviceTab)) {
    return false;
  }

  if (await isSelectedDeviceTab(deviceTab)) {
    return true;
  }

  await deviceTab.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page
    .waitForFunction(
      selectedBackend =>
        document
          .querySelector(`[data-luma-device-tab="${selectedBackend}"]`)
          ?.getAttribute('data-luma-device-tab-selected') === 'true',
      normalizedBackend,
      {timeout: 5000}
    )
    .catch(() => {});
  return await isSelectedDeviceTab(deviceTab);
}

export async function selectPreferredDeviceBackend(page, preferredBackend = 'webgpu') {
  const normalizedPreferredBackend = normalizeBackend(preferredBackend) || 'webgpu';
  const orderedBackends =
    normalizedPreferredBackend === 'webgl'
      ? ['webgl', 'webgpu-core', 'webgpu-compatibility']
      : [normalizedPreferredBackend, 'webgpu-core', 'webgpu-compatibility', 'webgl'].filter(
          (backend, index, array) => array.indexOf(backend) === index
        );

  for (const backend of orderedBackends) {
    if (await selectDeviceBackend(page, backend)) {
      return backend;
    }
  }

  return null;
}

async function isDisabledDeviceTab(tab) {
  return (await tab.getAttribute('aria-disabled')) === 'true';
}

async function isSelectedDeviceTab(tab) {
  return (await tab.getAttribute(SELECTED_DEVICE_TAB_ATTRIBUTE)) === 'true';
}
