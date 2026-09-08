// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {_resolveLoadFileUrl, setPathPrefix} from '@luma.gl/engine';
import {expect, it} from 'vitest';

it('load-file resolves only bare relative asset URLs against the configured prefix', () => {
  setPathPrefix(
    'https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/'
  );

  expect(
    _resolveLoadFileUrl('earth.jpg'),
    'bare relative asset paths use the configured prefix'
  ).toBe(
    'https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/earth.jpg'
  );
  expect(
    _resolveLoadFileUrl('./assets/images/earth.jpg'),
    'dot-relative asset paths use the configured prefix'
  ).toBe(
    'https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/./assets/images/earth.jpg'
  );
  expect(
    _resolveLoadFileUrl('/assets/images/earth.jpg'),
    'root-relative asset paths do not use the configured prefix'
  ).toBe('/assets/images/earth.jpg');
  expect(
    _resolveLoadFileUrl('https://example.com/earth.jpg'),
    'absolute http urls do not use the configured prefix'
  ).toBe('https://example.com/earth.jpg');
  expect(
    _resolveLoadFileUrl('blob:https://example.com/earth'),
    'blob urls do not use the configured prefix'
  ).toBe('blob:https://example.com/earth');
  expect(
    _resolveLoadFileUrl('data:image/png;base64,abc'),
    'data urls do not use the configured prefix'
  ).toBe('data:image/png;base64,abc');

  setPathPrefix('');
});
