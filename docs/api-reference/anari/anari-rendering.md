# ANARI Cameras, Renderers, and Frames

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
  <img src="https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square" alt="Private workspace" />
</p>

An `ANARICamera` describes the view, an `ANARIRenderer` selects shading and presentation settings, and an `ANARIFrame` combines both with a world to produce an image.

## `ANARICamera`

```ts
new ANARICamera(
  device: ANARIDevice,
  subtype: ANARICameraSubtype,
  parameters?: ANARICameraParameters
);

newCamera(
  subtype: 'perspective' | 'orthographic',
  parameters?: ANARICameraParameters
): ANARICamera;
```

### Camera parameters

```ts
type ANARICameraParameters = {
  position?: ANARIVector3;
  direction?: ANARIVector3;
  up?: ANARIVector3;
  aspect?: number;
  fovy?: number;
  height?: number;
  near?: number;
  far?: number;
};
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `position` | `[0, 0, 5]` | World-space camera position. |
| `direction` | `[0, 0, -1]` | World-space viewing direction. The look-at target is `position + direction`. |
| `up` | `[0, 1, 0]` | World-space up direction. |
| `aspect` | Frame width divided by frame height | Explicit projection aspect ratio. |
| `fovy` | `Math.PI / 3` | Perspective vertical field of view, in radians. |
| `height` | `12` | Orthographic vertical viewing extent. |
| `near` | `0.05` | Near clipping plane. |
| `far` | `500` | Far clipping plane. |

### Perspective camera

```ts
const camera = anariDevice.newCamera('perspective', {
  position: [5, 3, 8],
  direction: [-5, -2, -8],
  fovy: Math.PI / 4,
  near: 0.05,
  far: 200
});
```

### Orthographic camera

```ts
const camera = anariDevice.newCamera('orthographic', {
  position: [0, 6, 12],
  direction: [0, -4, -12],
  height: 10,
  near: 0.05,
  far: 100
});
```

The horizontal extent is `height * aspect`. Update camera position or direction with `setParameters(...).commitParameters()` before the next render.

## `ANARIRenderer`

```ts
new ANARIRenderer(
  device: ANARIDevice,
  subtype: ANARIRendererSubtype,
  parameters?: ANARIRendererParameters
);

newRenderer(
  subtype?: 'default' | 'debugNormals' | 'debugDepth',
  parameters?: ANARIRendererParameters
): ANARIRenderer;
```

Omitting the subtype selects `default`.

### Renderer parameters

```ts
type ANARIRendererParameters = {
  background?: ANARIVector4;
  ambientRadiance?: number;
  exposure?: number;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  fogColor?: ANARIVector3;
  fogDensity?: number;
};
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `background` | `[0.015, 0.018, 0.038, 1]` | RGBA clear color. |
| `ambientRadiance` | `0.12` | Base white ambient light added before explicit world/group lights. |
| `exposure` | `1.35` | Final lighting exposure. |
| `bloomIntensity` | `0` | Bloom amount; positive values allocate and run the bloom postprocessing path. |
| `bloomThreshold` | `0.62` | Brightness threshold for bloom extraction. |
| `bloomRadius` | `7` | Bloom blur radius. |
| `fogColor` | `[0.025, 0.035, 0.075]` | RGB atmospheric fog color. |
| `fogDensity` | `0` | Distance-based fog density. |

### Default renderer

```ts
const renderer = anariDevice.newRenderer('default', {
  background: [0.012, 0.016, 0.04, 1],
  ambientRadiance: 0.16,
  exposure: 1.5,
  bloomIntensity: 0.7,
  bloomThreshold: 0.65,
  bloomRadius: 8,
  fogColor: [0.03, 0.04, 0.09],
  fogDensity: 0.0004
});
```

Bloom renders into a temporary frame-sized texture before composing the result to the canvas. The intermediate texture uses the underlying device's preferred presentation format, preserving HDR values when the canvas uses `rgba16float`.

### Debug normals

