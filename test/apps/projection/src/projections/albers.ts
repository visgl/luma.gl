import {Texture} from '@luma.gl/core';
import {
  GPUTableEvaluator,
  Operation,
  type GPUTableEvaluatorInput,
  type OperationHandler
} from '@luma.gl/gpgpu';
import {
  getGLSLProjectionShaderSource,
  getWGSLProjectionShaderSource
} from './projection-shader-utils';
import {
  albersProjectionParameters,
  type AlbersProjectionUniforms
} from './projection-parameters';
import {
  PROJECTION_WORKGROUP_SIZE,
  applySignedDelta,
  executeWebGLProjection,
  executeWebGPUProjection,
  getQuantizedPosition,
  getProjectionPositions,
  clamp,
  interpolateCatmullRomUint32,
  makeQuantizedProjectionOutput,
  multiplyUint32ByQ31,
  multiplyUint32ByQuantizedScale,
  projectDegrees180ToQuantized,
  quantizeUnitInterval,
  unprojectQuantizedDegrees,
  type ProjectionOperationInputs
} from './projection-utils';

const RADIANS_PER_DEGREE = Math.PI / 180;
const UINT32_RANGE = 0x100000000;
const UINT32_MAX = 0xffffffff;
const UINT32_SIGN_BIT = 0x80000000;
const SINE_TABLE_CENTER = 0x80000000;
const THETA_PHASE_QUARTER_TURN = 0x40000000;
const ALBERS_TABLE_COORDINATE_SHIFT = 17;
const ALBERS_TABLE_COORDINATE_STEP = 2 ** ALBERS_TABLE_COORDINATE_SHIFT;
const ALBERS_TABLE_COORDINATE_MASK = ALBERS_TABLE_COORDINATE_STEP - 1;
const ALBERS_TABLE_COORDINATE_INVERSE_STEP = 1 / ALBERS_TABLE_COORDINATE_STEP;
const ALBERS_LATITUDE_MIN_QUANTIZED = projectDegrees180ToQuantized(-90);
const ALBERS_LATITUDE_MAX_QUANTIZED = projectDegrees180ToQuantized(90);
const ALBERS_RHO_TABLE_START_INDEX =
  Math.floor(ALBERS_LATITUDE_MIN_QUANTIZED / ALBERS_TABLE_COORDINATE_STEP) - 1;
const ALBERS_RHO_TABLE_END_INDEX =
  Math.ceil(ALBERS_LATITUDE_MAX_QUANTIZED / ALBERS_TABLE_COORDINATE_STEP) + 2;
const ALBERS_RHO_TABLE_LENGTH =
  ALBERS_RHO_TABLE_END_INDEX - ALBERS_RHO_TABLE_START_INDEX + 1;
const ALBERS_SINE_TABLE_START_INDEX = -1;
const ALBERS_SINE_TABLE_END_INDEX = Math.ceil(UINT32_RANGE / ALBERS_TABLE_COORDINATE_STEP) + 2;
const ALBERS_SINE_TABLE_LENGTH =
  ALBERS_SINE_TABLE_END_INDEX - ALBERS_SINE_TABLE_START_INDEX + 1;
const ALBERS_TABLE_TEXTURE_WIDTH = 256;
const ALBERS_RHO_TABLE_TEXTURE_HEIGHT = Math.ceil(
  ALBERS_RHO_TABLE_LENGTH / ALBERS_TABLE_TEXTURE_WIDTH
);
const ALBERS_SINE_TABLE_TEXTURE_HEIGHT = Math.ceil(
  ALBERS_SINE_TABLE_LENGTH / ALBERS_TABLE_TEXTURE_WIDTH
);

export type AlbersProjectionParameters = {
  standardParallels: readonly [number, number];
  longitudeOrigin: number;
  latitudeOrigin: number;
  falseEasting?: number;
  falseNorthing?: number;
  semiMajorAxis?: number;
  inverseFlattening?: number;
  outputCenter?: readonly [number, number];
  outputHalfExtent: number;
};

type AlbersProjectionState = Required<
  Omit<AlbersProjectionParameters, 'standardParallels' | 'outputCenter'>
