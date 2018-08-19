# RFC: GLSL 3.00 ES Shader Transpilation

* **Authors**: Ib Green
* **Date**: Jun 2018
* **Status**: Early Draft


## Summary

This RFC proposes extending the shadertools shader assembler with code transforms that allow GLSL 3.00 ES shader code to be transformed into WebGL 1.00 ES compatible code.


## Motivation

A clean API for attribute management is one of the most important design goals of luma.gl.


## Overview

WebGL2 claims to be almost 100% backwards compatible with WebGL1. While this can be true for the JavaScript side of the API (at least assuming one disregards the complications posed by use of WebGL extensions), it is certainly not true for the GLSL shader language.

If one wishes to use GLSL 3.00 features in a shader, one has to make modifications to the shader so that it no longer runs on GLSL 1.00 code.

For a small monolithic shader it may be less of an issue (e.g. if you need WebGL2 features, use GLSL 3.00, otherwise GLSL 1.00) but if the goal is to create reusable shader code that can run under both WebGL1 and WebGL2 and both in GLSL 1.00 and GLSL 3.00 shaders, then there are problems.


### Textual replacement

The required modifications are very simple, and can mostly be done by a (fairly) simple series of textual replacements, as detailed in the proposal below.


### Fragment Shader Outputs

The major complication is related to fragment shader outputs, that use built-in `gl_fragColor`/`gl_fragData[]` variables in GLSL 1.00, but must be declared as variables in GLSL 3.00. And any variable starting with `gl_` is reserved, so names must be changed.


## Proposal

* Shader Assembler knows the target version of GLSL.
* It applies as series of regular expressions (different between vertex and fragment shader) to replace basic constructs.
* Users will need to avoid WebGL2 constructs if they wish their shaders to compile


### Testing

to make sure shader modules work in both environments an automated testing system should be developed.

A shader module might want to declare minimum supported version, so that the tests can autodiscover what it needs to test.


```
const module = {
  fs,
  vs,
  ...,
  version: 300 // Needs at least GLSL 3.00 ES.
}

`version` is assumed to be 100 if not specified.


### Table of replacements

#### Converting from GLSL 3.00 to 3.00

To enable portable code to be written, we must allow some non-conformant code in GLSL 3.00.

Most importantly, `texture` in GLSL 3.00 might translate to either `texture2D` or `textureCube` in GLSL 1.00. Therefor we allow `textureCube` to be used in GLSL 3.00 code but automatically change it to `texture`.


#### Converting from GLSL 3.00 to 1.00

Vertex Shader

* `in` -> `attribute` - only beginning of line
* `out` -> `varying` - only beginning of line

Fragment Shader

* `in` -> `varying` - only beginning of line
* `out` -> `gl_fragColor/gl_fragData[]` - only beginning of line, remove declaration

Common

* `texture` -> `texture2D`


### Converting from GLSL 1.00 to 3.00

Vertex Shader

* `attribute` -> `in` - can be done with macro
* `varying` -> `out` - can be done with macro

Fragment Shader

* `varying` -> `out` - only beginning of line
* `out` -> `gl_fragColor/gl_fragData[]` - only beginning of line, remove declaration, if multiple `out`s use gl_fragData

Common

* `texture2D` -> `texture`
* `textureCube` -> `texture`


## Alternatives Considered

### Using Macros

An appealing solution could be to simply inject a prologue of macros, like

```
// Auto-injected VERTEX SHADER prologue with GLSL 3.00 to GLSL 1.00 mappings
#define in attribute
#define out varying

// users vertex shader GLSL code
```

However the keywords in question can arise in other places, which would break compilation:

```
vec2 project(vec2 p, out float z) { ... }
```


### Full parsing/tokenization of GLSL

Some systems like glslify perform a complete parse of the GLSL code. This is considered unncessarily heavy and fragile at this stage, and will be avoided until stronger reasons make it necessary.
