// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ShaderPassRenderer integration tests exercise enough render targets and pipelines to require
// a fresh software WebGL context after the remaining engine tests.
import.meta.glob('../../modules/engine/test/passes/shader-pass-renderer.spec.ts', {eager: true});
