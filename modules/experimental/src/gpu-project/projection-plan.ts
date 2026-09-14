// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {
  CompileProjectionPlanOptions,
  ProjectionBounds,
  ProjectionCoordinates,
  ProjectionDegree,
  ProjectionPatch,
  ProjectionPlan,
  ProjectionPrecision,
  ProjectionProvider
} from './types';

/** Number of uint32 words occupied by one stable packed GPU projection-patch record. */
export const PROJECTION_PATCH_WORD_LENGTH = 64;

/** Number of uint32 words occupied by the source-bounds trailer in a packed projection plan. */
export const PROJECTION_PLAN_BOUNDS_WORD_LENGTH = 12;

const MAXIMUM_COEFFICIENT_COUNT = 10;
const DEFAULT_TOLERANCE = 0.01;
const DEFAULT_MAXIMUM_DEPTH = 8;
const DEFAULT_SAMPLE_COUNT = 7;
const DEFAULT_MAXIMUM_PATCH_COUNT = 4096;
const MAXIMUM_SAMPLE_COUNT = 32;
const MAXIMUM_SUBDIVISION_DEPTH = 16;
const VALIDATION_SAMPLE_COUNT = 11;
const PIVOT_EPSILON = 1e-13;

type DoubleSingle = readonly [high: number, low: number];

type PolynomialFit = {
  coefficientsX: Float32Array;
  coefficientsY: Float32Array;
  doubleSingleCoefficientsX: Float64Array;
  doubleSingleCoefficientsY: Float64Array;
  maxError: number;
  float32MaxError: number;
  doubleSingleMaxError: number;
};

type ProjectionCompilerContext = {
  project: (coordinates: ProjectionCoordinates) => [number, number];
  destinationOrigin: ProjectionCoordinates;
  precision: ProjectionPrecision;
  degree: ProjectionDegree;
  tolerance: number;
  maxDepth: number;
  maxPatches: number;
  sampleCount: number;
  patches: ProjectionPatch[];
};

/**
 * Compiles an arbitrary CPU projection into adaptive, provider-independent local polynomials.
 *
 * Provider evaluation and fitting use JavaScript binary64. Validation simulates the selected
 * local Float32 or double-single GPU evaluator so accepted patches reflect their execution mode.
 *
 * @throws When options are invalid, a provider produces invalid coordinates, or the requested
 * tolerance cannot be achieved within the configured subdivision or patch limits.
 */
export function compileProjectionPlan(options: CompileProjectionPlanOptions): ProjectionPlan {
  const {
    projection,
    bounds,
    tolerance = DEFAULT_TOLERANCE,
    precision = 'local-f32',
    maxDepth = DEFAULT_MAXIMUM_DEPTH,
    degree = 3,
    sampleCount = DEFAULT_SAMPLE_COUNT,
    maxPatches = DEFAULT_MAXIMUM_PATCH_COUNT
  } = options;

  validateCompilerOptions({
    projection,
    bounds,
    tolerance,
    precision,
    maxDepth,
    degree,
    sampleCount,
    maxPatches
  });
  const project = getProjectionFunction(projection);
  const sourceOrigin = getBoundsCenter(bounds);
  const destinationOrigin = project(sourceOrigin);
  const patches: ProjectionPatch[] = [];
  const context: ProjectionCompilerContext = {
    project,
    destinationOrigin,
    precision,
    degree,
    tolerance,
    maxDepth,
    maxPatches,
    sampleCount,
    patches
  };

  compileProjectionPatch(context, bounds, 0);

  return {
    precision,
    bounds: [...bounds],
    destinationOrigin,
    patches,
    degree,
    tolerance,
    maxError: patches.reduce((maximum, patch) => Math.max(maximum, patch.maxError), 0),
    float32MaxError: patches.reduce(
      (maximum, patch) => Math.max(maximum, patch.float32MaxError),
      0
    ),
    doubleSingleMaxError: patches.reduce(
      (maximum, patch) => Math.max(maximum, patch.doubleSingleMaxError),
      0
    )
  };
}

/** Returns the zero-based patch containing a source coordinate, or `-1` outside the plan. */
export function findProjectionPatch(
  plan: ProjectionPlan,
  coordinates: ProjectionCoordinates
): number {
  const [sourceX, sourceY] = coordinates;
  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) {
    return -1;
  }
  return plan.patches.findIndex(patch => containsProjectionCoordinates(patch.bounds, coordinates));
}

/**
 * Evaluates one compiled plan and returns an absolute destination coordinate.
 *
 * Local Float32 GPU output remains relative to `plan.destinationOrigin`; double-single GPU output
 * is absolute. CPU evaluation always returns an absolute coordinate for direct provider comparison.
 */