> & {
  standardParallels: readonly [number, number];
  outputCenter: readonly [number, number];
  eccentricity: number;
  n: number;
  c: number;
  rho0: number;
  longitudeOriginQuantized: number;
};

type AlbersOperationInputs = ProjectionOperationInputs & {
  parameters: AlbersProjectionState;
  rhoTable: GPUTableEvaluator;
  sineTable: GPUTableEvaluator;
};

type AlbersProjectionTableValues = {
  rhoTableValue: Uint32Array;
  rhoTableTextureValue: Uint32Array;
  sineTableValue: Uint32Array;
  sineTableTextureValue: Uint32Array;
};

const albersProjectionTableCache = new Map<string, AlbersProjectionTableValues>();

export const ALBERS_USGS_5070: AlbersProjectionParameters = {
  standardParallels: [29.5, 45.5],
  longitudeOrigin: -96,
  latitudeOrigin: 23,
  falseEasting: 0,
  falseNorthing: 0,
  semiMajorAxis: 6378137,
  inverseFlattening: 298.257222101,
  outputCenter: [0, 1500000],
  outputHalfExtent: 20000000
};

class AlbersOperation extends Operation<AlbersOperationInputs> {
  name = 'albers';

  output: GPUTableEvaluator;

  constructor(positions: GPUTableEvaluator, parameters: AlbersProjectionState) {
    super({
      positions,
      parameters,
      rhoTable: getRhoTableEvaluator(parameters),
      sineTable: getSineTableEvaluator(parameters)
    });

    this.output = makeQuantizedProjectionOutput('albers', positions, this);
  }

  toString(): string {
    return `albers(${this.inputs.positions})`;
  }
}

export function albers(
  positions: GPUTableEvaluatorInput,
  parameters: AlbersProjectionParameters
): GPUTableEvaluator {
  return new AlbersOperation(
    getProjectionPositions(positions, 'albers'),
    makeAlbersProjectionState(parameters)
  ).output;
}

export function rawAlbers(
  coordinates: readonly [number, number],
  parameters: AlbersProjectionParameters
): [number, number] {
  return projectAlbersToQuantized(coordinates, makeAlbersProjectionState(parameters));
}

export const executeCPUAlbers: OperationHandler<AlbersOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {positions, parameters, rhoTable, sineTable} = inputs;
  const positionValues = positions.value ?? (await positions.readValue());
  const outputValues = new Uint32Array(output.length * output.size);
  const rhoTableValues = rhoTable.value as Uint32Array;
  const sineTableValues = sineTable.value as Uint32Array;

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const [longitude, latitude] = getQuantizedPosition(positionValues, positions, rowIndex);
    const outputOffset = rowIndex * output.size;
    const projected = projectQuantizedAlbersToQuantized(
      longitude,
      latitude,
      parameters,
      rhoTableValues,
      sineTableValues
    );
    outputValues[outputOffset] = projected[0];
    outputValues[outputOffset + 1] = projected[1];
  }

  target.write(outputValues);
  return {success: true, value: outputValues};
};

export const executeWebGPUAlbers: OperationHandler<AlbersOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, parameters, rhoTable, sineTable} = inputs;
  return executeWebGPUProjection({
    positions,
    output,
    target,
    extraBindings: [
      {name: 'rhoTable', table: rhoTable},
      {name: 'sineTable', table: sineTable}
    ],
    modules: [albersProjectionParameters],
    moduleProps: {albersProjection: makeAlbersProjectionUniforms(parameters)},
    getSource: ({resultBindingIndex, getBindingIndex}) =>
      getWebGPUProjectionSource({
        positions,
        output,
        rhoTableBindingIndex: getBindingIndex('rhoTable'),
        sineTableBindingIndex: getBindingIndex('sineTable'),
        resultBindingIndex
      })
  });
};

