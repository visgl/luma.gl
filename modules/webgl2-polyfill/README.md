# @luma.gl/webgl2-polyfill

This moduls installs a partial set of polyfills for WebGL1 contexts, making them more API compatible with WebGL2.

* It adds WebGL2 methods to the WebGL1 context, and simply forwards the calls to WebGL1 extensions.
* It also overrides some `getParameter` type calls returning default values when WebGL2 constants are used.

This way applications can work directly with the WebGL2 API even when using WebGL1 with extensions. It removes conditional code from applications and prepares application code bases for WebGL2.

## Usage

```
yarn add @luma.gl/webgl2-polyfill
```

```
import polyfillContext from '@luma.gl/webgl2-polyfill';

const gl = canvas.getContext('webgl');
polyfillContext(gl);
// New methods are now available on the context
```

## Remarks

* This a helper module for [luma.gl](http://luma.gl), but is designed to be independently usable in other projects.
