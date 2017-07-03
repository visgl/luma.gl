# IcoSphere

Creates a Sphere model by subdividing an Icosahedron. Inherits methods from [Model](Model).

Create a white IcoSphere of radius 1.

```js
var whiteSphere = new IcoSphere({
  iterations: 1,
  colors: [1, 1, 1, 1]
});
```

The constructor for the IcoSphere class. Use this to create a new IcoSphere.

`var model = new IcoSphere({iterations=});`

* iterations=0 - (*number*, optional) The number of iterations used to subdivide the Icosahedron.
