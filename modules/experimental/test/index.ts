// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import './textures/packed-pixels.spec';
import './textures/html-texture.spec';
import './oit/a-buffer-renderer.spec';
import './oit/wboit-renderer.spec';
import './shadows/shadow-map-renderer.spec';
import './shadows/shadow-wgsl.spec';
import './engine/scene-renderer.spec';
import './engine/scene-next-pbr-materials.spec';
import './engine/scene-deformation.spec';
import './engine/deferred-scene-renderer.spec';
import './rendering/deferred-lighting.spec';
import './rendering/fft-bloom.spec';
import './rendering/g-buffer.spec';
import './rendering/volumetric-fire-simulation.spec';

import './controls/orbit-controls.spec';

import './webxr';
import './gpu-primitives/gpu-command-graph.spec';
import './gpu-primitives/gpu-command-graph-textures.spec';
import './gpu-primitives/gpu-trace-manipulation.spec';
import './gpu-primitives/gpu-virtual-geometry-selection.spec';
import './gpu-primitives/gpu-sort.spec';
import './gpu-primitives/gpu-data-analysis.spec';
import './gpu-primitives/gpu-histogram-mask.spec';
import './gpu-primitives/gpu-reduction-mask.spec';
import './gpu-primitives/gpu-fft2d.spec';
import './gpu-primitives/gpu-hash-index.spec';
import './gpu-primitives/gpu-hash-join.spec';
import './gpu-primitives/gpu-batch-hash-join.spec';
import './gpu-primitives/gpu-scene-adapters.spec';
import './gpu-primitives/gpu-scene-draw-generation.spec';
import './gpu-primitives/gpu-scene-resource-groups.spec';
import './lutrace/gpu-trace-scene.spec';
import './lutrace/gpu-trace-interaction.spec';
import './simulation/spectral-ocean-simulation.spec';
import './geospatial/geospatial-projection-distance.spec';
import './ludf/lu-data-frame.spec';
import './ludf/lu-data-frame-query.spec';
import './ludf/lu-derived-columns.spec';
import './ludf/lu-group-aggregation.spec';
import './ludf/lu-global-aggregation.spec';
import './ludf/lu-sort.spec';
import './ludf/lu-join.spec';
import './luraster';
import './luxfilter';
import './luproj/luproj.spec';
import './luproj/projection-benchmark.spec';
import './luvs/gpu-similarity-search.spec';
