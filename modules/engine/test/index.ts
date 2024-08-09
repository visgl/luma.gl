// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// utils
import './utils/deep-equal.spec';

// model etc
import './lib/model.spec';
import './lib/animation-loop.spec';
import './lib/pipeline-factory.spec';
import './lib/shader-factory.spec';

import './async-texture/async-texture.spec';

import './geometry/geometries.spec';
import './geometry/geometry.spec';
import './geometry/geometry-utils.spec';

import './geometry/gpu-geometry.spec';

import './animation/timeline.spec';
import './animation/key-frames.spec';

// Scenegraph
import './scenegraph/group-node.spec';
import './scenegraph/scenegraph-node.spec';
import './scenegraph/model-node.spec';

// debug
import './debug/get-debug-table-from-shader-layout.spec';

// Experimental
import './shader-inputs.spec';
import './compute/swap.spec';
import './compute/buffer-transform.spec';
import './compute/texture-transform.spec';
import './compute/computation.spec';