```ts
const normals = anariDevice.newRenderer('debugNormals');
frame.setParameter('renderer', normals).commitParameters();
```

`debugNormals` visualizes world-space surface normals as RGB values. Bloom is disabled automatically in this renderer mode.

### Debug depth

```ts
const depth = anariDevice.newRenderer('debugDepth');
frame.setParameter('renderer', depth).commitParameters();
```

`debugDepth` visualizes scene depth. Bloom is disabled automatically in this renderer mode.

### Updating renderer settings

```ts
renderer
  .setParameters({exposure: 1.8, bloomIntensity: 0.9, fogDensity: 0.001})
  .commitParameters();
```

Committed renderer settings apply on the next frame. Set `bloomIntensity` to `0` to bypass the bloom pass.

## `ANARIFrame`

```ts
new ANARIFrame(device: ANARIDevice, parameters: ANARIFrameParameters);
newFrame(parameters: ANARIFrameParameters): ANARIFrame;

type ANARIFrameParameters = {
  world: ANARIWorld;
  camera: ANARICamera;
  renderer: ANARIRenderer;
  size?: readonly [number, number];
};
```

| Parameter | Required | Meaning |
| --- | --- | --- |
| `world` | Yes | Committed scene hierarchy. |
| `camera` | Yes | Committed perspective or orthographic camera. |
| `renderer` | Yes | Committed renderer and presentation controls. |
| `size` | No | Explicit width and height in drawing-buffer pixels. Defaults to the device canvas drawing-buffer size. |

```ts
const frame = anariDevice.newFrame({
  world,
  camera,
  renderer,
  size: [1280, 720]
});
```

### `render()`

```ts
render(): ANARIFrameStatistics;
```

Compiles committed scene objects as necessary, updates transforms and material/light uniforms, draws the world, optionally runs bloom, and returns render statistics:

```ts
const statistics = frame.render();
graphicsDevice.submit();
```

If required world, camera, or renderer parameters are absent from committed frame state, the implementation returns zero-valued statistics without rendering.

### `statistics`

```ts
frame.statistics: ANARIFrameStatistics;

type ANARIFrameStatistics = {
  surfaceCount: number;
  instanceCount: number;
  drawCount: number;
  triangleCount: number;
};
```

| Statistic | Meaning |
| --- | --- |
| `surfaceCount` | Number of distinct retained surface identities visible in the world. |
| `instanceCount` | Number of direct and instanced surface placements. |
| `drawCount` | Number of successful model draws, normally one per distinct surface. |
| `triangleCount` | Sum of geometry triangles across all placements. |

`frame.statistics` is initialized with zeroes and updated by each `frame.render()` call.

### Resizing

```ts
frame.setParameter('size', [canvas.width, canvas.height]).commitParameters();
```

Omit `size` to follow the canvas drawing-buffer size. Changing an explicit frame size resizes bloom's temporary framebuffer on the next render.

### Replacing world, camera, or renderer

```ts
frame.setParameters({
  world: nextWorld,
  camera: nextCamera,
  renderer: nextRenderer
}).commitParameters();
```

Each replacement must be committed on the frame. Scene objects referenced by the previous world can still be reused elsewhere.

### `destroy()`

```ts
destroy(): void;
```

Releases the frame's cached models, instance buffers, intermediate textures/framebuffers, and bloom renderer. Call it before disposing of the parent ANARI or graphics device.

## Shared exported types

```ts
type ANARIVector3 = readonly [number, number, number];
type ANARIVector4 = readonly [number, number, number, number];
type ANARIMatrix4 = readonly number[];

type ANARIGeometrySubtype = 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad';
type ANARIMaterialSubtype = 'matte' | 'physicallyBased';
type ANARILightSubtype = 'ambient' | 'directional' | 'point' | 'spot';
type ANARICameraSubtype = 'perspective' | 'orthographic';
type ANARIRendererSubtype = 'default' | 'debugNormals' | 'debugDepth';
```

All parameter interfaces, object classes, subtype aliases, object metadata, and frame statistics are exported from `@luma.gl/anari`.
