import {ShadertoolsDocsTabs} from '@site/src/components/docs/shadertools-docs-tabs';

# Shader Parsing

<ShadertoolsDocsTabs group="execution" active="shader-info" />

It is sometimes useful to be able to inspect shader source code

## Functions

### getShaderInfo

Returns information extracted from shader source code

```typescript
function getShaderInfo(shaderSource: string, defaultName?: string): {
  name: string;
  language: 'glsl' | 'wgsl';
  version: number;
}
```

Returns:
- `name`: `SHADER_NAME` define, supplied default name, or `'unnamed'`.
- `language`: always `'glsl'`; this helper does not parse WGSL.
- `version`: GLSL version `100` or `300`; missing `#version` defaults to `100`. Other versions throw.
