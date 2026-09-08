// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// We simulate the wandering of agents using transform feedback in this vertex shader
// The simulation goes like this:
// Assume there's a circle in front of the agent whose radius is WANDER_CIRCLE_R
// the origin of which has a offset to the agent's pivot point, which is WANDER_CIRCLE_OFFSET
// Each frame we pick a random point on this circle
// And the agent moves MOVE_DELTA toward this target point
// We also record the rotation facing this target point, so it will be the base rotation
// for our next frame, which means the WANDER_CIRCLE_OFFSET vector will be on this direction
// Thus we fake a smooth wandering behavior

export const COMPUTE_VS = /* glsl */ `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1

#define M_2PI 6.28318530718

#define MAP_HALF_LENGTH 1.01
#define WANDER_CIRCLE_R 0.01
#define WANDER_CIRCLE_OFFSET 0.04
#define MOVE_DELTA 0.001
precision highp float;
precision highp int;

uniform appUniforms{
  float time;
} app;

layout(location = OFFSET_LOCATION) in vec2 oldPositions;
layout(location = ROTATION_LOCATION) in float oldRotations;

out vec2 newOffsets;
out float newRotations;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float theta = M_2PI * rand(vec2(app.time, oldRotations + oldPositions.x + oldPositions.y));
    float cos_r = cos(oldRotations);
    float sin_r = sin(oldRotations);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);

    vec2 move = normalize(rot * p);
    newRotations = atan(move.y, move.x);
    newOffsets = oldPositions + MOVE_DELTA * move;

    // wrapping at edges
    newOffsets = vec2 (
        newOffsets.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( newOffsets.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : newOffsets.x ) ,
        newOffsets.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( newOffsets.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : newOffsets.y )
        );

    gl_Position = vec4(newOffsets, 0.0, 1.0);
}
`;

export const DRAW_VS = /* glsl */ `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1
#define POSITION_LOCATION 2
#define COLOR_LOCATION 3
precision highp float;
precision highp int;
layout(location = POSITION_LOCATION) in vec2 positions;
layout(location = ROTATION_LOCATION) in float instanceRotations;
layout(location = OFFSET_LOCATION) in vec2 instancePositions;
layout(location = COLOR_LOCATION) in vec3 instanceColors;
in vec2 instancePickingColors;
out vec3 vColor;
void main()
{
    vColor = instanceColors;

    float cos_r = cos(instanceRotations);
    float sin_r = sin(instanceRotations);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );
    gl_Position = vec4(rot * positions + instancePositions, 0.0, 1.0);
    picking_setPickingColor(vec3(0., instancePickingColors));
}
`;

export const DRAW_FS = /* glsl */ `\
#version 300 es
#define ALPHA 0.9
precision highp float;
precision highp int;
in vec3 vColor;
out vec4 fragColor;
void main()
{
    fragColor = vec4(vColor * ALPHA, ALPHA);
    fragColor = picking_filterColor(fragColor);
}
`;
