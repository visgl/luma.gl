# AmbientLight

Create an ambient light source which illuminates all the objects equally.


## Usage

Create an ambient light source with color and intensity.
```js
const ambientLight= new AmbientLight({
  color: [128, 128, 0],
  intensity: 2.0
});
```

## Methods

### constructor

The constructor for the `AmbientLight` class. Use this to create a new `AmbientLight`.

```js
const ambientLight = new AmbientLight({color, intensity});
```
#### Parameters

* `color` - (*array*,)  RGB color of ambient light source, default value is `[255, 255, 255]`.
* `intensity` - (*number*) Strength of ambient light source, default value is `1.0`.
