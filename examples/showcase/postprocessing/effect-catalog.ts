// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  bloom,
  brightnessContrast,
  bulgePinch,
  colorHalftone,
  denoise,
  dotScreen,
  edgeWork,
  fxaa,
  gaussianBlur,
  hexagonalPixelate,
  hueSaturation,
  ink,
  magnify,
  noise,
  sepia,
  swirl,
  tiltShift,
  toneMapping,
  triangleBlur,
  vibrance,
  vignette,
  zoomBlur
} from '@luma.gl/effects';
import type {ShaderPass} from '@luma.gl/shadertools';

export type EffectCategory =
  | 'Color & Tone'
  | 'Blur & Glow'
  | 'Stylize'
  | 'Warp & Lens'
  | 'Finish & Detail';

export type EffectDetails = {
  label: string;
  description: string;
  category: EffectCategory;
};

export const EFFECT_CATEGORY_ORDER: readonly EffectCategory[] = [
  'Color & Tone',
  'Blur & Glow',
  'Stylize',
  'Warp & Lens',
  'Finish & Detail'
];

export const EFFECT_SHADER_PASSES: Record<string, ShaderPass> = {
  brightnessContrast,
  hueSaturation,
  sepia,
  toneMapping,
  vibrance,
  bloom,
  gaussianBlur,
  tiltShift,
  triangleBlur,
  zoomBlur,
  colorHalftone,
  dotScreen,
  edgeWork,
  hexagonalPixelate,
  ink,
  bulgePinch,
  magnify,
  swirl,
  denoise,
  fxaa,
  noise,
  vignette
};

export const EFFECT_DETAILS: Record<string, EffectDetails> = {
  brightnessContrast: {
    label: 'Brightness + Contrast',
    description: 'Shapes the image range before the final presentation.',
    category: 'Color & Tone'
  },
  hueSaturation: {
    label: 'Hue + Saturation',
    description: 'Rotates the palette and controls chroma intensity.',
    category: 'Color & Tone'
  },
  sepia: {
    label: 'Sepia',
    description: 'Warms the image with a controllable vintage photographic tint.',
    category: 'Color & Tone'
  },
  toneMapping: {
    label: 'Tone Mapping',
    description: 'Maps scene brightness through a filmic curve with exposure control.',
    category: 'Color & Tone'
  },
  vibrance: {
    label: 'Vibrance',
    description: 'Raises quieter colors while protecting already saturated hues.',
    category: 'Color & Tone'
  },
  bloom: {
    label: 'Bloom',
    description: 'Spreads selected highlights into a soft luminous halo.',
    category: 'Blur & Glow'
  },
  gaussianBlur: {
    label: 'Gaussian Blur',
    description: 'Softens the image with a smooth, separable Gaussian blur.',
    category: 'Blur & Glow'
  },
  tiltShift: {
    label: 'Tilt Shift',
    description: 'Keeps a chosen focal band sharp while blurring its surroundings.',
    category: 'Blur & Glow'
  },
  triangleBlur: {
    label: 'Triangle Blur',
    description: 'Blends neighboring pixels with a lightweight triangular falloff.',
    category: 'Blur & Glow'
  },
  zoomBlur: {
    label: 'Zoom Blur',
    description: 'Pulls samples toward a focal point for a kinetic rush.',
    category: 'Blur & Glow'
  },
  colorHalftone: {
    label: 'Color Halftone',
    description: 'Separates color channels into a rotating print-screen pattern.',
    category: 'Stylize'
  },
  dotScreen: {
    label: 'Dot Screen',
    description: 'Transforms luminance into a rotating monochrome print pattern.',
    category: 'Stylize'
  },
  edgeWork: {
    label: 'Edge Work',
    description: 'Isolates fine image contours into a high-contrast line drawing.',
    category: 'Stylize'
  },
  hexagonalPixelate: {
    label: 'Hexagonal Pixelate',
    description: 'Rebuilds the scene as a mosaic of adjustable hexagonal cells.',
    category: 'Stylize'
  },
  ink: {
    label: 'Ink',
    description: 'Extracts local contrast into a graphic hand-inked treatment.',
    category: 'Stylize'
  },
  bulgePinch: {
    label: 'Bulge + Pinch',
    description: 'Pushes pixels outward or pulls them inward around a lens center.',
    category: 'Warp & Lens'
  },
  magnify: {
    label: 'Magnify',
    description: 'Places an adjustable circular magnifying lens over the image.',
    category: 'Warp & Lens'
  },
  swirl: {
    label: 'Swirl',
    description: 'Warps pixels around a configurable lens center.',
    category: 'Warp & Lens'
  },
  denoise: {
    label: 'Denoise',
    description: 'Smooths unwanted grain while preserving local image structure.',
    category: 'Finish & Detail'
  },
  fxaa: {
    label: 'FXAA',
    description: 'Smooths jagged high-contrast edges with fast approximate antialiasing.',
    category: 'Finish & Detail'
  },
  noise: {
    label: 'Noise',
    description: 'Adds adjustable monochrome grain for a tactile film finish.',
    category: 'Finish & Detail'
  },
  vignette: {
    label: 'Vignette',
    description: 'Guides attention with a soft radial falloff.',
    category: 'Finish & Detail'
  }
};
