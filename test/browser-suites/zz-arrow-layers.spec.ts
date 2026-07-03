// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Deck registers shader hooks globally, so its layer integration tests need their own module
// realm. Cached devices remain alive until the browser process exits to avoid adapter reuse.
import.meta.glob(
  [
    '../../modules/arrow-layers/test/**/*.spec.ts',
    '!../../modules/arrow-layers/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
