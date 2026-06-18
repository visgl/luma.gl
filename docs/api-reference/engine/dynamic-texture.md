# DynamicTexture

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

`DynamicTexture` is the engine-level convenience wrapper around core [`Texture`](/docs/api-reference/core/resources/texture) resources.
It adds async initialization, resizing, mipmap generation, and helpers for more complex texture layouts while still producing a normal `Texture`, `Sampler`, and `TextureView` once ready.

## Usage

```typescript
import {DynamicTexture, loadImageBitmap, Model} from '@luma.gl/engine';

const dynamicTexture = new DynamicTexture(device, {
  data: loadImageBitmap('/path/to/image.png'),
  mipmaps: true
});

const model = new Model(device, {
  source,
  bindings: {texture: dynamicTexture}
});

await dynamicTexture.ready;
```

## `HTMLTexture` Usage

`HTMLTexture` is an experimental `DynamicTexture` subclass for the Chrome HTML-in-Canvas APIs.
It copies a live DOM subtree into a GPU texture when the canvas receives a browser `paint` event.
The source element must be a direct child of the same canvas that participates in the HTML-in-Canvas paint cycle.

```typescript
import {HTMLTexture, Model} from '@luma.gl/engine';

HTMLTexture.configureCanvas(canvas);

const panelElement = document.createElement('div');
panelElement.style.cssText = 'position:absolute;left:0;top:0;width:320px;height:320px';
panelElement.innerHTML = '<button>Live DOM</button>';
canvas.appendChild(panelElement);

const htmlTexture = new HTMLTexture(device, {
  canvas,
  element: panelElement,
  width: 640,
  height: 640,
  autoUpdate: true,
  observeResize: true
});

const model = new Model(device, {
  source,
  bindings: {uHtmlTexture: htmlTexture}
});
```

For interactive 3D DOM, keep the DOM element positioned at the canvas origin and update its browser transform from the same model-view-projection matrix used to draw the textured geometry. Chrome's `canvas.getElementTransform(element, drawTransform)` maps pointer events into the transformed element. The `drawTransform` should be expressed in CSS pixels, so scale viewport coordinates by `1 / window.devicePixelRatio` when deriving it from the backing canvas size.

Chrome may throw `InvalidStateError` before the element has a cached paint record. Treat that as a transient first-frame condition and retry on later renders.

```typescript
try {
  const transform = canvas.getElementTransform?.(panelElement, drawTransform);
  if (transform) {
    panelElement.style.transform = transform.toString();
  }
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') {
    throw error;
  }
}
```

Practical constraints:

- Call `HTMLTexture.isSupported(device, canvas)` before constructing UI that depends on DOM-to-texture upload. It checks for `requestPaint()` plus the WebGL `texElementImage2D` or WebGPU `copyElementImageToTexture` path.
- Append the `element` directly to the `canvas`; nested source elements are rejected because Chrome requires direct canvas children for HTML-in-Canvas.
- Size the DOM element in CSS pixels and the texture in device pixels. `HTMLTexture` uses the element border box as `sourceWidth` and `sourceHeight` by default, so a 320 CSS pixel panel can upload cleanly into a 640 pixel texture on a 2x display.
- Stop propagation for pointer events handled by the DOM panel when the canvas also implements background drag or orbit controls.
- Use `autoUpdate` for DOM mutations and `observeResize` for source size changes. Manual callers can use `requestUpdate()` when they know the DOM needs a new paint.

## Types

### `DynamicTextureProps`

```ts
export type DynamicTextureProps =
  Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &
  TextureDataAsyncProps & {
    mipmaps?: boolean;
    mipLevels?: number | 'auto';
    width?: number;
    height?: number;
  };
```

`DynamicTextureProps` combines normal texture props with async-friendly texture data props from `texture-data.ts`.
For simple `2d` textures, `data` may still be provided as a bare typed array when `width` and `height` are supplied.

### `HTMLTextureProps`

```ts
export type HTMLTextureProps =
  Omit<DynamicTextureProps, 'data' | 'dimension' | 'height' | 'mipmaps' | 'width'> & {
    canvas: HTMLCanvasElement;
    element: Element;
    width: number;
    height: number;
    sourceWidth?: number;
    sourceHeight?: number;
    autoUpdate?: boolean;
    observeResize?: boolean;
  };
```

`width` and `height` define the destination texture size in pixels. `sourceWidth` and `sourceHeight` define the copied source rectangle in CSS pixels and default to the DOM element border box.

## Properties

### `device`, `id`

Owning device and application-provided identifier.

### `props`

Resolved texture props, with defaults applied and async `data` removed after initialization begins.

### `ready: Promise<Texture>`

Resolves when the underlying texture has been created and any initial data has been uploaded.

### `isReady: boolean`

Indicates whether `ready` has resolved successfully.

### `destroyed: boolean`

Indicates whether the dynamic texture has been destroyed.

### `texture`, `sampler`, `view`

Shortcuts to the underlying core texture resources. Accessing them before `isReady` is an error.

## Methods

### `constructor(device: Device, props: DynamicTextureProps)`

Starts async initialization immediately.

### `destroy(): void`

Destroys the underlying texture and marks the wrapper as destroyed.

### `generateMipmaps(): void`

Generates mipmaps for the current texture. Uses the appropriate WebGL or WebGPU backend path.

### `setSampler(sampler: Sampler | SamplerProps = {}): void`

Sets a sampler on the underlying texture.

### `readBuffer(options?: TextureReadOptions): Promise<Buffer>`

Allocates a temporary GPU readback buffer, copies the requested region into it, waits for GPU completion, and returns the ready-to-read buffer. The caller owns the returned buffer and must destroy it.

The underlying texture must support `Texture.COPY_SRC`. `DynamicTexture` owns the temporary buffer allocation, but it does not broaden texture usage automatically.

### `readAsync(options?: TextureReadOptions): Promise<ArrayBuffer>`

Convenience readback built on `readBuffer()`. Allocates a temporary buffer, copies the requested region, maps it, returns the bytes as an `ArrayBuffer`, and destroys the temporary buffer.

### `resize(size: {width: number; height: number}): boolean`

Clones the immutable underlying texture to a new size. Returns `false` when the size did not change.

### `getCubeFaceIndex(face: TextureCubeFace): number`

Returns the layer index for one cube face.

### `getCubeArrayFaceIndex(cubeIndex: number, face: TextureCubeFace): number`

Returns the layer index for a face within a cube-array texture.

### `setTexture1DData(data: Texture1DData): void`

Uploads 1D texture data.

### `setTexture2DData(data: Texture2DData, z = 0): void`

Uploads 2D texture data, optionally targeting a slice index.

### `setTexture3DData(data: Texture3DData): void`

Uploads 3D texture data.

### `setTextureArrayData(data: TextureArrayData): void`

Uploads 2D-array texture data.

### `setTextureCubeData(data: TextureCubeData): void`

Uploads cube texture data.

### `setTextureCubeArrayData(data: TextureCubeArrayData): void`

Uploads cube-array texture data.

## Remarks

- `DynamicTexture` is directly supported anywhere [`Model`](/docs/api-reference/engine/model) accepts bindings.
- It is the recommended way to work with promise-backed texture data and backend-independent mipmap generation.
