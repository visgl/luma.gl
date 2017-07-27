# Object3d

The Model class enables you to create 3D models which are compatible with the
[Group]() class. All primitives (Sphere, etc) inherit from Model.

## Usage

Object3d is a base class, normally used through Model or Group


## Properties

A Model instance has a number of public properties that can be accessed/modified:

* `position` (*object*) - A `Vector3` indicating the position of the Model.
* `rotation` (*object*) - A `Vector3` indicating the rotation of the Model.
* `scale` (*object*) - A `Vecto3` indicating the scaling of the Model.
* `matrix` (*object*) - A `Matrix4` containing information about position, rotation and scale.

This matrix gets updated each time the method `update` is called on a Model instance.


## Methods

### constructor

	var model = new Model(gl, options);


### update

Update the model matrix. Useful to update changes to the `position`, `rotation` or `scale` properties.

	model.update();
