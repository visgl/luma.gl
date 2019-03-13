# RFC: Dynamic Shader Regeneration

Being able to specify props that affect the shader source code means that either:
* Changes to these props need to be detected, shaders recompiled and programs relinked
* Or we need to specify in documentation that shaders are only generated on creation

Apart from the work/extra complexity required to accurately detect when shaders should be recompiled, the big issue is that recompilation and relinking of GLSL shaders tends to be slow (sometimes extremely slow, as in several seconds, or even half a minute or more) and happens synchronously on the main WebGL thread, freezing all rendering or even the entire app.

If we support dynamic recompilation of shaders based on changing props, we therefore need to be extra careful to avoid (and detect/warn for) "spurious" recompiles. The user might not realize that the supplied props are triggering constant recompiles causing app performance to crater.

For ideas around working around slow shader compilation, see:
* [Deferring linking till first draw](http://toji.github.io/shader-perf/)
* [KHR_parallel_shader_compile extension](https://www.khronos.org/registry/webgl/extensions/KHR_parallel_shader_compile/)
* [KHR_parallel_shader_compile discussion](https://github.com/KhronosGroup/WebGL/issues/2690)
* [Intel webGL 2018 presentation](https://docs.google.com/presentation/d/1qeD2xio2dgkqWGQucZs6nezQPePOM4NtV9J54J7si9c/htmlpresent) search for KHR_parallel_shader_compile


