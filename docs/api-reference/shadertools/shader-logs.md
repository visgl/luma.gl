# Shader Logs

shadertools provides utilities for platform independent handling of compiler logs,
in the form of a compiler message type and an error log formatting function.

## Types

### CompilerMessage

Contains information about one compilation message.

```typescript
export type CompilerMessage = {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineNum: number;
  linePos: number;
}
```

A shader compiler would typically return an array of `CompilerMessage` objects.

This type is intentionally compatible with the WebGPU `CompilerMessage` type.

## Functions

## formatCompilerLog

Formats compiler messages, optionally interleaving them with the source code.

```typescript
export function formatCompilerLog(
  shaderLog: readonly CompilerMessage[],
  source: string,
  options?: {
    showSourceCode?: boolean;
  }
): string;
```

- `shaderLog` - an array of compiler messages.
- `source` - the original source code.
- `options.showSourceCode`  - if true, shows 3 lines of source code before each error.
