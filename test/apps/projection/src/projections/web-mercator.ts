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
  clamp,
  executeWebGLProjection,
  executeWebGPUProjection,
  getQuantizedPosition,
  getProjectionPositions,
  interpolateCatmullRomUint32,
  makeQuantizedProjectionOutput,
  projectDegrees180ToQuantized,
  projectLongitudeToQuantized,
  quantizeUnitInterval,
  unprojectQuantizedDegrees,
  type ProjectionOperationInputs
} from './projection-utils';

const WEB_MERCATOR_MAX_LATITUDE = 85.0511287798066;
const LATITUDE_TABLE_COORDINATE_SHIFT = 17;
const LATITUDE_TABLE_COORDINATE_STEP = 2 ** LATITUDE_TABLE_COORDINATE_SHIFT;
const LATITUDE_TABLE_COORDINATE_MASK = LATITUDE_TABLE_COORDINATE_STEP - 1;
const LATITUDE_TABLE_COORDINATE_INVERSE_STEP = 1 / LATITUDE_TABLE_COORDINATE_STEP;
const LATITUDE_MIN_QUANTIZED = projectDegrees180ToQuantized(-WEB_MERCATOR_MAX_LATITUDE);
const LATITUDE_MAX_QUANTIZED = projectDegrees180ToQuantized(WEB_MERCATOR_MAX_LATITUDE);
const LATITUDE_TABLE_START_INDEX =
  Math.floor(LATITUDE_MIN_QUANTIZED / LATITUDE_TABLE_COORDINATE_STEP) - 1;
const LATITUDE_TABLE_END_INDEX =
  Math.ceil(LATITUDE_MAX_QUANTIZED / LATITUDE_TABLE_COORDINATE_STEP) + 2;
const LATITUDE_TABLE_LENGTH = LATITUDE_TABLE_END_INDEX - LATITUDE_TABLE_START_INDEX + 1;
const LATITUDE_TABLE_TEXTURE_WIDTH = 256;
const LATITUDE_TABLE_TEXTURE_HEIGHT = Math.ceil(
  LATITUDE_TABLE_LENGTH / LATITUDE_TABLE_TEXTURE_WIDTH
);
let latitudeTableValue: Uint32Array | null = null;
let latitudeTableTextureValue: Uint32Array | null = null;

type WebMercatorOperationInputs = ProjectionOperationInputs & {
  latitudeTable: GPUTableEvaluator;
};

class WebMercatorOperation extends Operation<WebMercatorOperationInputs> {
  name = 'webMercator';

  output: GPUTableEvaluator;

  constructor(positions: GPUTableEvaluator) {
    super({positions, latitudeTable: getLatitudeTableEvaluator()});

    this.output = makeQuantizedProjectionOutput('webMercator', positions, this);
  }

  toString(): string {
    return `webMercator(${this.inputs.positions})`;
  }
}

export function webMercator(positions: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new WebMercatorOperation(getProjectionPositions(positions, 'webMercator')).output;
}

export function rawWebMercator([longitude, latitude]: readonly [number, number]): [number, number] {
  return [projectLongitudeToQuantized(longitude), projectLatitudeAnalyticToQuantized(latitude)];
}

export const executeCPUWebMercator: OperationHandler<WebMercatorOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {positions} = inputs;
  const positionValues = positions.value ?? (await positions.readValue());
  const outputValues = new Uint32Array(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const [longitude, latitude] = getQuantizedPosition(positionValues, positions, rowIndex);
    const outputOffset = rowIndex * output.size;
    outputValues[outputOffset] = longitude;
    outputValues[outputOffset + 1] = projectLatitudeToQuantized(latitude);
  }

  target.write(outputValues);
  return {success: true, value: outputValues};
};

export const executeWebGPUWebMercator: OperationHandler<WebMercatorOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, latitudeTable} = inputs;
  return executeWebGPUProjection({
    positions,
    output,
    target,
    extraBindings: [{name: 'latitudeTable', table: latitudeTable}],
    getSource: ({resultBindingIndex, getBindingIndex}) =>
      getWebGPUProjectionSource({
        positions,
        output,
        latitudeTableBindingIndex: getBindingIndex('latitudeTable'),
        resultBindingIndex
      })
  });
};

export const executeWebGLWebMercator: OperationHandler<WebMercatorOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions, latitudeTable} = inputs;
  const latitudeTableTexture = target.device.createTexture({
    width: LATITUDE_TABLE_TEXTURE_WIDTH,
    height: Math.ceil(latitudeTable.length / LATITUDE_TABLE_TEXTURE_WIDTH),
    format: 'r32uint',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: getLatitudeTableTextureValue()
  });

  return executeWebGLProjection({
    positions,
    output,
    target,
    source: getWebGLProjectionSource(positions),
    bindings: {latitudeTable: latitudeTableTexture},
    resources: [latitudeTableTexture]
  });
};

function getLatitudeTableEvaluator(): GPUTableEvaluator {
  return GPUTableEvaluator.fromArray(getLatitudeTableValue(), {type: 'uint32', size: 1});
}

