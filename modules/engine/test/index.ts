// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// utils
import './utils/deep-equal.spec';
import './utils/split-uniforms-and-bindings.spec';
import './utils/buffer-layout-order.spec';

// model etc
import './lib/model.browser.spec';
import './lib/animation-loop.browser.spec';
import './lib/pipeline-factory.browser.spec';
import './lib/shader-factory.browser.spec';

import './dynamic-texture/dynamic-texture.browser.spec';
import './dynamic-texture/mip-levels.browser.spec';
import './dynamic-texture/texture-data.browser.spec';

import './geometry/geometries.spec';
import './geometry/geometry.spec';
import './geometry/geometry-utils.spec';

import './geometry/gpu-geometry.browser.spec';

import './animation/timeline.spec';
import './animation/key-frames.spec';

// Scenegraph
import './scenegraph/group-node.browser.spec';
import './scenegraph/scenegraph-node.spec';
import './scenegraph/model-node.browser.spec';

// debug
import './debug/get-debug-table-from-shader-layout.spec';

// Experimental
import './shader-inputs.spec';
import './shader-inputs-types.spec';
import './compute/swap.browser.spec';
import './compute/buffer-transform.browser.spec';
import './compute/texture-transform.browser.spec';
import './compute/computation.browser.spec';
import './passes/shader-pass-renderer.browser.spec';
import './models/background-texture-model.browser.spec';
import './models/light-models.browser.spec';
