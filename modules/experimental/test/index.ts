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
import './gpu-core/gpu-command-graph.spec';
import './gpu-core/gpu-command-graph-textures.spec';
import './gpu-core/gpu-trace-manipulation.spec';
import './gpu-core/gpu-virtual-geometry-selection.spec';
import './gpu-core/gpu-sort.spec';
import './gpu-core/gpu-data-analysis.spec';
import './gpu-core/gpu-histogram-mask.spec';
import './gpu-core/gpu-reduction-mask.spec';
import './gpu-core/gpu-fft2d.spec';
import './gpu-core/gpu-hash-index.spec';
import './gpu-core/gpu-hash-join.spec';
import './gpu-core/gpu-batch-hash-join.spec';
import './gpu-core/gpu-scene-adapters.spec';
import './gpu-core/gpu-scene-draw-generation.spec';
import './gpu-core/gpu-scene-resource-groups.spec';
import './gpu-trace/gpu-trace-scene.spec';
import './gpu-trace/gpu-trace-interaction.spec';
import './simulation/spectral-ocean-simulation.spec';
import './geospatial/geospatial-projection-distance.spec';
import './gpu-dataframe/lu-data-frame.spec';
import './gpu-dataframe/lu-data-frame-query.spec';
import './gpu-dataframe/lu-derived-columns.spec';
import './gpu-dataframe/lu-group-aggregation.spec';
import './gpu-dataframe/lu-global-aggregation.spec';
import './gpu-dataframe/lu-sort.spec';
import './gpu-dataframe/lu-join.spec';
import './gpu-raster';
import './gpu-crossfilter';
import './gpu-project/gpu-project.spec';
import './gpu-project/projection-benchmark.spec';
