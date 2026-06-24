# @deck.gl-community/arrow-layers

Private deck.gl layers backed by the Arrow adapters and `GPUVector` objects from
`@luma.gl/arrow`.

The layers intentionally do not use deck.gl `AttributeManager` for Arrow columns.
Arrow data is converted once into `GPUVector`/`GPUTable` inputs and bound directly
to luma.gl models.
