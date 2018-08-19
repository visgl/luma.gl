# About Loaders

loaders.gl exports a suite of loaders. Each loader is an object that can be passed to other functions in the loaders.gl API.




## Structure of a Loader Object

The loader object has the following fields

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `name`          | `String`    | Required   | Short name of the loader ('OBJ', 'PLY' etc) |
| `extension`     | `String`    | Required   | Three letter (typically) extension used by files of this format |
| `testText`      | `Function`  | `null`     | Guesses if a file is of this format by examining the first characters in the file |
| `loadText`      | `Function`  | `null`     | Parses a text file (`String`) \* |
| `loadJSON`      | `Function`  | `null`     | Parses a JSON file (JavaScript data structure) \* |
| `loadBinary`    | `Function`  | `null`     | Parses a binary file (`ArrayBuffer`) \* |
| `loadStream`    | `Function`  | `null`     | Parses a text stream (`Stream`) \* |

* Only one of the three `load...` fields must be implemented by a loader. The `loadFile` function examines what format the loader needs, loads that format, and calls the parser with the right type of input data.


