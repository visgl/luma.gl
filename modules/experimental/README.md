# @luma.gl/experimental

Experimental features for luma.gl.

:::warning
These are experimental features that may change or be removed at any time. Use at your own risk.
Experimental features are not documented. Refer to comments in code.
:::

See [luma.gl](http://luma.gl) for documentation.

## Device info panel

Create a DOM-based GPU info panel and attach it to the current page:

```ts
import {createDeviceInfoPanel} from '@luma.gl/experimental'

const device = await luma.createDevice()
const panel = createDeviceInfoPanel(device, {width: '420px'})
document.body.appendChild(panel)
```