export function evaluateProjectionPlan(
  plan: ProjectionPlan,
  coordinates: ProjectionCoordinates,
  patchId?: number
): [number, number] {
  const resolvedPatchId = patchId ?? findProjectionPatch(plan, coordinates);
  if (!Number.isSafeInteger(resolvedPatchId) || resolvedPatchId < 0) {
    throw new Error('projection coordinates are outside the compiled source bounds');
  }
  const patch = plan.patches[resolvedPatchId];
  if (!patch || !containsProjectionCoordinates(patch.bounds, coordinates)) {
    throw new Error('projection patch ID does not cover the supplied source coordinates');
  }
  const offset = evaluateProjectionPatchOffset(patch, coordinates, plan.precision);
  return [patch.destinationOrigin[0] + offset[0], patch.destinationOrigin[1] + offset[1]];
}

/**
 * Packs the stable, little-endian GPU patch ABI followed by the plan's source-bounds trailer.
 *
 * Each record contains source and destination binary64 origin words, source normalization,
 * the patch's destination offset from the plan origin, degree, Float32 coefficient highs,
 * double-single coefficient and scale lows, and reserved padding. The trailer contains four exact
 * binary64 bounds plus four inward-rounded float32 bounds.
 * Updating an imported GPU plan buffer with the result does not require recompiling its graph.
 */
export function packProjectionPlan(plan: ProjectionPlan): Uint32Array {
  const patchWordLength = plan.patches.length * PROJECTION_PATCH_WORD_LENGTH;
  const words = new Uint32Array(patchWordLength + PROJECTION_PLAN_BOUNDS_WORD_LENGTH);
  const dataView = new DataView(words.buffer);

  for (const patch of plan.patches) {
    const wordOffset = patch.id * PROJECTION_PATCH_WORD_LENGTH;
    if (!Number.isSafeInteger(patch.id) || patch.id < 0 || patch.id >= plan.patches.length) {
      throw new Error('projection patch IDs must be contiguous zero-based indices');
    }

    // Float64Array uploads use little-endian low/high words. WGSL converts these to canonical
    // high/low order immediately before invoking integer-backed binary64 subtraction helpers.
    dataView.setFloat64((wordOffset + 0) * 4, patch.sourceOrigin[0], true);
    dataView.setFloat64((wordOffset + 2) * 4, patch.sourceOrigin[1], true);
    dataView.setFloat32((wordOffset + 4) * 4, patch.sourceScale[0], true);
    dataView.setFloat32((wordOffset + 5) * 4, patch.sourceScale[1], true);
    dataView.setFloat32(
      (wordOffset + 6) * 4,
      patch.destinationOrigin[0] - plan.destinationOrigin[0],
      true
    );
    dataView.setFloat32(
      (wordOffset + 7) * 4,
      patch.destinationOrigin[1] - plan.destinationOrigin[1],
      true
    );
    dataView.setFloat32(
      (wordOffset + 8) * 4,
      (patch.bounds[0] - patch.sourceOrigin[0]) / patch.sourceScale[0],
      true
    );
    dataView.setFloat32(
      (wordOffset + 9) * 4,
      (patch.bounds[1] - patch.sourceOrigin[1]) / patch.sourceScale[1],
      true
    );
    // Preserve the binary64-origin residual for float32 inputs. The normalized upper bounds need
    // no dedicated storage because every compiler-created half-extent spans exactly two units.
    dataView.setFloat32(
      (wordOffset + 10) * 4,
      patch.sourceOrigin[0] - Math.fround(patch.sourceOrigin[0]),
      true
    );
    dataView.setFloat32(
      (wordOffset + 11) * 4,
      patch.sourceOrigin[1] - Math.fround(patch.sourceOrigin[1]),
      true
    );
    words[wordOffset + 12] = patch.degree;
    dataView.setFloat32((wordOffset + 13) * 4, patch.sourceOrigin[0], true);
    dataView.setFloat32((wordOffset + 14) * 4, patch.sourceOrigin[1], true);
    // This runtime zero is part of the ABI: its integer XOR prevents graphics drivers from
    // reassociating `(position - originHigh) - originLow` into the lossy global subtraction.
    words[wordOffset + 15] = 0;
    dataView.setFloat64((wordOffset + 16) * 4, patch.destinationOrigin[0], true);
    dataView.setFloat64((wordOffset + 18) * 4, patch.destinationOrigin[1], true);

    for (
      let coefficientIndex = 0;
      coefficientIndex < MAXIMUM_COEFFICIENT_COUNT;
      coefficientIndex++
    ) {
      const coefficientX = patch.doubleSingleCoefficientsX[coefficientIndex] ?? 0;
      const coefficientY = patch.doubleSingleCoefficientsY[coefficientIndex] ?? 0;
      const coefficientHighX = Math.fround(coefficientX);
      const coefficientHighY = Math.fround(coefficientY);
      dataView.setFloat32((wordOffset + 20 + coefficientIndex) * 4, coefficientHighX, true);
      dataView.setFloat32((wordOffset + 30 + coefficientIndex) * 4, coefficientHighY, true);
      dataView.setFloat32(
        (wordOffset + 40 + coefficientIndex) * 4,
        coefficientX - coefficientHighX,
        true
      );
      dataView.setFloat32(
        (wordOffset + 50 + coefficientIndex) * 4,
        coefficientY - coefficientHighY,
        true
      );
    }
    dataView.setFloat32(
      (wordOffset + 60) * 4,
      patch.sourceScale[0] - Math.fround(patch.sourceScale[0]),
      true
    );
    dataView.setFloat32(
      (wordOffset + 61) * 4,
      patch.sourceScale[1] - Math.fround(patch.sourceScale[1]),
      true
    );
  }

  for (let boundIndex = 0; boundIndex < plan.bounds.length; boundIndex++) {
    dataView.setFloat64(
      (patchWordLength + boundIndex * 2) * Uint32Array.BYTES_PER_ELEMENT,
      plan.bounds[boundIndex],
      true
    );
  }
  const float32Bounds = [
    getFloat32Ceiling(plan.bounds[0]),
    getFloat32Ceiling(plan.bounds[1]),
    getFloat32Floor(plan.bounds[2]),
    getFloat32Floor(plan.bounds[3])
  ];
  for (let boundIndex = 0; boundIndex < float32Bounds.length; boundIndex++) {
    dataView.setFloat32(
      (patchWordLength + 8 + boundIndex) * Uint32Array.BYTES_PER_ELEMENT,
      float32Bounds[boundIndex],
      true
    );
  }

  return words;
}

