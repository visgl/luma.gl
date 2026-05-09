// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, SignedDataType} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {GPUTable} from '../../operation/gpu-table';

const WORKGROUP_SIZE = 64;

export function runComputation({
  module,
  elementWise = false,
  inputs,
  output,
  operationType = output.type,
  outputBuffer
}: {
  module: ShaderModule;
  elementWise?: boolean;
  inputs: {[name: string]: GPUTable};
  output: GPUTable;
  /** If specified, coerce all parameters to operation to this type.
   * Default to output's data type.
   */
  operationType?: SignedDataType;
  outputBuffer: Buffer;
}): void {
  if (!module.source) {
    throw new Error(`WebGPU computation ${module.name} requires WGSL source`);
  }

  const bindings = Object.entries(inputs).map(([name, input]) => ({name, input}));
  const storageBindings = bindings
    .filter(({input}) => !input.isConstant)
    .map((binding, index) => ({...binding, index}));
  const castToType = getWGSLType(operationType);
  const outputType = getWGSLType(output.type);
  const defines: Record<string, string> = {
    TYPE: castToType,
    RESULT_LEN: output.size.toString()
  };

  for (const name in inputs) {
    const input = inputs[name];
    defines[`${name.toUpperCase()}_LEN`] = input.size.toString();
  }

  const source = /* wgsl */ `
${preprocess(module.source, defines)}
${storageBindings.map(({name, input, index}) => getInputBinding(name, input, index)).join('\n')}
${bindings.map(({name, input}) => getInputAccessor(name, input, operationType)).join('\n')}
${getOutputBinding(output, storageBindings.length)}
${getOutputWriter(output)}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${output.length}u) {
    return;
  }

${bindings.map(({name}) => `  let ${name} = read_${name}(rowIndex);`).join('\n')}
  var result: array<${outputType}, ${output.size}>;
${getComputeBlock(module.name, inputs, output, elementWise)}
  write_result(rowIndex, result);
}
`;
  // console.log(source);

  const computation = new Computation(outputBuffer.device, {
    source,
    shaderLayout: {
      bindings: [
        ...storageBindings.map(({name}, index) => ({
          name,
          type: 'storage' as const,
          group: 0,
          location: index
        })),
        {name: 'result', type: 'storage' as const, group: 0, location: storageBindings.length}
      ]
    }
  });

  const computationBindings: Record<string, Buffer> = Object.fromEntries(
    storageBindings.map(({name, input}) => [name, input.buffer])
  );
  computationBindings['result'] = outputBuffer;
  computation.setBindings(computationBindings);

  const computePass = outputBuffer.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / WORKGROUP_SIZE));
  computePass.end();
  outputBuffer.device.submit();
  computation.destroy();
}

function getInputBinding(name: string, input: GPUTable, index: number): string {
  if (input.isConstant) {
    return '';
  }
  const inputType = getWGSLType(input.type);
  return `@group(0) @binding(${index}) var<storage, read> ${name}: array<${inputType}>;`;
}

function getInputAccessor(name: string, input: GPUTable, asType: SignedDataType): string {
  const type = getWGSLType(asType);
  const castToType = input.type === asType ? '' : type;
  const stride = input.stride / input.ValueType.BYTES_PER_ELEMENT;
  const offset = input.offset / input.ValueType.BYTES_PER_ELEMENT;

  if (input.isConstant) {
    return `fn read_${name}(_rowIndex: u32) -> array<${type}, ${input.size}> {
  return array<${type}, ${input.size}>(${getConstantValues(input, castToType)});
}`;
  }

  return `fn read_${name}(rowIndex: u32) -> array<${type}, ${input.size}> {
  var value: array<${type}, ${input.size}>;
  let rowOffset = ${offset}u + rowIndex * ${stride}u;
${Array.from({length: input.size}, (_, elementIndex) =>
  castToType
    ? `  value[${elementIndex}] = ${castToType}(${name}[rowOffset + ${elementIndex}u]);`
    : `  value[${elementIndex}] = ${name}[rowOffset + ${elementIndex}u];`
).join('\n')}
  return value;
}`;
}

function getOutputBinding(output: GPUTable, bindingIndex: number): string {
  const type = getWGSLType(output.type);
  return `@group(0) @binding(${bindingIndex}) var<storage, read_write> result: array<${type}>;`;
}

function getOutputWriter(output: GPUTable): string {
  const stride = output.stride / output.ValueType.BYTES_PER_ELEMENT;
  const offset = output.offset / output.ValueType.BYTES_PER_ELEMENT;
  const type = getWGSLType(output.type);
  return `fn write_result(rowIndex: u32, value: array<${type}, ${output.size}>) {
  let rowOffset = ${offset}u + rowIndex * ${stride}u;
${Array.from({length: output.size}, (_, elementIndex) => `  result[rowOffset + ${elementIndex}u] = value[${elementIndex}];`).join('\n')}
}`;
}

function getComputeBlock(
  operationName: string,
  inputs: {[name: string]: GPUTable},
  output: GPUTable,
  elementWise: boolean
): string {
  let result = '';

  if (elementWise) {
    const zero = getZeroValue(output.type);
    const outputType = getWGSLType(output.type);

    for (let elementIndex = 0; elementIndex < output.size; elementIndex++) {
      const elementInputs = Object.keys(inputs).map(name => {
        if (elementIndex < inputs[name].size) {
          const inputType = getWGSLType(inputs[name].type);
          if (inputType === outputType) {
            return `${name}[${elementIndex}]`;
          }
          return `${outputType}(${name}[${elementIndex}])`;
        }
        return zero;
      });
      result += `  result[${elementIndex}] = ${operationName}(${elementInputs.join(', ')});\n`;
    }
  } else {
    result += `result = ${operationName}(${Object.keys(inputs).join(', ')});`;
  }

  return result.trimEnd();
}

function getConstantValues(input: GPUTable, asType: string): string {
  const values = input.value;
  if (!values) {
    throw new Error(`Constant input ${input} is missing CPU values`);
  }
  return Array.from({length: input.size}, (_, index) =>
    getLiteralValue(asType, values[index] ?? 0)
  ).join(', ');
}

function getLiteralValue(type: string, value: number): string {
  switch (type[0]) {
    case 'u':
      return `${value}u`;

    case 'f':
      return Number.isInteger(value) ? `${value}.0` : `${value}`;

    default:
      return `${value}`;
  }
}

function getZeroValue(type: SignedDataType): string {
  switch (type) {
    case 'uint32':
      return '0u';

    case 'sint32':
      return '0';

    case 'float32':
      return '0.0';

    default:
      throw new Error(`WebGPU runComputation only supports 32-bit output types, got ${type}`);
  }
}

function getWGSLType(type: SignedDataType): string {
  switch (type) {
    case 'uint32':
      return 'u32';

    case 'sint32':
      return 'i32';

    case 'float32':
      return 'f32';

    default:
      throw new Error(`WebGPU runComputation only supports 32-bit storage types, got ${type}`);
  }
}

function preprocess(source: string, defines: Record<string, string>) {
  for (const key in defines) {
    source = source.replaceAll(`{${key}}`, defines[key]);
  }
  return source;
}
