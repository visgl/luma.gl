import {chromium} from 'playwright';

import {getPlaywrightLaunchOptions} from '../get-playwright-launch-options.mjs';

const DEFAULT_DEBUG_PORT = 9222;

export async function launchDebugBrowser(options = {}) {
  const debugPort = options.debugPort || DEFAULT_DEBUG_PORT;
  const launchOptions = getPlaywrightLaunchOptions({
    ocularConfig: options.ocularConfig,
    channel: options.channel,
    headless: options.headless,
    launchOptions: options.launchOptions,
    softwareGpu: options.softwareGpu
  });
  const args = [...(launchOptions.args || []), `--remote-debugging-port=${debugPort}`];
  const browser = await chromium.launch({
    ...launchOptions,
    args
  });

  return {
    browser,
    debugPort,
    endpointURL: `http://127.0.0.1:${debugPort}`,
    mode: 'launch'
  };
}

export async function attachDebugBrowser(options = {}) {
  const endpointURL = options.attach || options.endpointURL || `http://127.0.0.1:${options.debugPort || DEFAULT_DEBUG_PORT}`;
  const browser = await chromium.connectOverCDP(endpointURL);

  return {
    browser,
    endpointURL,
    mode: 'attach'
  };
}