export const executeWebGLAlbers: OperationHandler<AlbersOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, parameters} = inputs;
  const tableValues = getAlbersProjectionTableValues(parameters);
  const rhoTableTexture = target.device.createTexture({
    width: ALBERS_TABLE_TEXTURE_WIDTH,
    height: ALBERS_RHO_TABLE_TEXTURE_HEIGHT,
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: tableValues.rhoTableTextureValue
  });
  const sineTableTexture = target.device.createTexture({
    width: ALBERS_TABLE_TEXTURE_WIDTH,
    height: ALBERS_SINE_TABLE_TEXTURE_HEIGHT,
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: tableValues.sineTableTextureValue
  });

  return executeWebGLProjection({
    positions,
    output,
    target,
    source: getWebGLProjectionSource(positions),
    bindings: {
      rhoTable: rhoTableTexture,
      sineTable: sineTableTexture
    },
    modules: [albersProjectionParameters],
    moduleProps: {albersProjection: makeAlbersProjectionUniforms(parameters)},
    resources: [rhoTableTexture, sineTableTexture]
  });
};

function makeAlbersProjectionState(parameters: AlbersProjectionParameters): AlbersProjectionState {
  const semiMajorAxis = parameters.semiMajorAxis ?? 6378137;
  const inverseFlattening = parameters.inverseFlattening ?? 298.257222101;
  const falseEasting = parameters.falseEasting ?? 0;
  const falseNorthing = parameters.falseNorthing ?? 0;
  const outputCenter: readonly [number, number] = parameters.outputCenter ?? [
    falseEasting,
    falseNorthing
  ];
  const flattening = 1 / inverseFlattening;
  const eccentricity = Math.sqrt(2 * flattening - flattening * flattening);
  const standardParallel1 = parameters.standardParallels[0] * RADIANS_PER_DEGREE;
  const standardParallel2 = parameters.standardParallels[1] * RADIANS_PER_DEGREE;
  const latitudeOrigin = parameters.latitudeOrigin * RADIANS_PER_DEGREE;
  const m1 = getM(standardParallel1, eccentricity);
  const m2 = getM(standardParallel2, eccentricity);
  const q1 = getQ(standardParallel1, eccentricity);
  const q2 = getQ(standardParallel2, eccentricity);
  const q0 = getQ(latitudeOrigin, eccentricity);
  const n = (m1 * m1 - m2 * m2) / (q2 - q1);
  const c = m1 * m1 + n * q1;
  const rho0 = (semiMajorAxis * Math.sqrt(c - n * q0)) / n;
  const longitudeOriginQuantized = projectDegrees180ToQuantized(parameters.longitudeOrigin);

  return {
    ...parameters,
    falseEasting,
    falseNorthing,
    semiMajorAxis,
    inverseFlattening,
    outputCenter,
    eccentricity,
    n,
    c,
    rho0,
    longitudeOriginQuantized
  };
}

function projectAlbersToQuantized(
  coordinates: readonly [number, number],
  parameters: AlbersProjectionState
): [number, number] {
  const [x, y] = projectAlbersToMeters(coordinates, parameters);
  return [
    projectCoordinateToQuantized(x, parameters.outputCenter[0], parameters.outputHalfExtent),
    projectCoordinateToQuantized(y, parameters.outputCenter[1], parameters.outputHalfExtent)
  ];
}

function projectQuantizedAlbersToQuantized(
  longitude: number,
  latitude: number,
  parameters: AlbersProjectionState,
  rhoTableValue: Uint32Array,
  sineTableValue: Uint32Array
): [number, number] {
  const rhoUnits = lookupRhoUnitsTable(latitude, rhoTableValue);
  const thetaPhase = getThetaPhaseCoordinate(longitude, parameters);
  const sinTheta = lookupSineTable(thetaPhase, sineTableValue);
  const cosTheta = lookupSineTable(
    addUint32Wrapped(thetaPhase, THETA_PHASE_QUARTER_TURN),
    sineTableValue
  );
  const [xOffset, yOffset] = getQuantizedOutputOffset(parameters);
  const xDelta = multiplyRhoUnitsBySine(rhoUnits, sinTheta);
  const yDelta = multiplyRhoUnitsBySine(rhoUnits, cosTheta);

  return [
    applySignedDelta(xOffset, xDelta.delta, xDelta.negative),
    applySignedDelta(yOffset, yDelta.delta, !yDelta.negative)
  ];
}

