Each package should be published as a separate NPM module.

* IO - Makes the luma.gl IO functions work under Node.js. This involves
  several big dependencies (in order to parse image formats, handle compression,
  streams etc) that make no sense to include in browsers.
