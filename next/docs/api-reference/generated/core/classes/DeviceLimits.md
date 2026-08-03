# Abstract Class: DeviceLimits

Defined in: [modules/core/src/adapter/device.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L89)

Limits for a device (max supported sizes of resources, max number of bindings etc)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DeviceLimits**(): `DeviceLimits`

#### Returns[​](#returns "Direct link to Returns")

`DeviceLimits`

## Properties[​](#properties "Direct link to Properties")

### maxBindGroups[​](#maxbindgroups "Direct link to maxBindGroups")

> `abstract` **maxBindGroups**: `number`

Defined in: [modules/core/src/adapter/device.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L99)

max number of BindGroups

***

### maxBindGroupsPlusVertexBuffers[​](#maxbindgroupsplusvertexbuffers "Direct link to maxBindGroupsPlusVertexBuffers")

> `abstract` **maxBindGroupsPlusVertexBuffers**: `number`

Defined in: [modules/core/src/adapter/device.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L101)

max total bind groups plus vertex buffers usable by one pipeline

***

### maxBindingsPerBindGroup[​](#maxbindingsperbindgroup "Direct link to maxBindingsPerBindGroup")

> `abstract` **maxBindingsPerBindGroup**: `number`

Defined in: [modules/core/src/adapter/device.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L103)

max bindings in one bind group

***

### maxBufferSize[​](#maxbuffersize "Direct link to maxBufferSize")

> `abstract` **maxBufferSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L131)

max total byte size of one GPU buffer allocation

***

### maxColorAttachmentBytesPerSample[​](#maxcolorattachmentbytespersample "Direct link to maxColorAttachmentBytesPerSample")

> `abstract` **maxColorAttachmentBytesPerSample**: `number`

Defined in: [modules/core/src/adapter/device.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L147)

max attachment bytes consumed per sample

***

### maxColorAttachments[​](#maxcolorattachments "Direct link to maxColorAttachments")

> `abstract` **maxColorAttachments**: `number`

Defined in: [modules/core/src/adapter/device.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L145)

max number of color attachments in one render pass

***

### maxComputeInvocationsPerWorkgroup[​](#maxcomputeinvocationsperworkgroup "Direct link to maxComputeInvocationsPerWorkgroup")

> `abstract` **maxComputeInvocationsPerWorkgroup**: `number`

Defined in: [modules/core/src/adapter/device.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L151)

max number of ComputeInvocations per Workgroup

***

### maxComputeWorkgroupSizeX[​](#maxcomputeworkgroupsizex "Direct link to maxComputeWorkgroupSizeX")

> `abstract` **maxComputeWorkgroupSizeX**: `number`

Defined in: [modules/core/src/adapter/device.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L153)

max ComputeWorkgroupSizeX

***

### maxComputeWorkgroupSizeY[​](#maxcomputeworkgroupsizey "Direct link to maxComputeWorkgroupSizeY")

> `abstract` **maxComputeWorkgroupSizeY**: `number`

Defined in: [modules/core/src/adapter/device.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L155)

max ComputeWorkgroupSizeY

***

### maxComputeWorkgroupSizeZ[​](#maxcomputeworkgroupsizez "Direct link to maxComputeWorkgroupSizeZ")

> `abstract` **maxComputeWorkgroupSizeZ**: `number`

Defined in: [modules/core/src/adapter/device.ts:157](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L157)

max ComputeWorkgroupSizeZ

***

### maxComputeWorkgroupsPerDimension[​](#maxcomputeworkgroupsperdimension "Direct link to maxComputeWorkgroupsPerDimension")

> `abstract` **maxComputeWorkgroupsPerDimension**: `number`

Defined in: [modules/core/src/adapter/device.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L159)

max ComputeWorkgroupsPerDimension

***

### maxComputeWorkgroupStorageSize[​](#maxcomputeworkgroupstoragesize "Direct link to maxComputeWorkgroupStorageSize")

> `abstract` **maxComputeWorkgroupStorageSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:149](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L149)

max number of ComputeWorkgroupStorageSize

***

### maxDynamicStorageBuffersPerPipelineLayout[​](#maxdynamicstoragebuffersperpipelinelayout "Direct link to maxDynamicStorageBuffersPerPipelineLayout")

> `abstract` **maxDynamicStorageBuffersPerPipelineLayout**: `number`

Defined in: [modules/core/src/adapter/device.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L107)

max number of DynamicStorageBuffers per PipelineLayout

***

### maxDynamicUniformBuffersPerPipelineLayout[​](#maxdynamicuniformbuffersperpipelinelayout "Direct link to maxDynamicUniformBuffersPerPipelineLayout")

> `abstract` **maxDynamicUniformBuffersPerPipelineLayout**: `number`

Defined in: [modules/core/src/adapter/device.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L105)

max number of DynamicUniformBuffers per PipelineLayout

***

### maxInterStageShaderVariables[​](#maxinterstageshadervariables "Direct link to maxInterStageShaderVariables")

> `abstract` **maxInterStageShaderVariables**: `number`

Defined in: [modules/core/src/adapter/device.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L143)

max number of InterStageShaderComponents

***

### maxSampledTexturesPerShaderStage[​](#maxsampledtexturespershaderstage "Direct link to maxSampledTexturesPerShaderStage")

