This example loads a range of image and compressed texture formats with loaders.gl and renders them with luma.gl.

It is useful for comparing WebGL and WebGPU behavior for compressed textures. Some non-block-aligned compressed sizes may appear to work on WebGL because drivers pad them internally, while WebGPU requires explicitly block-aligned texture sizes and upload extents.

### Usage

```bash
yarn install
yarn start
```
