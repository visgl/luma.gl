# MultiPassRenderer (Experimental)

Renders a list of render passes

## Usage

```js
import {
  _MultiPassRenderer as MultiPassRenderer,
  _ClearPass as ClearPass,
  _RenderPass as RenderPass,
  _CopyPass as CopyPass
} from 'luma.gl';

class AppAnimationLoop extends AnimationLoop {

  onInitialize({gl}) {

    this.multiPassRenderer = new MultiPassRenderer(gl, [
      new ClearPass(gl),

      new RenderPass(gl, {
        models: [this.model]
      }),

      new ConvolutionPass(gl, {
         kernel: ConvolutionPass.KERNEL.EMBOSS
      }),

      new CopyPass(gl, {screen: true})
    ]);
  }

  onRender(animationProps) {
    this.multiPassRenderer.render(this.animationProps);
  }
});
```

## Methods

### constructor(gl : WebGLRenderingContext, passes : Array)


### render(animationProps : Object)

Renders (recursively, in case any CompositePasses are present) all the render passes.