// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type VectorFieldPresetKind = 'scalar' | 'vector';
export type Vector3 = readonly [number, number, number];

export type VectorFieldProbe = {
  scalar: number;
  vector: Vector3;
  gradient: Vector3;
  divergence: number;
  curl: Vector3;
  laplacian: number;
};

export type VectorFieldPreset = {
  id: string;
  name: string;
  kind: VectorFieldPresetKind;
  summary: string;
  formula: string;
  periodic?: boolean;
  sample(x: number, y: number, z: number, time: number): {scalar: number; vector: Vector3};
  probe(x: number, y: number, z: number, time: number): VectorFieldProbe;
};

const zero3 = [0, 0, 0] as const;

export const VECTOR_FIELD_PRESETS: readonly VectorFieldPreset[] = [
  {
    id: 'radial-source',
    name: 'Radial source volume',
    kind: 'vector',
    summary: 'A breathing source makes positive divergence pulse throughout the volume.',
    formula: 'F(x,y,z,t) = (1 + 0.35 sin 0.8t)(x, y, z)',
    sample: (x, y, z, time) => {
      const strength = 1 + 0.35 * Math.sin(time * 0.8);
      return {scalar: 0, vector: [strength * x, strength * y, strength * z]};
    },
    probe: (x, y, z, time) => {
      const strength = 1 + 0.35 * Math.sin(time * 0.8);
      return {
        scalar: 0,
        vector: [strength * x, strength * y, strength * z],
        gradient: zero3,
        divergence: 3 * strength,
        curl: zero3,
        laplacian: 0
      };
    }
  },
  {
    id: 'rigid-vortex',
    name: 'Rigid vortex column',
    kind: 'vector',
    summary: 'A vortex column accelerates and relaxes while divergence remains zero.',
    formula: 'F(x,y,z,t) = (1 + 0.4 sin 0.7t)(−y, x, 0)',
    sample: (x, y, _z, time) => {
      const strength = 1 + 0.4 * Math.sin(time * 0.7);
      return {scalar: 0, vector: [-strength * y, strength * x, 0]};
    },
    probe: (x, y, _z, time) => {
      const strength = 1 + 0.4 * Math.sin(time * 0.7);
      return {
        scalar: 0,
        vector: [-strength * y, strength * x, 0],
        gradient: zero3,
        divergence: 0,
        curl: [0, 0, 2 * strength],
        laplacian: 0
      };
    }
  },
  {
    id: 'saddle',
    name: 'Volumetric saddle',
    kind: 'vector',
    summary: 'Oscillating stretch and compression stay perfectly divergence-free.',
    formula: 'F(x,y,z,t) = a(t)(x, −2y, z)',
    sample: (x, y, z, time) => {
      const strength = 1 + 0.35 * Math.sin(time * 0.65);
      return {scalar: 0, vector: [strength * x, -2 * strength * y, strength * z]};
    },
    probe: (x, y, z, time) => {
      const strength = 1 + 0.35 * Math.sin(time * 0.65);
      return {
        scalar: 0,
        vector: [strength * x, -2 * strength * y, strength * z],
        gradient: zero3,
        divergence: 0,
        curl: zero3,
        laplacian: 0
      };
    }
  },
  {
    id: 'taylor-green',
    name: 'Taylor–Green vortex lattice',
    kind: 'vector',
    periodic: true,
    summary: 'Nested counter-rotating cells expose 3D vorticity while remaining incompressible.',
    formula: 'F = (sin πx cos πy cos πz, −cos πx sin πy cos πz, 0)',
    sample: (x, y, z, time) => {
      const phase = time * 0.13;
      const px = Math.PI * (x + phase);
      const py = Math.PI * (y - phase * 0.7);
      const pz = Math.PI * (z + phase * 0.35);
      return {
        scalar: 0,
        vector: [
          Math.sin(px) * Math.cos(py) * Math.cos(pz),
          -Math.cos(px) * Math.sin(py) * Math.cos(pz),
          0
        ]
      };
    },
    probe: (x, y, z, time) => {
      const phase = time * 0.13;
      const px = Math.PI * (x + phase);
      const py = Math.PI * (y - phase * 0.7);
      const pz = Math.PI * (z + phase * 0.35);
      return {
        scalar: 0,
        vector: [
          Math.sin(px) * Math.cos(py) * Math.cos(pz),
          -Math.cos(px) * Math.sin(py) * Math.cos(pz),
          0
        ],
        gradient: zero3,
        divergence: 0,
        curl: [
          -Math.PI * Math.cos(px) * Math.sin(py) * Math.sin(pz),
          -Math.PI * Math.sin(px) * Math.cos(py) * Math.sin(pz),
          2 * Math.PI * Math.sin(px) * Math.sin(py) * Math.cos(pz)
        ],
        laplacian: 0
      };
    }
  },
  {
    id: 'gaussian',
    name: 'Gaussian potential cloud',
    kind: 'scalar',
    summary: 'A breathing cloud reveals how gradient and Laplacian follow changing curvature.',
    formula: 'φ(x,y,z,t) = exp(−a(t)(x²+y²+z²))',
    sample: (x, y, z, time) => {
      const sharpness = 4 + 1.25 * Math.sin(time * 0.7);
      return {scalar: Math.exp(-sharpness * (x * x + y * y + z * z)), vector: zero3};
    },
    probe: (x, y, z, time) => {
      const radiusSquared = x * x + y * y + z * z;
      const sharpness = 4 + 1.25 * Math.sin(time * 0.7);
      const scalar = Math.exp(-sharpness * radiusSquared);
      return {
        scalar,
        vector: zero3,
        gradient: [
          -2 * sharpness * x * scalar,
          -2 * sharpness * y * scalar,
          -2 * sharpness * z * scalar
        ],
        divergence: 0,
        curl: zero3,
        laplacian: (4 * sharpness * sharpness * radiusSquared - 6 * sharpness) * scalar
      };
    }
  },
  {
    id: 'multi-well',
    name: 'Breathing potential wells',
    kind: 'scalar',
    summary: 'Two moving 3D wells reveal curvature, extrema, and diffusion tendency.',
    formula: 'φ = e⁻⁸‖p−a‖² − 0.75e⁻¹⁰‖p−b‖²',
    sample: (x, y, z, time) => {
      const a = [
        0.34 * Math.cos(time * 0.35),
        0.25 * Math.sin(time * 0.3),
        0.24 * Math.sin(time * 0.23)
      ] as const;
      const b = [-0.4, 0.25 * Math.cos(time * 0.27), -0.22] as const;
      const ra = (x - a[0]) ** 2 + (y - a[1]) ** 2 + (z - a[2]) ** 2;
      const rb = (x - b[0]) ** 2 + (y - b[1]) ** 2 + (z - b[2]) ** 2;
      return {scalar: Math.exp(-8 * ra) - 0.75 * Math.exp(-10 * rb), vector: zero3};
    },
    probe: (x, y, z, time) => {
      const a = [
        0.34 * Math.cos(time * 0.35),
        0.25 * Math.sin(time * 0.3),
        0.24 * Math.sin(time * 0.23)
      ] as const;
      const b = [-0.4, 0.25 * Math.cos(time * 0.27), -0.22] as const;
      const da = [x - a[0], y - a[1], z - a[2]] as const;
      const db = [x - b[0], y - b[1], z - b[2]] as const;
      const ra = da[0] ** 2 + da[1] ** 2 + da[2] ** 2;
      const rb = db[0] ** 2 + db[1] ** 2 + db[2] ** 2;
      const ga = Math.exp(-8 * ra);
      const gb = -0.75 * Math.exp(-10 * rb);
      return {
        scalar: ga + gb,
        vector: zero3,
        gradient: [
          -16 * da[0] * ga - 20 * db[0] * gb,
          -16 * da[1] * ga - 20 * db[1] * gb,
          -16 * da[2] * ga - 20 * db[2] * gb
        ],
        divergence: 0,
        curl: zero3,
        laplacian: (256 * ra - 48) * ga + (400 * rb - 60) * gb
      };
    }
  }
] as const;