function projectAlbersToMeters(
  [longitude, latitude]: readonly [number, number],
  parameters: AlbersProjectionState
): [number, number] {
  const longitudeDeltaRadians =
    wrapLongitudeDeltaDegrees(longitude - parameters.longitudeOrigin) * RADIANS_PER_DEGREE;
  const latitudeRadians = latitude * RADIANS_PER_DEGREE;
  const theta = parameters.n * longitudeDeltaRadians;
  const rho =
    (parameters.semiMajorAxis *
      Math.sqrt(Math.max(0, parameters.c - parameters.n * getQ(latitudeRadians, parameters.eccentricity)))) /
    parameters.n;
  return [
    parameters.falseEasting + rho * Math.sin(theta),
    parameters.falseNorthing + parameters.rho0 - rho * Math.cos(theta)
  ];
}

function wrapLongitudeDeltaDegrees(deltaDegrees: number): number {
  if (deltaDegrees < -180) {
    return deltaDegrees + 360;
  }
  if (deltaDegrees > 180) {
    return deltaDegrees - 360;
  }
  return deltaDegrees;
}

function getM(latitudeRadians: number, eccentricity: number): number {
  const sineLatitude = Math.sin(latitudeRadians);
  return (
    Math.cos(latitudeRadians) /
    Math.sqrt(1 - eccentricity * eccentricity * sineLatitude * sineLatitude)
  );
}

function getQ(latitudeRadians: number, eccentricity: number): number {
  const sineLatitude = Math.sin(latitudeRadians);
  const eccentricitySineLatitude = eccentricity * sineLatitude;
  return (
    (1 - eccentricity * eccentricity) *
    (sineLatitude / (1 - eccentricitySineLatitude * eccentricitySineLatitude) -
      Math.log((1 - eccentricitySineLatitude) / (1 + eccentricitySineLatitude)) /
        (2 * eccentricity))
  );
}

function projectCoordinateToQuantized(
  value: number,
  center: number,
  halfExtent: number
): number {
  return quantizeUnitInterval((value - center + halfExtent) / (2 * halfExtent));
}

function getOutputUnitsPerMeter(parameters: AlbersProjectionState): number {
  return UINT32_MAX / (2 * parameters.outputHalfExtent);
}

function getOutputOffset(parameters: AlbersProjectionState): [number, number] {
  const unitsPerMeter = getOutputUnitsPerMeter(parameters);
  return [
    (parameters.falseEasting - parameters.outputCenter[0] + parameters.outputHalfExtent) *
      unitsPerMeter,
    (parameters.falseNorthing +
      parameters.rho0 -
      parameters.outputCenter[1] +
      parameters.outputHalfExtent) *
      unitsPerMeter
  ];
}

function getQuantizedOutputOffset(parameters: AlbersProjectionState): [number, number] {
  const [xOffset, yOffset] = getOutputOffset(parameters);
  return [quantizeOutputUnits(xOffset), quantizeOutputUnits(yOffset)];
}

function quantizeOutputUnits(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= UINT32_MAX) {
    return UINT32_MAX;
  }
  return Math.round(value) >>> 0;
}

function getRhoTableEvaluator(parameters: AlbersProjectionState): GPUTableEvaluator {
  return GPUTableEvaluator.fromArray(getAlbersProjectionTableValues(parameters).rhoTableValue, {
    type: 'uint32',
    size: 1
  });
}

function getSineTableEvaluator(parameters: AlbersProjectionState): GPUTableEvaluator {
  return GPUTableEvaluator.fromArray(getAlbersProjectionTableValues(parameters).sineTableValue, {
    type: 'uint32',
    size: 1
  });
}

