import {
  type Buffer,
  type BufferLayout,
  type VertexFormat
} from '@luma.gl/core';
import {BufferTransform, Computation, type BufferTransformProps} from '@luma.gl/engine';
import {
  getGPUTableEvaluator,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput,
  type Operation,
  type OperationHandlerResult
} from '@luma.gl/gpgpu';
import {degreesToQuantized} from './degrees-to-quantized';

export const UINT32_MAX = 0xffffffff;
export const PROJECTION_WORKGROUP_SIZE = 64;

export type ProjectionOperationInputs = {
  positions: GPUTableEvaluator;
};

type WebGPUBinding = {
  name: string;
  table: GPUTableEvaluator;
  index: number;
};

type ExtraWebGPUBinding = {
  name: string;
  table: GPUTableEvaluator;
};

type WebGPUProjectionSourceContext = {
  resultBindingIndex: number;
  getBindingIndex: (name: string) => number;
};

export function getProjectionPositions(
  positions: GPUTableEvaluatorInput,
  operationName: string
): GPUTableEvaluator {
  const positionsTable = getGPUTableEvaluator(positions);

  if (positionsTable.type === 'float32' || positionsTable.type === 'uint32') {
    const quantizedPositions = degreesToQuantized(positionsTable);
    if (quantizedPositions.size !== 2) {
      throw new Error(`${operationName} positions must contain lon/lat coordinate pairs`);
    }
    return quantizedPositions;
  }

  throw new Error(`${operationName} positions must be vec2<f32> or vec2<f64>`);
}

export function makeQuantizedProjectionOutput(
  id: string,
  positions: GPUTableEvaluator,
  source: Operation
): GPUTableEvaluator {
  return new GPUTableEvaluator({
    id,
    type: 'uint32',
    size: 2,
    length: positions.length,
    format: 'uint32x2',
    source
  });
}

export function getQuantizedPosition(
  values: ArrayLike<number>,
  positions: GPUTableEvaluator,
  rowIndex: number
): [number, number] {
  const valueOffset = positions.offset / positions.ValueType.BYTES_PER_ELEMENT;
  const valueStride = positions.stride / positions.ValueType.BYTES_PER_ELEMENT;
  const sourceRowIndex = positions.isConstant ? 0 : rowIndex;
  const rowOffset = valueOffset + sourceRowIndex * valueStride;

  return [Number(values[rowOffset]) >>> 0, Number(values[rowOffset + 1]) >>> 0];
}

export function quantizeUnitInterval(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return UINT32_MAX;
  }
  return Math.round(value * UINT32_MAX) >>> 0;
}

export function projectSignedRangeToQuantized(value: number, halfExtent: number): number {
  return quantizeUnitInterval((value + halfExtent) / (2 * halfExtent));
}

export function projectDegrees180ToQuantized(degrees: number): number {
  return projectSignedRangeToQuantized(degrees, 180);
}

export function unprojectQuantizedDegrees(quantizedDegrees: number): number {
  return (quantizedDegrees / UINT32_MAX) * 360 - 180;
}

export function projectLongitudeToQuantized(longitude: number): number {
  return projectDegrees180ToQuantized(longitude);
}

export function splitFloat64ToFloat32Pair(value: number): [number, number] {
  const high = Math.fround(value);
  return [high, Math.fround(value - high)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampUint32(value: number): number {
  return Math.trunc(clamp(value, 0, UINT32_MAX)) >>> 0;
}

export function interpolateCatmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const d10 = p1 - p0;
  const d21 = p2 - p1;
  const d32 = p3 - p2;
  const m1 = 0.5 * (d10 + d21);
  const m2 = 0.5 * (d21 + d32);
  const t2 = t * t;
  const t3 = t2 * t;
  return p1 + m1 * t + (3 * d21 - 2 * m1 - m2) * t2 + (m1 + m2 - 2 * d21) * t3;
}

export function interpolateCatmullRomUint32(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  return clampUint32(Math.floor(interpolateCatmullRom(p0, p1, p2, p3, t) + 0.5));
}

export function getWebGLPositionsBufferLayout(positions: GPUTableEvaluator): BufferLayout {
  return {
    name: 'positions',
    stepMode: positions.isConstant ? 'vertex' : 'instance',
    byteStride: positions.stride,
    attributes: [
      {
        attribute: 'positions',
        format: getPositionVertexFormat(positions),
        byteOffset: positions.offset
      }
    ]
  };
}

function getPositionVertexFormat(positions: GPUTableEvaluator): VertexFormat {
  if (positions.size === 1) {
    return positions.type as VertexFormat;
  }
  return `${positions.type}x${positions.size}` as VertexFormat;
}

export function executeWebGLProjection({
  positions,
  output,
  target,
  source,
  bindings,
  resources
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  target: Buffer;
  source: string;
  bindings?: BufferTransformProps['bindings'];
  resources?: {destroy: () => void}[];
}): Promise<OperationHandlerResult> {
  const transform = new BufferTransform(target.device, {
    vs: source,
    bufferLayout: [getWebGLPositionsBufferLayout(positions)],
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs: ['projected'],
    bindings
  });

  try {
    transform.run({
      inputBuffers: {positions: positions.buffer},
      outputBuffers: {projected: target}
    });
    return Promise.resolve({success: true});
  } finally {
    transform.destroy();
    resources?.forEach(resource => resource.destroy());
  }
}

export function executeWebGPUProjection({
  positions,
  output,
  target,
  extraBindings = [],
  getSource
}: {
  positions: GPUTableEvaluator;
  output: GPUTableEvaluator;
  target: Buffer;
  extraBindings?: ExtraWebGPUBinding[];
  getSource: (context: WebGPUProjectionSourceContext) => string;
}): Promise<OperationHandlerResult> {
  const bindings: WebGPUBinding[] = [];
  if (!positions.isConstant) {
    bindings.push({name: 'positions', table: positions, index: bindings.length});
  }
  for (const binding of extraBindings) {
    bindings.push({...binding, index: bindings.length});
  }

  const resultBindingIndex = bindings.length;
  const source = getSource({
    resultBindingIndex,
    getBindingIndex: (name: string) => {
      const binding = bindings.find(candidate => candidate.name === name);
      if (!binding) {
        throw new Error(`Missing WebGPU projection binding ${name}`);
      }
      return binding.index;
    }
  });

  const computation = new Computation(target.device, {
    source,
    shaderLayout: {
      bindings: [
        ...bindings.map(({name, index}) => ({
          name,
          type: 'storage' as const,
          group: 0,
          location: index
        })),
        {name: 'result', type: 'storage' as const, group: 0, location: resultBindingIndex}
      ]
    }
  });

  computation.setBindings({
    ...Object.fromEntries(bindings.map(({name, table}) => [name, table.buffer])),
    result: target
  });

  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / PROJECTION_WORKGROUP_SIZE));
  computePass.end();
  target.device.submit();
  computation.destroy();

  return Promise.resolve({success: true});
}
