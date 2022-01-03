# Overview

> WebGL only

luma.gl is pre-integrated with the Khronos group's WebGL debug tools (the [WebGLDeveloperTools](https://github.com/KhronosGroup/WebGLDeveloperTools)) and can use these to "instrument" `WebGLRenderingContext`s.

> Warning: WebGL debug contexts impose a significant performance penalty (due to waiting for the GPU after each WebGL call to check error codes) and should not be used in production builds.

To use debug support, first import the debug tools, then call [`createDevice`](/docs/api-reference/gltools/context) with `debug: true` to create a debug context:

```js
import {luma} from '@luma.gl/core';
import '@luma.gl/debug';
const device = luma.createDevice({type: 'webgl', debug: true});
```

If the debug tools haven't been imported, specifying the `debug` flag will print a warning and simply return the original context, so the debug code can be left in the applicatin even when debug support is not imported.

Debug contexts perform the following:

- **Detects WebGL Errors** - Check the WebGL error status after each WebGL call and throws an exception if an error was detected, taking care to extract helpful information into the error message.

- **Checks WebGL Parameters** - Ensure that WebGL parameters are set to valid values.
