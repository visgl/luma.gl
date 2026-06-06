import {type BufferLayout, type VertexFormat} from '@luma.gl/core';
import {BufferTransform, Computation} from '@luma.gl/engine';
import {
  fround,
  getGPUTableEvaluator,
  GPUTableEvaluator,
  Operation,
  type GPUTableEvaluatorInput,
  type OperationHandler
} from '@luma.gl/gpgpu';
import {
  formatShaderFloat,
  getGLSLDoublePrecisionMathModule,
  getGLSLGeospatialProjectionModule,
  getWGSLDoublePrecisionMathModule,
  getWGSLGeospatialProjectionModule
} from './projection-shader-utils';

type DegreesToQuantizedOperationInputs = {
  values: GPUTableEvaluator;
  hasLowPart: boolean;
};

const WORKGROUP_SIZE = 64;
const UINT32_MAX = 0xffffffff;

class DegreesToQuantizedOperation extends Operation<DegreesToQuantizedOperationInputs> {
  name = 'degreesToQuantized';

  output: GPUTableEvaluator;

  constructor(values: GPUTableEvaluator, outputSize: number, hasLowPart: boolean) {
    if (values.type !== 'float32') {
      throw new Error('degreesToQuantized input must be float32 values');
    }
    super({values, hasLowPart});

    this.output = new GPUTableEvaluator({
      id: 'degreesToQuantized',
      isConstant: values.isConstant,
      type: 'uint32',
      size: outputSize,
      length: values.length,
      source: this
    });
  }

  toString(): string {
    return `degreesToQuantized(${this.inputs.values})`;
  }
}

export function degreesToQuantized(x: GPUTableEvaluatorInput): GPUTableEvaluator {
  const input = getGPUTableEvaluator(x);

  if (input.type === 'uint32') {
    if (input.size % 2 !== 0) {
      throw new Error('degreesToQuantized fp64 input must have an even number of uint32 lanes');
    }
    return new DegreesToQuantizedOperation(fround(input), input.size / 2, true).output;
  }

  if (input.type === 'float32') {
    return new DegreesToQuantizedOperation(input, input.size, false).output;
  }

  throw new Error('degreesToQuantized input must be float32 degree values or float64 values');
}

export const executeCPUDegreesToQuantized: OperationHandler<
  DegreesToQuantizedOperationInputs
> = async ({inputs, output, target}) => {
  const {values, hasLowPart} = inputs;
  const sourceValues = values.value;
  const inputValues = sourceValues ?? (await values.readValue());
  const inputOffset = sourceValues ? values.offset / values.ValueType.BYTES_PER_ELEMENT : 0;
  const inputStride = sourceValues
    ? values.stride / values.ValueType.BYTES_PER_ELEMENT
    : values.size;
  const outputValues = new Uint32Array(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const inputRowIndex = values.isConstant ? 0 : rowIndex;
    const inputRowOffset = inputOffset + inputRowIndex * inputStride;
    const outputRowOffset = rowIndex * output.size;

    for (let valueIndex = 0; valueIndex < output.size; valueIndex++) {
      const high = Number(inputValues[inputRowOffset + valueIndex]);
      const low = hasLowPart ? Number(inputValues[inputRowOffset + valueIndex + output.size]) : 0;
      outputValues[outputRowOffset + valueIndex] = projectDegrees180ToQuantized(high + low);
    }
  }

  target.write(outputValues);
  return {success: true, value: outputValues};
};

export const executeWebGLDegreesToQuantized: OperationHandler<
  DegreesToQuantizedOperationInputs
> = ({inputs, output, target}) => {
  const {values, hasLowPart} = inputs;
  const transform = new BufferTransform(target.device, {
    vs: getWebGLDegreesToQuantizedSource(values, output, hasLowPart),
    bufferLayout: [getWebGLInputBufferLayout(values)],
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs: getWebGLOutputNames(output.size)
  });

  try {
    transform.run({
      inputBuffers: {values: values.buffer},
      outputBuffers: Object.fromEntries(
        getWebGLOutputNames(output.size).map(name => [name, target])
      )
    });
    return Promise.resolve({success: true});
  } finally {
    transform.destroy();
  }
};

