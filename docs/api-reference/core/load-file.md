# loadFile, loadImage

Minimal utilities to load files and images in the browser, typically used to initialize textures.

## Usage

Creating a request to load images.
```js
import {loadImage} from '@luma.gl/core';
async () {
  const image = await loadImage('image1.png');
  alert("images loaded! Now do something with the image");
}();
```

Creating a request to load images and create WebGL textures
```js
import {loadImage} from '@luma.gl/core';
const image = await loadImage('image1.png');
const new Texture2D(gl, {data: image});
```

You can also load text files
```js
import {loadFile} from '@luma.gl/core';
const text = await loadFile(url);
```

For more advanced loading you may want to consider using loaders.gl. these can parse complex formats and parsing works on Node.js, browser threads etc.
```
import {loadFile} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

loadFile(url, OBJLoader).then(data => {
  // Application code here
  ...
});
```


### loadImage(url : String [, options: Object]) : Promise

Enables loading of multiple remote images asynchronously and returns an array with all the images loaded.

```
const image = await loadImages(url, options);
```

* `url` - (*String*) strings pointing to image url.


### loadFile(url : String [, options: Object]) : Promise

Loads remote data asynchronously via an http request (`fetch`). The domain serving the data must match the domain where the data is queried.
