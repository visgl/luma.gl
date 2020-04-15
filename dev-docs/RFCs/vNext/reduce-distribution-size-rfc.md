# RFC: Reducing Distribution Size

* **Authors**: Ib Green, ...
* **Date**: Feb 2018-
* **Status**: Continuous Draft.

References:

* See luma.gl issue [#234](https://github.com/visgl/luma.gl/issues/234)
* Most ideas in [deck.gl size reduction RFC](https://github.com/visgl/deck.gl/blob/master/dev-docs/RFCs/v6.0/reduce-distribution-size-rfc.md) apply here.


## Summary

This RFC focuses on additional luma.gl specific size reduction opportunities


## Motivations

* New features are constanly added
* deck.gl + luma.gl keeps growing > 1MB
* react-map-gl pulls in mapbox which is already big
* Users are starting to show concern



## Size Reduction Opportunities, Open

## duplicated methods



## Size Reduction Opportunities, Implemented

### webgl-debug

This library is always bundled, even when not used.


### GL constants

* luma.gl should use local GL defs in files that can be collapsed by minimizer into numbers
* luma.gl library internal should avoid importing the `GL` constants so that apps can tree shake out this big object


### math.gl

* luma.gl proper does not need to import math.gl. Maybe it can include an internal minimal matrix multiplication method class.


