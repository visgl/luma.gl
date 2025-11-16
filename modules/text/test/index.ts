// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

process.on('unhandledRejection', reason => {
  console.error(reason)
  process.exitCode = 1
})

process.on('uncaughtException', error => {
  console.error(error)
  process.exitCode = 1
})

import './text-geometry.spec.ts'
import './paths.spec.ts'
