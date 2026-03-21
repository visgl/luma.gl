const DEFAULT_PLAYWRIGHT_CHANNEL = 'chromium';
const DEFAULT_PLAYWRIGHT_ARGS = ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'];
const SOFTWARE_GPU_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export function getPlaywrightLaunchOptions(options = {}) {
  const ocularConfig = options.ocularConfig || {};
  const playwrightConfig = ocularConfig.devtools?.playwright || {};
  const customLaunchOptions = options.launchOptions || {};
  const args = dedupeValues([
    ...DEFAULT_PLAYWRIGHT_ARGS,
    ...(playwrightConfig.args || []),
    ...(customLaunchOptions.args || []),
    ...(options.softwareGpu || playwrightConfig.softwareGpu ? SOFTWARE_GPU_ARGS : [])
  ]);

  const launchOptions = {
    ...playwrightConfig.launchOptions,
    ...customLaunchOptions,
    channel: options.channel || playwrightConfig.channel || customLaunchOptions.channel || DEFAULT_PLAYWRIGHT_CHANNEL,
    args
  };

  if (options.headless !== undefined) {
    launchOptions.headless = options.headless;
  }

  return launchOptions;
}

function dedupeValues(values) {
  return [...new Set(values.filter(Boolean))];
}
