# Function: loadImageBitmap()

> **loadImageBitmap**(`url`, `opts?`): `Promise`<`ImageBitmap`>

Defined in: [modules/engine/src/application-utils/load-file.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/application-utils/load-file.ts#L24)

Loads ImageBitmap asynchronously. Respects setPathPrefix. image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'

## Parameters[​](#parameters "Direct link to Parameters")

### url[​](#url "Direct link to url")

`string`

### opts?[​](#opts "Direct link to opts?")

`object` & `ImageBitmapOptions`

## Returns[​](#returns "Direct link to Returns")

`Promise`<`ImageBitmap`>

a promise tracking the load
