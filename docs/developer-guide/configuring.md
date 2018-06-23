# Configuring luma.gl

## Optional Imports

luma.gl is currently published as a single package, however there are still some optional parts of the library that are made available through the use of special imports.

| Optional Import            | Description |
| ---                        | --- |
| `import 'luma.gl/webgl1';` | Install optional support for running luma.gl on WebGL1-only browsers. Import before creating contexts. |
| `import 'luma.gl/debug';`  | Install optional WebGL debug support. Enables creation of debug contexts. Import before creating contexts. |
| `import GL from 'luma.gl/constants';` | Import static WebGL constant definitions |


## Running under Node.js

See get-started for information on installing headless-gl to run WebGL under Node.js.
