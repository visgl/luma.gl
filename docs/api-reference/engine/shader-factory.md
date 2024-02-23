# ShaderFactory

The `ShaderFactory` class provides a `createShader()` method that caches and reuses `Shader` resources.

Compiling shaders is costly, and may block the render pipeline on some devices. Using a shader factory allows applications to more easily consolidate shaders with identical properties, minimizing the amount of time spent compiling shaders.

The `ShaderFactory` will return the requested shader, creating it the first time, and then re-using a cached version if it is requested more than once. An application that tends to create multiple identical `Shader` instances should consider replacing calls to `device.createShader(...)` with calls to `shaderFactory.createShader(...)`.

It is possible to create multiple shader factories, but normally applications rely on the default factory that is created for each device.

## Usage

An application that tends to create multiple identical `Shader` instances
should consider replacing calls to `device.createShader(...)` with calls to `shaderFactory.createShader(...)`.

To deduplicate `Shader` instances, simply replace existing shader creation

```typescript
const shader = device.createShader({stage: 'vertex', source: '...'}));
```

with similar calls to the default shader factory

```typescript
import {ShaderFactory} from '@luma.gl/engine';
const shaderFactory = ShaderFactory.getDefaultShaderFactory(device);
const shader = shaderFactory.createShader({stage: 'vertex', source: '...'});
```

To prevent the cache from growing too big, an optional `release()` method is also available.

```typescript
shaderFactory.release(shader);
```

Shaders are destroyed by the factory automatically after all users of the shader have released their references. To clean up unused shaders and avoid memory leaks, every call to `createShader` must be paired with a corresponding call to `release` at some later time.

## Static Methods

### ShaderFactory.getDefaultShaderFactory()

Returns the default shader factory for a device.

```typescript
ShaderFactory.getDefaultShaderFactory(device: Device): ShaderFactory
```

While it is possible to create multiple factories, most applications will use the default factory.

## Methods

### createShader()

Returns a `Shader` configured with the properties specified.

```typescript
createShader(props: ShaderProps): Shader
```

If one is already cached, return it, otherwise create and cache a new one.

### release()

```typescript
release(shader: Shader): void
```

Indicates that a shader is no longer in use. Each call to `createShader()` increments a reference count, and only when all references to a shader are released, the shader is destroyed and deleted from the cache.
