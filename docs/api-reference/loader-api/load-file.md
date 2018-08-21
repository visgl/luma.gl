# loadFile

The `loadFile` function can be used with any loader. It takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.


## Usage

```
import {OBJLoader, loadFile} from 'loaders.gl';

loadFile(url, OBJLoader).then(data => {
  // Application code here
  ...
});
```

## Function

### loadFile(url : String, loader : Object [, options : Object]) : Promise