function getAlbersProjectionTableValues(
  parameters: AlbersProjectionState
): AlbersProjectionTableValues {
  const key = getAlbersProjectionTableKey(parameters);
  const cached = albersProjectionTableCache.get(key);
  if (cached) {
    return cached;
  }

  const rhoTableValue = new Uint32Array(ALBERS_RHO_TABLE_LENGTH);
  for (let index = 0; index < ALBERS_RHO_TABLE_LENGTH; index++) {
    rhoTableValue[index] = quantizeOutputUnits(
      getRhoOutputUnitsFromQuantizedLatitude(getRhoTableQuantizedLatitude(index), parameters)
    );
  }

  const sineTableValue = new Uint32Array(ALBERS_SINE_TABLE_LENGTH);
  for (let index = 0; index < ALBERS_SINE_TABLE_LENGTH; index++) {
    sineTableValue[index] = getBiasedSineFromPhaseCoordinate(getSineTableCoordinateValue(index));
  }

  const tableValues = {
    rhoTableValue,
    rhoTableTextureValue: makeTextureTableValue(
      rhoTableValue,
      ALBERS_RHO_TABLE_TEXTURE_HEIGHT
    ),
    sineTableValue,
    sineTableTextureValue: makeTextureTableValue(
      sineTableValue,
      ALBERS_SINE_TABLE_TEXTURE_HEIGHT
    )
  };
  albersProjectionTableCache.set(key, tableValues);
  return tableValues;
}

function getAlbersProjectionTableKey(parameters: AlbersProjectionState): string {
  return [
    parameters.eccentricity,
    parameters.n,
    parameters.c,
    parameters.rho0,
    parameters.semiMajorAxis,
    parameters.outputHalfExtent
  ].join('|');
}

function makeTextureTableValue(tableValue: Uint32Array, height: number): Uint32Array {
  const textureValue = new Uint32Array(ALBERS_TABLE_TEXTURE_WIDTH * height);
  textureValue.set(tableValue);
  return textureValue;
}

function getRhoOutputUnitsFromQuantizedLatitude(
  quantizedLatitude: number,
  parameters: AlbersProjectionState
): number {
  const clampedLatitude = clamp(
    quantizedLatitude,
    ALBERS_LATITUDE_MIN_QUANTIZED,
    ALBERS_LATITUDE_MAX_QUANTIZED
  );
  const latitudeRadians = unprojectQuantizedDegrees(clampedLatitude) * RADIANS_PER_DEGREE;
  return getRhoFromLatitudeRadians(latitudeRadians, parameters) * getOutputUnitsPerMeter(parameters);
}

function getRhoFromLatitudeRadians(
  latitudeRadians: number,
  parameters: AlbersProjectionState
): number {
  return (
    (parameters.semiMajorAxis *
      Math.sqrt(
        Math.max(0, parameters.c - parameters.n * getQ(latitudeRadians, parameters.eccentricity))
      )) /
    parameters.n
  );
}

function lookupRhoUnitsTable(latitude: number, rhoTableValue: Uint32Array): number {
  const clampedLatitude = clamp(
    latitude,
    ALBERS_LATITUDE_MIN_QUANTIZED,
    ALBERS_LATITUDE_MAX_QUANTIZED
  );
  const baseIndex = clamp(
    Math.floor(clampedLatitude / ALBERS_TABLE_COORDINATE_STEP) - ALBERS_RHO_TABLE_START_INDEX,
    1,
    ALBERS_RHO_TABLE_LENGTH - 3
  );
  const t =
    (Math.trunc(clampedLatitude) & ALBERS_TABLE_COORDINATE_MASK) *
    ALBERS_TABLE_COORDINATE_INVERSE_STEP;
  return interpolateUint32TableValue(rhoTableValue, baseIndex, t);
}

function lookupSineTable(coordinate: number, tableValue: Uint32Array): number {
  const baseIndex = clamp(
    Math.floor(coordinate / ALBERS_TABLE_COORDINATE_STEP) - ALBERS_SINE_TABLE_START_INDEX,
    1,
    ALBERS_SINE_TABLE_LENGTH - 3
  );
  const t =
    (Math.trunc(coordinate) & ALBERS_TABLE_COORDINATE_MASK) *
    ALBERS_TABLE_COORDINATE_INVERSE_STEP;
  return interpolateUint32TableValue(tableValue, baseIndex, t);
}

