# PCDLoader

A point cloud format defined by the Point Cloud Library

Currently only `ascii` and `binary` subformats are supported. Compressed binary files are currently not supported.

References

* [Point Cloud Library](https://en.wikipedia.org/wiki/Point_Cloud_Library)
* [PointClouds.org](http://pointclouds.org/documentation/tutorials/pcd_file_format.php)


## Usage

```
import {PCFLoader, loadFile} from 'loaders.gl';

loadFile(url, PCFLoader)
.then(({header, attributes}) => {
  // Application code here, e.g:
  // return new Geometry(attributes)
});
```

Loads `position`, `normal`, `color` attributes.


## Attribution/Credits

This loader is a light adaption of the PCDLoader example in the THREE.js code base. The THREE.js source files contain the following attributions:

* @author Filipe Caixeta / http://filipecaixeta.com.br
* @author Mugen87 / https://github.com/Mugen87
