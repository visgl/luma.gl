# loadFile, loadImage

Minimal utilities to load files and images, typically to initialize textures.

## Usage

Creating a request to load images.
```js
import {loadImage} from '@luma.gl.core';
const image = await loadImage('image1.png');
alert("images loaded! Now do something with the image");
```

Creating a request to load images and create WebGL textures
```js
import {loadImage} from '@luma.gl.core';
const image = loadImage('image1.png');
const new Texture2D(gl, {data: image});
```

Creating a request object to a specific url and making the request.
Note the `send` call at the end of the instanciation.

```js
import {loadFile} from '@luma.gl.core';
// Using ES7 async/await
const text = await loadFile('/mydomain/somethingelse/');
```

### loadImage(url : String [, options: Object]);

Enables loading of multiple remote images asynchronously and returns an array with all the images loaded.

`const image = await loadImages(url, options);`

* `url` - (*String*) strings pointing to image url.


### loadFile(url : String [, options: Object]);

Loads remote data asynchronously via an http request (fetch). On the browser, the domain serving the data must match the domain where the data is queried.
