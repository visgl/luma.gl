const DEVICE_TAB_LABELS = {
  'webgpu-core': 'WebGPU',
  'webgpu-max': 'WebGPU',
  webgl: 'WebGL2',
  webgl2: 'WebGL2',
  webgpu: 'WebGPU'
};

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

  await tab.first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  return true;
}

export async function selectPreferredDeviceBackend(page, preferredBackend = 'webgpu') {
  const normalizedPreferredBackend = normalizeBackend(preferredBackend) || 'webgpu';
  const orderedBackends =
    normalizedPreferredBackend === 'webgl'
      ? ['webgl', 'webgpu-core']
      : [normalizedPreferredBackend, 'webgpu-core', 'webgl'].filter(
          (backend, index, array) => array.indexOf(backend) === index
        );

  for (const backend of orderedBackends) {
    if (await selectDeviceBackend(page, backend)) {
      return backend;
    }
  }

  return null;
}