export const executeWebGPUDegreesToQuantized: OperationHandler<
  DegreesToQuantizedOperationInputs
> = ({inputs, output, target}) => {
  const {values, hasLowPart} = inputs;
  const resultBindingIndex = values.isConstant ? 0 : 1;
  const computation = new Computation(target.device, {
    source: getWebGPUDegreesToQuantizedSource(values, output, resultBindingIndex, hasLowPart),
    shaderLayout: {
      bindings: [
        ...(values.isConstant
          ? []
          : [{name: 'values', type: 'storage' as const, group: 0, location: 0}]),
        {name: 'result', type: 'storage' as const, group: 0, location: resultBindingIndex}
      ]
    }
  });

  computation.setBindings({
    ...(values.isConstant ? {} : {values: values.buffer}),
    result: target
  });

  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / WORKGROUP_SIZE));
  computePass.end();
  target.device.submit();
  computation.destroy();

  return Promise.resolve({success: true});
};

function projectDegrees180ToQuantized(degrees: number): number {
  if (degrees <= -180) {
    return 0;
  }
  if (degrees >= 180) {
    return UINT32_MAX;
  }
  return Math.round(((degrees + 180) / 360) * UINT32_MAX) >>> 0;
}

function getWebGLInputBufferLayout(values: GPUTableEvaluator): BufferLayout {
  return {
    name: 'values',
    stepMode: values.isConstant ? 'vertex' : 'instance',
    byteStride: values.stride,
    attributes: Array.from({length: Math.ceil(values.size / 4)}, (_, attributeIndex) => {
      const laneIndex = attributeIndex * 4;
      const laneCount = Math.min(values.size - laneIndex, 4);
      return {
        attribute: `values_${laneIndex}`,
        format: getFloat32VertexFormat(laneCount),
        byteOffset: values.offset + laneIndex * values.ValueType.BYTES_PER_ELEMENT
      };
    })
  };
}

function getFloat32VertexFormat(size: number): VertexFormat {
  return (size === 1 ? 'float32' : `float32x${size}`) as VertexFormat;
}

function getWebGLDegreesToQuantizedSource(
  values: GPUTableEvaluator,
  output: GPUTableEvaluator,
  hasLowPart: boolean
): string {
  const lowExpression = hasLowPart ? `values[index + ${output.size}]` : '0.0';
  return /* glsl */ `\
#version 300 es

precision highp float;
precision highp int;

${getWebGLInputDeclarations(values.size)}
${getWebGLOutputDeclarations(output.size)}
${getGLSLDoublePrecisionMathModule()}
${getGLSLGeospatialProjectionModule()}

DoubleSingle readInputValue(float values[${values.size}], int index) {
  return DoubleSingle(values[index], ${lowExpression});
}

void degreesToQuantized(float values[${values.size}], out uint result[${output.size}]) {
  for (int i = 0; i < ${output.size}; i++) {
    result[i] = projectDegrees180ToQuantized(readInputValue(values, i));
  }
}

void main() {
  float values[${values.size}];
  get_values(values);
  uint result[${output.size}];
  degreesToQuantized(values, result);
  set_result(result);
}
`;
}

