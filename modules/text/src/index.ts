// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js text utilities (https://github.com/mrdoob/three.js/) under the MIT License.

export {
  Font,
  parseFont,
  type TextLayoutOptions,
  type TypefaceFontData
} from './text-3d/font';
export {TextGeometry, type TextGeometryOptions} from './text-3d/text-geometry';
export {
  extrudeShapes,
  type ExtrudeOptions,
  type ExtrudedAttributes
} from './text-3d/extrude';
export {Shape, Path} from './text-3d/paths/path';
export {ShapePath} from './text-3d/paths/shape-path';
export * from './text-2d/index';
