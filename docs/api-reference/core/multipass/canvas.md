# Canvas (Experimental)

> This document is still being written.

`Canvas` is a unique class that makes it possible to use filter-style image processing shader modules in a standard JavaScript application, without using the rest of the luma.gl API.

The `Canvas` class was inspired by the `canvas` class in the glfx API.


## Usage


```js
<script src="glfx.js"></script>
<script>

window.onload = function() {
    // try to create a WebGL canvas (will fail if WebGL isn't supported)
    try {
        var canvas = fx.canvas();
    } catch (e) {
        alert(e);
        return;
    }

    // convert the image to a texture
    var image = document.getElementById('image');
    var texture = canvas.texture(image);

    // apply the ink filter
    canvas.draw(texture).ink(0.25).update();

    // replace the image with the canvas
    image.parentNode.insertBefore(canvas, image);
    image.parentNode.removeChild(image);

    // Note: instead of swapping the <canvas> tag with the <img> tag
    // as done above, we could have just transferred the contents of
    // the image directly:
    //
    //     image.src = canvas.toDataURL('image/png');
    //
    // This has two disadvantages. First, it is much slower, so it
    // would be a bad idea to do this repeatedly. If you are going
    // to be repeatedly updating a filter it's much better to use
    // the <canvas> tag directly. Second, this requires that the
    // image is hosted on the same domain as the script because
    // JavaScript has direct access to the image contents. When the
    // two tags were swapped using the previous method, JavaScript
    // actually doesn't have access to the image contents and this
    // does not violate the same origin policy.
};

</script>
<img id="image" src="image.jpg">
```

## Methods

### Canvas Constructor

var canvas = new Canvas();

Before you can apply any filters you will need a canvas, which stores the result of the filters you apply. Canvas creation is done through `new Canvas()`, which creates and returns a new WebGL <canvas> tag with additional methods specific to glfx.js. This call will throw an error message if the browser doesn't support WebGL.

### Canvas.destroy()

Textures will be garbage collected eventually when they are no longer referenced, but this method will free GPU resources immediately.


### installFiltersAsMethods(filters : Object)

Installs a map of shader filters as methods on the `Canvas` instance, as an alternative to calling them using `Canvas.filter`.

### replace(node : HTMLElement)


### setTexture(element)

Creates a texture that initially stores the image from an HTML element. Notice that texture() is a method on a canvas object, which means if you want to use the same image on two canvas objects you will need two different textures, one for each canvas.

* `element` - The HTML element to store in the texture, either an <img>, a <canvas>, or a <video>.

This replaces the internal contents of the canvas with the image stored in texture. All filter operations take place in a chain that starts with canvas.draw() and ends with canvas.update().

Loads the image from an HTML element into the texture. This is more efficient than repeatedly creating and destroying textures.

element The HTML element to store in the texture, either an <img>, a <canvas>, or a <video>.
Destroy Texture


### update()

Update Screen

This replaces the visible contents of the canvas with the internal image result. For efficiency reasons, the internal image buffers are not rendered to the screen every time a filter is applied, so you will need to call update() on your canvas after you have finished applying the filters to be able to see the result. All filter operations take place in a chain that starts with canvas.draw() and ends with canvas.update().


### filter(shaderModule, props)

### contents()

### getPixelArray()

Get a Uint8 array of pixel values: [r, g, b, a, r, g, b, a, ...]
Length of the array will be width * height * 4.