function getFloat32Ceiling(value: number): number {
  const rounded = Math.fround(value);
  return rounded >= value ? rounded : getAdjacentFloat32(rounded, 1);
}

function getFloat32Floor(value: number): number {
  const rounded = Math.fround(value);
  return rounded <= value ? rounded : getAdjacentFloat32(rounded, -1);
}

function getAdjacentFloat32(value: number, direction: -1 | 1): number {
  const values = new Float32Array(1);
  const words = new Uint32Array(values.buffer);
  values[0] = value;
  if (value === 0) {
    words[0] = direction === 1 ? 1 : 0x80000001;
  } else if (value > 0 === (direction === 1)) {
    words[0]++;
  } else {
    words[0]--;
  }
  return values[0];
}

function validateCompilerOptions(options: {
  projection: ProjectionProvider;
  bounds: ProjectionBounds;
  tolerance: number;
  precision: ProjectionPrecision;
  maxDepth: number;
  degree: ProjectionDegree;
  sampleCount: number;
  maxPatches: number;
}): void {
  const {projection, bounds, tolerance, precision, maxDepth, degree, sampleCount, maxPatches} =
    options;
  const hasProjectionFunction =
    typeof projection === 'function' ||
    (typeof projection === 'object' &&
      projection !== null &&
      typeof projection.project === 'function');
  if (!hasProjectionFunction) {
    throw new Error('projection must be a function or expose a project method');
  }
  if (
    !Array.isArray(bounds) ||
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3]
  ) {
    throw new Error('projection bounds must contain finite, increasing source coordinates');
  }
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error('projection tolerance must be a positive finite number');
  }
  if (precision !== 'local-f32' && precision !== 'double-single') {
    throw new Error('projection precision must be local-f32 or double-single');
  }
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || maxDepth > MAXIMUM_SUBDIVISION_DEPTH) {
    throw new Error('projection maxDepth must be an integer between 0 and 16');
  }
  if (degree !== 1 && degree !== 2 && degree !== 3) {
    throw new Error('projection polynomial degree must be 1, 2, or 3');
  }
  if (
    !Number.isSafeInteger(sampleCount) ||
    sampleCount < degree + 1 ||
    sampleCount > MAXIMUM_SAMPLE_COUNT
  ) {
    throw new Error('projection sampleCount must be between degree + 1 and 32');
  }
  if (!Number.isSafeInteger(maxPatches) || maxPatches < 1) {
    throw new Error('projection maxPatches must be a positive safe integer');
  }
}

