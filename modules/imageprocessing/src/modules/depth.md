# depth (Shader Module, Experimental)

Helps working with depth buffer values.


## Defines

* `DEPTH_PACKING` == 3200
* `USE_LOGDEPTHBUF`


## Uniforms

uniform bool depth_uEnabled;
uniform float opacity;
uniform float logDepthBufFC; (`USE_LOGDEPTHBUF`)


## Methods


### float depth_getDepth(sampler2D tDepth, vec2 coord)

Samples depth buffer and convert to float

Handles logarithmic depth buffers (`USE_LOGDEPTHBUF`).


### vec4 depth_getColor()

Returns the depth value of the current fragment

#if DEPTH_PACKING == 3200
  return vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );
#elif DEPTH_PACKING == 3201
  return pack_FloatToRGBA( gl_FragCoord.z );
#endif
}

### vec4 depth_filterColor(vec4 color)



## Methods (WIP)

### depth_viewZToOrthographicDepth(float viewZ, float near, float far) : float

* float invClipZ
* float near
* float far

NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions


### depth_orthographicDepthToViewZ(float linearClipZ, float near, float far) : float

* float linearClipZ
* float near
* float far


### depth_viewZToPerspectiveDepth(float viewZ, float near, float far) : float

* float viewZ
* float near
* float far


### depth_perspectiveDepthToViewZ(float invClipZ, float near, float far) : float

* float invClipZ
* float near
* float far



