---
layout: docs
title: addons
categories: [Documentation]
---

makeProgramFromShaderURIs {#makeProgramFromShaderURIs}
-----------------------------------------------------------------

Creates a new program by asynchronously fetching the source contained
in the files pointed by the given urls. This method is enables you to
write your shaders in separate files and keep your project organized.

### Syntax:

	LumaGL.addons.makeProgramFromShaderURIs(options);

### Arguments:

1. options - (*object*) An object with the following properties:

### Options:

* path - (*string*, optional) A common path used as prefix for the vertex and fragment shaders url path.
* vs - (*string*) The path to the vertex shader source file.
* fs - (*string*) The path to the fragment shader source file.
* noCache - (*boolean*, optional) If true, files will be reloaded and not taken
  from the cache. Useful on development phase. Default's `false`.
* onSuccess - (*function*) A callback function executed when the program was successfully created. The
first argument of the function is the `Program` instance.
* onError - (*function*) A callback function executed when there's an error while fetching/compiling the shaders.

### Examples:

Create a Program from the given script files.

In `shaders/fragment.glsl`

    #ifdef GL_ES
    precision highp float;
    #endif

    void main(void) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

In `shaders/vertex.glsl`

    attribute vec3 aVertexPosition;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main(void) {
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }

JavaScript code:

{% highlight js %}
LumaGL.makeProgramFromShaderURIs({
  path: 'shaders/',
  vs: 'vertex.glsl',
  fs: 'fragment.glsl',
  onSuccess: function(program) {
    alert("Got the program!");
  },
  onError: function(e) {
    alert("An error ocurred while fetching or compiling the shaders");
  }
});
{% endhighlight %}


makeProgramFromShaderIds {#makeProgramFromShaderIds}
---------------------------------------------------------------

Creates a new program by fetching the source contained into the DOM scripts
with ids provided in the method.

### Syntax:

	var program = LumaGL.Program.fromShaderIds(vertexShaderId, fragmentShaderId);

### Arguments:

1. vertexShaderId - (*string*) The id of the script tag containig the source code for the vertex shader.
2. fragmentShaderId - (*string*) The id of the script tag containig the source code for the fragment shader.

### Examples:

Create a Program from the given script ids.

HTML code:

{% highlight html %}
<script id="shader-fs" type="x-shader/x-fragment">
  #ifdef GL_ES
  precision highp float;
  #endif

  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
</script>

<script id="shader-vs" type="x-shader/x-vertex">
  attribute vec3 aVertexPosition;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
</script>
{% endhighlight %}

JavaScript code:

{% highlight js %}
var program = LumaGL.Program.fromShaderIds('shader-vs', 'shader-fs');
{% endhighlight %}


makeProgramFromDefaultShaders {#makeProgramFromDefaultShaders}
------------------------------------------------------------------------

Creates a new program by using the sources taken from [Shaders.Vertex](shaders.html#Shaders:Vertex) and
[Shaders.Fragment](shaders.html#Shaders:Fragment).

### Syntax:

  var program = LumaGL.Program.fromShaderIds(vertexDefaultShaderId, fragmentDefaultShaderId);

### Arguments:

1. vertexDefaultShaderId - (*string*, optional) The vertex shader id from [Shaders.Vertex](shaders.html#Shaders:Vertex). Default's `Default`.
2. fragmentShaderSource - (*string*) The fragment shader id from [Shaders.Fragment](shaders.html#Shaders:Fragment). Default's `Default`.

### Examples:

Extend [Shaders.Fragment](shaders.html#Shaders:Fragment) with a default shader and create a Program from defaults.
Taken from [lesson 8]http://uber.github.io/luma.gl/examples/lessons/8/) example.

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

var program = LumaGL.addons.makeProgramFromDefaultShaders('Default', 'Blend');

{% endhighlight %}

### Notes:

For more information about the default shader code `Default` included in the Framework take a look at the [Shaders](shaders.html) script.