function getProjectionFunction(
  projection: ProjectionProvider
): (coordinates: ProjectionCoordinates) => [number, number] {
  return coordinates => {
    const input = [coordinates[0], coordinates[1]];
    const output = typeof projection === 'function' ? projection(input) : projection.project(input);
    if (
      !Array.isArray(output) ||
      output.length < 2 ||
      !Number.isFinite(output[0]) ||
      !Number.isFinite(output[1])
    ) {
      throw new Error('projection provider must return two finite destination coordinates');
    }
    return [output[0], output[1]];
  };
}

function compileProjectionPatch(
  context: ProjectionCompilerContext,
  bounds: ProjectionBounds,
  depth: number
): void {
  const sourceOrigin = getBoundsCenter(bounds);
  const sourceScale: [number, number] = [(bounds[2] - bounds[0]) / 2, (bounds[3] - bounds[1]) / 2];
  if (
    sourceScale.some(
      scale => scale <= 0 || !Number.isFinite(Math.fround(scale)) || Math.fround(scale) === 0
    )
  ) {
    throw new Error('projection source bounds must have finite, nonzero float32 local scales');
  }
  const destinationOrigin = context.project(sourceOrigin);
  const fit = fitProjectionPolynomial(
    context,
    bounds,
    sourceOrigin,
    sourceScale,
    destinationOrigin
  );

  if (fit.maxError <= context.tolerance) {
    if (context.patches.length >= context.maxPatches) {
      throw new Error('projection approximation exceeds the configured maximum patch count');
    }
    context.patches.push({
      id: context.patches.length,
      bounds: [...bounds],
      sourceOrigin,
      sourceScale,
      destinationOrigin,
      coefficientsX: fit.coefficientsX,
      coefficientsY: fit.coefficientsY,
      doubleSingleCoefficientsX: fit.doubleSingleCoefficientsX,
      doubleSingleCoefficientsY: fit.doubleSingleCoefficientsY,
      degree: context.degree,
      maxError: fit.maxError,
      float32MaxError: fit.float32MaxError,
      doubleSingleMaxError: fit.doubleSingleMaxError
    });
    return;
  }

  if (depth >= context.maxDepth) {
    throw new Error(
      'projection approximation exceeds its tolerance at the maximum subdivision depth'
    );
  }
  const [centerX, centerY] = sourceOrigin;
  if (
    centerX <= bounds[0] ||
    centerX >= bounds[2] ||
    centerY <= bounds[1] ||
    centerY >= bounds[3]
  ) {
    throw new Error('projection source bounds cannot be subdivided at binary64 precision');
  }

  compileProjectionPatch(context, [bounds[0], bounds[1], centerX, centerY], depth + 1);
  compileProjectionPatch(context, [centerX, bounds[1], bounds[2], centerY], depth + 1);
  compileProjectionPatch(context, [bounds[0], centerY, centerX, bounds[3]], depth + 1);
  compileProjectionPatch(context, [centerX, centerY, bounds[2], bounds[3]], depth + 1);
}

