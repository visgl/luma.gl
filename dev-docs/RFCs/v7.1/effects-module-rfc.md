# RFC: @luma.gl/effects Module

* **Authors**: Jian Huang

* **Date**: May. 2019

* **Status**: For Review

## Abstract
A lot of shader modules focusing on effect rendering are created, better to have a sub-module for them instead of scattered all over the place.

## Status Quo
* Source code structure for effects in `@luma.gl/glfx`
	<pre>
	glfx/src
		|
		adjust-filters
		|
		blur-filters
		|
		curve-filters
		|
		fun-filters
		|
		warp-filters
	</pre>
* Source code structure for effects in current `@luma.gl/effects`
    <pre>
	 effects/src
		    |
		    modules
		        |
		        convolution.js
		        |
		        depth.js
		        |
		        pack.js
		        |
		        ssao.js
		    |
		    passes
		        |
		        convolution-pass.js
		        |
		        outline-pass.js
		        |
		        ssao-pass.js
    </pre>
			
## Proposal
New source code structure in `@luma.gl/effects`
<pre>
effects/src
	|
	modules
	    |
	    filter folders from `@luma.gl/gflx`
	|
	experimental
	    |
	    folders from old `@luma.gl/effects`
</pre>

* Objects under experimental folder will be exported as `_ObjectName`
* `@luma.gl/glfx` will re-export necessary objects from @luma.gl/effects to backward compatibility
* `@luma.gl/glfx` will be removed in 8.0 release

## Future Ideas
 Currently we focus on pure screen space filtering effects, which only has shader module while the rendering passes can be created on the fly. In the next step, we may create rendering passes in `@luma.gl/effects` for more complicated effects like bloom, SSAO, shadow etc. If this is the case, there will be a `passes` folder under `@luma.gl/effects/src`