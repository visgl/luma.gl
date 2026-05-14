// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

process.on('unhandledRejection', reason => {
  // biome-ignore lint/suspicious/noConsole: test bootstrap reports fatal process-level failures.
  console.error(reason);
  process.exitCode = 1;
});

process.on('uncaughtException', error => {
  // biome-ignore lint/suspicious/noConsole: test bootstrap reports fatal process-level failures.
  console.error(error);
  process.exitCode = 1;
});

import './text-3d/text-geometry.spec';
import './text-3d/paths.spec';
import './text-2d/arrow-text.spec';
import './text-2d/text-utils.spec';
import './text-2d/arrow-text-model.spec';