export function getVectorFieldPreset(id: string): VectorFieldPreset {
  return VECTOR_FIELD_PRESETS.find(preset => preset.id === id) ?? VECTOR_FIELD_PRESETS[0];
}

/** Samples a cubic scalar/vector field using padded vec4 vector rows for WGSL storage alignment. */
export function sampleVectorFieldPreset(
  preset: VectorFieldPreset,
  resolution: number,
  time: number
): {scalar: Float32Array; vector: Float32Array} {
  const elementCount = resolution ** 3;
  const scalar = new Float32Array(elementCount);
  const vector = new Float32Array(elementCount * 4);
  for (let zIndex = 0; zIndex < resolution; zIndex++) {
    const z = (zIndex / (resolution - 1)) * 2 - 1;
    for (let yIndex = 0; yIndex < resolution; yIndex++) {
      const y = (yIndex / (resolution - 1)) * 2 - 1;
      for (let xIndex = 0; xIndex < resolution; xIndex++) {
        const x = (xIndex / (resolution - 1)) * 2 - 1;
        const index = (zIndex * resolution + yIndex) * resolution + xIndex;
        const sample = preset.sample(x, y, z, time);
        scalar[index] = sample.scalar;
        vector.set(sample.vector, index * 4);
      }
    }
  }
  return {scalar, vector};
}
