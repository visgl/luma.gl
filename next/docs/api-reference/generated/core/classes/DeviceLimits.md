# Abstract Class: DeviceLimits

Defined in: [modules/core/src/adapter/device.ts:96](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L96)

Limits for a device (max supported sizes of resources, max number of bindings etc)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DeviceLimits**(): `DeviceLimits`

#### Returns[​](#returns "Direct link to Returns")

`DeviceLimits`

## Properties[​](#properties "Direct link to Properties")

### maxBindGroups[​](#maxbindgroups "Direct link to maxBindGroups")

> `abstract` **maxBindGroups**: `number`

Defined in: [modules/core/src/adapter/device.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L106)

max number of BindGroups

***

### maxBindGroupsPlusVertexBuffers[​](#maxbindgroupsplusvertexbuffers "Direct link to maxBindGroupsPlusVertexBuffers")

> `abstract` **maxBindGroupsPlusVertexBuffers**: `number`

Defined in: [modules/core/src/adapter/device.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L108)

max total bind groups plus vertex buffers usable by one pipeline

***

### maxBindingsPerBindGroup[​](#maxbindingsperbindgroup "Direct link to maxBindingsPerBindGroup")

> `abstract` **maxBindingsPerBindGroup**: `number`

Defined in: [modules/core/src/adapter/device.ts:110](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L110)

max bindings in one bind group

***

### maxBufferSize[​](#maxbuffersize "Direct link to maxBufferSize")

> `abstract` **maxBufferSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L138)

max total byte size of one GPU buffer allocation

***

### maxColorAttachmentBytesPerSample[​](#maxcolorattachmentbytespersample "Direct link to maxColorAttachmentBytesPerSample")

> `abstract` **maxColorAttachmentBytesPerSample**: `number`

Defined in: [modules/core/src/adapter/device.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L154)

max attachment bytes consumed per sample

***

### maxColorAttachments[​](#maxcolorattachments "Direct link to maxColorAttachments")

> `abstract` **maxColorAttachments**: `number`

Defined in: [modules/core/src/adapter/device.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L152)

max number of color attachments in one render pass

***

### maxComputeInvocationsPerWorkgroup[​](#maxcomputeinvocationsperworkgroup "Direct link to maxComputeInvocationsPerWorkgroup")

> `abstract` **maxComputeInvocationsPerWorkgroup**: `number`

Defined in: [modules/core/src/adapter/device.ts:158](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L158)

max number of ComputeInvocations per Workgroup

***

### maxComputeWorkgroupSizeX[​](#maxcomputeworkgroupsizex "Direct link to maxComputeWorkgroupSizeX")

> `abstract` **maxComputeWorkgroupSizeX**: `number`

Defined in: [modules/core/src/adapter/device.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L160)

max ComputeWorkgroupSizeX

***

### maxComputeWorkgroupSizeY[​](#maxcomputeworkgroupsizey "Direct link to maxComputeWorkgroupSizeY")

> `abstract` **maxComputeWorkgroupSizeY**: `number`

Defined in: [modules/core/src/adapter/device.ts:162](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L162)

max ComputeWorkgroupSizeY

***

### maxComputeWorkgroupSizeZ[​](#maxcomputeworkgroupsizez "Direct link to maxComputeWorkgroupSizeZ")

> `abstract` **maxComputeWorkgroupSizeZ**: `number`

Defined in: [modules/core/src/adapter/device.ts:164](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L164)

max ComputeWorkgroupSizeZ

***

### maxComputeWorkgroupsPerDimension[​](#maxcomputeworkgroupsperdimension "Direct link to maxComputeWorkgroupsPerDimension")

> `abstract` **maxComputeWorkgroupsPerDimension**: `number`

Defined in: [modules/core/src/adapter/device.ts:166](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L166)

max ComputeWorkgroupsPerDimension

***

### maxComputeWorkgroupStorageSize[​](#maxcomputeworkgroupstoragesize "Direct link to maxComputeWorkgroupStorageSize")

> `abstract` **maxComputeWorkgroupStorageSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:156](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L156)

max number of ComputeWorkgroupStorageSize

***

### maxDynamicStorageBuffersPerPipelineLayout[​](#maxdynamicstoragebuffersperpipelinelayout "Direct link to maxDynamicStorageBuffersPerPipelineLayout")

> `abstract` **maxDynamicStorageBuffersPerPipelineLayout**: `number`

Defined in: [modules/core/src/adapter/device.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L114)

max number of DynamicStorageBuffers per PipelineLayout

***

### maxDynamicUniformBuffersPerPipelineLayout[​](#maxdynamicuniformbuffersperpipelinelayout "Direct link to maxDynamicUniformBuffersPerPipelineLayout")

> `abstract` **maxDynamicUniformBuffersPerPipelineLayout**: `number`

Defined in: [modules/core/src/adapter/device.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L112)

max number of DynamicUniformBuffers per PipelineLayout

***

### maxInterStageShaderVariables[​](#maxinterstageshadervariables "Direct link to maxInterStageShaderVariables")

> `abstract` **maxInterStageShaderVariables**: `number`

Defined in: [modules/core/src/adapter/device.ts:150](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L150)

max number of InterStageShaderComponents

***

### maxSampledTexturesPerShaderStage[​](#maxsampledtexturespershaderstage "Direct link to maxSampledTexturesPerShaderStage")

