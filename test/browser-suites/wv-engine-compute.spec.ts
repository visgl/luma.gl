// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Engine compute integration tests share one context, separate from scenegraph/model tests.
import.meta.glob('../../modules/engine/test/compute/**/*.spec.ts', {eager: true});
