export default `\
#define MAX_LIGHTS 5

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
 
uniform AmbientLight lighting_ambientLight;
uniform PointLight lighting_pointLight[MAX_LIGHTS];
uniform DirectionalLight lighting_directionalLight[MAX_LIGHTS];
uniform int lighting_pointLightCount;
uniform int lighting_directionalLightCount;

uniform float lighting_ambient;
uniform float lighting_diffuse;
uniform float lighting_shininess;
uniform vec3  lighting_specularColor;

uniform bool lighting_enabled;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, float intensity) {
    vec3 halfway_direction = normalize(light_direction + view_direction);
    float lambertian = dot(light_direction, normal_worldspace);
    float specular = 0.0;
    if (lambertian > 0.0) {
      float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
      specular = pow(specular_angle, lighting_shininess);
    }
    lambertian = max(lambertian, 0.0);
    return (lambertian * lighting_diffuse * surfaceColor + specular * lighting_specularColor) * intensity;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (lighting_enabled) {
    vec3 camera_pos_worldspace = project_uCameraPosition;
    vec3 view_direction = normalize(camera_pos_worldspace - position_worldspace);
    vec3 lightColor = lighting_ambient * surfaceColor * lighting_ambientLight.intensity;

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_pointLightCount) {
        break;
      }
      PointLight pointLight = lighting_pointLight[i];
      vec3 light_position_worldspace = pointLight.position;
      vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
      lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.intensity);
    }

    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= lighting_directionalLightCount) {
        break;
      }
      DirectionalLight directionalLight = lighting_directionalLight[i];
      lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.intensity);
    }
  }
  return lightColor;
}
`;
