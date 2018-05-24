# Cylinder

Creates a cylinder model. Inherits methods from [`Model`](/docs/api-reference/core/model.md).


## Usage

Create a white Cylinder of radius 2 and height 3.

```js
var whiteCylinder = new Cylinder(gl, {
  radius: 2,
  height: 3,
  colors: [1, 1, 1, 1]
});
```

## Method

### constructor

The constructor for the Cylinder class. Use this to create a new Cylinder.

`var model = new Cylinder(gl, options);`

* nradial - (*number*, optional) The number of vertices for the disk. Default's 10.
* nvertical - (*number*, optional) The number of vertices for the height. Default's 10.
* verticalAxis - (*string*) The axis along which the height is measured. One of `x`, `y`, `z`. Default `y`.
* radius - (*number*) The radius of the cylinder.
* topCap - (*boolean*, optional) Whether to put the cap on the top of the cylinder. Default's false.
* bottomCap - (*boolean*, optional) Whether to put the cap on the bottom
  part of the cylinder. Default's false.
