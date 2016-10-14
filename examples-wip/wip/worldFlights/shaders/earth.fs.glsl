#ifdef GL_ES
precision highp float;
#endif

#define LIGHT_MAX 2

varying vec2 vTexCoord1;
varying vec2 vTexCoord2;
varying vec2 vTexCoord3;
varying vec4 vColor;
varying vec4 vTransformedNormal;
varying vec4 vEndTransformedNormal;
varying vec4 vPosition;
varying vec4 vEndPosition;

uniform float shininess;

uniform vec3 ambientColor;
uniform vec3 directionalColor;
uniform vec3 lightingDirection;

uniform vec3 pointLocation[LIGHT_MAX];
uniform vec3 pointColor[LIGHT_MAX];
uniform vec3 pointSpecularColor[LIGHT_MAX];
uniform int numberPoints;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform bool hasTexture2;
uniform sampler2D sampler2;

uniform bool hasTexture3;
uniform sampler2D sampler3;

uniform mat4 viewMatrix;

uniform float renderType;

void main(void) {
  vec3 lightWeighting;
  if (renderType >= 0.0) {
    lightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    vec3 lightDirection;
    float specularLightWeighting = 0.0;
    float diffuseLightWeighting = 0.0;
    vec3  specularLight = vec3(0.0, 0.0, 0.0);
    vec3  diffuseLight = vec3(0.0, 0.0, 0.0);

    vec3 transformedPointLocation;
    vec3 normal = vTransformedNormal.xyz;

    vec3 eyeDirection = normalize(-vPosition.xyz);
    vec3 reflectionDirection;

    vec3 pointWeight = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < LIGHT_MAX; i++) {
      if (i < numberPoints) {
        transformedPointLocation = (viewMatrix * vec4(pointLocation[i], 1.0)).xyz;
        lightDirection = normalize(transformedPointLocation - vPosition.xyz);
        reflectionDirection = reflect(-lightDirection, normal);
        specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
        specularLight += specularLightWeighting * pointSpecularColor[i];

        diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
        diffuseLight += diffuseLightWeighting * pointColor[i];
      } else {
        break;
      }
    }
    lightWeighting = ambientColor + diffuseLight + specularLight;
  }

  vec4 fragmentColor = vec4(renderType, renderType, renderType, 1.0);
  if (renderType < 0.0) {
    fragmentColor = texture2D(sampler1, vec2(vTexCoord1.s, vTexCoord1.t));
  }
  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, 1.0);
}
