# RFC: Reducing Distribution Size

* **Authors**: Ib Green, ...
* **Date**: Feb 2018
* **Status**: Early draft, not ready for formal review.

Notes:

## Motivation

* deck.gl + luma.gl keeps growing > 1MB
* react-map-gl pulls in mapbox which is already big
* Users are starting to show concern

Most ideas in [deck.gl size reduction RFC](https://github.com/uber/deck.gl/blob/master/dev-docs/RFCs/v6.0/reduce-distribution-size-rfc.md) apply here.

This RFC focuses on additional luma.gl specific size reduction opportunities


## Size Reduction Ops

### webgl-debug

This library is always bundled, even when not used.


### GL constants

* luma.gl should use local GL defs in files that can be collapsed by minimizer into numbers
* luma.gl library internal should avoid importing the `GL` constants so that apps can tree shake out this big object


### math.gl

* luma.gl proper does not need to import math.gl. Maybe it can include an internal minimal matrix multiplication method class.


## duplicated methods