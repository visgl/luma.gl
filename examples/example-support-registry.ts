// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from './example-support';
import standaloneSupport0 from './api/texture-compressed/mobile-support';
import standaloneSupport1 from './integrations/hello-react/mobile-support';
import standaloneSupport2 from './showcase/algebraic-varieties/mobile-support';
import support0 from './showcase/gaussian-splat-viewer/mobile-support';
import support1 from './showcase/gaussian-splats/mobile-support';
import support2 from './showcase/instancing/mobile-support';
import support3 from './showcase/globe/mobile-support';
import support4 from './showcase/packet-spraying/mobile-support';
import support5 from './showcase/dof/mobile-support';
import support6 from './experimental/bloom/mobile-support';
import support7 from './showcase/persistence/mobile-support';
import support8 from './showcase/gltf/mobile-support';
import support9 from './experimental/scene-playground/mobile-support';
import support10 from './showcase/lightstorm-megacity/mobile-support';
import support11 from './showcase/llm-network/mobile-support';
import support12 from './experimental/lucim-volume-lab/mobile-support';
import support13 from './experimental/volumetric-fire-forge/mobile-support';
import support14 from './showcase/tempest-ocean/mobile-support';
import support15 from './experimental/spectral-caustics/mobile-support';
import support16 from './experimental/fluid-foundry/mobile-support';
import support17 from './experimental/virtual-geometry-canyon/mobile-support';
import support18 from './experimental/advanced-effects/mobile-support';
import support19 from './experimental/deferred-rendering/mobile-support';
import support20 from './experimental/shadow-map/mobile-support';
import support21 from './experimental/gpgpu/mobile-support';
import support22 from './experimental/gpu-frustum-culling/mobile-support';
import support23 from './experimental/gpu-trace-viewer/mobile-support';
import support24 from './experimental/gpu-graph-explorer/mobile-support';
import support25 from './experimental/gpu-trace-scene/mobile-support';
import support26 from './experimental/gpu-scene-graph/mobile-support';
import support27 from './showcase/vector-field-lab/mobile-support';
import support28 from './showcase/quantum-state-studio/mobile-support';
import support29 from './experimental/gpu-sort/mobile-support';
import support30 from './experimental/gpu-data-analysis/mobile-support';
import support31 from './showcase/million-row-crossfilter/mobile-support';
import support32 from './showcase/raster-lab/mobile-support';
import support33 from './showcase/billion-point-spatial-atlas/mobile-support';
import support34 from './experimental/gpt-2/mobile-support';
import support35 from './api/animation/mobile-support';
import support36 from './showcase/postprocessing/mobile-support';
import support37 from './api/blending/mobile-support';
import support38 from './api/multi-canvas/mobile-support';
import support39 from './api/cubemap/mobile-support';
import support40 from './api/texture-3d/mobile-support';
import support41 from './api/texture-sampling/mobile-support';
import support42 from './api/texture-tester/mobile-support';
import support43 from './api/video-texture/mobile-support';
import support44 from './api/render-bundles/mobile-support';
import support45 from './integrations/external-context/mobile-support';
import support46 from './integrations/react-strict-mode/mobile-support';
import support47 from './tutorials/hello-triangle/mobile-support';
import support48 from './tutorials/hello-triangle-geometry/mobile-support';
import support49 from './tutorials/hello-cube/mobile-support';
import support50 from './tutorials/lighting/mobile-support';
import support51 from './tutorials/hello-gltf/mobile-support';
import support52 from './tutorials/two-cubes/mobile-support';
import support53 from './tutorials/instanced-cubes/mobile-support';
import support54 from './tutorials/hello-instancing/mobile-support';
import support55 from './tutorials/shader-modules/mobile-support';
import support56 from './tutorials/shader-hooks/mobile-support';
import support57 from './tutorials/shader-plugins/mobile-support';
import support58 from './tutorials/transform-feedback/mobile-support';
import support59 from './tutorials/transform/mobile-support';
import support60 from './experimental/a-buffer/mobile-support';
import support61 from './experimental/antialiasing/mobile-support';
import support62 from './experimental/fp64/mobile-support';
import support63 from './experimental/text-space-crawl/mobile-support';
import support64 from './experimental/html-ui-prism/mobile-support';
import support65 from './experimental/webxr-kaleidoscope/mobile-support';
import support66 from './arrow/arrow-points/mobile-support';
import support67 from './arrow/arrow-filtering/mobile-support';
import support68 from './arrow/arrow-lines/mobile-support';
import support71 from './arrow/arrow-float64-precision/mobile-support';
import support72 from './arrow/arrow-text-2d/mobile-support';
import support73 from './arrow/arrow-temporal-starfield/mobile-support';
import support74 from './arrow/arrow-time-columns/mobile-support';
import support75 from './arrow/arrow-mesh-geometry/mobile-support';
import support76 from './arrow/arrow-particles/mobile-support';
import support77 from './arrow/arrow-dggs-polygons/mobile-support';
import support78 from './arrow/arrow-columns/mobile-support';

