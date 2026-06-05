import {GPGPUDocsTabs} from '@site/src/components/docs/gpgpu-docs-tabs';

# Custom Operations

<GPGPUDocsTabs active="custom-operation" />

Custom operations let applications add lazy `GPUDataEvaluator` operations that
are dispatched through `backendRegistry`, just like the built-in operations.

A custom operation has two parts:

- an `Operation` subclass that describes the lazy output table
- one or more `OperationHandler` functions registered for the device types that
  will evaluate the operation

This example implements a [Natural Earth projection](https://en.wikipedia.org/wiki/Natural_Earth_projection) operation named
`projectNaturalEarth`. The input must be `vec2<f32>` rows storing longitude and
latitude in degrees. The output is `vec2<f32>` rows storing projected `x` and
`y` coordinates.

## Define the Operation

The operation `name` is the backend lookup key. It must match the handler key
registered with `backendRegistry.add()`.

```ts
import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  Operation,
  type GPUDataEvaluatorInput
} from '@luma.gl/gpgpu';

type ProjectNaturalEarthInputs = {
  coordinates: GPUDataEvaluator;
};

class ProjectNaturalEarthOperation extends Operation<ProjectNaturalEarthInputs> {
  name = 'projectNaturalEarth';

  output: GPUDataEvaluator;

  constructor(coordinates: GPUDataEvaluator) {
    super({coordinates});

    this.output = new GPUDataEvaluator({
      isConstant: coordinates.isConstant,
      type: 'float32',
      size: 2,
      length: coordinates.length,
      source: this
    });
  }

  toString(): string {
    return `projectNaturalEarth(${this.inputs.coordinates})`;
  }
}

export function projectNaturalEarth(coordinates: GPUDataEvaluatorInput): GPUDataEvaluator {
  const coordinatesTable = getGPUDataEvaluator(coordinates);
  if (coordinatesTable.type !== 'float32' || coordinatesTable.size !== 2) {
    throw new Error('projectNaturalEarth() requires vec2<f32> longitude/latitude input');
  }

  return new ProjectNaturalEarthOperation(coordinatesTable).output;
}
```

## Implement Operation Handlers

### CPU Backend

An `OperationHandler` receives the selected device, operation inputs, logical
output table, and target GPU buffer. It must write the operation result into
`target` and return `{success: true}`. Returning `value` is optional, but it
caches the CPU copy on the output table.

```ts
import {type OperationHandler} from '@luma.gl/gpgpu';

const RADIANS_PER_DEGREE = Math.PI / 180;

// https://en.wikipedia.org/wiki/Natural_Earth_projection
function naturalEarth(lon: number, lat: number): [number, number] {
  const lambda = lon * RADIANS_PER_DEGREE;
  const phi = lat * RADIANS_PER_DEGREE;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return [
    lambda *
      (0.8707 -
        0.131979 * phi2 +
        phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi *
      (1.007226 +
        phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)))
  ];
}

export const projectNaturalEarthCPU: OperationHandler<ProjectNaturalEarthInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {coordinates} = inputs;
  const source = await coordinates.readValue();
  const value = new Float32Array(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const [x, y] = naturalEarth(source[rowIndex * 2], source[rowIndex * 2 + 1]);
    value[rowIndex * 2] = x;
    value[rowIndex * 2 + 1] = y;
  }

  target.write(value);
  return {success: true, value};
};
```

### WebGL Backend

The WebGL handler uses transform feedback through `BufferTransform`.

```ts
import {BufferTransform} from '@luma.gl/engine';
import {type OperationHandler} from '@luma.gl/gpgpu';

const naturalEarth1WebGL = /* glsl */ `\
#version 300 es

in vec2 coordinates;
out vec2 projected;

const float RADIANS_PER_DEGREE = 0.017453292519943295;

vec2 naturalEarth(float lon, float lat) {
  float lambda = lon * RADIANS_PER_DEGREE;
  float phi = lat * RADIANS_PER_DEGREE;
  float phi2 = phi * phi;
  float phi4 = phi2 * phi2;
  return vec2(
    lambda * (
      0.8707 -
      0.131979 * phi2 +
      phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))
    ),
    phi * (
      1.007226 +
      phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))
    )
  );
}

