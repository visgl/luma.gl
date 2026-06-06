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
  PROJECTION_WORKGROUP_SIZE,
  UINT32_MAX,
  clamp,
  executeWebGLProjection,
  executeWebGPUProjection,
  getQuantizedPosition,
  getProjectionPositions,
  interpolateCatmullRomUint32,
  makeQuantizedProjectionOutput,
  projectDegrees180ToQuantized,
  projectSignedRangeToQuantized,
  quantizeUnitInterval,
  unprojectQuantizedDegrees,
  type ProjectionOperationInputs
} from './projection-utils';

const RADIANS_PER_DEGREE = Math.PI / 180;
const NATURAL_EARTH_HALF_WIDTH = Math.PI * 0.8707;
const NATURAL_EARTH_MAX_LATITUDE = 90;
const LATITUDE_TABLE_COORDINATE_SHIFT = 17;
const LATITUDE_TABLE_COORDINATE_STEP = 2 ** LATITUDE_TABLE_COORDINATE_SHIFT;
const LATITUDE_TABLE_COORDINATE_MASK = LATITUDE_TABLE_COORDINATE_STEP - 1;
const LATITUDE_TABLE_COORDINATE_INVERSE_STEP = 1 / LATITUDE_TABLE_COORDINATE_STEP;
const LATITUDE_MIN_QUANTIZED = projectDegrees180ToQuantized(-NATURAL_EARTH_MAX_LATITUDE);
const LATITUDE_MAX_QUANTIZED = projectDegrees180ToQuantized(NATURAL_EARTH_MAX_LATITUDE);
const LATITUDE_TABLE_START_INDEX =
  Math.floor(LATITUDE_MIN_QUANTIZED / LATITUDE_TABLE_COORDINATE_STEP) - 1;
const LATITUDE_TABLE_END_INDEX =
  Math.ceil(LATITUDE_MAX_QUANTIZED / LATITUDE_TABLE_COORDINATE_STEP) + 2;
const LATITUDE_TABLE_LENGTH = LATITUDE_TABLE_END_INDEX - LATITUDE_TABLE_START_INDEX + 1;
const LATITUDE_TABLE_TEXTURE_WIDTH = 256;
const LATITUDE_TABLE_TEXTURE_HEIGHT = Math.ceil(
  LATITUDE_TABLE_LENGTH / LATITUDE_TABLE_TEXTURE_WIDTH
);
const LONGITUDE_SCALE_DENOMINATOR = 360 * 0.8707;
const LONGITUDE_SCALE_TO_QUANTIZED_SCALE = 360;
const QUANTIZED_CENTER = 0x80000000;

let longitudeScaleTableValue: Uint32Array | null = null;
let longitudeScaleTableTextureValue: Uint32Array | null = null;
let yTableValue: Uint32Array | null = null;
let yTableTextureValue: Uint32Array | null = null;

type NaturalEarthOperationInputs = ProjectionOperationInputs & {
  longitudeScaleTable: GPUTableEvaluator;
  yTable: GPUTableEvaluator;
};

class NaturalEarthOperation extends Operation<NaturalEarthOperationInputs> {
  name = 'naturalEarth';

  output: GPUTableEvaluator;

  constructor(positions: GPUTableEvaluator) {
    super({
      positions,
      longitudeScaleTable: getLongitudeScaleTableEvaluator(),
      yTable: getYTableEvaluator()
    });

    this.output = makeQuantizedProjectionOutput('naturalEarth', positions, this);
  }

  toString(): string {
    return `naturalEarth(${this.inputs.positions})`;
  }
}

export function naturalEarth(positions: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new NaturalEarthOperation(getProjectionPositions(positions, 'naturalEarth')).output;
}

export function rawNaturalEarth([longitude, latitude]: readonly [number, number]): [number, number] {
  const longitudeScale = getLongitudeScaleAnalytic(latitude);
  return [
    quantizeUnitInterval(0.5 + longitude * longitudeScale),
    projectYAnalyticToQuantized(latitude)
  ];
}

