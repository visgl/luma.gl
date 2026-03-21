const DEVICE_TAB_LABELS = {
  webgl2: 'WebGL2',
  webgpu: 'WebGPU'
};

function normalizeBackend(backend) {
  if (!backend) {
    return null;
  }

  const normalizedBackend = backend.toLowerCase();
  return normalizedBackend === 'webgl' ? 'webgl2' : normalizedBackend;
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

  const tab = page.getByText(tabLabel, {exact: true});
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
    normalizedPreferredBackend === 'webgl2' ? ['webgl2', 'webgpu'] : ['webgpu', 'webgl2'];

  for (const backend of orderedBackends) {
    if (await selectDeviceBackend(page, backend)) {
      return backend;
    }
  }

  return null;
}
