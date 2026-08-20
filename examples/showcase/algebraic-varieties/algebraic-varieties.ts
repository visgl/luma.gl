// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Algebraic fields included in the implicit-surface showcase. */
export type AlgebraicVarietyPreset = {
  id:
    | 'clebsch'
    | 'cayley'
    | 'roman'
    | 'kummer'
    | 'chmutov'
    | 'barth'
    | 'heart'
    | 'torus'
    | 'tanglecube'
    | 'whitney';
  name: string;
  degree: number;
  shaderIndex: number;
  boundingRadius: number;
  cameraDistance: number;
  defaultDeformation: number;
  equation: string;
  equationDefinitions?: string;
  description: string;
};

export const ALGEBRAIC_VARIETY_PRESETS: readonly AlgebraicVarietyPreset[] = Object.freeze([
  {
    id: 'clebsch',
    name: 'Clebsch diagonal cubic',
    degree: 3,
    shaderIndex: 0,
    boundingRadius: 2.15,
    cameraDistance: 5.2,
    defaultDeformation: -0.12,
    equation: 'x³ + y³ + z³ + 1 − (x + y + z + 1)³ = 0',
    description: 'An affine chart of the projective cubic; its unbounded sheets are clipped.'
  },
  {
    id: 'cayley',
    name: 'Cayley nodal cubic',
    degree: 3,
    shaderIndex: 1,
    boundingRadius: 1.8,
    cameraDistance: 4.3,
    defaultDeformation: 0.08,
    equation: 'x² + y² + z² + 2xyz − 1 = 0',
    description: 'A symmetric cubic whose real affine locus reveals four conical nodes.'
  },
  {
    id: 'roman',
    name: 'Steiner Roman surface',
    degree: 4,
    shaderIndex: 2,
    boundingRadius: 1.55,
    cameraDistance: 3.8,
    defaultDeformation: -0.06,
    equation: 'x²y² + y²z² + z²x² − (47/20)xyz = 0',
    description: 'A quartic immersion of the projective plane with a triple point and double lines.'
  },
  {
    id: 'kummer',
    name: 'Kummer quartic',
    degree: 4,
    shaderIndex: 3,
    boundingRadius: 1.8,
    cameraDistance: 4.2,
    defaultDeformation: 0,
    equation: '(x² + y² + z² − μ²)² − λ((z−μ)² − 2x²)((z+μ)² − 2y²) = 0',
    equationDefinitions: 'μ² = (3 − √3)/2,   λ = 3 − √3',
    description: 'A classical quartic with sixteen ordinary double points in projective space.'
  },
  {
    id: 'chmutov',
    name: 'Chmutov quintic',
    degree: 5,
    shaderIndex: 4,
    boundingRadius: 1.52,
    cameraDistance: 3.8,
    defaultDeformation: 0.06,
    equation: 'T₅(x) + T₅(y) + T₅(z) = 0',
    equationDefinitions: 'T₅(u) = 16u⁵ − 20u³ + 5u',
    description: 'A Chebyshev construction packed with regularly arranged real nodal structure.'
  },
  {
    id: 'barth',
    name: 'Barth sextic',
    degree: 6,
    shaderIndex: 5,
    boundingRadius: 1.55,
    cameraDistance: 3.8,
    defaultDeformation: 0,
    equation: '4(φ²x²−y²)(φ²y²−z²)(φ²z²−x²) − (1+2φ)(x²+y²+z²−1)² = 0',
    equationDefinitions: 'φ = (1 + √5)/2',
    description: 'An icosahedrally symmetric sextic with the maximum 65 nodes.'
  },
  {
    id: 'heart',
    name: 'Algebraic heart',
    degree: 6,
    shaderIndex: 6,
    boundingRadius: 1.65,
    cameraDistance: 4,
    defaultDeformation: 0,
    equation: '(x² + 9y²/4 + z² − 1)³ − (x² + 9y²/80)z³ = 0',
    description: 'A degree-six real algebraic surface with a familiar singular silhouette.'
  },
  {
    id: 'torus',
    name: 'Torus quartic',
    degree: 4,
    shaderIndex: 7,
    boundingRadius: 1.55,
    cameraDistance: 4,
    defaultDeformation: 0,
    equation: '(x² + y² + z² + R² − r²)² − 4R²(x² + z²) = 0',
    equationDefinitions: 'R = 1,   r = 0.42',
    description: 'A ring torus written as one quartic polynomial rather than a parametric mesh.'
  },
  {
    id: 'tanglecube',
    name: 'Tanglecube quartic',
    degree: 4,
    shaderIndex: 8,
    boundingRadius: 2.55,
    cameraDistance: 5.8,
    defaultDeformation: 0,
    equation: 'x⁴ − 5x² + y⁴ − 5y² + z⁴ − 5z² + 11.8 = 0',
    description: 'A compact nodal quartic whose lobes weave into a cube-like sculptural form.'
  },
  {
    id: 'whitney',
    name: 'Whitney umbrella',
    degree: 3,
    shaderIndex: 9,
    boundingRadius: 1.9,
    cameraDistance: 4.5,
    defaultDeformation: 0,
    equation: 'x² − y²z = 0',
    description: 'A singular cubic pinch surface; its unbounded sheet is clipped by the ray bounds.'
  }
]);

