# BackgroundTextureModel

`BackgroundTextureModel` is a specialized [`ClipSpace`](/docs/api-reference/engine/clip-space) that renders one texture across the screen while preserving aspect ratio.

It is useful for fullscreen background imagery, texture previews, and screen-space compositing.

## Usage

```typescript
import {BackgroundTextureModel, DynamicTexture} from '@luma.gl/engine';

const backgroundTexture = new DynamicTexture(device, {data: loadImageBitmap('/background.png')});

const background = new BackgroundTextureModel(device, {
  backgroundTexture
});
```

## Types

### `BackgroundTextureModelProps`

```ts
export type BackgroundTextureModelProps = ClipSpaceProps & {
  id?: string;
  backgroundTexture: Texture | DynamicTexture;
  blend?: boolean;
};
```

## Properties

### `backgroundTexture`

Resolved core texture currently used for drawing.

## Methods

### `constructor(device: Device, props: BackgroundTextureModelProps)`

Creates the fullscreen texture renderer. Throws if `backgroundTexture` is missing.

### `setProps(props: Partial<BackgroundTextureModelProps>): void`

Updates the background texture and recomputes aspect-ratio scale when the texture is ready.

### `predraw(): void`

Runs the normal `ClipSpace` predraw path.

### `updateScale(texture: Texture): void`

Updates the internal shader uniforms that preserve aspect ratio.

## Remarks

- `BackgroundTextureModel` accepts `DynamicTexture` directly and waits for it to resolve before updating scale.
- When `blend` is enabled, the model configures blend parameters intended for compositing into transparent areas.
