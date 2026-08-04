# ANARI C API and THREE.js Mapping

![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)![Private workspace](https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square)![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)

This page maps the official [ANARI 1.1 specification](https://registry.khronos.org/ANARI/specs/1.1/ANARI-1.1.html) to the experimental, private `@luma.gl/anari` implementation and, where helpful, to comparable THREE.js concepts.

The first column is the authoritative ANARI C vocabulary. The JavaScript column describes what this package **actually implements**, not what a fully conformant ANARI binding would need to implement. The THREE.js column is a conceptual migration aid, not an adapter or dependency.

caution

`@luma.gl/anari` is not a binding to the ANARI C API, is not ABI-compatible with ANARI, and does not claim ANARI conformance. Some mappings are approximate, some are convenience extensions, and many official functions are not implemented.

## High-level mental model[​](#high-level-mental-model "Direct link to High-level mental model")

| Rendering concept        | Official ANARI C                    | `@luma.gl/anari`                                   | Comparable THREE.js concept                                                |
| ------------------------ | ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Rendering implementation | `ANARILibrary` + `ANARIDevice`      | Existing luma.gl `Device` wrapped by `ANARIDevice` | `WebGPURenderer` or `WebGLRenderer`                                        |
| Scene root               | `ANARIWorld`                        | `ANARIWorld`                                       | `Scene`                                                                    |
| Geometry data            | `ANARIGeometry` + `ANARIArray`      | `ANARIGeometry` + `ANARIArray`                     | `BufferGeometry`, geometry subclasses, `BufferAttribute`                   |
| Surface appearance       | `ANARIMaterial`                     | `ANARIMaterial`                                    | `MeshStandardMaterial`, `MeshPhysicalMaterial`, or other material          |
| Geometry + material      | `ANARISurface`                      | `ANARISurface`                                     | `Mesh`                                                                     |
| Reusable collection      | `ANARIGroup`                        | `ANARIGroup`                                       | `Group`                                                                    |
| Transformed placement    | `ANARIInstance`                     | `ANARIInstance`                                    | `Object3D.matrix`, `Object3D.matrixWorld`, or an `InstancedMesh` transform |
| Light                    | `ANARILight`                        | `ANARILight`                                       | `AmbientLight`, `DirectionalLight`, `PointLight`, `SpotLight`              |
| View                     | `ANARICamera`                       | `ANARICamera`                                      | `PerspectiveCamera` or `OrthographicCamera`                                |
| Rendering policy         | `ANARIRenderer`                     | `ANARIRenderer`                                    | Renderer plus material, tone-mapping, and postprocessing configuration     |
| Render operation         | `ANARIFrame` + `anariRenderFrame()` | `ANARIFrame.render()`                              | `renderer.render(scene, camera)`                                           |

THREE.js generally exposes a mutable, renderer-owned object graph. ANARI explicitly separates a device, retained parameters, committed scene objects, a renderer description, and frame operations. The two systems solve overlapping problems but do not have identical ownership or lifecycle semantics.

## Library and device functions[​](#library-and-device-functions "Direct link to Library and device functions")

| ANARI 1.1 C API               | `@luma.gl/anari`                                                           | THREE.js comparison                            | Status and differences                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `anariLoadLibrary()`          | No equivalent                                                              | Import `three/webgpu` or `three`               | JavaScript modules are imported normally; no ANARI implementation library is dynamically loaded.         |
| `anariUnloadLibrary()`        | No equivalent                                                              | No direct equivalent                           | Module loading and process lifetime are managed by the JavaScript runtime.                               |
| `anariNewDevice()`            | `new ANARIDevice(graphicsDevice)`                                          | `new WebGPURenderer()` / `new WebGLRenderer()` | Wraps an already-created luma.gl device instead of creating an ANARI library-backed device.              |
| `anariNewInitializedDevice()` | Configure `luma.createDevice(...)`, then `new ANARIDevice(graphicsDevice)` | Renderer constructor options                   | Comparable initialization step, but no ANARI initializer array or device subtype selection.              |
| `anariGetDeviceSubtypes()`    | No equivalent                                                              | Renderer class / backend selection             | Backend selection happens through luma.gl adapter ordering, not ANARI device-library discovery.          |
| `anariGetDeviceExtensions()`  | `anariDevice.extensions`                                                   | Capability inspection on the selected renderer | Returns this proof of concept's static extension-name list; no library/subtype-specific extension query. |
| `ANARIStatusCallback`         | No equivalent                                                              | Application logging / error handling           | No ANARI severity, status-code, callback, or callback-user-data interface.                               |

```
const graphicsDevice = await luma.createDevice({

  adapters: [webgpuAdapter, webgl2Adapter],

  createCanvasContext: true

});



const anariDevice = new ANARIDevice(graphicsDevice);
```

The native concept “select an ANARI device implementation” therefore maps to “select a luma.gl graphics backend, then wrap it,” not to loading a Khronos-compatible ANARI device.

## Object creation functions[​](#object-creation-functions "Direct link to Object creation functions")

| ANARI 1.1 C API                                                          | `@luma.gl/anari`                                              | Comparable THREE.js concept                                  | Support                                                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `anariNewArray1D(device, memory, deleter, userData, elementType, count)` | `anariDevice.newArray({data, elementType, dimensions})`       | Typed array + `BufferAttribute`                              | Partial: one-dimensional typed arrays and object-reference arrays; no deleter callback or ownership transfer.        |
| `anariNewArray2D()`                                                      | No equivalent                                                 | `DataTexture`, texture image data                            | Not implemented.                                                                                                     |
| `anariNewArray3D()`                                                      | No equivalent                                                 | `Data3DTexture`                                              | Not implemented.                                                                                                     |
| `anariNewGeometry(device, subtype)`                                      | `anariDevice.newGeometry(subtype, parameters)`                | `BufferGeometry` or a geometry subclass                      | Supported for `triangle`, `sphere`, `cylinder`, `cone`, and `quad`; primitive semantics are simplified.              |
| `anariNewMaterial(device, subtype)`                                      | `anariDevice.newMaterial(subtype, parameters)`                | `MeshStandardMaterial` / `MeshPhysicalMaterial`              | Supported for `matte` and `physicallyBased`; many official material parameters are absent.                           |
| `anariNewSurface(device)`                                                | `anariDevice.newSurface({geometry, material})`                | `new Mesh(geometry, material)`                               | Supported; references are supplied in the factory call.                                                              |
| `anariNewGroup(device)`                                                  | `anariDevice.newGroup({surface, light})`                      | `new Group()`                                                | Supported for surface/light collections.                                                                             |
| `anariNewInstance(device, subtype)`                                      | `anariDevice.newInstance({group, transform})`                 | `Object3D` transform or `InstancedMesh.setMatrixAt()`        | Supported only for transform instances.                                                                              |
| `anariNewWorld(device)`                                                  | `anariDevice.newWorld({surface, instance, light})`            | `new Scene()`                                                | Supported for direct surfaces, instances, and lights.                                                                |
| `anariNewLight(device, subtype)`                                         | `anariDevice.newLight(subtype, parameters)`                   | THREE.js light subclasses                                    | Supported for `directional`, `point`, and `spot`; JavaScript additionally provides an `ambient` convenience subtype. |
| `anariNewCamera(device, subtype)`                                        | `anariDevice.newCamera(subtype, parameters)`                  | `PerspectiveCamera` / `OrthographicCamera`                   | Supported for `perspective` and `orthographic`.                                                                      |
| `anariNewRenderer(device, subtype)`                                      | `anariDevice.newRenderer(subtype, parameters)`                | Renderer configuration / debug material                      | Supported for `default`, WebGPU-only `deferred`, `debugNormals`, and `debugDepth`.                                   |
| `anariNewFrame(device)`                                                  | `anariDevice.newFrame({world, camera, renderer, size})`       | `renderer.render(scene, camera)` / render target             | Supported for canvas presentation; arbitrary mapped output channels are not implemented.                             |
| `anariNewSampler()`                                                      | `anariDevice.newSampler('image2D', {image, transform})`       | `Texture`, sampler state, texture-backed material properties | Partial: retained 2D image samplers; no procedural or volume samplers.                                               |
| `anariNewSpatialField()`                                                 | No equivalent                                                 | 3D texture / volume field                                    | Not implemented.                                                                                                     |
| `anariNewVolume()`                                                       | No equivalent                                                 | Volume renderer / 3D texture                                 | Not implemented.                                                                                                     |
| `anariNewObject()`                                                       | `new ANARIObject(...)` exists, but is not renderer-extensible | Custom `Object3D` subclass                                   | No generic extension-object registration or custom renderer support.                                                 |

### Important primitive differences[​](#important-primitive-differences "Direct link to Important primitive differences")

Official ANARI `sphere`, `cylinder`, `cone`, and `quad` geometries can represent collections of primitives described by arrays such as `vertex.position`, per-primitive indices, and radii. This implementation creates **one procedural engine geometry** from scalar parameters such as `radius`, `height`, `width`, and `segments`.

For example:

```
anariDevice.newGeometry('sphere', {radius: 1, segments: 32});
```

is conceptually closer to `new THREE.SphereGeometry(1, ...)` than to the full official ANARI sphere-soup data model. Use retained instances to place that procedural sphere repeatedly.

Official ANARI light subtypes include directional, point, spot, HDRI, quad, and ring lights. The JavaScript `ambient` light is a convenience extension; the standard expresses ambient illumination as renderer configuration such as `ambientRadiance`, rather than defining the same ambient light subtype.

## Parameter and commit functions[​](#parameter-and-commit-functions "Direct link to Parameter and commit functions")

| ANARI 1.1 C API                                            | `@luma.gl/anari`                                       | THREE.js comparison                                                                    | Support and differences                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `anariSetParameter(device, object, name, dataType, value)` | `object.setParameter(name, value)`                     | Assign `mesh.material.roughness = value`                                               | Supported conceptually. TypeScript and JavaScript values replace explicit `ANARIDataType` and C pointers.     |
| Repeated `anariSetParameter(...)` calls                    | `object.setParameters({...})`                          | Assign several object/material properties                                              | JavaScript convenience for staging multiple parameters.                                                       |
| `anariUnsetParameter(device, object, name)`                | `object.unsetParameter(name)`                          | Reset/delete a property, depending on the object                                       | Supported; still requires `commitParameters()`.                                                               |
| `anariUnsetAllParameters()`                                | No equivalent                                          | Replace/reset object configuration                                                     | Not implemented.                                                                                              |
| `anariCommitParameters(device, object)`                    | `object.commitParameters()`                            | Property updates, `material.needsUpdate`, `attribute.needsUpdate`, or `updateMatrix()` | Supported; staged changes become visible only after committing.                                               |
| Read back a parameter                                      | `object.getParameter(name)` / `object.getParameters()` | Read ordinary JavaScript object properties                                             | JavaScript-only extension: official ANARI deliberately does **not** provide a general parameter-readback API. |

### C versus JavaScript example[​](#c-versus-javascript-example "Direct link to C versus JavaScript example")

```
float roughness = 0.15f;

anariSetParameter(device, material, "roughness", ANARI_FLOAT32, &roughness);

anariCommitParameters(device, material);
```

```
material.setParameter('roughness', 0.15).commitParameters();
```

The commit boundary is intentionally similar. The parameter typing and ownership models are not: official ANARI passes an explicit data type and a pointer, while the JavaScript package uses typed method signatures and ordinary values.

### Commit versus THREE.js updates[​](#commit-versus-threejs-updates "Direct link to Commit versus THREE.js updates")

```
// @luma.gl/anari

material.setParameter('roughness', 0.15).commitParameters();



// Conceptual THREE.js equivalent

threeMaterial.roughness = 0.15;
```

THREE.js materials are generally mutated directly. Some operations additionally require explicit flags such as `material.needsUpdate`, `attribute.needsUpdate`, or `instancedMesh.instanceMatrix.needsUpdate`; those are GPU-update hints, not an ANARI-style transactional commit mechanism.

## Arrays and mapped memory[​](#arrays-and-mapped-memory "Direct link to Arrays and mapped memory")

| ANARI 1.1 C API              | `@luma.gl/anari`             | THREE.js comparison                                      | Support                                                                                               |
| ---------------------------- | ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `anariNewArray1D()`          | `newArray({data})`           | `new BufferAttribute(typedArray, itemSize)`              | Zero-copy JavaScript typed-array storage; no C deleter or reference-count contract.                   |
| `anariMapArray()`            | Access `array.data` directly | Access `attribute.array`                                 | No explicit map call; retained typed-array data remains directly accessible.                          |
| `anariUnmapArray()`          | No equivalent                | `attribute.needsUpdate = true`                           | No explicit map/unmap synchronization. Commit the owning geometry after changing rendered array data. |
| `anariMapParameterArray1D()` | No equivalent                | Allocate/update an attribute array                       | Not implemented.                                                                                      |
| `anariMapParameterArray2D()` | No equivalent                | Update texture image data                                | Not implemented.                                                                                      |
| `anariMapParameterArray3D()` | No equivalent                | Update 3D texture data                                   | Not implemented.                                                                                      |
| `anariUnmapParameterArray()` | No equivalent                | `attribute.needsUpdate` / `texture.needsUpdate`          | Not implemented.                                                                                      |
| `ANARIDeleterCallback`       | No equivalent                | JavaScript garbage collection / explicit GPU `dispose()` | No application-memory deleter callback or transferred memory ownership.                               |

```
const positions = new Float32Array([-1, 0, 0, 1, 0, 0, 0, 1, 0]);

const array = anariDevice.newArray({data: positions, elementType: 'float32x3'});



positions[0] = -2;

geometry.commitParameters();
```

The array retains the original JavaScript object. `array.length` counts scalar JavaScript elements; `new Float32Array(9)` reports `9`, not three `vec3` elements.

## Discovery, properties, and extensions[​](#discovery-properties-and-extensions "Direct link to Discovery, properties, and extensions")

| ANARI 1.1 C API                                                       | `@luma.gl/anari`                              | THREE.js comparison                                       | Support                                                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `anariGetObjectSubtypes(device, objectType)`                          | `anariDevice.getObjectSubtypes(type)`         | Select known constructors / inspect renderer capabilities | Supported with JavaScript string object types.                                                                |
| `anariGetObjectInfo(device, objectType, subtype, infoName, infoType)` | `anariDevice.getObjectInfo(type)`             | Class/capability inspection                               | Partial: returns `{type, subtypes, extensions}` only, not arbitrary named metadata.                           |
| `anariGetParameterInfo()`                                             | No equivalent                                 | Constructor documentation / TypeScript types              | Not implemented; parameter schemas are documented and statically typed rather than introspectable at runtime. |
| `anariGetProperty()`                                                  | No generic equivalent; use `frame.statistics` | Renderer/scene properties and renderer info               | Partial only: render statistics are exposed directly, but ANARI property queries and wait masks are absent.   |
| `anariGetDeviceExtensions()`                                          | `anariDevice.extensions`                      | Renderer/backend capability properties                    | Static package extension list rather than library-dependent/runtime-dependent discovery.                      |

```
anariDevice.getObjectSubtypes('geometry');

// ['triangle', 'sphere', 'cylinder', 'cone', 'quad']



anariDevice.getObjectInfo('material');

// {type: 'material', subtypes: [...], extensions: [...]}
```

The current extension names describe concepts the proof of concept supports; they are not evidence of complete, certified Khronos extension behavior.

## Frame rendering and presentation[​](#frame-rendering-and-presentation "Direct link to Frame rendering and presentation")

| ANARI 1.1 C API                                                              | `@luma.gl/anari`                                     | THREE.js comparison                       | Support and differences                                                                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `anariRenderFrame(device, frame)`                                            | `frame.render()` or `anariDevice.renderFrame(frame)` | `renderer.render(scene, camera)`          | Supported conceptually, but the JavaScript call immediately encodes/draws instead of exposing official asynchronous frame-operation semantics. |
| `anariFrameReady(device, frame, waitMask)`                                   | No equivalent                                        | No exact equivalent                       | Not implemented; there is no polling/wait-mask frame API.                                                                                      |
| `anariDiscardFrame()`                                                        | No equivalent                                        | Stop an application animation loop        | Not implemented; no in-flight frame cancellation API.                                                                                          |
| `anariMapFrame(device, frame, channel, ...)`                                 | No equivalent                                        | Render target / pixel readback            | Not implemented; frames present to the canvas and do not expose mapped pixel channels.                                                         |
| `anariUnmapFrame()`                                                          | No equivalent                                        | Release a mapped/readback resource        | Not implemented.                                                                                                                               |
| `ANARIFrameCompletionCallback`                                               | No equivalent                                        | Animation loop / promise integration      | Not implemented.                                                                                                                               |
| Frame `channel.color`, `channel.depth`, `channel.normal`, and other channels | No equivalent                                        | Render targets, depth textures, G-buffers | Not implemented as ANARI channels. `debugNormals` and `debugDepth` are visualization renderers, not mappable output channels.                  |

```
const statistics = frame.render();

graphicsDevice.submit();
```

Official ANARI rendering is specified as asynchronous and may support readiness queries, cancellation, frame channels, mapping, and completion callbacks. The JavaScript proof of concept returns rendering statistics immediately while GPU execution still follows the underlying luma.gl device's command/submission behavior.

## Retention and destruction[​](#retention-and-destruction "Direct link to Retention and destruction")

| ANARI 1.1 C API                    | `@luma.gl/anari`        | THREE.js comparison                               | Support                                                                                   |
| ---------------------------------- | ----------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `anariRetain()`                    | No equivalent           | Keep a JavaScript object reference                | JavaScript object references replace explicit native handle retention.                    |
| `anariRelease()` on a scene object | No equivalent           | `geometry.dispose()` / `material.dispose()`       | No general per-object reference-count or release method.                                  |
| `anariRelease()` on a frame        | `frame.destroy()`       | Dispose render targets / postprocessing resources | Releases frame-owned GPU resources, but is not a general ANARI handle-release operation.  |
| `anariRelease()` on a device       | `anariDevice.destroy()` | `renderer.dispose()`                              | Releases ANARI runtime resources; does not destroy the separately owned luma.gl `Device`. |

```
frame.destroy();

anariDevice.destroy();

graphicsDevice.destroy();
```

Only destroy the graphics device when the application no longer shares it with other rendering or compute systems.

## Geometry subtype comparison[​](#geometry-subtype-comparison "Direct link to Geometry subtype comparison")

| Official ANARI subtype | `@luma.gl/anari`                                      | Comparable THREE.js class                           | Important difference                                                                                            |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `triangle`             | `newGeometry('triangle', {...})`                      | `BufferGeometry` + position/normal/index attributes | Supports packed positions, optional normals, and 16/32-bit indices; not the complete official attribute system. |
| `sphere`               | `newGeometry('sphere', {radius, segments})`           | `SphereGeometry`                                    | One procedural sphere; official ANARI supports arrays of sphere primitives.                                     |
| `cylinder`             | `newGeometry('cylinder', {radius, height, segments})` | `CylinderGeometry`                                  | One capped procedural cylinder; official ANARI supports collections of indexed cylinder primitives.             |
| `cone`                 | `newGeometry('cone', {radius, height, segments})`     | `ConeGeometry`                                      | One capped procedural cone; official ANARI supports arrays of cone primitives.                                  |
| `quad`                 | `newGeometry('quad', {width, height})`                | `PlaneGeometry`                                     | One XZ-plane procedural quad; official ANARI quad geometry supports explicit vertex/index arrays.               |
| `curve`                | Not supported                                         | `Line`, `LineSegments`, tube/curve geometry         | Not implemented.                                                                                                |
| `isosurface`           | Not supported                                         | Custom marching-cubes / isosurface implementation   | Not implemented.                                                                                                |

## Material parameter comparison[​](#material-parameter-comparison "Direct link to Material parameter comparison")

| Official ANARI concept                                            | `@luma.gl/anari`                                                                                                | Comparable THREE.js property                | Notes                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `matte.color`                                                     | `material.color` / `baseColor`                                                                                  | `material.color`                            | Constant RGB/RGBA values only.                                                                   |
| `physicallyBased.baseColor`                                       | `baseColor` / `baseColorTexture`                                                                                | `MeshStandardMaterial.color` / `map`        | Constant color multiplied by an optional image sampler.                                          |
| `metallic`                                                        | `metallic`                                                                                                      | `MeshStandardMaterial.metalness`            | Same broad metallic-roughness concept; property names differ.                                    |
| `roughness`                                                       | `roughness`                                                                                                     | `MeshStandardMaterial.roughness`            | Constant scalar only.                                                                            |
| `opacity`                                                         | `opacity`                                                                                                       | `material.opacity` + `material.transparent` | Blend state is selected when this implementation first compiles the surface.                     |
| `alphaMode`                                                       | Accepted, not interpreted                                                                                       | `transparent`, `alphaTest`                  | Official `opaque`, `blend`, and `mask` semantics are not fully implemented.                      |
| `emissive`                                                        | `emissive`                                                                                                      | `MeshStandardMaterial.emissive`             | Constant emissive RGB.                                                                           |
| Emissive scaling                                                  | `emissiveStrength`                                                                                              | `MeshStandardMaterial.emissiveIntensity`    | JavaScript convenience scalar.                                                                   |
| `clearcoat`                                                       | `clearcoat`, `clearcoatRoughness`, `clearcoatTexture`                                                           | `MeshPhysicalMaterial.clearcoat`            | Simplified clearcoat term with factor and map; no clearcoat normal map.                          |
| `iridescence`                                                     | `iridescence`                                                                                                   | `MeshPhysicalMaterial.iridescence`          | Simplified angle-dependent spectral effect.                                                      |
| Normal, roughness, metallic, and base-color samplers              | `normalTexture`, `metallicRoughnessTexture`, `baseColorTexture`                                                 | Material textures/maps                      | Supported through retained `image2D` samplers and `vertex.attribute1` UVs.                       |
| Transmission, index of refraction, sheen, attenuation, anisotropy | `transmission`, `transmissionTexture`, `indexOfRefraction`, `sheenColor`, `sheenRoughness`, `sheenColorTexture` | `MeshPhysicalMaterial` advanced properties  | Partial: transmission and sheen are approximated; attenuation and anisotropy remain unsupported. |

## Light and camera comparison[​](#light-and-camera-comparison "Direct link to Light and camera comparison")

| Official ANARI concept                                            | `@luma.gl/anari`                                        | Comparable THREE.js class/property           | Notes                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Directional light                                                 | `newLight('directional', {direction, irradiance})`      | `DirectionalLight`                           | Direction and intensity map conceptually; shadow behavior is absent.                 |
| Point light                                                       | `newLight('point', {position, intensity})`              | `PointLight`                                 | Fixed attenuation; no official radius/power behavior.                                |
| Spot light                                                        | `newLight('spot', {position, direction, openingAngle})` | `SpotLight.angle` / `SpotLight.penumbra`     | `falloffAngle` is accepted but ignored; inner cone is derived automatically.         |
| Renderer ambient lighting                                         | `renderer.ambientRadiance`                              | `AmbientLight` or environment lighting       | This aligns more closely with the official renderer ambient-light extension.         |
| Ambient light object                                              | `newLight('ambient', ...)`                              | `AmbientLight`                               | JavaScript convenience; not an official ANARI 1.1 light subtype.                     |
| HDRI / quad / ring area lights                                    | Not supported                                           | Environment maps / area lights               | Not implemented.                                                                     |
| Perspective camera                                                | `newCamera('perspective', {fovy, ...})`                 | `PerspectiveCamera`                          | ANARI-style `fovy` is expressed in radians; THREE.js constructor `fov` uses degrees. |
| Orthographic camera                                               | `newCamera('orthographic', {height, ...})`              | `OrthographicCamera`                         | JavaScript derives horizontal extent from `height * aspect`.                         |
| Camera depth of field, motion blur, stereo, panoramic projections | Not supported                                           | Specialized camera / postprocessing features | Not implemented.                                                                     |

## THREE.js migration example[​](#threejs-migration-example "Direct link to THREE.js migration example")

The following snippets express approximately the same simple scene. They are not interchangeable implementations.

### THREE.js[​](#threejs "Direct link to THREE.js")

```
import * as THREE from 'three';



const scene = new THREE.Scene();

const geometry = new THREE.SphereGeometry(1, 48, 24);

const material = new THREE.MeshPhysicalMaterial({

  color: 0x3388ff,

  metalness: 0.85,

  roughness: 0.18,

  clearcoat: 0.25

});



const mesh = new THREE.Mesh(geometry, material);

mesh.position.set(0, 1, 0);

scene.add(mesh);



const light = new THREE.PointLight(0xff8833, 30);

light.position.set(3, 2, 0);

scene.add(light);



const camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 200);

camera.position.set(0, 2, 8);

camera.lookAt(0, 1, 0);



renderer.render(scene, camera);
```

### `@luma.gl/anari`[​](#lumaglanari "Direct link to lumaglanari")

```
const geometry = anariDevice.newGeometry('sphere', {radius: 1, segments: 24});

const material = anariDevice.newMaterial('physicallyBased', {

  baseColor: [0.2, 0.53, 1],

  metallic: 0.85,

  roughness: 0.18,

  clearcoat: 0.25

});



const surface = anariDevice.newSurface({geometry, material});

const group = anariDevice.newGroup({surface: [surface]});

const instance = anariDevice.newInstance({

  group,

  transform: new Matrix4().translate([0, 1, 0])

});



const light = anariDevice.newLight('point', {

  position: [3, 2, 0],

  color: [1, 0.53, 0.2],

  intensity: 30

});



const world = anariDevice.newWorld({instance: [instance], light: [light]});

const camera = anariDevice.newCamera('perspective', {

  position: [0, 2, 8],

  direction: [0, -1, -8],

  fovy: 50 * Math.PI / 180

});

const renderer = anariDevice.newRenderer('default');

const frame = anariDevice.newFrame({world, camera, renderer, size: [width, height]});



frame.render();
```

### THREE.js-specific differences[​](#threejs-specific-differences "Direct link to THREE.js-specific differences")

* THREE.js attaches transforms directly to `Object3D`; ANARI separates surfaces, groups, and transform instances.
* THREE.js does not require a general explicit parameter commit; ANARI-style updates require `commitParameters()`.
* THREE.js `InstancedMesh` is constructed explicitly and requires instance-matrix updates; this package derives instanced draws from shared `ANARISurface` identities.
* THREE.js `MeshStandardMaterial.metalness` corresponds conceptually to ANARI `metallic`, not to a property named `metalness` in this package.
* THREE.js camera field of view is commonly specified in degrees; ANARI `fovy` here is specified in radians.
* THREE.js provides many mature features absent from this proof of concept, including extensive texture/material systems, shadow maps, loaders, raycasting, postprocessing, and broad scenegraph functionality.
* THREE.js `WebGPURenderer` can fall back to WebGL 2; this package obtains similar portability by configuring luma.gl WebGPU and WebGL adapters explicitly.

## Official sources[​](#official-sources "Direct link to Official sources")

* [Khronos ANARI Registry](https://registry.khronos.org/ANARI/)
* [ANARI 1.1 specification](https://registry.khronos.org/ANARI/specs/1.1/ANARI-1.1.html)
* [THREE.js Scene](https://threejs.org/docs/pages/Scene.html)
* [THREE.js Mesh](https://threejs.org/docs/pages/Mesh.html)
* [THREE.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
* [THREE.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html)
* [THREE.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)
* [THREE.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
* [THREE.js PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html)
* [THREE.js WebGPURenderer](https://threejs.org/manual/en/webgpurenderer)
