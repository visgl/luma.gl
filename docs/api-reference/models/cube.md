# Cube

Create a white cube model. Inherits methods from [`Model`](/docs/api-reference/core/model.md)

## Usage

```js
var whiteCube = new Cube(gl, {
      colors: [1, 1, 1, 1]
    });
```

## Method

### constructor

Creates a Cube model. Inherits methods from [`Model`](/docs/api-reference/core/model.md).


Use this to create a new Cube. Accepts the same properties and options as Model constructor but has preset for `vertices`, `normals` and `indices`.

`var model = new Cube(gl, options);`
