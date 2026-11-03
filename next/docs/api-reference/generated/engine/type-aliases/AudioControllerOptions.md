# Type Alias: AudioControllerOptions

> **AudioControllerOptions** = `object`

Defined in: [modules/engine/src/audio/audio-controller.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L65)

## Properties[​](#properties "Direct link to Properties")

### activeCameraNode?[​](#activecameranode "Direct link to activeCameraNode?")

> `optional` **activeCameraNode?**: [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)

Defined in: [modules/engine/src/audio/audio-controller.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L79)

Authored camera node used for environment listener selection.

***

### activeListener?[​](#activelistener "Direct link to activeListener?")

> `optional` **activeListener?**: `number`

Defined in: [modules/engine/src/audio/audio-controller.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L72)

***

### audioContext[​](#audiocontext "Direct link to audioContext")

> **audioContext**: `BaseAudioContext`

Defined in: [modules/engine/src/audio/audio-controller.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L75)

Borrowed context; the application resumes and closes it. No context is created implicitly.

***

### baseUrl[​](#baseurl "Direct link to baseUrl")

> **baseUrl**: `string`

Defined in: [modules/engine/src/audio/audio-controller.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L77)

Absolute base URL, used to resolve external audio.

***

### defaultEnvironment?[​](#defaultenvironment "Direct link to defaultEnvironment?")

> `optional` **defaultEnvironment?**: `number`

Defined in: [modules/engine/src/audio/audio-controller.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L73)

***

### definition[​](#definition "Direct link to definition")

> **definition**: [`AudioDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioDefinition.md)

Defined in: [modules/engine/src/audio/audio-controller.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L67)

***

### emitterIndices?[​](#emitterindices "Direct link to emitterIndices?")

> `optional` **emitterIndices?**: readonly `number`\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L70)

***

### environment?[​](#environment "Direct link to environment?")

> `optional` **environment?**: [`AudioEnvironmentDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioEnvironmentDefinition.md)

Defined in: [modules/engine/src/audio/audio-controller.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L71)

***

### fetch?[​](#fetch "Direct link to fetch?")

> `optional` **fetch?**: *typeof* `fetch`

Defined in: [modules/engine/src/audio/audio-controller.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L82)

***

### graphs?[​](#graphs "Direct link to graphs?")

> `optional` **graphs?**: readonly [`AudioGraphDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioGraphDefinition.md)\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L68)

***

### listenerPose?[​](#listenerpose "Direct link to listenerPose?")

> `optional` **listenerPose?**: `"authored"` | `"viewer"`

Defined in: [modules/engine/src/audio/audio-controller.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L81)

Use the application viewer pose while retaining authored listener audio properties.

***

### nodes?[​](#nodes "Direct link to nodes?")

> `optional` **nodes?**: readonly [`AudioNodeBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AudioNodeBinding.md)\[]

Defined in: [modules/engine/src/audio/audio-controller.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L69)

***

### scene[​](#scene "Direct link to scene")

> **scene**: [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)

Defined in: [modules/engine/src/audio/audio-controller.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-controller.ts#L66)
