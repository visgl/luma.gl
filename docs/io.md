--- 
layout: docs 
title: IO
categories: [Documentation]
---

Module: IO {#IO}
===========================

The IO module contains classes to load remote assets like images, shader files, textures, and more via different methods like 
XHR or JSONP. These methods are also exposed to the user so he can load models and data sets in an asynchronous way.


IO Class: IO.XHR {#IO:XHR}
---------------------------

The XHR class provides an API for loading remote data asynchronously via an http request (AJAX). The domain serving the data must match the domain where 
the data is queried.

IO.XHR Method: constructor {#IO:XHR:constructor}
-------------------------------------------------

Initializes a new XHR instance.

### Syntax:

	var xhr = new PhiloGL.IO.XHR(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* url - (*string*) The url to make the request to.
* method - (*string*, optional) The request method. Possible values are `GET` or `POST`. Default's `GET`.
* async - (*boolean*, optional) Whether to make the request asynchronous or not. Default's `true`.
* noCache - (*boolean*, optional) If true a random number will be appended to the url in order to force the reload of the file and avoid the use of the cache. 
Default's `false`.
* responseType - (*string*, optional) The format/type of data to be retrieved. Set this to `arraybuffer` to get binary data. More info [here](https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data).
* sendAsBinary - (*boolean*, optional) Whether the content should be sent as binary or not. Default's false. More info [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* body - (*mixed*, optional) To be used when `sendAsBinary` is `true`. The binary content to be sent. More info [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* onProgress - (*function*, optional) A callback executed while the data is being downloaded. The first parameter of the callback is the percentage downloaded.
* onSuccess - (*function*, optional) A callback executed once the connection was successful and the information completely sent. The first parameter of the callback is the `responseText` content.
* onError - (*function*, optional) A callback executed if there's an error while making the connection or sending the data.


### Examples:

Creating a request object to a specific url.

{% highlight js %}
  var req = new PhiloGL.IO.XHR({
    url: '/mydomain/somethingelse/',
    
    onSuccess: function(text) {
      alert(text);
    },

    onError: function() {
      alert("An error ocurred");
    }
  });
{% endhighlight %}


IO.XHR Method: send {#IO:XHR:send}
-----------------------------------

Creates a connection and sends the information to be sent.

### Syntax:

	xhr.send();

### Examples:

Creating a request object to a specific url and making the request. 
Note the `send` call at the end of the instanciation.

{% highlight js %}
  var req = new PhiloGL.IO.XHR({
    url: '/mydomain/somethingelse/',
    
    onSuccess: function(text) {
      alert(text);
    },

    onError: function() {
      alert("An error ocurred");
    }
  }).send();
{% endhighlight %}


IO Class: IO.XHR.Group {#IO:XHR:Group}
---------------------------------------

The XHR Group class creates parallel XHR requests and returns the
information in an array. Callbacks for when a single resquest is
succesfull and also for when all requests are completed are provided.


IO.XHR.Group Method: constructor {#IO:XHR:Group:constructor}
-------------------------------------------------------------

Initializes a new XHR Group instance.

### Syntax:

	var xhr = new PhiloGL.IO.XHR.Group(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* urls - (*array*) The urls to make the requests to.
* method - (*string*, optional) The request method. Possible values are `GET` or `POST`. Default's `GET`.
* async - (*boolean*, optional) Whether to make the request asynchronous or not. Default's `true`.
* noCache - (*boolean*, optional) If true a random number will be appended to the url in order to force the reload of the file and avoid the use of the cache. 
Default's `false`.
* responseType - (*string*, optional) The format/type of data to be retrieved. Set this to `arraybuffer` to get binary data. More info [here](https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data).
* sendAsBinary - (*boolean*, optional) Whether the content should be sent as binary or not. Default's false. More info [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* body - (*mixed*, optional) To be used when `sendAsBinary` is `true`. The binary content to be sent. More info [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* onSuccess - (*function*, optional) A callback executed once the connection was successful and the information completely sent. This callback is called for each individual 
request.
* onError - (*function*, optional) A callback executed if there's an error while making the connection or sending the data. This callback will be called for each unsuccesfull request.
* onComplete - (*function*, optional) Called when all the requests are
  done. The first argument of this function will be an array with the
answers for each request.


### Examples:

Creating a request object to a specific url.

{% highlight js %}
  var req = new PhiloGL.IO.XHR.Group({
    urls: ['/mydomain/1/' '/mydomain/2/'],

    onError: function() {
      alert("An error ocurred in one request");
    },

    onComplete: function(arr) {
        alert("responses: " + arr);
    }
  });
{% endhighlight %}


IO.XHR.Group Method: send {#IO:XHR:Group:send}
------------------------------------------------

Creates parallel connections for each url and sends the information.

### Syntax:

	xhr.send();

### Examples:

Creating a request object to a specific url and making the request. 
Note the `send` call at the end of the instanciation.

{% highlight js %}
  var req = new PhiloGL.IO.XHR({
    urls: ['/mydomain/1/', '/mydomain/2/'],
    
    onSuccess: function(text) {
      alert(text);
    },

    onError: function() {
      alert("An error ocurred");
    },

    onComplete: function(arr) {
      alert("answer array: " + arr);
    }
  }).send();
{% endhighlight %}


IO Class: IO.JSONP {#IO:JSONP}
---------------------------

The JSONP class provides an API for loading remote data asynchronously via an http request. Instead of using the `XMLHttpRequest` object JSONP creates a `script` 
document that is appended to the head tag of the HTML page. This technique enables the user to query a different domain for JSON data. More information about this 
technique can be found [here](http://en.wikipedia.org/wiki/JSONP).

IO.JSONP Method: constructor {#IO:JSONP:constructor}
-------------------------------------------------

Creates and sends a JSONP request. Can be called without the `new` keyword.

### Syntax:

	PhiloGL.IO.JSONP(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* url - (*string*) The url to make the request to.
* data - (*object*, optional) A key/value object to build a query string from it. Default's an empty object (i.e. `{}`)
* callbackKey - (*string*) The name of the query string parameter to set the name of the callback function to.
* onComplete - (*function*, optional) A callback executed once the connection ended. The first parameter of the callback is the JSON content.
* noCache - (*boolean*, optional) If true a random number will be appended to the url in order to force the reload of the file and avoid the use of the cache. 
Default's `false`.

### Examples:

Creating a request object to a specific url.

{% highlight js %}
  PhiloGL.IO.JSONP({
    url: '/anotherdomain/somethingelse/',
    callbackKey: 'callbackName',
    data: {
      'somekey': 'somevalue'
    },
    onComplete: function(json) {
      console.log(json);
    }
  });
{% endhighlight %}


IO Class: IO.Images {#IO:Images}
---------------------------

A very useful class that enables loading of multiple remote images asynchronously and returns an array with all the images loaded.

IO.Images Method: constructor {#IO:Images:constructor}
-------------------------------------------------

Creates a request to Images providing an array that will be asynchonously filled with loaded images.

### Syntax:

	var images = new PhiloGL.IO.Images(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* src - (*array*) An array of strings pointing to image urls.
* onProgress - (*function*, optional) Callback executed each time an image is loaded. Provides as first argument the percentage of images loaded.
* onComplete - (*function*, optional) Callback executed when all images finished loading. The `images` variable will now have all loaded images.
* noCache - (*boolean*, optional) If true a random number will be appended to the url in order to force the reload of the file and avoid the use of the cache. 
Default's `false`.

### Examples:

Creating a request to load images.

{% highlight js %}
  var imageUrls = ['image1.png', 'image2.png', 'image3.png'];

  var images = new PhiloGL.IO.Images({
    src: imageUrls,
    onProgress: function(perc) {
      console.log(perc + ' loaded');
    },
    onComplete: function() {
      alert("All images loaded! Now do something with the images array");
    }
  });
{% endhighlight %}

IO Class: IO.Textures {#IO:Textures}
--------------------------------------

A very useful class that enables loading of multiple textures from remote images asynchronously.

IO.Textures Method: constructor {#IO:Textures:constructor}
-----------------------------------------------------------

Creates a request to Images to load the array of remote images and then generates Textures from them. The id of each texture will be the same as the url for each image. 
Can be called without the `new` keyword.

### Syntax:

	PhiloGL.IO.Textures(options);

### Arguments:

1. options - (*object*) An object containing the following options:

### Options:

* src - (*array*) An array of strings pointing to image urls.
* onComplete - (*function*, optional) Callback executed when all images and textures finished loading.
* noCache - (*boolean*, optional) If true a random number will be appended to the url in order to force the reload of the file and avoid the use of the cache. 
Default's `false`.

### Examples:

Creating a request to load images and set them as textures for a specific program.

{% highlight js %}
  var imageUrls = ['image1.png', 'image2.png', 'image3.png'];

  PhiloGL.IO.Textures({
    src: imageUrls,
    onComplete: function() {
      alert("All images and textures loaded!");
    }
  });
{% endhighlight %}