function getWebGPUDegreesToQuantizedSource(
  values: GPUTableEvaluator,
  output: GPUTableEvaluator,
  resultBindingIndex: number,
  hasLowPart: boolean
): string {
  const inputBinding = values.isConstant
    ? ''
    : '@group(0) @binding(0) var<storage, read> values: array<f32>;\n';
  const constantValues = values.isConstant
    ? getConstantValues(values).map(formatShaderFloat).join(', ')
    : '';
  const lowExpression = hasLowPart ? `values[index + ${output.size}u]` : '0.0';
  return /* wgsl */ `
${inputBinding}@group(0) @binding(${resultBindingIndex}) var<storage, read_write> result: array<u32>;

${getWGSLDoublePrecisionMathModule()}
${getWGSLGeospatialProjectionModule()}

fn readValues(rowIndex: u32) -> array<f32, ${values.size}> {
${getWebGPUInputReader(values, constantValues)}
}

fn readInputValue(values: array<f32, ${values.size}>, index: u32) -> DoubleSingle {
  return DoubleSingle(values[index], ${lowExpression});
}

fn writeResult(rowIndex: u32, values: array<u32, ${output.size}>) {
  let rowOffset = ${output.offset / output.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${output.stride / output.ValueType.BYTES_PER_ELEMENT}u;
${Array.from({length: output.size}, (_, index) => `  result[rowOffset + ${index}u] = values[${index}];`).join('\n')}
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalInvocationId: vec3<u32>
) {
  let rowIndex = globalInvocationId.x;
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let values = readValues(rowIndex);
  var projected: array<u32, ${output.size}>;
  for (var i = 0u; i < ${output.size}u; i = i + 1u) {
    projected[i] = projectDegrees180ToQuantized(readInputValue(values, i));
  }
  writeResult(rowIndex, projected);
}
`;
}

function getWebGLInputDeclarations(size: number): string {
  let attributeBlock = '';
  let readBlock = '';
  for (let index = 0; index < size; index += 4) {
    const laneCount = Math.min(size - index, 4);
    attributeBlock += `in ${getGLSLFloatType(laneCount)} values_${index};\n`;
    for (let lane = 0; lane < laneCount; lane++) {
      readBlock += `  values[${index + lane}] = ${laneCount === 1 ? `values_${index}` : `values_${index}[${lane}]`};\n`;
    }
  }
  return `${attributeBlock}
void get_values(out float values[${size}]) {
${readBlock}}
`;
}

function getWebGLOutputDeclarations(size: number): string {
  let varyingBlock = '';
  let writeBlock = '';
  for (let index = 0; index < size; index += 4) {
    const laneCount = Math.min(size - index, 4);
    varyingBlock += `flat out ${getGLSLUintType(laneCount)} result_${index};\n`;
    const values = Array.from({length: laneCount}, (_, lane) => `values[${index + lane}]`);
    writeBlock +=
      laneCount === 1
        ? `  result_${index} = values[${index}];\n`
        : `  result_${index} = ${getGLSLUintType(laneCount)}(${values.join(', ')});\n`;
  }
  return `${varyingBlock}
void set_result(uint values[${size}]) {
${writeBlock}}
`;
}

function getWebGLOutputNames(size: number): string[] {
  return Array.from({length: Math.ceil(size / 4)}, (_, index) => `result_${index * 4}`);
}

function getGLSLFloatType(size: number): string {
  return size === 1 ? 'float' : `vec${size}`;
}

function getGLSLUintType(size: number): string {
  return size === 1 ? 'uint' : `uvec${size}`;
}

function getWebGPUInputReader(values: GPUTableEvaluator, constantValues: string): string {
  if (values.isConstant) {
    return `  return array<f32, ${values.size}>(${constantValues});`;
  }

  const offset = values.offset / values.ValueType.BYTES_PER_ELEMENT;
  const stride = values.stride / values.ValueType.BYTES_PER_ELEMENT;
  return `  var result: array<f32, ${values.size}>;
  let rowOffset = ${offset}u + rowIndex * ${stride}u;
${Array.from({length: values.size}, (_, index) => `  result[${index}] = values[rowOffset + ${index}u];`).join('\n')}
  return result;`;
}

function getConstantValues(values: GPUTableEvaluator): number[] {
  const value = values.value;
  if (!value) {
    throw new Error(`Constant input ${values} is missing CPU values`);
  }
  return Array.from({length: values.size}, (_, index) => Number(value[index] ?? 0));
}
