# v7 NEWS

### WebGL Improvements

* **WebGL1 Browser Support Optimizations** - luma.gl focuses on providing a WebGL2 based API, and internally "translates" WebGL2-style API calls to WebGL1 calls when WebGL2 is not available. While this WebGL1 backwards compatibility is convenient, it is not completely free. Therefore, to optimize the bundle size of WebGL2-only applications, WebGL1 "polyfills" are no longer included by default. If you still want your app to support WebGL1 browsers, just import 'luma.gl/webgl1' before creating any luma.gl contexts. Also note that WebGL portability, including WebGL1 browser support, is still a core feature of luma.gl, and the WebGL1 polyfills will continue to be used and supported.


# v7 UPGRADE GUIDE

### WebGL1 Support

Support for WebGL1 browsers/environments (e.g Safari, Edge, Node.js with headless gl) is now optional. To ensure your app still supports WebGL1 contexts, import the "polyfills" before creating any WebGL contexts:

```js
import 'luma.gl/webgl1';
```