export const executeCPUNaturalEarth: OperationHandler<NaturalEarthOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {positions} = inputs;
  const positionValues = positions.value ?? (await positions.readValue());
  const outputValues = new Uint32Array(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const [longitude, latitude] = getQuantizedPosition(positionValues, positions, rowIndex);
    const {longitudeScale, y} = getNaturalEarthTableLookup(latitude);
    const outputOffset = rowIndex * output.size;
    outputValues[outputOffset] = projectQuantizedLongitude(longitude, longitudeScale);
    outputValues[outputOffset + 1] = y;
  }

  target.write(outputValues);
  return {success: true, value: outputValues};
};

export const executeWebGPUNaturalEarth: OperationHandler<NaturalEarthOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, longitudeScaleTable, yTable} = inputs;
  return executeWebGPUProjection({
    positions,
    output,
    target,
    extraBindings: [
      {name: 'longitudeScaleTable', table: longitudeScaleTable},
      {name: 'yTable', table: yTable}
    ],
    getSource: ({resultBindingIndex, getBindingIndex}) =>
      getWebGPUProjectionSource({
        positions,
        output,
        longitudeScaleTableBindingIndex: getBindingIndex('longitudeScaleTable'),
        yTableBindingIndex: getBindingIndex('yTable'),
        resultBindingIndex
      })
  });
};

export const executeWebGLNaturalEarth: OperationHandler<NaturalEarthOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, longitudeScaleTable, yTable} = inputs;
  const longitudeScaleTableTexture = target.device.createTexture({
    width: LATITUDE_TABLE_TEXTURE_WIDTH,
    height: Math.ceil(longitudeScaleTable.length / LATITUDE_TABLE_TEXTURE_WIDTH),
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: getLongitudeScaleTableTextureValue()
  });
  const yTableTexture = target.device.createTexture({
    width: LATITUDE_TABLE_TEXTURE_WIDTH,
    height: Math.ceil(yTable.length / LATITUDE_TABLE_TEXTURE_WIDTH),
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: getYTableTextureValue()
  });

  return executeWebGLProjection({
    positions,
    output,
    target,
    source: getWebGLProjectionSource(positions),
    bindings: {longitudeScaleTable: longitudeScaleTableTexture, yTable: yTableTexture},
    resources: [longitudeScaleTableTexture, yTableTexture]
  });
};

function getLongitudeScaleTableEvaluator(): GPUTableEvaluator {
  return GPUTableEvaluator.fromArray(getLongitudeScaleTableValue(), {type: 'uint32', size: 1});
}

function getYTableEvaluator(): GPUTableEvaluator {
  return GPUTableEvaluator.fromArray(getYTableValue(), {type: 'uint32', size: 1});
}

function getLongitudeScaleTableValue(): Uint32Array {
  if (longitudeScaleTableValue) {
    return longitudeScaleTableValue;
  }

  longitudeScaleTableValue = new Uint32Array(LATITUDE_TABLE_LENGTH);
  for (let index = 0; index < LATITUDE_TABLE_LENGTH; index++) {
    const latitude = unprojectQuantizedDegrees(getLatitudeTableQuantizedValue(index));
    longitudeScaleTableValue[index] = quantizeUnitInterval(
      getLongitudeScaleAnalytic(latitude) * LONGITUDE_SCALE_TO_QUANTIZED_SCALE
    );
  }
  return longitudeScaleTableValue;
}

function getLongitudeScaleTableTextureValue(): Uint32Array {
  if (longitudeScaleTableTextureValue) {
    return longitudeScaleTableTextureValue;
  }

  longitudeScaleTableTextureValue = new Uint32Array(
    LATITUDE_TABLE_TEXTURE_WIDTH * LATITUDE_TABLE_TEXTURE_HEIGHT
  );
  longitudeScaleTableTextureValue.set(getLongitudeScaleTableValue());
  return longitudeScaleTableTextureValue;
}

function getYTableValue(): Uint32Array {
  if (yTableValue) {
    return yTableValue;
  }

  yTableValue = new Uint32Array(LATITUDE_TABLE_LENGTH);
  for (let index = 0; index < LATITUDE_TABLE_LENGTH; index++) {
    const latitude = unprojectQuantizedDegrees(getLatitudeTableQuantizedValue(index));
    yTableValue[index] = projectYAnalyticToQuantized(latitude);
  }
  return yTableValue;
}

