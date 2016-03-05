    //object attributes
    attribute vec3 position;
    attribute vec3 normal;
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
    //reflection / refraction configuration
		uniform bool useReflection;
    //varyings
		varying vec3 vReflection;
    varying vec4 vNormal;
    varying vec3 lightWeighting;

    void main(void) {
      vec4 mvPosition = worldMatrix * vec4(position, 1.0);
      vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);
      //lighting code 
      lightWeighting = vec3(1.0, 1.0, 1.0);
      //refraction / reflection code
      vReflection = (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;
      //pass results to varyings
      vNormal = transformedNormal;
      gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);
    }