> `abstract` **maxSampledTexturesPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L109)

max number of SampledTextures per ShaderStage

***

### maxSamplersPerShaderStage[​](#maxsamplerspershaderstage "Direct link to maxSamplersPerShaderStage")

> `abstract` **maxSamplersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L111)

max number of Samplers per ShaderStage

***

### maxStorageBufferBindingSize[​](#maxstoragebufferbindingsize "Direct link to maxStorageBufferBindingSize")

> `abstract` **maxStorageBufferBindingSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L129)

max number of StorageBufferBindingSize

***

### maxStorageBuffersInFragmentStage[​](#maxstoragebuffersinfragmentstage "Direct link to maxStorageBuffersInFragmentStage")

> `abstract` **maxStorageBuffersInFragmentStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:117](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L117)

Maximum number of storage buffers visible to the fragment shader stage.

***

### maxStorageBuffersInVertexStage[​](#maxstoragebuffersinvertexstage "Direct link to maxStorageBuffersInVertexStage")

> `abstract` **maxStorageBuffersInVertexStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L115)

Maximum number of storage buffers visible to the vertex shader stage.

***

### maxStorageBuffersPerShaderStage[​](#maxstoragebufferspershaderstage "Direct link to maxStorageBuffersPerShaderStage")

> `abstract` **maxStorageBuffersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L113)

max number of StorageBuffers per ShaderStage

***

### maxStorageTexturesInFragmentStage[​](#maxstoragetexturesinfragmentstage "Direct link to maxStorageTexturesInFragmentStage")

> `abstract` **maxStorageTexturesInFragmentStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L123)

Maximum number of storage textures visible to the fragment shader stage.

***

### maxStorageTexturesInVertexStage[​](#maxstoragetexturesinvertexstage "Direct link to maxStorageTexturesInVertexStage")

> `abstract` **maxStorageTexturesInVertexStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L121)

Maximum number of storage textures visible to the vertex shader stage.

***

### maxStorageTexturesPerShaderStage[​](#maxstoragetexturespershaderstage "Direct link to maxStorageTexturesPerShaderStage")

> `abstract` **maxStorageTexturesPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L119)

max number of StorageTextures per ShaderStage

***

### maxTextureArrayLayers[​](#maxtexturearraylayers "Direct link to maxTextureArrayLayers")

> `abstract` **maxTextureArrayLayers**: `number`

Defined in: [modules/core/src/adapter/device.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L97)

max number of TextureArrayLayers

***

### maxTextureDimension1D[​](#maxtexturedimension1d "Direct link to maxTextureDimension1D")

> `abstract` **maxTextureDimension1D**: `number`

Defined in: [modules/core/src/adapter/device.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L91)

max number of TextureDimension1D

***

### maxTextureDimension2D[​](#maxtexturedimension2d "Direct link to maxTextureDimension2D")

> `abstract` **maxTextureDimension2D**: `number`

Defined in: [modules/core/src/adapter/device.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L93)

max number of TextureDimension2D

***

### maxTextureDimension3D[​](#maxtexturedimension3d "Direct link to maxTextureDimension3D")

> `abstract` **maxTextureDimension3D**: `number`

Defined in: [modules/core/src/adapter/device.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L95)

max number of TextureDimension3D

***

### maxUniformBufferBindingSize[​](#maxuniformbufferbindingsize "Direct link to maxUniformBufferBindingSize")

> `abstract` **maxUniformBufferBindingSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L127)

max number of UniformBufferBindingSize

***

### maxUniformBuffersPerShaderStage[​](#maxuniformbufferspershaderstage "Direct link to maxUniformBuffersPerShaderStage")

> `abstract` **maxUniformBuffersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L125)

max number of UniformBuffers per ShaderStage

***

### maxVertexAttributes[​](#maxvertexattributes "Direct link to maxVertexAttributes")

> `abstract` **maxVertexAttributes**: `number`

Defined in: [modules/core/src/adapter/device.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L139)

max number of VertexAttributes

***

### maxVertexBufferArrayStride[​](#maxvertexbufferarraystride "Direct link to maxVertexBufferArrayStride")

> `abstract` **maxVertexBufferArrayStride**: `number`

Defined in: [modules/core/src/adapter/device.ts:141](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L141)

max number of VertexBufferArrayStride

***

### maxVertexBuffers[​](#maxvertexbuffers "Direct link to maxVertexBuffers")

> `abstract` **maxVertexBuffers**: `number`

Defined in: [modules/core/src/adapter/device.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L137)

max number of VertexBuffers

***

### minStorageBufferOffsetAlignment[​](#minstoragebufferoffsetalignment "Direct link to minStorageBufferOffsetAlignment")

> `abstract` **minStorageBufferOffsetAlignment**: `number`

Defined in: [modules/core/src/adapter/device.ts:135](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L135)

min StorageBufferOffsetAlignment

***

### minUniformBufferOffsetAlignment[​](#minuniformbufferoffsetalignment "Direct link to minUniformBufferOffsetAlignment")

> `abstract` **minUniformBufferOffsetAlignment**: `number`

Defined in: [modules/core/src/adapter/device.ts:133](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L133)

min UniformBufferOffsetAlignment