void main() {
  projected = naturalEarth(coordinates.x, coordinates.y);
}
`;

export const projectNaturalEarthWebGL: OperationHandler<ProjectNaturalEarthInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {coordinates} = inputs;

  const transform = new BufferTransform(target.device, {
    vs: naturalEarth1WebGL,
    bufferLayout: [
      {
        name: 'coordinates',
        stepMode: 'vertex',
        byteStride: coordinates.stride,
        attributes: [
          {
            attribute: 'coordinates',
            format: 'float32x2',
            byteOffset: coordinates.offset
          }
        ]
      }
    ],
    vertexCount: output.length,
    outputs: ['projected']
  });

  transform.run({
    inputBuffers: {coordinates: coordinates.buffer},
    outputBuffers: {projected: target}
  });
  transform.destroy();
  return {success: true};
};
```

### WebGPU Backend

The WebGPU handler runs the same projection in a compute shader.

```ts
import {Computation} from '@luma.gl/engine';
import {type OperationHandler} from '@luma.gl/gpgpu';

const WORKGROUP_SIZE = 64;

export const projectNaturalEarthWebGPU: OperationHandler<ProjectNaturalEarthInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {coordinates} = inputs;
  const sourceStride = coordinates.stride / Float32Array.BYTES_PER_ELEMENT;
  const sourceOffset = coordinates.offset / Float32Array.BYTES_PER_ELEMENT;

  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> coordinates: array<f32>;
@group(0) @binding(1) var<storage, read_write> projected: array<f32>;

const RADIANS_PER_DEGREE: f32 = 0.017453292519943295;

fn naturalEarth(lon: f32, lat: f32) -> vec2<f32> {
  let lambda = lon * RADIANS_PER_DEGREE;
  let phi = lat * RADIANS_PER_DEGREE;
  let phi2 = phi * phi;
  let phi4 = phi2 * phi2;
  return vec2<f32>(
    lambda * (
      0.8707 -
      0.131979 * phi2 +
      phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))
    ),
    phi * (
      1.007226 +
      phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))
    )
  );
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let rowIndex = globalId.x;
  if (rowIndex >= ${output.length}u) {
    return;
  }

  let inputIndex = ${sourceOffset}u + rowIndex * ${sourceStride}u;
  let xy = naturalEarth(coordinates[inputIndex], coordinates[inputIndex + 1u]);
  projected[rowIndex * 2u] = xy.x;
  projected[rowIndex * 2u + 1u] = xy.y;
}
`;

  const computation = new Computation(target.device, {
    source,
    shaderLayout: {
      bindings: [
        {name: 'coordinates', type: 'storage', group: 0, location: 0},
        {name: 'projected', type: 'storage', group: 0, location: 1}
      ]
    }
  });

  computation.setBindings({
    coordinates: coordinates.buffer,
    projected: target
  });

  const computePass = target.device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(output.length / WORKGROUP_SIZE));
  computePass.end();
  target.device.submit();
  computation.destroy();
  return {success: true};
};
```

## Register the Backends

Register the handler for each device type that should evaluate the operation.
`backendRegistry.add()` replaces the backend module for that device type, so
spread the built-in backend module when you want to preserve built-in operation
handlers.

```ts
import {backendRegistry, type BackendModule} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/cpu';
import * as webglBackend from '@luma.gl/gpgpu/webgl';
import * as webgpuBackend from '@luma.gl/gpgpu/webgpu';

backendRegistry.add('cpu', {
  ...cpuBackend,
  projectNaturalEarth: projectNaturalEarthCPU
} satisfies BackendModule);

backendRegistry.add('webgl', {
  ...webglBackend,
  projectNaturalEarth: projectNaturalEarthWebGL
} satisfies BackendModule);

backendRegistry.add('webgpu', {
  ...webgpuBackend,
  projectNaturalEarth: projectNaturalEarthWebGPU
} satisfies BackendModule);
```

## Use the Operation

Custom operations return `GPUDataEvaluator` instances, so they can be evaluated
or chained with other GPGPU operations.

```ts
const coordinates = GPUDataEvaluator.fromArray(
  new Float32Array([
    -122.4194, 37.7749,
    -74.006, 40.7128
  ]),
  {size: 2}
);

const projected = projectNaturalEarth(coordinates);
await projected.evaluate(device);

const result = await projected.readValue();
```

## Notes

- `Operation.name` and the backend module key must be identical.
- Dependencies are evaluated before the handler is called.
- WebGPU compute handlers bind input evaluators as storage buffers. Buffers
  materialized by `GPUDataEvaluator.evaluate()` are storage-bindable; externally
  supplied `GPUData` buffers must also be created with storage usage.
- Use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)` when the same
  custom leaf operation should run independently across preserved vector chunks.
- Register a handler for every device type that may evaluate the operation.
- Registering a custom backend module for `cpu`, `webgl`, or `webgpu` replaces
  the previously registered module for that device type.
