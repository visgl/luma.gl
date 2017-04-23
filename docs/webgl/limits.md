
# Limits

In addition to capabilities, luma.gl can also query the context for all limits.
These are available as `glGetInfo(gl).limits` and can be indexed with the
GL constant representing the limit. Each limit is an object with multiple
values:

- `value` - the value of the limit in the current context
- `webgl1` - the minimum allowed value of the limit for WebGL1 contexts
- `webgl2` - the minimum allowed value of the limit for WebGL2 contexts

