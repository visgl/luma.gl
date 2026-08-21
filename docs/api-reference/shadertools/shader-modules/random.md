# random

The `random` shader module injects a small random-number helper into shaders. It does not define any uniforms or bindings.

## Usage[​](#usage "Direct link to Usage")

```
import {random} from '@luma.gl/shadertools';



const modules = [random];
```

The module provides a `random(scale, seed)` helper:

```
float value = random(vec3(12.9898, 78.233, 151.7182), 0.0);
```

## Uniforms[​](#uniforms "Direct link to Uniforms")

None.

## Remarks[​](#remarks "Direct link to Remarks")

* This is a convenience helper for shader code, not a cryptographically secure or statistically rigorous random-number generator.
* The GLSL and WGSL implementations are intentionally lightweight and suitable for visual effects, dithering, and noise seeding.
