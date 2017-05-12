# Using with Node.js

If [headless-gl](https://www.npmjs.com/package/gl) is installed and properly configured on your system (it can often autodetect your configuration), you should be able to run luma.gl in Node.js from the console, even machines that do not have GPUs.

To do this, your application should import 'luma.gl/headless':
```js
import 'luma.gl/headless';
import {createGLContext, Model, ...} from 'luma.gl';
const gl = createGLContext({width, height, ...});
```

The main limitation is that `headless-gl` only supports WebGL1.

