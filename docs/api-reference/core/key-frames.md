#KeyFrames

Manages key frame animation data. Associates time points with arbitrary data and provides methods to access key times and data, and an interpolation factor, based on the current time.


## Usage

Automatic update usage (assume `update` method is being called once per frame):
```js
const keyFrames = new KeyFrames([
  [0, { val1: [1, 0, 1], val2: 0} ],
  [500, { val1: [1, 1, 1], val2: 2} ],
  [800, { val1: [0, 0, 1], val2: 1} ],
  [1200, { val1: [0, 1, 0], val2: 4} ],
  [1500, { val1: [1, 0, 1], val2: 5} ]
]);

keyFrames.setTime(1000);

keyFrames.getStartIndex(); // => 2                            (i.e. key frame at time=800)
keyFrames.getEndIndex();   // => 3                            (i.e. key frame at time=1200)
keyFrames.getStartData()   // => { val1: [0, 0, 1], val2: 1}  (i.e. data at index 2)
keyFrames.getEndData()     // => { val1: [0, 1, 0], val2: 4}  (i.e. data at index 3)
keyFrames.getFactor();     // => 0.5                          (i.e. halfway between 800 and 1200)

```

## Methods

### constructor(keyFrameData: Array)

Takes an array of `[time, data]` pairs to initialize the key frames.


### setKeyFrames(keyFrameData: Array)

Replaces the current set of key frames with a new one. Takes the same argument as the constructor.


### getStartIndex() : Number

Returns the current start key frame index (i.e. the index of the key frame being interpolated from).


### getEndIndex() : Number

Returns the current end key frame index (i.e. the index of the key frame being interpolated to).


### getStartData() : Any

Returns the data at the current start key frame index (i.e. the data being interpolated from).


### getEndData() : Any

Returns the data at the current end key frame index (i.e. the data being interpolated to).


### getFactor() : Number

Returns a value between 0 and 1 representing the interpolation factor between the start and end key frame pair.


### setTime(time: Number)

Set the current time of the key frames.