function getYTableTextureValue(): Uint32Array {
  if (yTableTextureValue) {
    return yTableTextureValue;
  }

  yTableTextureValue = new Uint32Array(
    LATITUDE_TABLE_TEXTURE_WIDTH * LATITUDE_TABLE_TEXTURE_HEIGHT
  );
  yTableTextureValue.set(getYTableValue());
  return yTableTextureValue;
}

function getNaturalEarthTableLookup(latitude: number): {longitudeScale: number; y: number} {
  const clampedLatitude = clamp(latitude, LATITUDE_MIN_QUANTIZED, LATITUDE_MAX_QUANTIZED);
  const baseIndex = clamp(
    Math.floor(clampedLatitude / LATITUDE_TABLE_COORDINATE_STEP) - LATITUDE_TABLE_START_INDEX,
    1,
    LATITUDE_TABLE_LENGTH - 3
  );
  const t =
    (Math.trunc(clampedLatitude) & LATITUDE_TABLE_COORDINATE_MASK) *
    LATITUDE_TABLE_COORDINATE_INVERSE_STEP;
  const longitudeScaleTable = getLongitudeScaleTableValue();
  const yTable = getYTableValue();
  return {
    longitudeScale: interpolateCatmullRomUint32(
      longitudeScaleTable[baseIndex - 1],
      longitudeScaleTable[baseIndex],
      longitudeScaleTable[baseIndex + 1],
      longitudeScaleTable[baseIndex + 2],
      t
    ),
    y: interpolateCatmullRomUint32(
      yTable[baseIndex - 1],
      yTable[baseIndex],
      yTable[baseIndex + 1],
      yTable[baseIndex + 2],
      t
    )
  };
}

function getLatitudeTableQuantizedValue(index: number): number {
  return (LATITUDE_TABLE_START_INDEX + index) * LATITUDE_TABLE_COORDINATE_STEP;
}

function getLongitudeScaleAnalytic(latitude: number): number {
  const phi = clamp(
    latitude,
    -NATURAL_EARTH_MAX_LATITUDE,
    NATURAL_EARTH_MAX_LATITUDE
  ) * RADIANS_PER_DEGREE;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const xCoefficient =
    0.8707 -
    0.131979 * phi2 +
    phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4));
  return xCoefficient / LONGITUDE_SCALE_DENOMINATOR;
}

function projectQuantizedLongitude(longitude: number, longitudeScale: number): number {
  if (longitude >= QUANTIZED_CENTER) {
    return addUint32Clamped(
      QUANTIZED_CENTER,
      multiplyUint32ByQuantizedScale(longitude - QUANTIZED_CENTER, longitudeScale)
    );
  }

  return subtractUint32Clamped(
    QUANTIZED_CENTER,
    multiplyUint32ByQuantizedScale(QUANTIZED_CENTER - longitude, longitudeScale)
  );
}

function multiplyUint32ByQuantizedScale(value: number, scale: number): number {
  const product = BigInt(value >>> 0) * BigInt(scale >>> 0);
  return Number((product + 0x80000000n) >> 32n);
}

function addUint32Clamped(value: number, delta: number): number {
  return value > UINT32_MAX - delta ? UINT32_MAX : (value + delta) >>> 0;
}

function subtractUint32Clamped(value: number, delta: number): number {
  return value < delta ? 0 : (value - delta) >>> 0;
}

function projectYAnalyticToQuantized(latitude: number): number {
  return projectSignedRangeToQuantized(projectYAnalytic(latitude), NATURAL_EARTH_HALF_WIDTH);
}

function projectYAnalytic(latitude: number): number {
  const phi = clamp(
    latitude,
    -NATURAL_EARTH_MAX_LATITUDE,
    NATURAL_EARTH_MAX_LATITUDE
  ) * RADIANS_PER_DEGREE;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return (
    phi *
    (1.007226 +
      phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)))
  );
}

