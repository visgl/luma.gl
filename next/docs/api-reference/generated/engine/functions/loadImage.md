# ~~Function: loadImage()~~

> **loadImage**(`url`, `opts?`): `Promise`<`HTMLImageElement`>

Defined in: [modules/engine/src/application-utils/load-file.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/application-utils/load-file.ts#L52)

Loads image asynchronously. Respects setPathPrefix. image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'

## Parameters[​](#parameters "Direct link to Parameters")

### url[​](#url "Direct link to url")

`string`

### opts?[​](#opts "Direct link to opts?")

#### crossOrigin?[​](#crossorigin "Direct link to crossOrigin?")

`string`

## Returns[​](#returns "Direct link to Returns")

`Promise`<`HTMLImageElement`>

a promise tracking the load

## Deprecated[​](#deprecated "Direct link to Deprecated")

Use `loadImageBitmap()` unless you are supporting old versions of Safari.
