#ifdef GL_ES
precision highp float;
#endif

#define PI 3.141592654
#define PI2 (3.141592654 * 2.)

#define PATTERN_DIM 128.0

#define GROUP_P1 0
#define GROUP_P2 1
#define GROUP_PM 2
#define GROUP_PG 3
#define GROUP_CM 4
#define GROUP_PMM 5
#define GROUP_PMG 6
#define GROUP_PGG 7
#define GROUP_CMM 8
#define GROUP_P4 9
#define GROUP_P4M 10
#define GROUP_P4G 11
#define GROUP_P3 12
#define GROUP_P3M1 13
#define GROUP_P31M 14
#define GROUP_P6 15
#define GROUP_P6M 16

#define EPSILON 0.000001

uniform int group;
uniform float offset;
uniform float rotation;
uniform vec2 scaling;
uniform vec2 resolution;
uniform float radialFactor;
uniform float hyperbolic;
uniform vec4 background;

uniform sampler2D sampler1;

//Groups
vec2 p1(float xt, float yt) {
  float oyt = yt;
  yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;
  float widthDim = PATTERN_DIM - offset;
  float from  = offset / PATTERN_DIM * yt;
  float to = 1. - offset * (1. - yt) / PATTERN_DIM;
  xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;
  return vec2(xt, yt);
}

vec2 p2(float xt, float yt) {
  float widthDim = PATTERN_DIM - offset;
  float oyt = yt;
  if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
    yt = mod(yt, PATTERN_DIM) / PATTERN_DIM;
    float from  = offset / PATTERN_DIM * yt;
    float to = 1. - offset * (1. - yt) / PATTERN_DIM;
    xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;
  } else {
    yt = 1. - mod(yt, PATTERN_DIM) / PATTERN_DIM;
    float from  = 1. - offset / PATTERN_DIM * (1. - yt);
    float to = offset * yt / PATTERN_DIM;
    xt = mod(xt - offset * (oyt / PATTERN_DIM), widthDim) / widthDim * (to - from) + from;
  }
  return vec2(xt, yt);
}

vec2 pm(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(yt / heightDim, 2.0) < 1.0) {
    yt = mod(yt, heightDim) / heightDim * (to - from) + from;

  } else {
    yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
  }
  return vec2(xt, yt);
}

vec2 pg(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    yt = mod(yt, heightDim) / heightDim * (to - from) + from;

  } else {
    yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
  }

  xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  return vec2(xt, yt);
}

vec2 cm(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, heightDim) / heightDim;

  if (mod(yt / heightDim, 2.0) < 1.0) {
    float xfrom = (1. - ytmod) / 2.;
    float xto = ytmod / 2. + .5;

    if (xtmod > xfrom && xtmod < xto) {
      xt = xtmod;
      yt = ytmod * (to - from) + from;
    } else {
      xt = xtmod - .5;
      yt = 1. - (ytmod * (to - from) + from);
    }
  } else {
    float xfrom = ytmod / 2.;
    float xto = (1. - ytmod) * .5 + .5;

    if (xtmod > xfrom && xtmod < xto) {
      xt = xtmod;
      yt = (1. - ytmod) * (to - from) + from;
    } else {
      xt = xtmod - .5;
      yt = 1. - ((1. - ytmod) * (to - from) + from);
    }
  }
  return vec2(xt, yt);
}

vec2 pmm(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  } else {
    xt = 1. - mod(xt, PATTERN_DIM) / PATTERN_DIM;
  }

  if (mod(yt / heightDim, 2.0) < 1.0) {
    yt = mod(yt, heightDim) / heightDim * (to - from) + from;
  } else {
    yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
  }
  return vec2(xt, yt);
}

vec2 pmg(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = mod(yt, heightDim) / heightDim * (to - from) + from;
    } else {
      xt = mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    }
  } else {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      xt = 1. - mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    } else {
      xt = 1. - mod(xt, PATTERN_DIM) / PATTERN_DIM;
      yt = mod(yt, heightDim) / heightDim * (to - from) + from;
    }
  }
  return vec2(xt, yt);
}

