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
  executeWebGLProjection,
  executeWebGPUProjection,
  getQuantizedPosition,
  getProjectionPositions,
  makeQuantizedProjectionOutput,
  projectDegrees180ToQuantized,
  projectLongitudeToQuantized,
  type ProjectionOperationInputs
} from './projection-utils';

class EquirectangularOperation extends Operation<ProjectionOperationInputs> {
  name = 'equirectangular';

  output: GPUTableEvaluator;

  constructor(positions: GPUTableEvaluator) {
    super({positions});

    this.output = makeQuantizedProjectionOutput('equirectangular', positions, this);
  }

  toString(): string {
    return `equirectangular(${this.inputs.positions})`;
  }
}

export function equirectangular(positions: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new EquirectangularOperation(getProjectionPositions(positions, 'equirectangular')).output;
}

export function rawEquirectangular(
  [longitude, latitude]: readonly [number, number]
): [number, number] {
  return [projectLongitudeToQuantized(longitude), projectLatitudeToQuantized(latitude)];
}

export const executeCPUEquirectangular: OperationHandler<ProjectionOperationInputs> =
  async ({inputs, output, target}) => {
    const {positions} = inputs;
    const positionValues = positions.value ?? (await positions.readValue());
    const outputValues = new Uint32Array(output.length * output.size);

    for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
      const [longitude, latitude] = getQuantizedPosition(positionValues, positions, rowIndex);
      const outputOffset = rowIndex * output.size;
      outputValues[outputOffset] = longitude;
      outputValues[outputOffset + 1] = latitude;
    }

    target.write(outputValues);
    return {success: true, value: outputValues};
  };

export const executeWebGPUEquirectangular: OperationHandler<ProjectionOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions} = inputs;
  return executeWebGPUProjection({
    positions,
    output,
    target,
    getSource: ({resultBindingIndex}) =>
      getWebGPUProjectionSource({positions, output, resultBindingIndex})
  });
};

export const executeWebGLEquirectangular: OperationHandler<ProjectionOperationInputs> = ({
  inputs,
  output,
  target
}) => {
  const {positions} = inputs;
  return executeWebGLProjection({
    positions,
    output,
    target,
    source: getWebGLProjectionSource(positions)
  });
};

function projectLatitudeToQuantized(latitude: number): number {
  return projectDegrees180ToQuantized(latitude);
}

function getWebGLProjectionSource(positions: GPUTableEvaluator): string {
  return getGLSLProjectionShaderSource({
    positions,
    projectionFunctions: /* glsl */ `
uint projectLatitude(uint latitude) {
  return latitude;
}
`
  });
}

function getWebGPUProjectionSource({
  positions,
  output,
  resultBindingIndex
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  resultBindingIndex: number;
}): string {
  return getWGSLProjectionShaderSource({
    positions,
    output,
    resultBindingIndex,
    workgroupSize: PROJECTION_WORKGROUP_SIZE,
    projectionFunctions: /* wgsl */ `
fn projectLatitude(latitude: u32) -> u32 {
  return latitude;
}
`
  });
}
