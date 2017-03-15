---
layout: docs
title: IO
categories: [Documentation]
---

Module: IO {#IO}
===========================

The IO module contains classes to load assets like images, shader files,
textures, models and data sets in an asynchronous way.

Separates between loadFiles, loadImages and loadTextures.

While the intention is to mainly provide a basic set of features and
to enable use of external modules for more advanced asset loading use cases,
the IO module does provide a couple of conveniences:

* Parallel loading of multiple files.
* Promise based interface, easy to compose with other asynchronous events.
* Works on both browser and node (work in progress).
* Progress callbacks (work in progress).


IO Function: loadFiles {#IO:loadFiles}
--------------------------------------

Loads remote data asynchronously via an http request (AJAX).
On the browser, the domain serving the data must match the
domain where the data is queried.

Creates a connection and sends the information to be sent. Returns
an array of promises that will resolve to the contents of the files.

### Syntax:

  loadFiles({paths, ...options});

### Arguments:

1. paths - (*array*)
1. options - (*object*) An object containing the following options:

### Options:

* method - (*string*, optional, default='GET')
  The request method. Possible values are `GET` or `POST`.
* async - (*boolean*, optional, default=true)
  Whether to make the request asynchronous or not.
* noCache - (*boolean*, optional, default=false)
  If true a random number will be appended to the url in order to
  force the reload of the file and avoid the use of the cache.
* responseType - (*string*, optional)
  The format/type of data to be retrieved.
  Set this to `arraybuffer` to get binary data. More info
  [here](https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data).
* sendAsBinary - (*boolean*, optional, default=false)
  Whether the content should be sent as binary or not. More info
  [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* body - (*mixed*, optional) To be used when `sendAsBinary` is `true`.
  The binary content to be sent. More info
  [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* onProgress - (*function*, optional)
  A callback executed while the data is being downloaded.
  The first parameter of the callback is the percentage downloaded.

### Options:

* method - (*string*, optional) The request method.
  Possible values are `GET` or `POST`. Default's `GET`.
* async - (*boolean*, optional, default=true)
  Whether to make the request asynchronous or not. Default's `true`.
* noCache - (*boolean*, optional, default= false)
   If true a random number will be appended
   to the url in order to force the reload of the file and avoid
   the use of the cache.
* responseType - (*string*, optional) The format/type of data to be retrieved.
  Set this to `arraybuffer` to get binary data. More info
  [here](https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data).
* sendAsBinary - (*boolean*, optional) Whether the content should be sent
  as binary or not. Default's false. More info 
  [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).
* body - (*mixed*, optional) To be used when `sendAsBinary` is `true`.
  The binary content to be sent. More info 
  [here](https://developer.mozilla.org/en/xmlhttprequest#sendAsBinary()).


### Examples:

Creating a request object to a specific url and making the request. 
Note the `send` call at the end of the instanciation.

{% highlight js %}
  // Using ES7 async/await
  try {
    const text = await loadFiles({
      paths: ['/mydomain/somethingelse/']
    });
    alert(text);
  } catch (error) {
    alert("An error ocurred");
  }
{% endhighlight %}


Creating a request object to a specific url.

{% highlight js %}
  loadFiles({
    url: '/mydomain/somethingelse/',
    onSuccess: function(text) {
      alert(text);
    },
    onError: function() {
      alert("An error ocurred");
    }
  });
{% endhighlight %}

Creating a request object to a specific url.

{% highlight js %}
  var req = new loadFiles({
    urls: ['/mydomain/1/' '/mydomain/2/'],

    onError: function() {
      alert("An error ocurred in one request");
    },

    onComplete: function(arr) {
        alert("responses: " + arr);
    }
  });
{% endhighlight %}

Creating a request object to a specific url and making the request.

{% highlight js %}
  var req = loadFiles({
    paths: ['/mydomain/1/', '/mydomain/2/'],
  })
    onSuccess: function(text) {
      alert(text);
    },

    onError: function() {
      alert("An error ocurred");
    },

    onComplete: function(arr) {
      alert("answer array: " + arr);
    }
{% endhighlight %}


IO Function: loadImages {#IO:loadImages}
----------------------------------------

A very useful class that enables loading of multiple remote images
asynchronously and returns an array with all the images loaded.

### Syntax:

	const images = await loadImages({paths, ...options});

### Arguments:

1. paths - (*array*) An array of strings pointing to image urls.
1. options - (*object*) An object containing the following options:

### Options:

* onProgress - (*function*, optional) Callback executed each time an image is loaded. Provides as first argument the percentage of images loaded.
* noCache - (*boolean*, optional, default=false)
  If true a random number will be appended to the url in order to force
  the reload of the file and avoid the use of the cache.

### Examples:

Creating a request to load images.

{% highlight js %}
  const imageUrls = ['image1.png', 'image2.png', 'image3.png'];
  const images = await loadImages({
    paths: imageUrls,
    onProgress: function(perc) {
      console.log(perc + ' loaded');
    }
  });
  alert("All images loaded! Now do something with the images array");
{% endhighlight %}


IO Function: loadTextures {#IO:loadTextures}
--------------------------------------------

Loads multiple textures from image urls asynchronously and in parallel.

### Syntax:

{% highlight js %}
	const textures = await loadTextures({paths, params, ...options});
{% endhighlight %}

### Arguments:

1. paths - (*array*) An array of strings pointing to image urls.
2. options - (*object*) An object containing the following options:

### Options:

* noCache - (*boolean*, optional, default=false)
  If true a random number will be appended to the url in order to
  force the reload of the file and avoid the use of the cache.

### Examples:

Creating a request to load images and create WebGL textures

{% highlight js %}
  const imageUrls = ['image1.png', 'image2.png', 'image3.png'];
  const textures = await loadTextures({
    paths: imageUrls,
  });
  alert("All images and textures loaded!");
{% endhighlight %}
