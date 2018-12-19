# babel-plugin-inline-gl-constants

Replaces `gl.<constant>` or `GL.<constant>` references with the corresponding OpenGL constant value.

When used on luma.gl applications, also removes any import of the `GL` namespace.


## Example

#### in

```js
const max = gl.MAX_VERTEX_ATTRIBS;
```

#### out

```js
const max = 34921;
```


#### in

```js
import GL from '@luma.gl/constants';
...
const max = GL.MAX_VERTEX_ATTRIBS;
```

#### out

```js
...
const max = 34921;
```



## Installation

```sh
$ npm install --save-dev babel-plugin-inline-gl-constants
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["inline-gl-constants"]
}
```

### Via CLI

```sh
$ babel --plugins inline-gl-constants script.js
```

### Via Node API

```js
require("babel-core").transform("code", {
  plugins: ["inline-gl-constants"]
});
```