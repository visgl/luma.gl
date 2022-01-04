# Installing

The `@luma.gl/api` module provides an abstract API for writing application code
that works with both WebGPU and WebGL.

The `@luma.gl/api` module cannot be used on its own: it relies on being backed up by another module
that implements the API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

## Installing adapters

The `@luma.gl/api` module is not usable on its own. A device adapter module must
be imported (it self registers on import).

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```
