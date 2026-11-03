# Function: preprocess()

> **preprocess**(`source`, `options?`): `string`

Defined in: [lib/preprocessor/preprocessor.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/preprocessor/preprocessor.ts#L30)

Removes inactive conditional branches from shader source. Supports `#ifdef`, `#ifndef`, and simple `#if` expressions using a define name, `!NAME`, `defined(NAME)`, `!defined(NAME)`, or a boolean or numeric literal.

## Parameters[​](#parameters "Direct link to Parameters")

### source[​](#source "Direct link to source")

`string`

Shader source containing luma.gl-supported conditional directives.

### options?[​](#options "Direct link to options?")

`PreprocessorOptions`

Defines used while evaluating conditional directives.

## Returns[​](#returns "Direct link to Returns")

`string`

Shader source with inactive branches removed.
