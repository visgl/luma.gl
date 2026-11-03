# Function: integrateSurfaceWeather()

> **integrateSurfaceWeather**(`state`, `rates`, `elapsedSeconds`): [`SurfaceWeatherState`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherState.md)

Defined in: [modules/lighting/surface-weather/surface-weather.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/surface-weather/surface-weather.ts#L28)

Exact integration of bounded accumulation/decay for a constant-rate interval. Caller owns the state, clock, rates and any spatial exposure map. Pausing requires no GPU state.

## Parameters[​](#parameters "Direct link to Parameters")

### state[​](#state "Direct link to state")

`Readonly`<[`SurfaceWeatherState`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherState.md)>

### rates[​](#rates "Direct link to rates")

`Readonly`<[`SurfaceWeatherRates`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherRates.md)>

### elapsedSeconds[​](#elapsedseconds "Direct link to elapsedSeconds")

`number`

## Returns[​](#returns "Direct link to Returns")

[`SurfaceWeatherState`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherState.md)
