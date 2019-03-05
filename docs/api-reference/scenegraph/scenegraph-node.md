# ScenegraphNode

The `ScenegraphNode` is a base class for objects in the luma.gl scene graph, such as `Model`, `Group` and `Camera`. It holds the transformation matrix (i.e. the position, orientation and scale) of the object.


## Usage

`ScenegraphNode` is a base class, normally only instantiated via base classes.

```
const model = new Model();
model
  .setPosition([0, 1, 2])
  .update();
```



## Properties

A Model instance has a number of public properties that can be accessed/modified:

* `position` (*object*) - A `Vector3` indicating the position of the Model.
* `rotation` (*object*) - A `Vector3` indicating the rotation of the Model.
* `scale` (*object*) - A `Vecto3` indicating the scaling of the Model.
* `matrix` (*object*) - A `Matrix4` containing information about position, rotation and scale.

This matrix gets updated each time the method `update` is called on a Model instance.


## Properties

### matrix (`Number[16]`)

The model matrix of this scenegraph node.


## Methods

### constructor(props : Object)

```
var node = new Model(gl, props);
```


### setProps(props: Object)

* `position` (`Number[3]`) - Sets the position part of the matrix
* `rotation` (`Number[3]`) - Sets the rotation part of the matrix
* `scale` (`Number[3]`) - Sets the scale part of the matrix


Note that setting orientation props does not actually update the object's matrix. `update()` must be called.


### update() - DEPRECATED

Update the model matrix. Useful to update changes to the `position`, `rotation` or `scale` properties.

```
node.update();
```


## Remarks

* Before luma.gl v7, `ScenegraphNode` was called `Object3D`.