function fitProjectionPolynomial(
  context: ProjectionCompilerContext,
  bounds: ProjectionBounds,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates,
  destinationOrigin: ProjectionCoordinates
): PolynomialFit {
  const coefficientCount = getCoefficientCount(context.degree);
  const matrix = new Float64Array(coefficientCount * coefficientCount);
  const destinationX = new Float64Array(coefficientCount);
  const destinationY = new Float64Array(coefficientCount);
  const basis = new Float64Array(coefficientCount);

  for (let rowIndex = 0; rowIndex < context.sampleCount; rowIndex++) {
    const normalizedY = getChebyshevNode(rowIndex, context.sampleCount);
    for (let columnIndex = 0; columnIndex < context.sampleCount; columnIndex++) {
      const normalizedX = getChebyshevNode(columnIndex, context.sampleCount);
      const source: [number, number] = [
        sourceOrigin[0] + normalizedX * sourceScale[0],
        sourceOrigin[1] + normalizedY * sourceScale[1]
      ];
      const normalizedSource =
        context.precision === 'double-single'
          ? normalizeProjectionCoordinatesBinary64(source, sourceOrigin, sourceScale)
          : normalizeProjectionCoordinates(source, sourceOrigin, sourceScale);
      fillPolynomialBasis(basis, normalizedSource, context.degree);
      const projected = context.project(source);
      const offsetX = projected[0] - destinationOrigin[0];
      const offsetY = projected[1] - destinationOrigin[1];

      for (let coefficientIndex = 0; coefficientIndex < coefficientCount; coefficientIndex++) {
        const basisValue = basis[coefficientIndex];
        destinationX[coefficientIndex] += basisValue * offsetX;
        destinationY[coefficientIndex] += basisValue * offsetY;
        for (let innerIndex = 0; innerIndex < coefficientCount; innerIndex++) {
          matrix[coefficientIndex * coefficientCount + innerIndex] +=
            basisValue * basis[innerIndex];
        }
      }
    }
  }

  const doubleSingleCoefficientsX = solveLinearSystem(matrix, destinationX, coefficientCount);
  const doubleSingleCoefficientsY = solveLinearSystem(matrix, destinationY, coefficientCount);
  const coefficientsX = Float32Array.from(doubleSingleCoefficientsX);
  const coefficientsY = Float32Array.from(doubleSingleCoefficientsY);
  let float32MaximumError = 0;
  let doubleSingleMaximumError = 0;

  for (let rowIndex = 0; rowIndex < VALIDATION_SAMPLE_COUNT; rowIndex++) {
    const normalizedY = -1 + (2 * rowIndex) / (VALIDATION_SAMPLE_COUNT - 1);
    for (let columnIndex = 0; columnIndex < VALIDATION_SAMPLE_COUNT; columnIndex++) {
      const normalizedX = -1 + (2 * columnIndex) / (VALIDATION_SAMPLE_COUNT - 1);
      const source: [number, number] = [
        columnIndex === 0
          ? bounds[0]
          : columnIndex === VALIDATION_SAMPLE_COUNT - 1
            ? bounds[2]
            : sourceOrigin[0] + normalizedX * sourceScale[0],
        rowIndex === 0
          ? bounds[1]
          : rowIndex === VALIDATION_SAMPLE_COUNT - 1
            ? bounds[3]
            : sourceOrigin[1] + normalizedY * sourceScale[1]
      ];
      const reference = context.project(source);
      const normalizedSource = normalizeProjectionCoordinates(source, sourceOrigin, sourceScale);
      float32MaximumError = Math.max(
        float32MaximumError,
        getFloat32ProjectionEvaluationError(
          context,
          destinationOrigin,
          coefficientsX,
          coefficientsY,
          normalizedSource,
          reference
        )
      );
      doubleSingleMaximumError = Math.max(
        doubleSingleMaximumError,
        getDoubleSingleProjectionEvaluationError(
          destinationOrigin,
          doubleSingleCoefficientsX,
          doubleSingleCoefficientsY,
          source,
          sourceOrigin,
          sourceScale,
          context.degree,
          reference
        )
      );

      // Float32 source rows arrive already quantized. Validate their real representable locations
      // and the shader's split-origin subtraction too, but never invent rows outside a narrow
      // binary64 patch merely because rounding a validation sample moved it past the boundary.
      const float32Source: [number, number] = [Math.fround(source[0]), Math.fround(source[1])];
      if (
        float32Source.every(Number.isFinite) &&
        containsProjectionCoordinates(bounds, float32Source)
      ) {
        const float32Reference =
          float32Source[0] === source[0] && float32Source[1] === source[1]
            ? reference
            : context.project(float32Source);
        const normalizedFloat32Source = normalizeFloat32ProjectionCoordinates(
          float32Source,
          sourceOrigin,
          sourceScale
        );
        float32MaximumError = Math.max(
          float32MaximumError,
          getFloat32ProjectionEvaluationError(
            context,
            destinationOrigin,
            coefficientsX,
            coefficientsY,
            normalizedFloat32Source,
            float32Reference
          )
        );
        doubleSingleMaximumError = Math.max(
          doubleSingleMaximumError,
          getDoubleSingleProjectionEvaluationError(
            destinationOrigin,
            doubleSingleCoefficientsX,
            doubleSingleCoefficientsY,
            float32Source,
            sourceOrigin,
            sourceScale,
            context.degree,
            float32Reference
          )
        );
      }
    }
  }

  const maxError =
    context.precision === 'double-single' ? doubleSingleMaximumError : float32MaximumError;
  return {
    coefficientsX,
    coefficientsY,
    doubleSingleCoefficientsX,
    doubleSingleCoefficientsY,
    maxError,
    float32MaxError: float32MaximumError,
    doubleSingleMaxError: doubleSingleMaximumError
  };
}

function getFloat32ProjectionEvaluationError(
  context: ProjectionCompilerContext,
  destinationOrigin: ProjectionCoordinates,
  coefficientsX: Float32Array,
  coefficientsY: Float32Array,
  normalizedSource: ProjectionCoordinates,
  reference: ProjectionCoordinates
): number {
  const projectedX = evaluatePolynomial(coefficientsX, normalizedSource, context.degree);
  const projectedY = evaluatePolynomial(coefficientsY, normalizedSource, context.degree);
  // GPU results are relative to one shared binary64 destination origin. Model the float32 patch
  // offset too: subdivision cannot restore precision lost by an excessively broad shared frame.
  const gpuLocalX = Math.fround(
    Math.fround(destinationOrigin[0] - context.destinationOrigin[0]) + projectedX
  );
  const gpuLocalY = Math.fround(
    Math.fround(destinationOrigin[1] - context.destinationOrigin[1]) + projectedY
  );
  return Math.hypot(
    gpuLocalX - (reference[0] - context.destinationOrigin[0]),
    gpuLocalY - (reference[1] - context.destinationOrigin[1])
  );
}

