# PipelineFactory

The `PipelineFactory` class provides a `createRenderPipeline()` method that caches and reuses render pipelines.

The purpose of the pipeline factory is to speed up applications that tend to create multiple render pipelines with the same shaders and other properties. By returning the same cached pipeline, the pipeline factory minimizes the amount of time spent in shader compilation and linking.

:::info
Pipeline creation involves compiling and linking shaders. The linking stage in particular is highly dependent on graphics drivers, and the time spent accumulates when creating many pipelines during application startup or during dynamic renderings. Also, on some graphics drivers, pipeline linking can grow non-linearly into the multi-second range for big shaders.
:::

The `PipelineFactory` will return the requested pipeline, creating it the first time, and then re-using a cached version if it is requested more than once. An application that tends to create multiple identical `RenderPipeline` instances
should consider replacing normal pipeline creation.

It is possible to create multiple pipeline factories, but normally applications rely on the default pipeline factory that is be created for each device.

Limitations:
- `ComputePipeline` caching is not currently supported.

## Usage

An application that tends to create multiple identical `RenderPipeline` instances
should consider replacing normal pipeline creation.

To deduplicate `RenderPipeline` instances, simply replace normal pipeline creation

```typescript
const pipeline = device.createRenderPipeline({vs, fs, ...}));
```

with similar calls to the default pipeline factory

```typescript
import {PipelineFactory} from '@luma.gl/engine';
const pipeline = PipelineFactory.getDefaultFactory(device).createRenderPipeline({vs, fs, ...}));
```

To prevent the cache from growing too big, an optional `release()` method is also available.

```typescript
pipelineFactory.release(pipeline);
```

## shadertools Integration

```typescript
import {PipelineFactory} from '@luma.gl/engine';
const pf = new PipelineFactory(gl);

const vs = `
attribute vec4 position;

void main() {
#ifdef MY_DEFINE
  gl_Position = position;
#else
  gl_Position = position.wzyx;
#endif
}
`;

const fs = `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  MY_SHADER_HOOK(gl_FragColor);
}
`;

pipelineFactory.addShaderHook('fs:MY_SHADER_HOOK(inout vec4 color)');

pipelineFactory.addDefaultModule(dirlight); // Will be included in all following programs

const pipeline1 = pipelineFactory.createRenderPipeline({vs, fs}); // Basic, no defines, only default module
const program2 = pipelineFactory.createRenderPipeline({vs, fs}); // Cached, same as pipeline 1, use count 2
const program3 = pipelineFactory.createRenderPipeline({
  // New pipeline, with different source based on define
  vs,
  fs,
  defines: {
    MY_DEFINE: true
  }
});

const program4 = pipelineFactory.createRenderPipeline({
  // New pipeline, with different source based on module and its injection
  vs,
  fs,
  defines: {
    MY_DEFINE: true
  },
  modules: [picking]
});

const program5 = pipelineFactory.createRenderPipeline({
  // Cached, same as pipeline 4, use count 2
  vs,
  fs,
  defines: {
    MY_DEFINE: true
  },
  modules: [picking]
});

pipelineFactory.release(program1); // Cached pipeline still available, use count 1
pipelineFactory.release(program2); // Cached pipeline deleted
pipelineFactory.release(program3); // Cached pipeline deleted
pipelineFactory.release(program4); // Cached pipeline still available, use count 1
pipelineFactory.release(program5); // Cached pipeline deleted
```

## Static Methods

### PipelineFactory.getDefaultFactory()

Returns the default pipeline factory for a device.

```typescript
PipelineFactory.getDefaultFactory(device: Device): PipelineFactory
```

While it is possible to create multiple factories, most applications will use the default factory.

## Methods

### createRenderPipeline()

Get a program that fits the parameters provided. 

```typescript
createRenderPipeline(props: RenderPipelineProps): RenderPipeline
```

If one is already cached, return it, otherwise create and cache a new one.
`opts` can include the following (see `assembleShaders` for details):

- `vs`: Base vertex shader source.
- `fs`: Base fragment shader source.
- `defines`: Object indicating `#define` constants to include in the shaders.
- `modules`: Array of module objects to include in the shaders.
- `inject`: Object of hook injections to include in the shaders.

### release()

```typescript
release(pipeline: RenderPipeline): void
```

Indicates that a pipeline is no longer in use. Each call to `createRenderPipeline()` increments a reference count, and only when all references to a pipeline are released, the pipeline is destroyed and deleted from the cache.


### getUniforms(program: Program): Object

Returns an object containing all the uniforms defined for the program. Returns `null` if `program` isn't managed by the `PipelineFactory`.
