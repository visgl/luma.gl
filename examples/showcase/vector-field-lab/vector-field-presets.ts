// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type VectorFieldPresetKind = 'scalar' | 'vector';

export type VectorFieldProbe = {
  scalar: number;
  vector: readonly [number, number];
  gradient: readonly [number, number];
  divergence: number;
  curl: number;
  laplacian: number;
};

export type VectorFieldPreset = {
  id: string;
  name: string;
  kind: VectorFieldPresetKind;
  summary: string;
  formula: string;
  periodic?: boolean;
  sample(x: number, y: number, time: number): {scalar: number; vector: readonly [number, number]};
  probe(x: number, y: number, time: number): VectorFieldProbe;
};

const zero2 = [0, 0] as const;

export const VECTOR_FIELD_PRESETS: readonly VectorFieldPreset[] = [
  {
    id: 'radial-source',
    name: 'Radial source',
    kind: 'vector',
    summary: 'Every arrow escapes; positive divergence measures the local area expansion.',
    formula: 'F(x,y) = (x, y)',
    sample: (x, y) => ({scalar: 0, vector: [x, y]}),
    probe: (x, y) => ({
      scalar: 0,
      vector: [x, y],
      gradient: zero2,
      divergence: 2,
      curl: 0,
      laplacian: 0
    })
  },
  {
    id: 'rigid-vortex',
    name: 'Rigid-body vortex',
    kind: 'vector',
    summary: 'Pure rotation: constant positive curl with zero divergence everywhere.',
    formula: 'F(x,y) = (−y, x)',
    sample: (x, y) => ({scalar: 0, vector: [-y, x]}),
    probe: (x, y) => ({
      scalar: 0,
      vector: [-y, x],
      gradient: zero2,
      divergence: 0,
      curl: 2,
      laplacian: 0
    })
  },
  {
    id: 'saddle',
    name: 'Saddle',
    kind: 'vector',
    summary: 'Stretching along x is exactly balanced by compression along y.',
    formula: 'F(x,y) = (x, −y)',
    sample: (x, y) => ({scalar: 0, vector: [x, -y]}),
    probe: (x, y) => ({
      scalar: 0,
      vector: [x, -y],
      gradient: zero2,
      divergence: 0,
      curl: 0,
      laplacian: 0
    })
  },
  {
    id: 'taylor-green',
    name: 'Taylor–Green cells',
    kind: 'vector',
    periodic: true,
    summary: 'An incompressible lattice of counter-rotating vortices with animated phase.',
    formula: 'F = (sin πx cos πy, −cos πx sin πy)',
    sample: (x, y, time) => {
      const phase = time * 0.16;
      const px = Math.PI * (x + phase);
      const py = Math.PI * (y - phase * 0.7);
      return {scalar: 0, vector: [Math.sin(px) * Math.cos(py), -Math.cos(px) * Math.sin(py)]};
    },
    probe: (x, y, time) => {
      const phase = time * 0.16;
      const px = Math.PI * (x + phase);
      const py = Math.PI * (y - phase * 0.7);
      return {
        scalar: 0,
        vector: [Math.sin(px) * Math.cos(py), -Math.cos(px) * Math.sin(py)],
        gradient: zero2,
        divergence: 0,
        curl: 2 * Math.PI * Math.sin(px) * Math.sin(py),
        laplacian: 0
      };
    }
  },
  {
    id: 'gaussian',
    name: 'Gaussian potential',
    kind: 'scalar',
    summary:
      'Gradient arrows cut orthogonally through level sets; the Laplacian flips sign at the shoulder.',
    formula: 'φ(x,y) = exp(−4(x²+y²))',
    sample: (x, y) => ({scalar: Math.exp(-4 * (x * x + y * y)), vector: zero2}),
    probe: (x, y) => {
      const scalar = Math.exp(-4 * (x * x + y * y));
      return {
        scalar,
        vector: zero2,
        gradient: [-8 * x * scalar, -8 * y * scalar],
        divergence: 0,
        curl: 0,
        laplacian: (64 * (x * x + y * y) - 16) * scalar
      };
    }
  },
  {
    id: 'multi-well',
    name: 'Breathing multi-well',
    kind: 'scalar',
    summary: 'Two moving wells reveal curvature, extrema, and diffusion tendency over time.',
    formula: 'φ = e⁻⁸‖p−a‖² − 0.75e⁻¹⁰‖p−b‖²',
    sample: (x, y, time) => {
      const a = [0.36 * Math.cos(time * 0.35), 0.28 * Math.sin(time * 0.3)] as const;
      const b = [-0.42, 0.28 * Math.cos(time * 0.27)] as const;
      const ra = (x - a[0]) ** 2 + (y - a[1]) ** 2;
      const rb = (x - b[0]) ** 2 + (y - b[1]) ** 2;
      return {scalar: Math.exp(-8 * ra) - 0.75 * Math.exp(-10 * rb), vector: zero2};
    },
    probe: (x, y, time) => {
      const a = [0.36 * Math.cos(time * 0.35), 0.28 * Math.sin(time * 0.3)] as const;
      const b = [-0.42, 0.28 * Math.cos(time * 0.27)] as const;
      const dax = x - a[0];
      const day = y - a[1];
      const dbx = x - b[0];
      const dby = y - b[1];
      const ga = Math.exp(-8 * (dax * dax + day * day));
      const gb = -0.75 * Math.exp(-10 * (dbx * dbx + dby * dby));
      return {
        scalar: ga + gb,
        vector: zero2,
        gradient: [-16 * dax * ga - 20 * dbx * gb, -16 * day * ga - 20 * dby * gb],
        divergence: 0,
        curl: 0,
        laplacian:
          (256 * (dax * dax + day * day) - 32) * ga + (400 * (dbx * dbx + dby * dby) - 40) * gb
      };
    }
  }
] as const;

export function getVectorFieldPreset(id: string): VectorFieldPreset {
  return VECTOR_FIELD_PRESETS.find(preset => preset.id === id) ?? VECTOR_FIELD_PRESETS[0];
}

/** Samples both field families so one immutable command graph can serve every preset. */
export function sampleVectorFieldPreset(
  preset: VectorFieldPreset,
  resolution: number,
  time: number
): {scalar: Float32Array; vector: Float32Array} {
  const scalar = new Float32Array(resolution * resolution);
  const vector = new Float32Array(resolution * resolution * 2);
  for (let yIndex = 0; yIndex < resolution; yIndex++) {
    const y = (yIndex / (resolution - 1)) * 2 - 1;
    for (let xIndex = 0; xIndex < resolution; xIndex++) {
      const x = (xIndex / (resolution - 1)) * 2 - 1;
      const index = yIndex * resolution + xIndex;
      const sample = preset.sample(x, y, time);
      scalar[index] = sample.scalar;
      vector[index * 2] = sample.vector[0];
      vector[index * 2 + 1] = sample.vector[1];
    }
  }
  return {scalar, vector};
}