function getDoubleSingleProjectionEvaluationError(
  destinationOrigin: ProjectionCoordinates,
  coefficientsX: Float64Array,
  coefficientsY: Float64Array,
  coordinates: ProjectionCoordinates,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates,
  degree: ProjectionDegree,
  reference: ProjectionCoordinates
): number {
  const normalized = normalizeDoubleSingleProjectionCoordinates(
    coordinates,
    sourceOrigin,
    sourceScale
  );
  const projectedX = evaluateDoubleSinglePolynomial(coefficientsX, normalized, degree);
  const projectedY = evaluateDoubleSinglePolynomial(coefficientsY, normalized, degree);
  const resultX = sumDoubleSingle(splitDoubleSingle(destinationOrigin[0]), projectedX);
  const resultY = sumDoubleSingle(splitDoubleSingle(destinationOrigin[1]), projectedY);
  return Math.hypot(resultX[0] + resultX[1] - reference[0], resultY[0] + resultY[1] - reference[1]);
}

function solveLinearSystem(
  coefficients: Float64Array,
  values: Float64Array,
  dimension: number
): Float64Array {
  const matrix = coefficients.slice();
  const solution = values.slice();

  for (let columnIndex = 0; columnIndex < dimension; columnIndex++) {
    let pivotRow = columnIndex;
    let pivotMagnitude = Math.abs(matrix[columnIndex * dimension + columnIndex]);
    for (let rowIndex = columnIndex + 1; rowIndex < dimension; rowIndex++) {
      const magnitude = Math.abs(matrix[rowIndex * dimension + columnIndex]);
      if (magnitude > pivotMagnitude) {
        pivotMagnitude = magnitude;
        pivotRow = rowIndex;
      }
    }
    if (!Number.isFinite(pivotMagnitude) || pivotMagnitude <= PIVOT_EPSILON) {
      throw new Error('projection samples cannot support a stable polynomial approximation');
    }
    if (pivotRow !== columnIndex) {
      for (let innerIndex = columnIndex; innerIndex < dimension; innerIndex++) {
        const firstIndex = columnIndex * dimension + innerIndex;
        const secondIndex = pivotRow * dimension + innerIndex;
        [matrix[firstIndex], matrix[secondIndex]] = [matrix[secondIndex], matrix[firstIndex]];
      }
      [solution[columnIndex], solution[pivotRow]] = [solution[pivotRow], solution[columnIndex]];
    }

    const pivot = matrix[columnIndex * dimension + columnIndex];
    for (let rowIndex = columnIndex + 1; rowIndex < dimension; rowIndex++) {
      const factor = matrix[rowIndex * dimension + columnIndex] / pivot;
      matrix[rowIndex * dimension + columnIndex] = 0;
      for (let innerIndex = columnIndex + 1; innerIndex < dimension; innerIndex++) {
        matrix[rowIndex * dimension + innerIndex] -=
          factor * matrix[columnIndex * dimension + innerIndex];
      }
      solution[rowIndex] -= factor * solution[columnIndex];
    }
  }

  for (let rowIndex = dimension - 1; rowIndex >= 0; rowIndex--) {
    let value = solution[rowIndex];
    for (let columnIndex = rowIndex + 1; columnIndex < dimension; columnIndex++) {
      value -= matrix[rowIndex * dimension + columnIndex] * solution[columnIndex];
    }
    solution[rowIndex] = value / matrix[rowIndex * dimension + rowIndex];
  }

  return solution;
}

function evaluateProjectionPatchOffset(
  patch: ProjectionPatch,
  coordinates: ProjectionCoordinates,
  precision: ProjectionPrecision
): [number, number] {
  if (precision === 'double-single') {
    const normalized = normalizeDoubleSingleProjectionCoordinates(
      coordinates,
      patch.sourceOrigin,
      patch.sourceScale
    );
    const projectedX = evaluateDoubleSinglePolynomial(
      patch.doubleSingleCoefficientsX,
      normalized,
      patch.degree
    );
    const projectedY = evaluateDoubleSinglePolynomial(
      patch.doubleSingleCoefficientsY,
      normalized,
      patch.degree
    );
    return [projectedX[0] + projectedX[1], projectedY[0] + projectedY[1]];
  }
  const normalized = normalizeProjectionCoordinates(
    coordinates,
    patch.sourceOrigin,
    patch.sourceScale
  );
  return [
    evaluatePolynomial(patch.coefficientsX, normalized, patch.degree),
    evaluatePolynomial(patch.coefficientsY, normalized, patch.degree)
  ];
}