vec2 pgg(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, heightDim) / heightDim;

  if (mod(yt / heightDim, 2.0) < 1.0) {
    float xfrom = (1. - ytmod) / 2.;
    float xto = ytmod / 2. + .5;

    if (xtmod > xfrom && xtmod < xto) {
      xt = xtmod;
      yt = ytmod * (to - from) + from;
    } else {
      xt = xtmod - .5;
      yt = 1. - (ytmod * (to - from) + from);
    }
  } else {
    float xfrom = ytmod / 2.;
    float xto = (1. - ytmod) * .5 + .5;

    if (xtmod > xfrom && xtmod < xto) {
      xt =  1. - xtmod;
      yt = (1. - ytmod) * (to - from) + from;
    } else {
      xt = (1. - xtmod) - .5;
      yt = ytmod * (to - from) + from;
    }
  }
  return vec2(xt, yt);
}

vec2 cmm(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, heightDim) / heightDim;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      if (ytmod > 1. - xtmod) {
        xt = xtmod;
        yt = ytmod * (to - from) + from;
      } else {
        xt = 1. - xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      }
    } else {
      if (ytmod < xtmod) {
        xt = xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      } else {
        xt = 1. - xtmod;
        yt = ytmod * (to - from) + from;
      }
    }
  } else {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      if (ytmod > xtmod) {
        xt = 1. - xtmod;
        yt = ytmod * (to - from) + from;
      } else {
        xt = xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      }
    } else {
      if (ytmod < 1. - xtmod) {
        xt = 1. - xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      } else {
        xt = xtmod;
        yt = ytmod * (to - from) + from;
      }
    }
  }
  return vec2(xt, yt);
}

vec2 p4(float xt, float yt) {
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      xt = xtmod;
      yt = ytmod;
    } else {
      xt = 1. - ytmod;
      yt = xtmod;
    }
  } else {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      xt = ytmod;
      yt = 1. - xtmod;
    } else {
      xt = 1. - xtmod;
      yt = 1. - ytmod;
    }
  }
  return vec2(xt, yt);
}

vec2 p4m(float xt, float yt) {
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      if (xtmod > ytmod) {
        xt = xtmod;
        yt = ytmod;
      } else {
        xt = ytmod;
        yt = xtmod;
      }
    } else {
      if (ytmod < 1. - xtmod) {
        xt = 1. - ytmod;
        yt = xtmod;
      } else {
        xt = xtmod;
        yt = 1. - ytmod;
      }
    }
  } else {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      if (ytmod < 1. - xtmod) {
        xt = 1. - xtmod;
        yt = ytmod;
      } else {
        xt = ytmod;
        yt = 1. - xtmod;
      }
    } else {
      if (xtmod > ytmod) {
        xt = 1. - ytmod;
        yt = 1. - xtmod;
      } else {
        xt = 1. - xtmod;
        yt = 1. - ytmod;
      }
    }
  }
  return vec2(xt, yt);
}

vec2 p4g(float xt, float yt) {
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      if (ytmod > 1. - xtmod) {
        xt = xtmod;
        yt = ytmod;
      } else {
        xt = 1. - ytmod;
        yt = 1. - xtmod;
      }
    } else {
      if (xtmod > ytmod) {
        xt = 1. - ytmod;
        yt = xtmod;
      } else {
        xt = 1. - xtmod;
        yt = ytmod;
      }
    }
  } else {
    if (mod(yt / PATTERN_DIM, 2.0) < 1.0) {
      if (xtmod > ytmod) {
        xt = xtmod;
        yt = 1. - ytmod;
      } else {
        xt = ytmod;
        yt = 1. - xtmod;
      }
    } else {
      if (ytmod > 1. - xtmod) {
        xt = ytmod;
        yt = xtmod;
      } else {
        xt = 1. - xtmod;
        yt = 1. - ytmod;
      }
    }
  }
  return vec2(xt, yt);
}

