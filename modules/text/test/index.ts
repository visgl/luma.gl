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

import './text-geometry.spec';
import './paths.spec';
