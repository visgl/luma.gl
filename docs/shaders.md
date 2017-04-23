---
layout: docs
title: Shaders
categories: [Documentation]
---

## Shader Module System

Core Requirements
* Support modules exporting
* Support dynamic registry of GLSL modules with dependencies (per vertex and fragment)
* Resolve dependency graphs.

Long Term Requirements
* Eventually support dynamic composition.

Optional Requirements
* Support 'interfaces' - set of functions expected from module (e.g. lighting)
* Several concrete modules could implement an interface.
* App shaders can be written towards an interface, app can change implementation
  module easily.

References
* [deck.gl assembleShaders](https://github.com/uber/deck.gl/blob/master/src/shader-utils/assemble-shaders.js)
* [shadergraph](https://github.com/unconed/shadergraph)
  + Graph structure
  - Coffee Script
  - Hard to understand?
* [glslify](https://github.com/stackgl/glslify)
  + supports import statements in GLSL code.
  + Supports node modules, shader-name etc
  - One function per import
  - Renames uniforms and secondary functions
* [Per file parsing of shader errors](http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/#shader-problems)
  - Our import system could track files and generate correct line numbers!

## GPGPU Computing

References:
* [GPU Gems Article](http://http.developer.nvidia.com/GPUGems/gpugems_ch37.html)

* Handle a number of cases (set up arrays as textures, clip space rectangles)
* Blend modes for accumulate
* Reduction algorithms for e.g. Max and Min.
* WebGL2, transform feedback, disable rasterizers etc.
* Perf tests, based on Query class, vs JavaScript counterparts.


Object: Shaders {#Shaders}
===============================

An object that contains default shaders that could be used with the
[Scene](scene.html) class. Only one vertex shader and one fragment
shader are shipped in this object. This is so because we encourage
having shaders in separate files and access them in
an asynchronous way by using `makeProgramFromShaderURIs` and other methods available in the Framework. You can set shader strings
into `Shaders.Vertex` and `Shaders.Fragment`. We provide a default vertex and fragment shader in `Shaders.Vertex.Default` and
`Shaders.Fragment.Default`. These shaders can also be conveniently used with `makeProgramFromDefaultShaders(vertexShaderName, fragmentShaderName)`.


Shaders Object: Vertex {#Shaders:Vertex}
--------------------------------------

Append in this object vertex shaders to be used with a [Scene](scene.html). We provide `Shaders.Vertex.Default` which is the
default shader used in the library. You can find more scene compatible shaders
[here](https://github.com/uber/luma.gl/tree/master/shaders).
In order to get familiar with the attributes and uniforms used by the [Scene](scene.html) we provide the default vertex shader code:

    #define LIGHT_MAX 4
    //object attributes
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec4 color;
    attribute vec4 pickingColor;
    attribute vec2 texCoord1;
    //camera and object matrices
    uniform mat4 viewMatrix;
    uniform mat4 viewInverseMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 viewProjectionMatrix;
    //objectMatrix * viewMatrix = worldMatrix
    uniform mat4 worldMatrix;
    uniform mat4 worldInverseMatrix;
    uniform mat4 worldInverseTransposeMatrix;
    uniform mat4 objectMatrix;
    uniform vec3 cameraPosition;
    //lighting configuration
    uniform bool enableLights;
    uniform vec3 ambientColor;
    uniform vec3 directionalColor;
    uniform vec3 lightingDirection;
    //point lights configuration
    uniform vec3 pointLocation[LIGHT_MAX];
    uniform vec3 pointColor[LIGHT_MAX];
    uniform int numberPoints;
    //reflection / refraction configuration
    uniform bool useReflection;
    //varyings
    varying vec3 vReflection;
    varying vec4 vColor;
    varying vec4 vPickingColor;
    varying vec2 vTexCoord;
    varying vec4 vNormal;
    varying vec3 lightWeighting;

    void main(void) {
      vec4 mvPosition = worldMatrix * vec4(position, 1.0);
      vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);
      //lighting code
      if(!enableLights) {
        lightWeighting = vec3(1.0, 1.0, 1.0);
      } else {
        vec3 plightDirection;
        vec3 pointWeight = vec3(0.0, 0.0, 0.0);
        float directionalLightWeighting = max(dot(transformedNormal.xyz, lightingDirection), 0.0);
        for (int i = 0; i < LIGHT_MAX; i++) {
          if (i < numberPoints) {
            plightDirection = normalize((viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);
            pointWeight += max(dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];
          } else {
            break;
          }
        }

        lightWeighting = ambientColor + (directionalColor * directionalLightWeighting) + pointWeight;
      }
      //refraction / reflection code
      if (useReflection) {
        vReflection = (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;
      } else {
        vReflection = vec3(1.0, 1.0, 1.0);
      }
      //pass results to varyings
      vColor = color;
      vPickingColor = pickingColor;
      vTexCoord = texCoord1;
      vNormal = transformedNormal;
      gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);
    }


### Syntax:

	LumaGL.Shaders.Vertex.MyName = shaderCode;

### Examples:

See the example on how to extend the fragment shader object below.


Shaders Object: Fragment {#Shaders:Fragment}
-----------------------------------------

Append in this object fragment shaders to be used with a [Scene](scene.html). We provide `Shaders.Fragment.Default` which is the
default shader used in the library. You can find more scene compatible shaders [here](https://github.com/philogb/philogl/tree/master/shaders).
In order to get familiar with the attributes and uniforms used by the [Scene](scene.html) we provide the default fragment shader code:

    #ifdef GL_ES
    precision highp float;
    #endif
    //varyings
    varying vec4 vColor;
    varying vec4 vPickingColor;
    varying vec2 vTexCoord;
    varying vec3 lightWeighting;
    varying vec3 vReflection;
    varying vec4 vNormal;
    //texture configs
    uniform bool hasTexture1;
    uniform sampler2D sampler1;
    uniform bool hasTextureCube1;
    uniform samplerCube samplerCube1;
    //picking configs
    uniform bool enablePicking;
    uniform bool hasPickingColors;
    uniform vec3 pickColor;
    //reflection / refraction configs
    uniform float reflection;
    uniform float refraction;
    //fog configuration
    uniform bool hasFog;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    void main(){
      //set color from texture
      if (!hasTexture1) {
        gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);
      } else {
        gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, 1.0);
      }
      //has cube texture then apply reflection
     if (hasTextureCube1) {
       vec3 nReflection = normalize(vReflection);
       vec3 reflectionValue;
       if (refraction > 0.0) {
        reflectionValue = refract(nReflection, vNormal.xyz, refraction);
       } else {
        reflectionValue = -reflect(nReflection, vNormal.xyz);
       }
       vec4 cubeColor = textureCube(samplerCube1, vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));
       gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);
     }
      //set picking
      if (enablePicking) {
        if (hasPickingColors) {
          gl_FragColor = vPickingColor;
        } else {
          gl_FragColor = vec4(pickColor, 1.0);
        }
      }
      //handle fog
      if (hasFog) {
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = smoothstep(fogNear, fogFar, depth);
        gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
      }
    }


### Syntax:

	LumaGL.Shaders.Fragment.MyName = shaderCode;

### Examples:

Extending the Fragment Shader object to use a blending uniform. You can see the entire example in [lesson 8]http://uber.github.io/luma.gl/examples/lessons/8/).

{% highlight js %}
//Add Blend Fragment Shader
LumaGL.Shaders.Fragment.Blend = [

    "#ifdef GL_ES",
    "precision highp float;",
    "#endif",

    "varying vec4 vColor;",
    "varying vec2 vTexCoord;",
    "varying vec3 lightWeighting;",

    "uniform bool hasTexture1;",
    "uniform sampler2D sampler1;",
    "uniform float alpha;",

    "void main(){",

      "if (hasTexture1) {",

        "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, alpha);",

      "}",

    "}"

].join("\n");
{% endhighlight %}