vec2 p3(float xt, float yt) {
  const float w = 1.154700538379251529; // sqrt(4/3)
  const float w_2 = 0.5773502691896257; // sqrt(1/3)
  const float l = 0.3333333333;
  const float offsetX = 0.21132486540518711774542560; // (1 - sqrt(1/3))/2;

  float xtmod = mod(xt, w * PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(floor(yt / PATTERN_DIM), 2.0) < l) {
    xtmod = mod(xtmod + w_2, w);
  }

  if (xtmod > w_2) {
    if (ytmod > l && ytmod < l + l ||
      ytmod < l && ytmod > (w - xtmod) * w_2 ||
      ytmod > l + l && ytmod < 1.0 - (xtmod - w_2) * w_2
      ) {
      return vec2(xtmod - w_2 + offsetX, ytmod);
    }
  } else {
    if (ytmod > l && ytmod < l + l ||
        ytmod < l && ytmod > xtmod * w_2 ||
        ytmod > l + l && ytmod < 1.0 - (w_2 - xtmod) * w_2
        ) {
        return vec2(- xtmod * 0.5 + ytmod / w + offsetX, 1.0 - ytmod * 0.5 - xtmod / w);
      }
  }

  if (ytmod > l) {
    ytmod -= 1.0;
    xtmod = mod(xtmod + w_2, w);
  }

  return vec2(offsetX + (w - xtmod) * 0.5 - ytmod / w, 1.0 - (w - xtmod) / w - ytmod * 0.5);
}

vec2 p3m1(float xt, float yt) {
  const float w = 1.154700538379251529; // sqrt(4/3)
  const float w_2 = 0.5773502691896257; // sqrt(1/3)
  const float l = 0.3333333333;
  const float offsetX = 0.21132486540518711774542560; // (1 - sqrt(1/3))/2;
  float offset = (1. - cos(PI / 6.)) / 2.;
  float offset2 = 1.0 / w;
  float xtmod = mod(xt, PATTERN_DIM * offset2) / PATTERN_DIM / offset2;
  float ytmod = mod(yt, PATTERN_DIM * 2.0) / PATTERN_DIM;

  /* mat2 rot60 = mat3 ( cos (PI / 3.), -sin (PI / 3.),*/
  /*                     sin (PI / 3.),  cos (PI / 3.) );*/

  /* mat2 rotm60 = mat3 ( cos (- PI / 3.), -sin (-PI / 3.),*/
  /*                      sin (- PI / 3.),  cos (-PI / 3.) );*/

  float from = offset;
  float to = 1. - offset;

  float fromy = 0.;
  float toy = 0.;

  vec2 ans = vec2(xtmod, ytmod);
  vec2 res = vec2(0., 0.);

  if (mod(xt / (PATTERN_DIM * offset2), 2.0) < 1.0) {
    fromy = .5 * xtmod;
    toy = 1. - fromy;

    if (ytmod > toy) {


    } else if (ytmod <= toy && ytmod >= fromy) {
      ans.x = from + xtmod * (to - from);

    } else {
      /* ans = rot60 * ans;*/
    }
  } else {
    fromy = .5 * (1. - xtmod);
    toy = 1. - fromy;

    if (ytmod > toy) {


    } else if (ytmod <= toy && ytmod >= fromy) {
      ans.x = from + (1. - xtmod) * (to - from);

    } else {

    }
  }

  return ans;
}

