export default `\
struct AmbientLight {
 vec3 color;
 float intensity;
};

struct PointLight {
 vec3 color;
 float intensity;
 vec3 position;
};

struct DirectionalLight {
  vec3 color;
  float intensity;
  vec3 direction;
};

uniform AmbientLight lighting_uAmbientLight;
uniform PointLight lighting_uPointLight[MAX_LIGHTS];
uniform DirectionalLight lighting_uDirectionalLight[MAX_LIGHTS];
uniform int lighting_uPointLightCount;
uniform int lighting_uDirectionalLightCount;

uniform bool lighting_uEnabled;
`;