function getWebGLProjectionSource(positions: GPUTableEvaluator): string {
  return getGLSLProjectionShaderSource({
    positions,
    extraPrecision: 'precision highp usampler2D;',
    uniforms: `uniform highp usampler2D longitudeScaleTable;
uniform highp usampler2D yTable;`,
    projectedExpression: 'projectPosition(longitude, latitude)',
    projectionFunctions: getGLSLNaturalEarthProjectionFunctions()
  });
}

function getWebGPUProjectionSource({
  positions,
  output,
  longitudeScaleTableBindingIndex,
  yTableBindingIndex,
  resultBindingIndex
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  longitudeScaleTableBindingIndex: number;
  yTableBindingIndex: number;
  resultBindingIndex: number;
}): string {
  return getWGSLProjectionShaderSource({
    positions,
    output,
    resultBindingIndex,
    workgroupSize: PROJECTION_WORKGROUP_SIZE,
    extraBindings: `@group(0) @binding(${longitudeScaleTableBindingIndex}) var<storage, read> longitudeScaleTable: array<u32>;
@group(0) @binding(${yTableBindingIndex}) var<storage, read> yTable: array<u32>;`,
    projectedExpression: 'projectPosition(longitude, latitude)',
    projectionFunctions: getWGSLNaturalEarthProjectionFunctions()
  });
}

function getGLSLNaturalEarthProjectionFunctions(): string {
  return /* glsl */ `
uint readLongitudeScaleTable(int index) {
  return texelFetch(
    longitudeScaleTable,
    ivec2(index % ${LATITUDE_TABLE_TEXTURE_WIDTH}, index / ${LATITUDE_TABLE_TEXTURE_WIDTH}),
    0
  ).r;
}

uint readYTable(int index) {
  return texelFetch(
    yTable,
    ivec2(index % ${LATITUDE_TABLE_TEXTURE_WIDTH}, index / ${LATITUDE_TABLE_TEXTURE_WIDTH}),
    0
  ).r;
}

uint addUnsignedClamped(uint value, uint delta) {
  if (value > 0xffffffffu - delta) {
    return 0xffffffffu;
  }
  return value + delta;
}

uint subtractUnsignedClamped(uint value, uint delta) {
  if (value < delta) {
    return 0u;
  }
  return value - delta;
}

uint multiplyUint32ByQuantizedScale(uint value, uint scale) {
  uint valueLow = value & 0xffffu;
  uint valueHigh = value >> 16u;
  uint scaleLow = scale & 0xffffu;
  uint scaleHigh = scale >> 16u;
  uint productLow = valueLow * scaleLow;
  uint productMid1 = valueLow * scaleHigh;
  uint productMid2 = valueHigh * scaleLow;
  uint productHigh = valueHigh * scaleHigh;
  uint middleLow = (productLow >> 16u) + (productMid1 & 0xffffu) + (productMid2 & 0xffffu);
  uint high = productHigh + (productMid1 >> 16u) + (productMid2 >> 16u) + (middleLow >> 16u);
  uint low = ((middleLow & 0xffffu) << 16u) | (productLow & 0xffffu);
  if (low >= 0x80000000u && high < 0xffffffffu) {
    high = high + 1u;
  }
  return high;
}

uint projectLongitudeNaturalEarth(uint longitude, uint longitudeScale) {
  if (longitude >= 0x80000000u) {
    uint delta = multiplyUint32ByQuantizedScale(longitude - 0x80000000u, longitudeScale);
    return addUnsignedClamped(0x80000000u, delta);
  }

  uint delta = multiplyUint32ByQuantizedScale(0x80000000u - longitude, longitudeScale);
  return subtractUnsignedClamped(0x80000000u, delta);
}

uvec2 projectPosition(uint longitude, uint latitude) {
  uint clampedLatitude = clamp(latitude, ${LATITUDE_MIN_QUANTIZED}u, ${LATITUDE_MAX_QUANTIZED}u);
  int baseIndex = clamp(
    int(clampedLatitude >> ${LATITUDE_TABLE_COORDINATE_SHIFT}u) - ${LATITUDE_TABLE_START_INDEX},
    1,
    ${LATITUDE_TABLE_LENGTH - 3}
  );
  float t = float(clampedLatitude & ${LATITUDE_TABLE_COORDINATE_MASK}u) * ${LATITUDE_TABLE_COORDINATE_INVERSE_STEP};
  uint longitudeScale = interpolateCatmullRomUint32(
    readLongitudeScaleTable(baseIndex - 1),
    readLongitudeScaleTable(baseIndex),
    readLongitudeScaleTable(baseIndex + 1),
    readLongitudeScaleTable(baseIndex + 2),
    t
  );
  return uvec2(
    projectLongitudeNaturalEarth(longitude, longitudeScale),
    interpolateCatmullRomUint32(
      readYTable(baseIndex - 1),
      readYTable(baseIndex),
      readYTable(baseIndex + 1),
      readYTable(baseIndex + 2),
      t
    )
  );
}
`;
}

