# Material (Shader Module)

Provides support for material properties, specified as a mix of uniform values and supplied texture maps.

Currently supports:
* Diffuse color (uniform, attribute or texture map)
* Specularity (uinform, attribute or texture map)
* Environment Map (uinform, attribute or texture map)

* Uses 3 varyings!

| `materialEmissiveColor` | Color that is emitted without any light |
| `materialAmbientColor` | Color that is emitted when illuminated by ambient light |

| `materialDiffuseColor` | |
| `materialDiffuseMapEnable` | |
| `materialDiffuseMap` | |

| `materialSpecularity` | |
| `materialSpecularMapEnable` | |
| `materialSpecularMap` | |

| `materialEnableEnvironment` | |
| `materialEnvironmentMapEnable` | |
| `materialEnvironmentMap` | |
| `materialEnvironmentColor` | |
| `materialEnvironmentReflection` | |
| `materialEnvirinmentRefractio` | |


Possible extensions
* 'alphaThreshold' - Don't render if alpha is lower than this
* `side`: `GL.FRONT`, `GL.BACK`, GL.FRONT_AND_BACK`
* `depthWrite` - whether to write to depth buffer
