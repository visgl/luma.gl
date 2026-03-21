import {describe, expect, test} from 'vitest';

import {getPlaywrightLaunchOptions} from '../../devtools/get-playwright-launch-options.mjs';

describe('getPlaywrightLaunchOptions', () => {
  test('merges reusable defaults with repo overrides', () => {
    const launchOptions = getPlaywrightLaunchOptions({
      channel: 'chrome',
      ocularConfig: {
        devtools: {
          playwright: {
            args: ['--foo'],
            launchOptions: {
              slowMo: 25
            }
          }
        }
      },
      softwareGpu: true
    });

    expect(launchOptions.channel).toBe('chrome');
    expect(launchOptions.slowMo).toBe(25);
    expect(launchOptions.args).toContain('--enable-unsafe-webgpu');
    expect(launchOptions.args).toContain('--foo');
    expect(launchOptions.args).toContain('--use-angle=swiftshader');
  });
});