/** WGSL field contract consumed by the generic implicit-surface renderer. */
export const ALGEBRAIC_VARIETIES_WGSL = /* wgsl */ `\
struct ImplicitSurfaceUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  cameraPosition: vec4f,
  variety: vec4f,
  lighting: vec4f,
};
@group(0) @binding(auto) var<uniform> implicitSurface: ImplicitSurfaceUniforms;

const GOLDEN_RATIO: f32 = 1.61803398875;

fn evaluateClebsch(point: vec3f) -> vec4f {
  let fifthCoordinate = -(point.x + point.y + point.z + 1.0);
  let value = point.x * point.x * point.x + point.y * point.y * point.y +
    point.z * point.z * point.z + 1.0 +
    fifthCoordinate * fifthCoordinate * fifthCoordinate;
  let fifthDerivative = -3.0 * fifthCoordinate * fifthCoordinate;
  let gradient = vec3f(
    3.0 * point.x * point.x + fifthDerivative,
    3.0 * point.y * point.y + fifthDerivative,
    3.0 * point.z * point.z + fifthDerivative
  );
  return vec4f(gradient, value);
}

fn evaluateCayley(point: vec3f) -> vec4f {
  let value = dot(point, point) + 2.0 * point.x * point.y * point.z - 1.0;
  let gradient = 2.0 * vec3f(
    point.x + point.y * point.z,
    point.y + point.x * point.z,
    point.z + point.x * point.y
  );
  return vec4f(gradient, value);
}

fn evaluateRoman(point: vec3f) -> vec4f {
  let scale = 2.35;
  let value =
    point.x * point.x * point.y * point.y +
    point.y * point.y * point.z * point.z +
    point.z * point.z * point.x * point.x -
    scale * point.x * point.y * point.z;
  let gradient = vec3f(
    2.0 * point.x * (point.y * point.y + point.z * point.z) - scale * point.y * point.z,
    2.0 * point.y * (point.x * point.x + point.z * point.z) - scale * point.x * point.z,
    2.0 * point.z * (point.x * point.x + point.y * point.y) - scale * point.x * point.y
  );
  return vec4f(gradient, value);
}

fn evaluateKummer(point: vec3f) -> vec4f {
  let squareRootThree = sqrt(3.0);
  let mu = sqrt((3.0 - squareRootThree) * 0.5);
  let lambda = 3.0 - squareRootThree;
  let radial = dot(point, point) - mu * mu;
  let negativeFactor = (point.z - mu) * (point.z - mu) - 2.0 * point.x * point.x;
  let positiveFactor = (point.z + mu) * (point.z + mu) - 2.0 * point.y * point.y;
  let value = radial * radial - lambda * negativeFactor * positiveFactor;
  let gradient = vec3f(
    4.0 * point.x * radial + 4.0 * lambda * point.x * positiveFactor,
    4.0 * point.y * radial + 4.0 * lambda * point.y * negativeFactor,
    4.0 * point.z * radial - lambda * (
      2.0 * (point.z - mu) * positiveFactor +
      2.0 * (point.z + mu) * negativeFactor
    )
  );
  return vec4f(gradient, value);
}

fn evaluateChmutov(point: vec3f) -> vec4f {
  let pointSquared = point * point;
  let pointCubed = pointSquared * point;
  let pointFifth = pointCubed * pointSquared;
  let chebyshev = 16.0 * pointFifth - 20.0 * pointCubed + 5.0 * point;
  let gradient = 80.0 * pointSquared * pointSquared - 60.0 * pointSquared + vec3f(5.0);
  return vec4f(gradient, chebyshev.x + chebyshev.y + chebyshev.z);
}

fn evaluateBarth(point: vec3f) -> vec4f {
  let goldenRatioSquared = GOLDEN_RATIO * GOLDEN_RATIO;
  let firstFactor = goldenRatioSquared * point.x * point.x - point.y * point.y;
  let secondFactor = goldenRatioSquared * point.y * point.y - point.z * point.z;
  let thirdFactor = goldenRatioSquared * point.z * point.z - point.x * point.x;
  let radial = dot(point, point) - 1.0;
  let radialCoefficient = 1.0 + 2.0 * GOLDEN_RATIO;
  let value = 4.0 * firstFactor * secondFactor * thirdFactor -
    radialCoefficient * radial * radial;
  let gradient = vec3f(
    4.0 * (
      2.0 * goldenRatioSquared * point.x * secondFactor * thirdFactor -
      2.0 * point.x * firstFactor * secondFactor
    ) - 4.0 * radialCoefficient * point.x * radial,
    4.0 * (
      -2.0 * point.y * secondFactor * thirdFactor +
      2.0 * goldenRatioSquared * point.y * firstFactor * thirdFactor
    ) - 4.0 * radialCoefficient * point.y * radial,
    4.0 * (
      -2.0 * point.z * firstFactor * thirdFactor +
      2.0 * goldenRatioSquared * point.z * firstFactor * secondFactor
    ) - 4.0 * radialCoefficient * point.z * radial
  );
  return vec4f(gradient, value);
}

fn evaluateHeart(point: vec3f) -> vec4f {
  let radial = point.x * point.x + 2.25 * point.y * point.y + point.z * point.z - 1.0;
  let zCubed = point.z * point.z * point.z;
  let weightedPlanar = point.x * point.x + 0.1125 * point.y * point.y;
  let value = radial * radial * radial - weightedPlanar * zCubed;
  let gradient = vec3f(
    6.0 * point.x * radial * radial - 2.0 * point.x * zCubed,
    13.5 * point.y * radial * radial - 0.225 * point.y * zCubed,
    6.0 * point.z * radial * radial - 3.0 * weightedPlanar * point.z * point.z
  );
  return vec4f(gradient, value);
}

fn evaluateTorus(point: vec3f) -> vec4f {
  let majorRadius = 1.0;
  let minorRadius = 0.42;
  let radial = dot(point, point) + majorRadius * majorRadius - minorRadius * minorRadius;
  let ringRadiusSquared = point.x * point.x + point.z * point.z;
  let value = radial * radial - 4.0 * majorRadius * majorRadius * ringRadiusSquared;
  let gradient = vec3f(
    4.0 * point.x * radial - 8.0 * majorRadius * majorRadius * point.x,
    4.0 * point.y * radial,
    4.0 * point.z * radial - 8.0 * majorRadius * majorRadius * point.z
  );
  return vec4f(gradient, value);
}

fn evaluateTanglecube(point: vec3f) -> vec4f {
  let pointSquared = point * point;
  let value = dot(pointSquared, pointSquared) - 5.0 * dot(point, point) + 11.8;
  let gradient = 4.0 * point * pointSquared - 10.0 * point;
  return vec4f(gradient, value);
}

fn evaluateWhitneyUmbrella(point: vec3f) -> vec4f {
  let value = point.x * point.x - point.y * point.y * point.z;
  let gradient = vec3f(2.0 * point.x, -2.0 * point.y * point.z, -point.y * point.y);
  return vec4f(gradient, value);
}

fn evaluateImplicitField(point: vec3f) -> vec4f {
  var field: vec4f;
  let varietyIndex = implicitSurface.variety.x;
  if (varietyIndex < 0.5) {
    field = evaluateClebsch(point);
  } else if (varietyIndex < 1.5) {
    field = evaluateCayley(point);
  } else if (varietyIndex < 2.5) {
    field = evaluateRoman(point);
  } else if (varietyIndex < 3.5) {
    field = evaluateKummer(point);
  } else if (varietyIndex < 4.5) {
    field = evaluateChmutov(point);
  } else if (varietyIndex < 5.5) {
    field = evaluateBarth(point);
  } else if (varietyIndex < 6.5) {
    field = evaluateHeart(point);
  } else if (varietyIndex < 7.5) {
    field = evaluateTorus(point);
  } else if (varietyIndex < 8.5) {
    field = evaluateTanglecube(point);
  } else {
    field = evaluateWhitneyUmbrella(point);
  }

  let deformation = implicitSurface.variety.y;
  let deformationField = dot(point, point) - 0.72;
  return vec4f(
    field.xyz + deformation * 2.0 * point,
    field.w + deformation * deformationField
  );
}
`;

export function getAlgebraicVarietyPreset(id: string): AlgebraicVarietyPreset {
  return (
    ALGEBRAIC_VARIETY_PRESETS.find(preset => preset.id === id) ?? ALGEBRAIC_VARIETY_PRESETS[1]!
  );
}
