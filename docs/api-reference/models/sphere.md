# Sphere

Creates a sphere model. Inherits methods from [`Model`](/docs/api-reference/core/model.md).

## Usage

Create a white Sphere of radius 2
```js
var whiteSphere = new Sphere(gl, {
  radius: 2,
  colors: [1, 1, 1, 1]
});
```

## Method

### constructor

The constructor for the Sphere class. Use this to create a new Sphere.

`var model = new Sphere(gl, options);`

* nlat - (*number*, optional) The number of vertices for latitude. Default's 10.
* nlong - (*number*, optional) The number of vertices for longitude. Default's 10.
* radius - (*number*, optional) The radius of the sphere. Default's 1.
