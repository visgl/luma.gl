    #ifdef GL_ES
    precision highp float;
    #endif
    //varyings
    varying vec4 vColor;
    varying vec4 vPickingColor;
    varying vec2 vTexCoord;
    varying vec3 lightWeighting;
    varying vec4 vNormal;
    //picking configs
    uniform bool enablePicking;
    uniform bool hasPickingColors;
    uniform vec3 pickColor;

    uniform vec4 colorUfm;

    void main(){
      //set color from texture
      gl_FragColor = vec4(colorUfm.rgb * lightWeighting, colorUfm.a);
      //set picking
      if (enablePicking) {
        if (hasPickingColors) {
          gl_FragColor = vPickingColor;
        } else {
          gl_FragColor = vec4(pickColor, 1.0);
        }
      }

    }

