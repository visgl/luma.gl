interface CreateContextOptions {
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2?: boolean // Attempt to create a WebGL2 context (false to force webgl1)
  webgl1?: boolean // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
  throwOnError?: boolean
  break?: Array<any> // TODO: types
  manageState?: boolean
  // BROWSER CONTEXT PARAMETERS
  canvas?: HTMLCanvasElement | string | OffscreenCanvas // A canvas element or a canvas string id
  debug?: boolean // Instrument context (at the expense of performance)
  alpha?: boolean // Default render target has an alpha buffer.
  depth?: boolean // Default render target has a depth buffer of at least 16 bits.
  stencil?: boolean // Default render target has a stencil buffer of at least 8 bits.
  antialias?: boolean // Boolean that indicates whether or not to perform anti-aliasing.
  premultipliedAlpha?: boolean // Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer?: boolean // Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
  failIfMajorPerformanceCaveat?: boolean // Do not create if the system performance is low.
  // HEADLESS CONTEXT PARAMETERS
  width?: number // width are height are only used by headless gl
  height?: number
  // WEBGL/HEADLESS CONTEXT PARAMETERS
  // Remaining options are passed through to context creator
}