function interpolateUint32TableValue(
  tableValue: Uint32Array,
  baseIndex: number,
  t: number
): number {
  return interpolateCatmullRomUint32(
    tableValue[baseIndex - 1] ?? 0,
    tableValue[baseIndex] ?? 0,
    tableValue[baseIndex + 1] ?? 0,
    tableValue[baseIndex + 2] ?? 0,
    t
  );
}

function getRhoTableQuantizedLatitude(index: number): number {
  return (ALBERS_RHO_TABLE_START_INDEX + index) * ALBERS_TABLE_COORDINATE_STEP;
}

function getSineTableCoordinateValue(index: number): number {
  return (ALBERS_SINE_TABLE_START_INDEX + index) * ALBERS_TABLE_COORDINATE_STEP;
}

function getBiasedSineFromPhaseCoordinate(coordinate: number): number {
  return quantizeUnitInterval((Math.sin((coordinate / UINT32_RANGE) * 2 * Math.PI) + 1) / 2);
}

function getThetaPhaseCoordinate(longitude: number, parameters: AlbersProjectionState): number {
  const {longitudeOriginQuantized} = parameters;
  const shiftedLongitude = (longitude - longitudeOriginQuantized) >>> 0;
  let negative = false;
  let absoluteDelta = shiftedLongitude;
  if (shiftedLongitude > UINT32_SIGN_BIT) {
    negative = true;
    absoluteDelta = (0 - shiftedLongitude) >>> 0;
  }

  if (parameters.n < 0) {
    negative = !negative;
  }

  const phase = multiplyUint32ByQuantizedScale(
    absoluteDelta,
    getThetaPhaseScale(parameters)
  );
  return negative ? addUint32Wrapped(0, -phase) : phase;
}

function getThetaPhaseScale(parameters: AlbersProjectionState): number {
  return quantizeUnitInterval(Math.abs(parameters.n));
}

function multiplyRhoUnitsBySine(
  rhoUnits: number,
  biasedSine: number
): {delta: number; negative: boolean} {
  const negative = biasedSine < SINE_TABLE_CENTER;
  const sineMagnitude = negative
    ? SINE_TABLE_CENTER - biasedSine
    : biasedSine - SINE_TABLE_CENTER;
  return {
    delta: multiplyUint32ByQ31(rhoUnits, sineMagnitude),
    negative
  };
}

function addUint32Wrapped(value: number, delta: number): number {
  return (value + delta) >>> 0;
}

function makeAlbersProjectionUniforms(
  parameters: AlbersProjectionState
): AlbersProjectionUniforms {
  const [xOffset, yOffset] = getQuantizedOutputOffset(parameters);

  return {
    outputParameters: [
      xOffset,
      yOffset,
      parameters.longitudeOriginQuantized,
      getThetaPhaseScale(parameters)
    ],
    thetaParameters: [parameters.n < 0 ? 1 : 0, 0, 0, 0]
  };
}

function getWebGLProjectionSource(positions: GPUTableEvaluator): string {
  return getGLSLProjectionShaderSource({
    positions,
    extraPrecision: 'precision highp usampler2D;',
    uniforms: `uniform highp usampler2D rhoTable;
uniform highp usampler2D sineTable;`,
    projectedExpression: 'projectAlbers(longitude, latitude)',
    projectionFunctions: getGLSLAlbersProjectionFunctions()
  });
}

function getWebGPUProjectionSource({
  positions,
  output,
  rhoTableBindingIndex,
  sineTableBindingIndex,
  resultBindingIndex
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  rhoTableBindingIndex: number;
  sineTableBindingIndex: number;
  resultBindingIndex: number;
}): string {
  return getWGSLProjectionShaderSource({
    positions,
    output,
    resultBindingIndex,
    workgroupSize: PROJECTION_WORKGROUP_SIZE,
    extraBindings: `@group(0) @binding(${rhoTableBindingIndex}) var<storage, read> rhoTable: array<u32>;
@group(0) @binding(${sineTableBindingIndex}) var<storage, read> sineTable: array<u32>;`,
    projectedExpression: 'projectAlbers(longitude, latitude)',
    projectionFunctions: getWGSLAlbersProjectionFunctions()
  });
}