function getWGSLNaturalEarthProjectionFunctions(): string {
  return /* wgsl */ `
fn addUnsignedClamped(value: u32, delta: u32) -> u32 {
  if (value > 0xffffffffu - delta) {
    return 0xffffffffu;
  }
  return value + delta;
}

fn subtractUnsignedClamped(value: u32, delta: u32) -> u32 {
  if (value < delta) {
    return 0u;
  }
  return value - delta;
}

fn multiplyUint32ByQuantizedScale(value: u32, scale: u32) -> u32 {
  let valueLow = value & 0xffffu;
  let valueHigh = value >> 16u;
  let scaleLow = scale & 0xffffu;
  let scaleHigh = scale >> 16u;
  let productLow = valueLow * scaleLow;
  let productMid1 = valueLow * scaleHigh;
  let productMid2 = valueHigh * scaleLow;
  let productHigh = valueHigh * scaleHigh;
  let middleLow = (productLow >> 16u) + (productMid1 & 0xffffu) + (productMid2 & 0xffffu);
  var high = productHigh + (productMid1 >> 16u) + (productMid2 >> 16u) + (middleLow >> 16u);
  let low = ((middleLow & 0xffffu) << 16u) | (productLow & 0xffffu);
  if (low >= 0x80000000u && high < 0xffffffffu) {
    high = high + 1u;
  }
  return high;
}

fn projectLongitudeNaturalEarth(longitude: u32, longitudeScale: u32) -> u32 {
  if (longitude >= 0x80000000u) {
    let delta = multiplyUint32ByQuantizedScale(longitude - 0x80000000u, longitudeScale);
    return addUnsignedClamped(0x80000000u, delta);
  }

  let delta = multiplyUint32ByQuantizedScale(0x80000000u - longitude, longitudeScale);
  return subtractUnsignedClamped(0x80000000u, delta);
}

fn projectPosition(longitude: u32, latitude: u32) -> vec2<u32> {
  let clampedLatitude = clamp(latitude, ${LATITUDE_MIN_QUANTIZED}u, ${LATITUDE_MAX_QUANTIZED}u);
  let baseIndex = clamp(
    i32(clampedLatitude >> ${LATITUDE_TABLE_COORDINATE_SHIFT}u) - ${LATITUDE_TABLE_START_INDEX},
    1,
    ${LATITUDE_TABLE_LENGTH - 3}
  );
  let t = f32(clampedLatitude & ${LATITUDE_TABLE_COORDINATE_MASK}u) * ${LATITUDE_TABLE_COORDINATE_INVERSE_STEP};
  let index = u32(baseIndex);
  let longitudeScale = interpolateCatmullRomUint32(
    readLongitudeScaleTable(index - 1u),
    readLongitudeScaleTable(index),
    readLongitudeScaleTable(index + 1u),
    readLongitudeScaleTable(index + 2u),
    t
  );
  return vec2<u32>(
    projectLongitudeNaturalEarth(longitude, longitudeScale),
    interpolateCatmullRomUint32(
      yTable[index - 1u],
      yTable[index],
      yTable[index + 1u],
      yTable[index + 2u],
      t
    )
  );
}
`;
}
