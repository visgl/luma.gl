# Shader Parsing

It is sometimes useful to be able to inspect shader source code

## Functions

### getShaderInfo

Returns information extracted from shader source code

```typescript
function getShaderInfo(shaderSource: string): {
  name: string;
  language: 'glsl' | 'wgsl';
  version: number;
}
```

Returns:
- `name`
- `language`: `'glsl'`
- `version`: GLSL version e.g. 130 or 300