# ShaderValues (POC)

`ShaderValues` is a read-only interface exported from `@luma.gl/core/shader-inputs`. It exposes current uniform values and resource bindings without requiring shader modules, dependency resolution, `setProps()`, or lifecycle methods.

```typescript
import type {ShaderValues} from '@luma.gl/core/shader-inputs';
import {Model} from '@luma.gl/engine';

let opacity = 0.5;
const values: ShaderValues = {
  getUniformValues: () => ({appearance: {opacity}}),
  getBindingValues: () => ({image: texture})
};

const model = new Model(device, {
  source,
  modules: [appearance], // Defines uniform types and shader code as before.
  shaderValues: values
});

opacity = 0.8;
model.updateShaderInputs(); // Read the provider again and upload current values.
```

Uniform maps are keyed by uniform block/module name. Binding maps are keyed by shader binding name and may contain concrete core bindings or deferred texture binding sources. Consumers borrow the returned maps and resources; they must not mutate the maps or destroy the provider's resources.

## POC scope

- Existing `ShaderInputs` implements this interface and remains the default value provider.
- `GPUVectorModel` and its engine `Model` subclass accept `shaderValues`, `setShaderValues(values)`, and `getShaderValues()`.
- `setShaderValues(undefined)` restores the existing `ShaderInputs` provider. Supplying a provider does not register modules or change layouts.
- Getters are read during `updateShaderInputs()`. A provider does not notify the model of changes; applications must schedule updates/redraws.
- Uniform updates and bindings retain existing merge semantics: missing entries do not clear previously uploaded values or bindings. Uniform defaults remain initialized from module definitions.
- Engine material binding ownership remains authoritative, using the existing Model filtering path.
- Providers do not require `getModules()`, `addModules()`, `setProps()`, or `destroy()`.

This POC does not move ShaderInputs to shadertools, split shader-module initialization, or add provider support to Computation. It establishes a real rendering consumer boundary first. Existing engine/gpgpu ShaderInputs exports and shader-module inference remain unchanged.

The optional core entry point contains types only and imports no shadertools implementation. It reuses core's existing `CompositeUniformValue` representation, including nested structs and arrays, rather than adding another uniform-value type hierarchy.