vec2 p31m(float xt, float yt) {
  const float h = 0.5773502691896257; // sqrt(1/3)
  const float c30 = 0.866025403784438; // sqrt(3)/2
  const float h2 = 1.154700538379251529; // sqrt(4/3)
  const float h6 = h * 6.0; // 6 * sqrt(1/3)
  const mat3 rot = mat3(
    -0.5, +c30, +c30,
    -c30, -0.5, 0.5,
    0.0, 0.0, 1.0
  );
  float xs = xt / PATTERN_DIM;
  float xi = floor(xs);
  float xmod = mod(xs - xi, 2.0);
  if (xmod > 1.0) {
    xmod = 2.0 - xmod;
  }
  float ys = yt / h2 / PATTERN_DIM;
  float yi = floor(ys);
  float ymod = mod(ys - yi, 3.0);
  yi = mod(yi, 3.0);

  vec3 res = vec3(xmod, ymod, 1.0);
  if (yi > 0.5) {
    res = rot * res;
  }
  if (yi > 1.5) {
    res = rot * res;
  }
  return res.xy;
}

vec2 p6(float xt, float yt) {
  const float h = 0.5773502691896257; // sqrt(1/3)
  const float c30 = 0.866025403784438; // sqrt(3)/2
  const float h2 = 1.154700538379251529; // sqrt(4/3)
  const float h6 = h * 6.0; // 6 * sqrt(1/3)
  const mat3 rot = mat3(
    -0.5, +c30, +c30,
    -c30, -0.5, 0.5,
    0.0, 0.0, 1.0
  );
  float xs = xt / PATTERN_DIM;
  float xi = floor(xs);
  float xmod = mod(xs - xi, 2.0);
  if (xmod > 1.0) {
    xmod = 2.0 - xmod;
  }
  float ys = yt / h2 / PATTERN_DIM;
  float yi = floor(ys);
  float ymod = mod(ys - yi, 3.0);
  yi = mod(yi, 3.0);

  vec3 res = vec3(xmod, ymod, 1.0);
  if (yi > 0.5) {
    res = rot * res;
  }
  if (yi > 1.5) {
    res = rot * res;
  }
  return res.xy;
}

vec2 p6m(float xt, float yt) {
  const float h = 0.5773502691896257; // sqrt(1/3)
  const float c30 = 0.866025403784438; // sqrt(3)/2
  const float h2 = 1.154700538379251529; // sqrt(4/3)
  const float h6 = h * 6.0; // 6 * sqrt(1/3)
  const mat3 rot = mat3(
    -0.5, +c30, +c30,
    -c30, -0.5, 0.5,
    0.0, 0.0, 1.0
  );
  float xs = xt / PATTERN_DIM;
  float xi = floor(xs);
  float xmod = mod(xs - xi, 2.0);
  if (xmod > 1.0) {
    xmod = 2.0 - xmod;
  }
  float ys = yt / h2 / PATTERN_DIM;
  float yi = floor(ys);
  float ymod = mod(ys - yi, 3.0);
  yi = mod(yi, 3.0);

  vec3 res = vec3(xmod, ymod, 1.0);
  if (yi > 0.5) {
    res = rot * res;
  }
  if (yi > 1.5) {
    res = rot * res;
  }
  return res.xy;
}

//Sampling
float cubic(float x) {
  x = abs(x);
  const float a = -0.5;
  if (x <= 1.0) {
    return ((a + 2.0) * x - (a + 3.0)) * x * x + 1.0;
  } else if (x < 2.0) {
    return a * (((x - 5.0) * x + 8.0) * x - 4.0);
  } else {
    return 0.0;
  }
}

vec4 sampDirNearest(float x, float y) {
  return texture2D(sampler1, vec2(floor(mod(x, PATTERN_DIM)) / PATTERN_DIM,
                                  floor(mod(y, PATTERN_DIM)) / PATTERN_DIM));
}

vec4 sampNearest(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  return sampDirNearest(x, y);
}

vec4 sampLinear(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix(
    mix(sampDirNearest(x, y), sampDirNearest(x + 1.0, y), fx),
    mix(sampDirNearest(x, y + 1.0), sampDirNearest(x + 1.0, y + 1.0), fx),
    fy);
}

vec4 mix4(vec4 c1, vec4 c2, vec4 c3, vec4 c4, float fr) {
  return ((((-c1+c2-c3+c4)*fr+(2.0*c1-2.0*c2+c3-c4))*fr)+(-c1+c3))*fr+c2;
}

