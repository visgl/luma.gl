// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js text utilities (https://github.com/mrdoob/three.js/) under the MIT License.

export {
  Font,
  parseFont,
  type TextLayoutOptions,
  type TypefaceFontData
} from './font';
export {TextGeometry, type TextGeometryOptions} from './text-geometry';
export {extrudeShapes, type ExtrudeOptions, type ExtrudedAttributes} from './extrude';
export {
  buildText3DGlyphAtlas,
  layoutText3DGlyphRows,
  type Text3DBounds,
  type Text3DGlyphAtlas,
  type Text3DGlyphAtlasOptions,
  type Text3DGlyphInstance,
  type Text3DGlyphLayout,
  type Text3DGlyphLayoutOptions,
  type Text3DGlyphRange,
  type Text3DVector3
} from './glyph-atlas';
export {Shape, Path} from './paths/path';
export {ShapePath} from './paths/shape-path';