/**
 * Metadata-only support registry. Importing this file never imports an example application.
 */
export const EXAMPLE_SUPPORT_REGISTRY: Readonly<Record<string, ExampleSupportDefinition>> = {
  'showcase/gaussian-splat-viewer': support0,
  'showcase/gaussian-splats': support1,
  'showcase/instancing': support2,
  'showcase/globe': support3,
  'showcase/packet-spraying': support4,
  'showcase/dof': support5,
  'experimental/bloom': support6,
  'showcase/persistence': support7,
  'showcase/gltf': support8,
  'experimental/scene-playground': support9,
  'showcase/lightstorm-megacity': support10,
  'showcase/llm-network': support11,
  'experimental/lucim-volume-lab': support12,
  'experimental/volumetric-fire-forge': support13,
  'showcase/tempest-ocean': support14,
  'experimental/spectral-caustics': support15,
  'experimental/fluid-foundry': support16,
  'experimental/virtual-geometry-canyon': support17,
  'experimental/advanced-effects': support18,
  'experimental/deferred-rendering': support19,
  'experimental/shadow-map': support20,
  'experimental/gpgpu': support21,
  'experimental/gpu-frustum-culling': support22,
  'experimental/gpu-trace-viewer': support23,
  'experimental/gpu-graph-explorer': support24,
  'experimental/gpu-trace-scene': support25,
  'experimental/gpu-scene-graph': support26,
  'showcase/vector-field-lab': support27,
  'showcase/quantum-state-studio': support28,
  'experimental/gpu-sort': support29,
  'experimental/gpu-data-analysis': support30,
  'showcase/million-row-crossfilter': support31,
  'showcase/raster-lab': support32,
  'showcase/billion-point-spatial-atlas': support33,
  'experimental/gpt-2': support34,
  'api/animation': support35,
  'showcase/postprocessing': support36,
  'api/blending': support37,
  'api/multi-canvas': support38,
  'api/cubemap': support39,
  'api/texture-3d': support40,
  'api/texture-sampling': support41,
  'api/texture-tester': support42,
  'api/video-texture': support43,
  'api/render-bundles': support44,
  'integrations/external-context': support45,
  'integrations/react-strict-mode': support46,
  'tutorials/hello-triangle': support47,
  'tutorials/hello-triangle-geometry': support48,
  'tutorials/hello-cube': support49,
  'tutorials/lighting': support50,
  'tutorials/hello-gltf': support51,
  'tutorials/two-cubes': support52,
  'tutorials/instanced-cubes': support53,
  'tutorials/hello-instancing': support54,
  'tutorials/shader-modules': support55,
  'tutorials/shader-hooks': support56,
  'tutorials/shader-plugins': support57,
  'tutorials/transform-feedback': support58,
  'tutorials/transform': support59,
  'experimental/a-buffer': support60,
  'experimental/antialiasing': support61,
  'experimental/fp64': support62,
  'experimental/text-space-crawl': support63,
  'experimental/html-ui-prism': support64,
  'experimental/webxr-kaleidoscope': support65,
  'arrow/arrow-points': support66,
  'arrow/arrow-filtering': support67,
  'arrow/arrow-lines': support68,
  'arrow/arrow-float64-precision': support71,
  'arrow/arrow-text-2d': support72,
  'arrow/arrow-temporal-starfield': support73,
  'arrow/arrow-time-columns': support74,
  'arrow/arrow-mesh-geometry': support75,
  'arrow/arrow-particles': support76,
  'arrow/arrow-dggs-polygons': support77,
  'arrow/arrow-columns': support78,
  'api/texture-compressed': standaloneSupport0,
  'integrations/hello-react': standaloneSupport1,
  'showcase/algebraic-varieties': standaloneSupport2,
  'homepage/instancing': support2
};

export function getExampleSupportDefinition(id: string): ExampleSupportDefinition | undefined {
  return EXAMPLE_SUPPORT_REGISTRY[id];
}
