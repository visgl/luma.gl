// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Model integration tests exercise enough pipelines to exhaust a software WebGL context when
// combined with the remaining engine tests.
import.meta.glob('../../modules/engine/test/lib/model.spec.ts', {eager: true});
