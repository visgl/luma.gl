# glfx Image Processing Demo

This example is a luma.gl port of [glfx.js](https://github.com/evanw/glfx.js/), Ewan Wallace's WebGL powered image effects library. It also includes improvements made by @daviestar in [glfx-es6](https://github.com/daviestar/glfx-es6).

All the glfx have been packaged as reusable luma.gl shader modules.


## Running

```
yarn
yarn build
open index.html
```


## TODO

Effects:
- [ ] Fix EdgeWork
- [ ] Port curves effect
- [ ] Port perspect effect
- [ ] Port lensblur effect

Canvas API
- [ ] Readback buffers
- [ ] Use floating point buffers

App
- [ ] Retina Photos
