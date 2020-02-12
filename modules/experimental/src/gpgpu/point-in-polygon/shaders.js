export const POLY_TEX_VS = `\
uniform vec4 boundingBoxOriginSize; //[xMin, yMin, xSize, ySize]
attribute vec2 a_position;
attribute float a_polygonID;
varying vec4 v_polygonColor;
void main()
{
    // translate from bbox to NDC
    vec2 pos = a_position - boundingBoxOriginSize.xy;
    pos = pos / boundingBoxOriginSize.zw;
    pos = pos * 2.0 - vec2(1.0);
    gl_Position = vec4(pos, 0.0, 1.0);
    v_polygonColor = vec4(a_polygonID, 1.0, 1.0, 1.0);
}
`;

export const FILTER_VS = `\
#version 300 es
in vec2 a_position;
out vec2 filterValueIndex; //[x: 0 (outside polygon)/1 (inside), y: position index]
void main()
{
  filterValueIndex = textureFilter_filter(a_position);
}
`;