function getGLSLAlbersProjectionFunctions(): string {
  return /* glsl */ `
uint readRhoTable(int index) {
  return texelFetch(
    rhoTable,
    ivec2(index % ${ALBERS_TABLE_TEXTURE_WIDTH}, index / ${ALBERS_TABLE_TEXTURE_WIDTH}),
    0
  ).r;
}

uint readSineTable(int index) {
  return texelFetch(
    sineTable,
    ivec2(index % ${ALBERS_TABLE_TEXTURE_WIDTH}, index / ${ALBERS_TABLE_TEXTURE_WIDTH}),
    0
  ).r;
}

uint lookupRhoUnits(uint latitude) {
  uint clampedLatitude = clamp(latitude, ${ALBERS_LATITUDE_MIN_QUANTIZED}u, ${ALBERS_LATITUDE_MAX_QUANTIZED}u);
  int baseIndex = clamp(
    int(clampedLatitude >> ${ALBERS_TABLE_COORDINATE_SHIFT}u) - ${ALBERS_RHO_TABLE_START_INDEX},
    1,
    ${ALBERS_RHO_TABLE_LENGTH - 3}
  );
  float t = float(clampedLatitude & ${ALBERS_TABLE_COORDINATE_MASK}u) * ${ALBERS_TABLE_COORDINATE_INVERSE_STEP};
  return interpolateCatmullRomUint32(
    readRhoTable(baseIndex - 1),
    readRhoTable(baseIndex),
    readRhoTable(baseIndex + 1),
    readRhoTable(baseIndex + 2),
    t
  );
}

uint getThetaPhaseCoordinate(uint longitude) {
  uint shiftedLongitude = longitude - albersProjection.outputParameters.z;
  bool negative = false;
  uint absoluteDelta = shiftedLongitude;
  if (shiftedLongitude > 0x80000000u) {
    negative = true;
    absoluteDelta = 0u - shiftedLongitude;
  }

  if (albersProjection.thetaParameters.x != 0u) {
    negative = !negative;
  }

  uint phase = multiplyUint32ByQuantizedScale(
    absoluteDelta,
    albersProjection.outputParameters.w
  );
  return negative ? 0u - phase : phase;
}

uint lookupSine(uint phaseCoordinate) {
  int baseIndex = clamp(
    int(phaseCoordinate >> ${ALBERS_TABLE_COORDINATE_SHIFT}u) + ${-ALBERS_SINE_TABLE_START_INDEX},
    1,
    ${ALBERS_SINE_TABLE_LENGTH - 3}
  );
  float t = float(phaseCoordinate & ${ALBERS_TABLE_COORDINATE_MASK}u) * ${ALBERS_TABLE_COORDINATE_INVERSE_STEP};
  return interpolateCatmullRomUint32(
    readSineTable(baseIndex - 1),
    readSineTable(baseIndex),
    readSineTable(baseIndex + 1),
    readSineTable(baseIndex + 2),
    t
  );
}

uint getSineMagnitude(uint biasedSine, out bool negative) {
  negative = biasedSine < ${SINE_TABLE_CENTER}u;
  return negative ? ${SINE_TABLE_CENTER}u - biasedSine : biasedSine - ${SINE_TABLE_CENTER}u;
}

uint multiplyRhoUnitsBySine(uint rhoUnits, uint biasedSine, out bool negative) {
  uint sineMagnitude = getSineMagnitude(biasedSine, negative);
  return multiplyUint32ByQ31(rhoUnits, sineMagnitude);
}

uvec2 projectAlbers(uint longitude, uint latitude) {
  uint rhoUnits = lookupRhoUnits(latitude);
  uint thetaPhase = getThetaPhaseCoordinate(longitude);
  bool xNegative;
  uint xDelta = multiplyRhoUnitsBySine(rhoUnits, lookupSine(thetaPhase), xNegative);
  bool cosineNegative;
  uint yDelta = multiplyRhoUnitsBySine(
    rhoUnits,
    lookupSine(thetaPhase + ${THETA_PHASE_QUARTER_TURN}u),
    cosineNegative
  );
  return uvec2(
    addSignedDelta(albersProjection.outputParameters.x, xDelta, xNegative),
    addSignedDelta(albersProjection.outputParameters.y, yDelta, !cosineNegative)
  );
}
`;
}