function getLatitudeTableValue(): Uint32Array {
  if (latitudeTableValue) {
    return latitudeTableValue;
  }

  latitudeTableValue = new Uint32Array(LATITUDE_TABLE_LENGTH);
  for (let index = 0; index < LATITUDE_TABLE_LENGTH; index++) {
    const latitude = unprojectQuantizedDegrees(getLatitudeTableQuantizedValue(index));
    latitudeTableValue[index] = projectLatitudeAnalyticToQuantized(latitude);
  }
  return latitudeTableValue;
}

function getLatitudeTableTextureValue(): Uint32Array {
  if (latitudeTableTextureValue) {
    return latitudeTableTextureValue;
  }

  latitudeTableTextureValue = new Uint32Array(
    LATITUDE_TABLE_TEXTURE_WIDTH * LATITUDE_TABLE_TEXTURE_HEIGHT
  );
  latitudeTableTextureValue.set(getLatitudeTableValue());
  return latitudeTableTextureValue;
}

function projectLatitudeToQuantized(latitude: number): number {
  const clampedLatitude = clamp(latitude, LATITUDE_MIN_QUANTIZED, LATITUDE_MAX_QUANTIZED);
  const baseIndex = clamp(
    Math.floor(clampedLatitude / LATITUDE_TABLE_COORDINATE_STEP) - LATITUDE_TABLE_START_INDEX,
    1,
    LATITUDE_TABLE_LENGTH - 3
  );
  const t =
    (Math.trunc(clampedLatitude) & LATITUDE_TABLE_COORDINATE_MASK) *
    LATITUDE_TABLE_COORDINATE_INVERSE_STEP;
  const latitudeTable = getLatitudeTableValue();
  return interpolateCatmullRomUint32(
    latitudeTable[baseIndex - 1],
    latitudeTable[baseIndex],
    latitudeTable[baseIndex + 1],
    latitudeTable[baseIndex + 2],
    t
  );
}

function projectLatitudeAnalyticToQuantized(latitude: number): number {
  const clampedLatitude = clamp(
    latitude,
    -WEB_MERCATOR_MAX_LATITUDE,
    WEB_MERCATOR_MAX_LATITUDE
  );
  const latitudeRadians = (clampedLatitude * Math.PI) / 180;
  const mercatorY = Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
  return quantizeUnitInterval((mercatorY + Math.PI) / (2 * Math.PI));
}

function getLatitudeTableQuantizedValue(index: number): number {
  return (LATITUDE_TABLE_START_INDEX + index) * LATITUDE_TABLE_COORDINATE_STEP;
}

function getWebGLProjectionSource(positions: GPUTableEvaluator): string {
  return getGLSLProjectionShaderSource({
    positions,
    extraPrecision: 'precision highp usampler2D;',
    uniforms: 'uniform highp usampler2D latitudeTable;',
    projectionFunctions: /* glsl */ `
uint readLatitudeTable(int index) {
  return texelFetch(
    latitudeTable,
    ivec2(index % ${LATITUDE_TABLE_TEXTURE_WIDTH}, index / ${LATITUDE_TABLE_TEXTURE_WIDTH}),
    0
  ).r;
}

uint projectLatitude(uint latitude) {
  uint clampedLatitude = clamp(latitude, ${LATITUDE_MIN_QUANTIZED}u, ${LATITUDE_MAX_QUANTIZED}u);
  int baseIndex = clamp(
    int(clampedLatitude >> ${LATITUDE_TABLE_COORDINATE_SHIFT}u) - ${LATITUDE_TABLE_START_INDEX},
    1,
    ${LATITUDE_TABLE_LENGTH - 3}
  );
  float t = float(clampedLatitude & ${LATITUDE_TABLE_COORDINATE_MASK}u) * ${LATITUDE_TABLE_COORDINATE_INVERSE_STEP};
  return interpolateCatmullRomUint32(
    readLatitudeTable(baseIndex - 1),
    readLatitudeTable(baseIndex),
    readLatitudeTable(baseIndex + 1),
    readLatitudeTable(baseIndex + 2),
    t
  );
}
`
  });
}

function getWebGPUProjectionSource({
  positions,
  output,
  latitudeTableBindingIndex,
  resultBindingIndex
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  latitudeTableBindingIndex: number;
  resultBindingIndex: number;
}): string {
  return getWGSLProjectionShaderSource({
    positions,
    output,
    resultBindingIndex,
    workgroupSize: PROJECTION_WORKGROUP_SIZE,
    extraBindings: `@group(0) @binding(${latitudeTableBindingIndex}) var<storage, read> latitudeTable: array<u32>;`,
    projectionFunctions: /* wgsl */ `
fn projectLatitude(latitude: u32) -> u32 {
  let clampedLatitude = clamp(latitude, ${LATITUDE_MIN_QUANTIZED}u, ${LATITUDE_MAX_QUANTIZED}u);
  let baseIndex = clamp(
    i32(clampedLatitude >> ${LATITUDE_TABLE_COORDINATE_SHIFT}u) - ${LATITUDE_TABLE_START_INDEX},
    1,
    ${LATITUDE_TABLE_LENGTH - 3}
  );
  let t = f32(clampedLatitude & ${LATITUDE_TABLE_COORDINATE_MASK}u) * ${LATITUDE_TABLE_COORDINATE_INVERSE_STEP};
  let index = u32(baseIndex);
  return interpolateCatmullRomUint32(
    latitudeTable[index - 1u],
    latitudeTable[index],
    latitudeTable[index + 1u],
    latitudeTable[index + 2u],
    t
  );
}
`
  });
}
