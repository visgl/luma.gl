# PhongMaterial

A material class specifies reflection properties of a shiny surface, uses [Blinn-Phong](https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_shading_model) model for underlying implementation. 


## Usage

Create a material class
```js
const phongMaterial = new PhongMaterial({
  ambient: 0.2,
  diffuse: 0.5,
  shininess: 32,
  specularColor: [255, 255, 255]
});
```

## Methods

### constructor

The constructor for the `PhongMaterial` class. Use this to create a new `PhongMaterial`.

```js
const phongMaterial = new PhongMaterial({ambient, diffuse, shininess, specularColor});
```

* `ambient` - (*number*,) Ambient light reflection ratio, default value is `0.4`.
* `diffuse` - (*number*) Diffuse light reflection ratio, default value is `0.6`.
* `shininess` - (*number*) Parameter to control specular highlight radius, default value is `32`.
* `specularColor` - (*array*) Color applied to specular lighting, default value is `[30, 30, 30]`.