function normalizeDoubleSingleProjectionCoordinates(
  coordinates: ProjectionCoordinates,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates
): readonly [DoubleSingle, DoubleSingle] {
  const sourceOffsetX = splitDoubleSingle(coordinates[0] - sourceOrigin[0]);
  const sourceOffsetY = splitDoubleSingle(coordinates[1] - sourceOrigin[1]);
  return [
    divideDoubleSingle(sourceOffsetX, splitDoubleSingle(sourceScale[0])),
    divideDoubleSingle(sourceOffsetY, splitDoubleSingle(sourceScale[1]))
  ];
}

function normalizeProjectionCoordinates(
  coordinates: ProjectionCoordinates,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates
): [number, number] {
  return [
    Math.fround(Math.fround(coordinates[0] - sourceOrigin[0]) / Math.fround(sourceScale[0])),
    Math.fround(Math.fround(coordinates[1] - sourceOrigin[1]) / Math.fround(sourceScale[1]))
  ];
}

function normalizeProjectionCoordinatesBinary64(
  coordinates: ProjectionCoordinates,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates
): [number, number] {
  return [
    (coordinates[0] - sourceOrigin[0]) / sourceScale[0],
    (coordinates[1] - sourceOrigin[1]) / sourceScale[1]
  ];
}

function normalizeFloat32ProjectionCoordinates(
  coordinates: ProjectionCoordinates,
  sourceOrigin: ProjectionCoordinates,
  sourceScale: ProjectionCoordinates
): [number, number] {
  const originHighX = Math.fround(sourceOrigin[0]);
  const originHighY = Math.fround(sourceOrigin[1]);
  const originLowX = Math.fround(sourceOrigin[0] - originHighX);
  const originLowY = Math.fround(sourceOrigin[1] - originHighY);
  const sourceOffsetX = Math.fround(Math.fround(coordinates[0] - originHighX) - originLowX);
  const sourceOffsetY = Math.fround(Math.fround(coordinates[1] - originHighY) - originLowY);
  return [
    Math.fround(sourceOffsetX / Math.fround(sourceScale[0])),
    Math.fround(sourceOffsetY / Math.fround(sourceScale[1]))
  ];
}

function fillPolynomialBasis(
  basis: Float64Array,
  normalized: ProjectionCoordinates,
  degree: ProjectionDegree
): void {
  const [normalizedX, normalizedY] = normalized;
  let coefficientIndex = 0;
  for (let totalDegree = 0; totalDegree <= degree; totalDegree++) {
    for (let yDegree = 0; yDegree <= totalDegree; yDegree++) {
      const xDegree = totalDegree - yDegree;
      basis[coefficientIndex++] = normalizedX ** xDegree * normalizedY ** yDegree;
    }
  }
}

function evaluatePolynomial(
  coefficients: Float32Array,
  normalized: ProjectionCoordinates,
  degree: ProjectionDegree
): number {
  const [normalizedX, normalizedY] = normalized;
  const coefficientCount = getCoefficientCount(degree);
  const coefficient = (index: number): number =>
    index < coefficientCount ? coefficients[index] : 0;

  // Mirror the fully unrolled GPU Horner evaluator. Rounding each elementary multiply and add
  // avoids validating a more accurate CPU-only expression than the portable float32 shader.
  const xQuadratic = addFloat32Product(normalizedX, coefficient(6), coefficient(3));
  const xLinear = addFloat32Product(normalizedX, xQuadratic, coefficient(1));
  const mixedLinear = addFloat32Product(normalizedX, coefficient(7), coefficient(4));
  const yQuadraticX = addFloat32Product(normalizedX, coefficient(8), coefficient(5));
  const yQuadratic = addFloat32Product(normalizedY, coefficient(9), yQuadraticX);
  const yLinearX = addFloat32Product(normalizedX, mixedLinear, coefficient(2));
  const yLinear = addFloat32Product(normalizedY, yQuadratic, yLinearX);
  const xContribution = addFloat32Product(normalizedX, xLinear, coefficient(0));
  return addFloat32Product(normalizedY, yLinear, xContribution);
}