> `abstract` **maxSampledTexturesPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L116)

max number of SampledTextures per ShaderStage

***

### maxSamplersPerShaderStage[​](#maxsamplerspershaderstage "Direct link to maxSamplersPerShaderStage")

> `abstract` **maxSamplersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L118)

max number of Samplers per ShaderStage

***

### maxStorageBufferBindingSize[​](#maxstoragebufferbindingsize "Direct link to maxStorageBufferBindingSize")

> `abstract` **maxStorageBufferBindingSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L136)

max number of StorageBufferBindingSize

***

### maxStorageBuffersInFragmentStage[​](#maxstoragebuffersinfragmentstage "Direct link to maxStorageBuffersInFragmentStage")

> `abstract` **maxStorageBuffersInFragmentStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L124)

Maximum number of storage buffers visible to the fragment shader stage.

***

### maxStorageBuffersInVertexStage[​](#maxstoragebuffersinvertexstage "Direct link to maxStorageBuffersInVertexStage")

> `abstract` **maxStorageBuffersInVertexStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L122)

Maximum number of storage buffers visible to the vertex shader stage.

***

### maxStorageBuffersPerShaderStage[​](#maxstoragebufferspershaderstage "Direct link to maxStorageBuffersPerShaderStage")

> `abstract` **maxStorageBuffersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L120)

max number of StorageBuffers per ShaderStage

***

### maxStorageTexturesInFragmentStage[​](#maxstoragetexturesinfragmentstage "Direct link to maxStorageTexturesInFragmentStage")

> `abstract` **maxStorageTexturesInFragmentStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L130)

Maximum number of storage textures visible to the fragment shader stage.

***

### maxStorageTexturesInVertexStage[​](#maxstoragetexturesinvertexstage "Direct link to maxStorageTexturesInVertexStage")

> `abstract` **maxStorageTexturesInVertexStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L128)

Maximum number of storage textures visible to the vertex shader stage.

***

### maxStorageTexturesPerShaderStage[​](#maxstoragetexturespershaderstage "Direct link to maxStorageTexturesPerShaderStage")

> `abstract` **maxStorageTexturesPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L126)

max number of StorageTextures per ShaderStage

***

### maxTextureArrayLayers[​](#maxtexturearraylayers "Direct link to maxTextureArrayLayers")

> `abstract` **maxTextureArrayLayers**: `number`

Defined in: [modules/core/src/adapter/device.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L104)

max number of TextureArrayLayers

***

### maxTextureDimension1D[​](#maxtexturedimension1d "Direct link to maxTextureDimension1D")

> `abstract` **maxTextureDimension1D**: `number`

Defined in: [modules/core/src/adapter/device.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L98)

max number of TextureDimension1D

***

### maxTextureDimension2D[​](#maxtexturedimension2d "Direct link to maxTextureDimension2D")

> `abstract` **maxTextureDimension2D**: `number`

Defined in: [modules/core/src/adapter/device.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L100)

max number of TextureDimension2D

***

### maxTextureDimension3D[​](#maxtexturedimension3d "Direct link to maxTextureDimension3D")

> `abstract` **maxTextureDimension3D**: `number`

Defined in: [modules/core/src/adapter/device.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L102)

max number of TextureDimension3D

***

### maxUniformBufferBindingSize[​](#maxuniformbufferbindingsize "Direct link to maxUniformBufferBindingSize")

> `abstract` **maxUniformBufferBindingSize**: `number`

Defined in: [modules/core/src/adapter/device.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L134)

max number of UniformBufferBindingSize

***

### maxUniformBuffersPerShaderStage[​](#maxuniformbufferspershaderstage "Direct link to maxUniformBuffersPerShaderStage")

> `abstract` **maxUniformBuffersPerShaderStage**: `number`

Defined in: [modules/core/src/adapter/device.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L132)

max number of UniformBuffers per ShaderStage

***

### maxVertexAttributes[​](#maxvertexattributes "Direct link to maxVertexAttributes")

> `abstract` **maxVertexAttributes**: `number`

Defined in: [modules/core/src/adapter/device.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L146)

max number of VertexAttributes

***

### maxVertexBufferArrayStride[​](#maxvertexbufferarraystride "Direct link to maxVertexBufferArrayStride")

> `abstract` **maxVertexBufferArrayStride**: `number`

Defined in: [modules/core/src/adapter/device.ts:148](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L148)

max number of VertexBufferArrayStride

***

### maxVertexBuffers[​](#maxvertexbuffers "Direct link to maxVertexBuffers")

> `abstract` **maxVertexBuffers**: `number`

Defined in: [modules/core/src/adapter/device.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L144)

max number of VertexBuffers

***

### minStorageBufferOffsetAlignment[​](#minstoragebufferoffsetalignment "Direct link to minStorageBufferOffsetAlignment")

> `abstract` **minStorageBufferOffsetAlignment**: `number`

Defined in: [modules/core/src/adapter/device.ts:142](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L142)

min StorageBufferOffsetAlignment

***

### minUniformBufferOffsetAlignment[​](#minuniformbufferoffsetalignment "Direct link to minUniformBufferOffsetAlignment")

> `abstract` **minUniformBufferOffsetAlignment**: `number`

Defined in: [modules/core/src/adapter/device.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L140)

min UniformBufferOffsetAlignment
