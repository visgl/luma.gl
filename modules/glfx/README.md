# glfx - A WebGL powered image effects library

Adjust photos in your browser in realtime with glfx. It uses your graphics card for image effects that would be impossible to apply in real-time with JavaScript alone.


## Attributions / Credits

This is a luma.gl port of [glfx.js](https://github.com/evanw/glfx.js/), Ewan Wallace's WebGL powered image effects library. It includes improvements made by @daviestar in [glfx-es6](https://github.com/daviestar/glfx-es6).


## Remarks

There are two caveats to glfx.js.

* It requires WebGL, which is now ubiquitous.
* Due to the same origin policy, JavaScript is only allowed to read images that originate from the same domain as the script reading them, so you may have to host the images you modify.


## License

Both the [glfx.js](https://github.com/evanw/glfx.js/LICENSE) and [glfx-es6](https://github.com/daviestar/glfx-es6/LICENSE) packages are MIT licensed, as is luma.gl.
