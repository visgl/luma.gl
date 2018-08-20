# KMLLoader

KML (Keyhole Markup Language) is an XML-based file format used to display geographic data in an Earth browser such as Google Earth (originally named "Keyhole Earth Viewer"). It can be used with any 2D or 3D maps.

References:

* [Keyhole Markup Language - Wikipedia](https://en.wikipedia.org/wiki/Keyhole_Markup_Language)
* [KML Tutorial - Google](https://developers.google.com/kml/documentation/kml_tut)


## Structure of Data

The parser will return a JavaScript object with a number of top-level array-valued fields:

| Field           | Description |
| ---             | ---         |
| `documents`     |    |
| `folders`       |    |
| `links`         |    |
| `points`        | Points |
| `lines`         | Lines |
| `polygons`      | Polygons |
| `imageoverlays` | Urls and bounds of bitmap overlays |


## Parser Options

> Work in progress

| Option            | Default  | Description    |
| ---               | ---      | ---            |
| `useLngLatFormat` | `true`   | KML longitudes and latitudes are specified as `[lat, lng]`. This option "normalizes" them to `[lng, lat]`. |
| `useColorArrays`  | `true`   | Convert color strings to arrays |


## Limitations

* Currently XML parsing is only implemented in browsers, not in Node.js. Check `KMLLoader.supported` to check at run-time.


## License/Credits/Attributions

License: MIT

`XMLLoader` is an adaptation of Nick Blackwell's [`js-simplekml`](https://github.com/nickolanack/js-simplekml) module.
