# Scenegraph Interactivity

The engine's `Interactivity` runtime evaluates supported typed behavior graphs. Applications connect graph properties to resolved scene objects and provide hosts for external effects. glTF conversion is one source of graph definitions; the runtime can also be constructed directly.

Behavior graphs complement [input, picking, and highlighting](https://luma.gl/next/docs/api-guide/engine/interactivity.md). The host still owns hit testing, selectability, browser input routing, and rendering the resulting state.

## Example[​](#example "Direct link to Example")

<!-- -->

Loading interactive example…

The existing viewer loads published behavior-graph assets and exposes their authored checks. The example uses glTF documents as input to the shared engine runtime.

## Construct a graph[​](#construct-a-graph "Direct link to Construct a graph")

```
import {Interactivity} from '@luma.gl/engine';



const behavior = new Interactivity({

  graphs: [{

    types: [{signature: 'float'}],

    variables: [{type: 0, value: [0]}],

    declarations: [{op: 'event/onTick'}, {op: 'variable/set'}],

    nodes: [

      {declaration: 0, flows: {out: {node: 1}}},

      {

        declaration: 1,

        configuration: {variables: {value: [0]}},

        values: {'0': {node: 0, socket: 'timeSinceStart'}}

      }

    ]

  }]

});



behavior.start();

behavior.tick(10);

behavior.tick(12.5);

// behavior.variables[0] is [2.5].
```

Values are component arrays, including scalars. `tick()` takes a monotonic absolute clock in seconds. The first tick establishes the origin; its `timeSinceStart` is zero and its `timeSinceLastTick` is `NaN`. `start()` is idempotent. This clock differs from the animation mixer's delta-seconds update and the scenegraph animator's legacy millisecond `setTime()`.

## Connect behavior to the scene[​](#connect-behavior-to-the-scene "Direct link to Connect behavior to the scene")

| Host option                         | Responsibility                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `properties.get` / `properties.set` | Resolve supported property addresses to application state and scene objects. |
| `onEvent`                           | Receive custom events emitted by the graph.                                  |
| `onLog`                             | Receive graph diagnostics and severity.                                      |
| `physics`                           | Provide supported impulse, query, and trigger operations.                    |
| `maxSteps`                          | Bound flow activations per dispatch; defaults to `10000`.                    |

`selectNode(nodeIndex)` dispatches the supported selection event. The host supplies the identity mapping expected by the graph; this does not add source indices to native scene node identity. Property adapters may resolve addresses once and retain object references rather than search source JSON on every frame.

Unsupported operations are rejected during construction. The supported operation set is a profile, rather than a general scripting environment or full behavior-specification claim.

## Physics scheduling[​](#physics-scheduling "Direct link to Physics scheduling")

Physics queries may complete asynchronously. Call `await behavior.flushPhysics()` at an appropriate boundary before consuming their continuation results. Dispatch tick/selection input, submit physics work, and consume completed results according to the application's frame policy. The engine receives a host interface rather than depending on a particular solver.

See [Physics integration](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md) and [glTF native-extension conversion](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md) for source mapping and supported profiles.
