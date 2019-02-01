# Loading Data

Often 3D applications need to load assets like textures and models into memory.

Data loading is not a part of luma.gl, however an optional companion framework (loaders.gl) provides a rich suite of compatible loaders.

## Loading Images and Textures

`Texture` constructors accept any WebGL-supported texture image data sources such as `Image` objects and image data arrays. They also accept `Promise`s that resolve the those objects. This enables applications to pass the `Promise` from an image loading function directly to the texture constructor:

For basic image loading use cases, a very simple `loadImage` utility is included in luma.gl:

```
import {Texture2D, loadImage} from '@luma.gl/core';

// The following constructors are all equivalent:
const texture = new Texture2D(gl, url); // String argument, `loadImage` automatically called
const texture = new Texture2D(gl, {data: url}); // String `data`, `loadImage` automatically called
const texture = new Texture2D(gl, loadImage(url)); // Promise argument
const texture = new Texture2D(gl, {data: loadImage(url)}); // Promise `data`
```

Note: the luma.gl `Program.draw()` function will not render until all texture uniforms have been initialized (i.e. any promises have resolved).


For more advanced use cases, e.g. loading images in browser worker threads or Node.js, you can use custom image loading code or the `loadImage` utilities from loaders.gl.

```
import {Texture2D} from '@luma.gl/core';
import {loadImage} from '@loaders.gl/core';

const texture = new Texture2D(gl, loadImage(url));
const texture = new Texture2D(gl, {data: loadImage(url)});
```

## Loading Meshes and Point Clouds

Refer to loaders.gl for a suite of loaders supporting a variety of 3D formats.


## Loading glTF Scenegraphs

Install `@loaders.gl/gltf`.

Support for Draco encoded glTF models is also available, however it requires installing and injecting the draco decoder into the gltf parser.
