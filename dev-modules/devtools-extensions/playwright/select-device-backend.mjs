const DEVICE_TAB_LABELS = {
  'webgpu-core': 'WebGPU',
  'webgpu-max': 'WebGPU',
  'webgpu-compatibility': 'WebGPU',
  webgl: 'WebGL2',
  webgl2: 'WebGL2',
  webgpu: 'WebGPU'
};
const SELECTED_DEVICE_TAB_ATTRIBUTE = 'data-luma-device-tab-selected';

function normalizeBackend(backend) {
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

  const tab = page.locator(`[data-luma-device-tab="${normalizedBackend}"]`);
  if ((await tab.count()) === 0) {
    return false;
  }

  const deviceTab = tab.first();
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
