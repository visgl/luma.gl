# GLBLoader

Provides functions for parsing or generating the binary GLB containers used by glTF (and certain other formats).

Takes a JavaScript data structure and encodes it as a JSON blob with binary data (e.g. typed arrays) extracted into a binary chunk.


## Usage

```
import {GLBLoader, loadFile} from 'loaders.gl';

loadFile(url, GLBLoader).then(data => {
  // Application code here
  ...
});
```


## `GLBParser` class

The `GLBLoader` module exposes the `GLBParser` class with the following methods

### constructor

Creates a new `GLBParser` instance.


### parse(arrayBuffer : ArrayBuffer) : Object

Parses an in-memory, GLB formatted `ArrayBuffer` into:

* `arrayBuffer` - just returns the input array buffer
* `binaryByteOffset` - offset to the first byte in the binary chunk
* `json` - a JavaScript "JSON" data structure with inlined binary data fields.
