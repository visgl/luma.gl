# RFC: GLSL Function Replacement And Attribute Injection

* Authors: Ib Green
* Date: March 2019
* Status: **Draft**

This RFC is part of the [shadertools roadmap](dev-docs/roadmaps/shadertools-roadmap.md).


## Summary

This RFC proposes a system for shader module users to replace GLSL functions (by supplying a map of function names to strings fragments of GLSL code) as well as injecting new attributes and uniforms.

This supports use case such as:
* Completely or partially skip CPU side attribute generation
* Work directly on supplied binary data (e.g. binary tables).
* Do additional GPU processing on data, allowing performant custom effects.


## Overview

Let's start with a couple of API examples to illustrate what we want to achieve:


### API Example: Using Columnar Binary Data Sirectly

Columnar binary data systems (like Apache arrow) will often store primitive values (e.g. a Float32) in separate columns, rather than as a `vec2` or `vec3`. This means that even if we exposed these columns as attributes in GLSL, we cannot use them directly as the expected `vec3` attribute for positions. However, if we could just define a snippet of GLSL code to override how the shader extracs a position from attributes (`getPosition`), we could still use these values rather than pre-processing them in JavaScript:

```
new Model({
  vs,
  fs,

  // inject new attributes
  glsl: {
    attributes: {
      x: 'float',
      y: 'float'
    },
  },

  // Define a custom glsl accessor (string valued accessor will be treated as GLSL)
  getPosition: 'return vec3(x, y, 0.);',

  // Supply values to the injected attributes
  attributes: {
    x: new Float32Array(...),
    y: new Float32Array(...)
  },
})
```

The input vertex shader would be defined as follows:

```
in vec3 instancePosition;

// Shadertools would e.g. do a line-based replacement of getPosition
vec3 getPosition() { return instancePosition; }

main() {
  const position = getPosition();
  // Note: shader does not assume that `position = instancePositions`, but calls an overridable GLSL function!
}
```

Shadertools would resolve this to:

```
in vec3 instancePosition; // Note: no longer used, would be nice if this could be removed but not critical.

in float x;
in float y;

// Shadertools has done a line-based replacement of getPosition
vec3 getPosition() { return vec3(x, y, 0.);; }

main() {
  const position = getPosition();
  // Note: layer no longer assumes `position = instancePositions`, but calls overridable GLSL function
}
```


### API Example: Adapting Data to fit layer's Requirement

Let's say that we load binary data for a point cloud that only contains a single value per point (e.g. `reflectance`), but the shader we want to use only supports specifying an RGBA color per point. While we could certainly write a JavaScript function to generate a complete RGBA color array attribute, this extra time and memory could be avoided:

```
new Model({
  vs: POINT_CLOUD_VS,
  fs: POINT_CLOUD_FS,

  // inject new attributes and uniforms
  glsl: {
    attributes: {
   	  reflectance
    },
    uniforms: {
   	  alpha
    }
  },

  // Define a custom glsl accessor (string valued accessor will be treated as GLSL)
  getColor: 'return vec4(reflectance, reflectance, reflectance, alpha);',

  // Supply actual values to the injected attributes and uniforms
  attributes: {
    reflectance: new Float32Array(...)
  },
  uniforms: {
    alpha: 0.5
  }
})
```


## Design Discussions

### Shader Buy-In

While it might be possible to use the function replacement system to replace of arbitrary functions in a shader, this can lead to brittle overrides as the base shader is updated.

The ideal setup is one where the shader is written with the intention of having certain functions be overridable. Often, the readout of attributes would be a typical place to add an overridable function, allowing the shader to be used with different attributes.

Apart from attribute access, a shader could potentially define additional overridable functions that it would call at the right moments. These would then normally be separately documented.


## Open Issues

### Naming Conflicts

Define/reinforce naming conventions/prefixes for GLSL functions and variables in shader code to maximize predictability/minimize conflicts with user's GLSL accessor code.

Since we do not have a true syntax aware parser/string replacement system we also risk replacing unrelated strings. This risk is becoming bigger the more extensive our shader replacement support becomes.


### Fragment Shader Support

This RFC as written does not offer any way for users to modify fragment shaders.

If it is desirable to offer the ability to redefine GLSL functions in the fragment shader, the GLSL accessor system outlined in this system does not extend well.
* attributes are not available in the fragment shader, and such data needs to be explicitly plumbed through as `varyings` that "eat into" a very limited bank (often only 8 varyings or `vec4`s).
* It may be necessary to implement a "varying compressor" and additonal props with more complicated semantics to describe the data flow.
Naturally, if user-defined GLSL functions in the fragment shaders can only use the data already available, the system should be simpler.
