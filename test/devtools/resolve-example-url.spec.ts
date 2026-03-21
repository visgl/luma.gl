import {describe, expect, test} from 'vitest';

import {
  resolveExamplePath,
  resolveExampleUrl
} from '../../dev-modules/devtools-extensions/playwright/resolve-example-url.mjs';

describe('resolveExamplePath', () => {
  test('uses repo alias mappings from ocular config', () => {
    const examplePath = resolveExamplePath('persistence', {
      devtools: {
        playwright: {
          examples: {
            persistence: '/examples/showcase/persistence'
          }
        }
      }
    });

    expect(examplePath).toBe('/examples/showcase/persistence');
  });

  test('supports generic website example routes', () => {
    const examplePath = resolveExamplePath('api/animation', {
      devtools: {
        playwright: {
          exampleBasePath: '/examples'
        }
      }
    });

    expect(examplePath).toBe('/examples/api/animation');
  });
});

describe('resolveExampleUrl', () => {
  test('builds a full URL from the base URL and example route', () => {
    const exampleUrl = resolveExampleUrl('showcase/persistence', 'http://127.0.0.1:3000', {
      devtools: {
        playwright: {
          exampleBasePath: '/examples'
        }
      }
    });

    expect(exampleUrl).toBe('http://127.0.0.1:3000/examples/showcase/persistence');
  });
});
