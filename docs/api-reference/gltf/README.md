# Overview

Classes and functions in `@luma.gl/gltf` 

<<<<<<< Updated upstream
- GLTF
=======
## Installing

```bash
npm install @luma.gl/gltf
```

You will also typically need the `@loaders.gl/gltf` loader.

```bash
npm install @loaders.gl/gltf
```

## Usage

Loading a glTF file and instantiating scenegraphs

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webglAdapter]               // supply a device adapter
});

const gltf = await load('model.glb', GLTFLoader, {gltf: {postProcess: true}});
const {scenes, animator} = createScenegraphsFromGLTF(device, gltf);

// `scenes` is an array of GroupNode instances. Add them to your scenegraph.
for (const scene of scenes) {
  root.add(scene);
}

// Move animations forward each frame:
function renderFrame(timeMs: number) {
  animator.setTime(timeMs);
  requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
```

Typical flow:

1. Use `GTLFLoader` from the `@loaders.gl/gltf` module to load a glTF/GLB file.
2. Use the `postProcessGLTF()` function from the `@loaders.gl/gltf` module further process and prepare the raw glTF.
3. Pass the processed glTF to the `createScenegraphsFromGLTF()` function, which returns an array of [`GroupNode`](../engine/README.md) scenes and a `GLTFAnimator` instances.4. Add the resulting nodes to your own scenegraph and update the`GLTFAnimator` each frame to animate the nodes.


## API

#### `createScenegraphsFromGLTF()`

```ts
createScenegraphsFromGLTF(device, gltf[, options])
```

Creates scenegraph nodes and returns `{scenes, animator}`.

- `device` – a Device instance created from @luma.gl/core.
- `gltf` – a GLTFPostprocessed object (data returned by `@loaders.gl/gltf` when postProcess: true is enabled).
- `options` – optional, see below.

The returned scenes array contains a GroupNode for each glTF scene
in the file. The optional animator is an instance of GLTFAnimator
that can be used to update active animations (animator.setTime(ms)).

```ts
type ParseGLTFOptions = {
  modelOptions?: Partial<ModelProps>;
  pbrDebug?: boolean;
  imageBasedLightingEnvironment?: PBREnvironment;
  lights?: boolean;
  useTangents?: boolean;
};
```
- `modelOptions` – additional options that will be passed when constructing any ModelNode instances for primitives in the glTF.
- `pbrDebug `– set to true to enable extra PBR debugging information.
- `imageBasedLightingEnvironment` – a PBREnvironment object (as returned by loadPBREnvironment()) to
supply textures for PBR image-based lighting.
- `lights` – true by default. If false, lights declared in the glTF
(KHR_lights_punctual) will not be instantiated.
- `useTangents` – compute/propagate tangents when possible. Useful when the glTF contains normal-mapped materials.

#### `GLTFAnimator`

Animation support: the `GLTFAnimator `class encapsulates all animations found in the glTF
and provides a simple API for advancing them:

```ts
const { animator } = createScenegraphsFromGLTF(device, gltf);
```

- animator.setTime(timeMs);  - timeMs is the current clock time in ms
- .getAnimations() returns an array of internal animator objects if the application needs to manage them individually.

#### `loadPBREnvironment()`

Image Based Lighting Utilities

```ts
import {loadPBREnvironment} from '@luma.gl/gltf';

type PBREnvironmentProps = {
  brdfLutUrl: string;
  getTexUrl: (type: 'diffuse' | 'specular', faceIndex: number, lod: number) => string;
  specularMipLevels?: number;
};

loadPBREnvironment(device, props)
```

Creates a set of textures suitable for physically based rendering:


const env = loadPBREnvironment(device, {
  brdfLutUrl: '/path/brdfLUT.png',
  getTexUrl: (name, face, mip) => `/env/${name}/${face}/${mip}.jpg`,
  specularMipLevels: 10
});
The returned object:

```ts
type PBREnvironment = {
  brdfLutTexture: DynamicTexture;
  diffuseEnvSampler: DynamicTexture;
  specularEnvSampler: DynamicTexture;
};
```

Pass the object through ParseGLTFOptions.imageBasedLightingEnvironment
to cause the newly created ModelNodes to use the supplied IBL textures.

#### `parsePBRMaterial()`

```ts
parsePBRMaterial(device, gltfMaterial, attributes, options)
```

Low-level helper which interprets the glTF material definition and
returns a ParsedPBRMaterial object containing shader parameters.
Normally this is called automatically by parseGLTF/createScenegraphsFromGLTF
but it can be invoked directly when applications need to construct a
material programmatically.

## Relationship to other modules

- Relies on `@loaders.gl/gltf` for reading .gltf/.glb scene files.
- Produces scenegraph nodes from `@luma.gl/engine`.
- Expects a Device from `@luma.gl/core` (`@luma.gl/webgl` or
`@luma.gl/webgpu` device adapters are required for rendering).
- Material and lighting implementations reuse features from
`@luma.gl/shadertools`.

Notes:
- All scenegraph objects created by @luma.gl/gltf are ordinary
`@luma.gl/engine` scengraph nodes and can be freely manpipulated or intermixed with manually
constructed nodes.

glTF files containing extension data (e.g. Draco compressed meshes,
custom PBR materials, or meshopt compression) need to be processed by
the `@loaders.gl/gltf` `GLTFLoader` which processes the relevant extensions.

See also 
- `GLTFLoader` in `@loaders.gl/gltf`
- `@luma.gl/engine`

# Example with loaders.gl

```ts
load('model.glb', GLTFLoader, {
  gltf: {
    postProcess: true,
    decompress: false         # set to true if draco-encoded
  }
});
```
>>>>>>> Stashed changes