function getWGSLAlbersProjectionFunctions(): string {
  return /* wgsl */ `
struct SignedDelta {
  delta: u32,
  negative: bool,
}

fn readRhoTable(index: u32) -> u32 {
  return rhoTable[index];
}

fn readSineTable(index: u32) -> u32 {
  return sineTable[index];
}

fn lookupRhoUnits(latitude: u32) -> u32 {
  let clampedLatitude = clamp(latitude, ${ALBERS_LATITUDE_MIN_QUANTIZED}u, ${ALBERS_LATITUDE_MAX_QUANTIZED}u);
  let baseIndex = clamp(
    i32(clampedLatitude >> ${ALBERS_TABLE_COORDINATE_SHIFT}u) - ${ALBERS_RHO_TABLE_START_INDEX},
    1,
    ${ALBERS_RHO_TABLE_LENGTH - 3}
  );
  let t = f32(clampedLatitude & ${ALBERS_TABLE_COORDINATE_MASK}u) * ${ALBERS_TABLE_COORDINATE_INVERSE_STEP};
  let index = u32(baseIndex);
  return interpolateCatmullRomUint32(
    readRhoTable(index - 1u),
    readRhoTable(index),
    readRhoTable(index + 1u),
    readRhoTable(index + 2u),
    t
  );
}

fn getThetaPhaseCoordinate(longitude: u32) -> u32 {
  let shiftedLongitude = longitude - albersProjection.outputParameters.z;
  var negative = false;
  var absoluteDelta = shiftedLongitude;
  if (shiftedLongitude > 0x80000000u) {
    negative = true;
    absoluteDelta = 0u - shiftedLongitude;
  }

  if (albersProjection.thetaParameters.x != 0u) {
    negative = !negative;
  }

  let phase = multiplyUint32ByQuantizedScale(
    absoluteDelta,
    albersProjection.outputParameters.w
  );
  if (negative) {
    return 0u - phase;
  }
  return phase;
}

fn lookupSine(phaseCoordinate: u32) -> u32 {
  let baseIndex = clamp(
    i32(phaseCoordinate >> ${ALBERS_TABLE_COORDINATE_SHIFT}u) + ${-ALBERS_SINE_TABLE_START_INDEX},
    1,
    ${ALBERS_SINE_TABLE_LENGTH - 3}
  );
  let t = f32(phaseCoordinate & ${ALBERS_TABLE_COORDINATE_MASK}u) * ${ALBERS_TABLE_COORDINATE_INVERSE_STEP};
  let index = u32(baseIndex);
  return interpolateCatmullRomUint32(
    readSineTable(index - 1u),
    readSineTable(index),
    readSineTable(index + 1u),
    readSineTable(index + 2u),
    t
  );
}

fn multiplyRhoUnitsBySine(rhoUnits: u32, biasedSine: u32) -> SignedDelta {
  let negative = biasedSine < ${SINE_TABLE_CENTER}u;
  let sineMagnitude =
    select(biasedSine - ${SINE_TABLE_CENTER}u, ${SINE_TABLE_CENTER}u - biasedSine, negative);
  return SignedDelta(multiplyUint32ByQ31(rhoUnits, sineMagnitude), negative);
}

fn projectAlbers(longitude: u32, latitude: u32) -> vec2<u32> {
  let rhoUnits = lookupRhoUnits(latitude);
  let thetaPhase = getThetaPhaseCoordinate(longitude);
  let xDelta = multiplyRhoUnitsBySine(rhoUnits, lookupSine(thetaPhase));
  let yDelta = multiplyRhoUnitsBySine(
    rhoUnits,
    lookupSine(thetaPhase + ${THETA_PHASE_QUARTER_TURN}u)
  );
  return vec2<u32>(
    addSignedDelta(albersProjection.outputParameters.x, xDelta.delta, xDelta.negative),
    addSignedDelta(albersProjection.outputParameters.y, yDelta.delta, !yDelta.negative)
  );
}
`;
}