function evaluateDoubleSinglePolynomial(
  coefficients: Float64Array,
  normalized: readonly [DoubleSingle, DoubleSingle],
  degree: ProjectionDegree
): DoubleSingle {
  const [normalizedX, normalizedY] = normalized;
  const coefficientCount = getCoefficientCount(degree);
  const coefficient = (index: number): DoubleSingle =>
    splitDoubleSingle(index < coefficientCount ? coefficients[index] : 0);
  const multiplyAdd = (
    multiplier: DoubleSingle,
    multiplicand: DoubleSingle,
    addend: DoubleSingle
  ): DoubleSingle => sumDoubleSingle(addend, multiplyDoubleSingle(multiplier, multiplicand));

  const xQuadratic = multiplyAdd(normalizedX, coefficient(6), coefficient(3));
  const xLinear = multiplyAdd(normalizedX, xQuadratic, coefficient(1));
  const mixedLinear = multiplyAdd(normalizedX, coefficient(7), coefficient(4));
  const yQuadraticX = multiplyAdd(normalizedX, coefficient(8), coefficient(5));
  const yQuadratic = multiplyAdd(normalizedY, coefficient(9), yQuadraticX);
  const yLinearX = multiplyAdd(normalizedX, mixedLinear, coefficient(2));
  const yLinear = multiplyAdd(normalizedY, yQuadratic, yLinearX);
  const xContribution = multiplyAdd(normalizedX, xLinear, coefficient(0));
  return multiplyAdd(normalizedY, yLinear, xContribution);
}

function splitDoubleSingle(value: number): DoubleSingle {
  const high = Math.fround(value);
  return [high, Math.fround(value - high)];
}

function quickTwoSum(left: number, right: number): DoubleSingle {
  const sum = Math.fround(left + right);
  return [sum, Math.fround(right - Math.fround(sum - left))];
}

function twoSum(left: number, right: number): DoubleSingle {
  const sum = Math.fround(left + right);
  const virtualRight = Math.fround(sum - left);
  const leftError = Math.fround(left - Math.fround(sum - virtualRight));
  const rightError = Math.fround(right - virtualRight);
  return [sum, Math.fround(leftError + rightError)];
}

function twoProduct(left: number, right: number): DoubleSingle {
  const product = Math.fround(left * right);
  return [product, Math.fround(left * right - product)];
}

function sumDoubleSingle(left: DoubleSingle, right: DoubleSingle): DoubleSingle {
  let sum = twoSum(left[0], right[0]);
  const lowSum = twoSum(left[1], right[1]);
  sum = [sum[0], Math.fround(sum[1] + lowSum[0])];
  sum = quickTwoSum(sum[0], sum[1]);
  sum = [sum[0], Math.fround(sum[1] + lowSum[1])];
  return quickTwoSum(sum[0], sum[1]);
}

function subtractDoubleSingle(left: DoubleSingle, right: DoubleSingle): DoubleSingle {
  return sumDoubleSingle(left, [-right[0], -right[1]]);
}

function multiplyDoubleSingle(left: DoubleSingle, right: DoubleSingle): DoubleSingle {
  let product = twoProduct(left[0], right[0]);
  product = [product[0], Math.fround(product[1] + Math.fround(left[0] * right[1]))];
  product = quickTwoSum(product[0], product[1]);
  product = [product[0], Math.fround(product[1] + Math.fround(left[1] * right[0]))];
  return quickTwoSum(product[0], product[1]);
}

function divideDoubleSingle(dividend: DoubleSingle, divisor: DoubleSingle): DoubleSingle {
  const reciprocalHigh = Math.fround(1 / divisor[0]);
  const quotient = multiplyDoubleSingle(dividend, [reciprocalHigh, 0]);
  const remainderHigh = subtractDoubleSingle(dividend, multiplyDoubleSingle(divisor, quotient))[0];
  return sumDoubleSingle(quotient, twoProduct(reciprocalHigh, remainderHigh));
}

function addFloat32Product(left: number, right: number, addend: number): number {
  return Math.fround(Math.fround(left * right) + addend);
}

function containsProjectionCoordinates(
  bounds: ProjectionBounds,
  coordinates: ProjectionCoordinates
): boolean {
  return (
    coordinates[0] >= bounds[0] &&
    coordinates[0] <= bounds[2] &&
    coordinates[1] >= bounds[1] &&
    coordinates[1] <= bounds[3]
  );
}

function getBoundsCenter(bounds: ProjectionBounds): [number, number] {
  return [bounds[0] + (bounds[2] - bounds[0]) / 2, bounds[1] + (bounds[3] - bounds[1]) / 2];
}

function getCoefficientCount(degree: ProjectionDegree): number {
  return ((degree + 1) * (degree + 2)) / 2;
}

function getChebyshevNode(index: number, sampleCount: number): number {
  const node = Math.cos(((2 * index + 1) * Math.PI) / (2 * sampleCount));
  return Math.abs(node) < Number.EPSILON ? 0 : node;
}
