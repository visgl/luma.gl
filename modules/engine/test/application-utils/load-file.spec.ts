// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {_resolveLoadFileUrl, setPathPrefix} from '@luma.gl/engine';

test('load-file resolves only bare relative asset URLs against the configured prefix', t => {
  setPathPrefix('https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/');

  t.equal(
    _resolveLoadFileUrl('earth.jpg'),
    'https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/earth.jpg',
    'bare relative asset paths use the configured prefix'
  );
  t.equal(
    _resolveLoadFileUrl('./assets/images/earth.jpg'),
    'https://raw.githubusercontent.com/visgl/luma.gl/master/examples/showcase/water-globe/./assets/images/earth.jpg',
    'dot-relative asset paths use the configured prefix'
  );
  t.equal(
    _resolveLoadFileUrl('/assets/images/earth.jpg'),
    '/assets/images/earth.jpg',
    'root-relative asset paths do not use the configured prefix'
  );
  t.equal(
    _resolveLoadFileUrl('https://example.com/earth.jpg'),
    'https://example.com/earth.jpg',
    'absolute http urls do not use the configured prefix'
  );
  t.equal(
    _resolveLoadFileUrl('blob:https://example.com/earth'),
    'blob:https://example.com/earth',
    'blob urls do not use the configured prefix'
  );
  t.equal(
    _resolveLoadFileUrl('data:image/png;base64,abc'),
    'data:image/png;base64,abc',
    'data urls do not use the configured prefix'
  );

  setPathPrefix('');
  t.end();
});
