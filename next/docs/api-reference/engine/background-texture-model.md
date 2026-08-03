# BackgroundTextureModel

[ClipSpace](https://luma.gl/next/docs/api-reference/engine/clip-space.md)[BackgroundTextureModel](https://luma.gl/next/docs/api-reference/engine/background-texture-model.md)[ShaderPassRenderer](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md)

`BackgroundTextureModel` is a specialized [`ClipSpace`](https://luma.gl/next/docs/api-reference/engine/clip-space.md) that renders one texture across the screen while preserving aspect ratio.

It is useful for fullscreen background imagery, texture previews, and screen-space compositing.

## Usage[​](#usage "Direct link to Usage")

```
import {BackgroundTextureModel, DynamicTexture} from '@luma.gl/engine';

const backgroundTexture = new DynamicTexture(device, {data: loadImageBitmap('/background.png')});

const background = new BackgroundTextureModel(device, {
  backgroundTexture
});
```

## Types[​](#types "Direct link to Types")

### `BackgroundTextureModelProps`[​](#backgroundtexturemodelprops "Direct link to backgroundtexturemodelprops")

```
export type BackgroundTextureModelProps = ClipSpaceProps & {
  id?: string;
  backgroundTexture: Texture | DynamicTexture;
  blend?: boolean;
};
```

## Properties[​](#properties "Direct link to Properties")

### `backgroundTexture`[​](#backgroundtexture "Direct link to backgroundtexture")

Resolved core texture currently used for drawing.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: BackgroundTextureModelProps)`[​](#constructordevice-device-props-backgroundtexturemodelprops "Direct link to constructordevice-device-props-backgroundtexturemodelprops")

Creates the fullscreen texture renderer. Throws if `backgroundTexture` is missing.

### `setProps(props: Partial<BackgroundTextureModelProps>): void`[​](#setpropsprops-partialbackgroundtexturemodelprops-void "Direct link to setpropsprops-partialbackgroundtexturemodelprops-void")

Updates the background texture and recomputes aspect-ratio scale when the texture is ready.

### `predraw(commandEncoder: CommandEncoder): void`[​](#predrawcommandencoder-commandencoder-void "Direct link to predrawcommandencoder-commandencoder-void")

Runs the normal `ClipSpace` predraw path, encoding any managed uniform uploads onto the supplied command encoder.

### `updateScale(texture: Texture): void`[​](#updatescaletexture-texture-void "Direct link to updatescaletexture-texture-void")

Updates the internal shader uniforms that preserve aspect ratio.

## Remarks[​](#remarks "Direct link to Remarks")

* `BackgroundTextureModel` accepts `DynamicTexture` directly and waits for it to resolve before updating scale.
* When `blend` is enabled, the model configures blend parameters intended for compositing into transparent areas.
