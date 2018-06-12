# Programs and Shaders

A `Program` serves the following main purposes:

* Linking (vertex and fragment) shader programs, and extracting information about attributes and uniforms from the linker.
* Storing uniforms
* Running the linked shaders against the stored uniforms and the passed in `VertexArray` and `TransformFeedback` objects.


The `Program` constructor always links shaders and queries the linkers output to extract an "attribute configuration map". This attribute configuration map can be transferred to `VertexArray` and `TransformFeedback` objects which allows those objects to accept the names of shader `in` and `out` parameters instead of numeric location indices.


The `Program.draw` call runs the shader with the desired input.


## Running Programs

The way to execute anything on the GPU happens through calls to `Program.draw()`, which runs the programs. Running the program (i.e the shaders) is customarily referred to as a "draw call", but does not necessarily draw anything on the screen.


## Configuring Vertex Attributes

`VertexArray` objects allow the user to store a set of buffer bindings / constants that specify what values the various vertex shader `in` parameters (also known as "attributes") will have during a draw call.

`VertexArray` objects need to be configured to precisely match the expectations of linked program, and the details of this configuration are rather technicakl and tedious (includes a unique integer index/location for each attribute, as well as type and size information).

The good news is `VertexArray` objects can read the required configuration from a `Program` instance. The `Program` constructor reads the name and types of attributes which becomes available immediately after compiling and linking the shaders.


```
const program = new Program();
const vertexArray = new VertexArray(gl, {program});
...
program.draw({vertexArray, ...});
```

Once configured, `VertexArray` objects can be manipulated independently of the program. And you can create multiple `VertexArray` objects that can be used with your program, and these `VertexArray` object can also be used with other programs (as long as they are created with identical parameters, i.e. same shaders etc).

```
const program = new Program(gl, {fs: FS, vs: VS});
const vertexArray1 = new VertexArray(gl, {program});
const vertexArray2 = new VertexArray(gl, {program});
const vertexArray3 = new VertexArray(gl, {program});
...
program.draw({vertexArray: vertexArray1, ...});
program.draw({vertexArray: vertexArray2, ...});
program.draw({vertexArray: vertexArray3, ...});

const program2 = new Program(gl, {fs: FS, vs: VS});
program2.draw({vertexArray: vertexArray1, ...});
```

## Configuring TransformFeedback outputs

TransformFeedback objects work very similarly to `VertexAttribute` objects

```
const program = new Program();
const vertexArray = new VertexArray(gl, {program});
const transformFeedback = new TransformFeedback(gl, {program});
...
program.draw({vertexArray, transformFeedback...});
```

Just as with `VertexAttributes`, you can create multiple `TransformFeedback` objects for each program, and use them with any program built from (exactly) the same shaders.


## Storing Uniforms

To store new uniform values, `Program.setUniforms()` should be called with a uniforms object map. The uniform values

The `Program.draw()` class accepts a uniforms object (map), which will set (i.e. store) the supplied uniforms on the `Program` just before drawing (and leave them set!).

Setting uniforms in each draw call does allow for a very attractive "functional" programming style but for very draw call intensice programs it can slightly impact performance. For uniforms that change with each draw call, we don't have a choice, but for other uniforms it can be slightly more performance to set them outside of the render loop.

Examples could be a `time` uniform that updates every frame, versus a `scale` uniform that changes only when the user manipulates a control in the application's user interface.


## Debugging Programs

Getting all data properly configured before calling `Program.draw()` is key to correct exection. The result of mistakes is often just silent failure and black screens, and there are precious few ways to debug what has gone wrong. Because of this, luma.gl provides extensive validation and logging support, for more information see the [debugging]() article.


## Remarks

There is a cost to updating uniforms. As a general guide, this cost should be considered quite small, but not completely free, and can compound when drawing many programs each with many uniforms. The cost is partly (but not completely) reduced since the `Program` class may do comparisons on uniform values before setting them to avoid unnecessary WebGL uniform updates.

The fact that uniforms are stored on the program object (as opposed in a separate "uniform bank" object) is sometimes considered a design flaw in WebGL and OpenGL. Just like it is convenient to be able to use separate `VertexArray`s or `TransformFeedback` objects with the same program, it would be nice to be able to use separate uniform banks to quickly switch between different sets of uniforms. In WebGL1 one must create multiple program instances to store multipe uniform sets. In WebGL2 "uniform buffers" can somewhat compensate for the limitation, although they are not nearly as easy to use as the basic uniform API.



