# Custom Operations

Custom operations let applications add lazy `GPUTableEvaluator` operations that
are dispatched through `backendRegistry`, just like the built-in operations.

A custom operation has two parts:

- an `Operation` subclass that describes the lazy output table
- one or more `OperationHandler` functions registered for the device types that
  will evaluate the operation

## Define the Operation

The operation `name` is the backend lookup key. It must match the handler key
registered with `backendRegistry.add()`.

```ts
import {
  GPUTableEvaluator,
  Operation,
  type OperationHandler
} from '@luma.gl/gpgpu';

type RampInputs = {
  start: number;
  step: number;
};

class RampOperation extends Operation<RampInputs> {
  name = 'ramp';

  output: GPUTableEvaluator;

  constructor(count: number, start: number, step: number) {
    super({start, step});

    this.output = new GPUTableEvaluator({
      type: 'float32',
      size: 1,
      length: count,
      source: this
    });
  }

  toString(): string {
    const {start, step} = this.inputs;
    return `ramp(start=${start}, step=${step}, length=${this.output.length})`;
  }
}

export function ramp(count: number, start = 0, step = 1): GPUTableEvaluator {
  return new RampOperation(count, start, step).output;
}
```

## Register a Handler

An `OperationHandler` receives the selected device, operation inputs, logical
output table, and target GPU buffer. It must write the operation result into
`target` and return `{success: true}`. Returning `value` is optional, but it
caches the CPU copy on the output table.

```ts
const rampHandler: OperationHandler<RampInputs> = async ({inputs, output, target}) => {
  const value = new output.ValueType(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    value[rowIndex] = inputs.start + rowIndex * inputs.step;
  }

  target.write(value);
  return {success: true, value};
};
```

Register the handler for each device type that should evaluate the operation.
`backendRegistry.add()` replaces the backend module for that device type, so
spread the built-in backend module when you want to preserve built-in operation
handlers.

```ts
import {backendRegistry, type BackendModule} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/cpu';
import * as webglBackend from '@luma.gl/gpgpu/webgl';

const customCPUBackend: BackendModule = {
  ...cpuBackend,
  ramp: rampHandler
};

const customWebGLBackend: BackendModule = {
  ...webglBackend,
  ramp: rampHandler
};

backendRegistry.add('cpu', customCPUBackend);
backendRegistry.add('webgl', customWebGLBackend);
```


## Use the Operation

Custom operations return `GPUTableEvaluator` instances, so they can be evaluated
or chained with other GPGPU operations.

```ts
const values = ramp(4, 10, 2);
await values.evaluate(device);

const result = await values.readValue();
// Float32Array [10, 12, 14, 16]
```

## Notes

- `Operation.name` is used as key to retrieve the implementation from the registered backend
- Dependencies are evaluated before the handler is called.
- Register a handler for every device type that may evaluate the operation.
- Registering a custom backend module for `cpu`, `webgl`, or `webgpu` replaces
  the previously registered module for that device type.