vec4 sampCubic(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix4(
    mix4(sampDirNearest(x-1.0,y-1.0), sampDirNearest(x,y-1.0), sampDirNearest(x+1.0,y-1.0), sampDirNearest(x+2.0,y-1.0),fx),
    mix4(sampDirNearest(x-1.0,y),     sampDirNearest(x,y),     sampDirNearest(x+1.0,y),     sampDirNearest(x+2.0,y),    fx),
    mix4(sampDirNearest(x-1.0,y+1.0), sampDirNearest(x,y+1.0), sampDirNearest(x+1.0,y+1.0), sampDirNearest(x+2.0,y+1.0),fx),
    mix4(sampDirNearest(x-1.0,y+2.0), sampDirNearest(x,y+2.0), sampDirNearest(x+1.0,y+2.0), sampDirNearest(x+2.0,y+2.0),fx),
    fy
  );
}

//Main
void main(void) {
  vec2 pos = gl_FragCoord.xy;
  float xt, yt;

  xt =  pos.x * cos(rotation) * scaling.x + pos.y * sin(rotation) * scaling.y;
  yt = -pos.x * sin(rotation) * scaling.x + pos.y * cos(rotation) * scaling.y;

  xt -= resolution.x / 2.;
  yt -= resolution.y / 2.;

  if (hyperbolic > 0.0) {
    float minDim = min(resolution.x, resolution.y) / (2. * hyperbolic);
    xt /= minDim;
    yt /= minDim;
    vec2 v = vec2(xt, yt);
    float vlen = length(v);

    if (vlen < 1.0 - EPSILON && vlen > EPSILON) {
      float len = sqrt ( xt * xt + yt * yt );
      xt = xt / (1. - len) * minDim;
      yt = yt / (1. - len) * minDim;
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
  }

  if (group == GROUP_P1) {
    pos = p1(xt, yt);
  } else if (group == GROUP_P2) {
    pos = p2(xt, yt);
  } else if (group == GROUP_PM) {
    pos = pm(xt, yt);
  } else if (group == GROUP_PG) {
    pos = pg(xt, yt);
  } else if (group == GROUP_CM) {
    pos = cm(xt, yt);
  } else if (group == GROUP_PMM) {
    pos = pmm(xt, yt);
  } else if (group == GROUP_PMG) {
    pos = pmg(xt, yt);
  } else if (group == GROUP_PGG) {
    pos = pgg(xt, yt);
  } else if (group == GROUP_CMM) {
    pos = cmm(xt, yt);
  } else if (group == GROUP_P4) {
    pos = p4(xt, yt);
  } else if (group == GROUP_P4M) {
    pos = p4m(xt, yt);
  } else if (group == GROUP_P4G) {
    pos = p4g(xt, yt);
  } else if (group == GROUP_P3) {
    pos = p3(xt, yt);
  } else if (group == GROUP_P3M1) {
    pos = p3m1(xt, yt);
  } else if (group == GROUP_P6) {
    pos = p6(xt, yt);
  } else if (group == GROUP_P6M) {
    pos = p6m(xt, yt);
  } else {
    pos = vec2( mod(xt, PATTERN_DIM) / PATTERN_DIM,
                mod(yt, PATTERN_DIM) / PATTERN_DIM );
  }

  vec4 color = vec4(texture2D(sampler1, pos));
  color = vec4(mix(color.rgb, background.rgb, 1. - color.a), 1);

  //add a radial blend
  vec4 colorFrom = color;
  vec4 colorTo = vec4(mix(background.rgb, colorFrom.rgb, radialFactor), 1);
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float ratio = resolution.y / resolution.x;
  vec2 center = vec2(.5, .5);

  gl_FragColor = colorFrom + (colorTo - colorFrom) * distance(uv, center) / distance(vec2(1., 1.), center);
}
