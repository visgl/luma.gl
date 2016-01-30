var halted = false;
var it = 1;
var mouseX = 0.5;
var mouseY = 0.5;
var sizeX = 1024;
var sizeY = 1024;
var viewX = 900;
var viewY = 550;

var $ = function(d) {
	return document.getElementById(d);
};

function load() {
	if (!PhiloGL.hasWebGL()) {
		alert("Your browser does not support WebGL");
		return;
	}
	$('fullscreen')
			.addEventListener(
					'click',
					function(e) {
						var width = window.innerWidth, height = window.innerHeight, canvas = $('c'), style = canvas.style;

						canvas.width = viewX = width;
						canvas.height = viewY = height;

						style.position = 'absolute';
						style.top = '0px';
						style.left = '0px';

						document.body.appendChild(canvas);

						var anchor = document.createElement('a'), astyle = anchor.style;
						astyle.position = 'absolute';
						astyle.top = astyle.left = '0px';
						astyle.color = '#000';
						astyle.display = 'block';
						// astyle.backgroundColor = 'black';
						anchor.innerHTML = 'Click here to leave fullscreen';
						anchor.href = '#';
						document.body.appendChild(anchor);

						anchor.addEventListener('click', function() {
							canvas.width = viewX = 900;
							canvas.height = viewY = 550;
							canvas.style.position = 'static';
							$('container').appendChild(canvas);
							anchor.parentNode.removeChild(anchor);
						}, false);

					});
	mouseX = 0;
	mouseY = 0;
	PhiloGL('c', {
		program : [ {
			id : 'advance',
			from : 'ids',
			vs : 'shader-vs',
			fs : 'shader-fs-advance'
		}, {
			id : 'composite',
			from : 'ids',
			vs : 'shader-vs',
			fs : 'shader-fs-composite'
		}, {
			id : 'copy',
			from : 'ids',
			vs : 'shader-vs',
			fs : 'shader-fs-copy'
		}, {
			id : 'blur-h',
			from : 'ids',
			vs : 'shader-vs',
			fs : 'shader-fs-blur-horizontal'
		}, {
			id : 'blur-v',
			from : 'ids',
			vs : 'shader-vs',
			fs : 'shader-fs-blur-vertical'
		} ],
		events : {
			centerOrigin : false,
			onMouseMove : function(e) {
				mouseX = e.x / viewX;
				mouseY = 1 - e.y / viewY;
			},
		// onClick : function(e) {
		// halted = !halted;
		// }
		},
		onError : function(e) {
			alert(e);
		},
		onLoad : function(app) {

			// Set framebuffers
			function fbosetting(scale) { // general settings
				return {
					width : sizeX / scale,
					height : sizeY / scale,
					bindToTexture : {
						parameters : [ {
							name : 'TEXTURE_MAG_FILTER',
							value : 'LINEAR'
						}, {
							name : 'TEXTURE_MIN_FILTER',
							value : 'LINEAR',
							generateMipmap : false
						} ]
					},
					bindToRenderBuffer : false
				};
			}

			var fbo1 = fbosetting(1); // fbos for multi-resolution
			var fbo2 = fbosetting(2);
			var fbo3 = fbosetting(4);
			var fbo4 = fbosetting(8);
			var fbo5 = fbosetting(16);

			app.setFrameBuffer('main', fbo1).setFrameBuffer('main2', fbo1)
					.setFrameBuffer('blur1', fbo1).setFrameBuffer('temp1', fbo1)
					.setFrameBuffer('blur2', fbo2).setFrameBuffer('temp2', fbo2)
					.setFrameBuffer('blur3', fbo3).setFrameBuffer('temp3', fbo3)
					.setFrameBuffer('blur4', fbo4).setFrameBuffer('temp4', fbo4)
					.setFrameBuffer('blur5', fbo5).setFrameBuffer('temp5', fbo5);

			anim();

			function draw() {
				if (it > 0) {
					advance('main', 'main2');
					calculateBlurTextures('main2');
					composite('main2');
				} else {
					advance('main2', 'main');
					calculateBlurTextures('main');
					composite('main');
				}
				it = -it;
			}

			function advance(source, target) {
				PhiloGL.Media.Image.postProcess({
					width : sizeX,
					height : sizeY,
					fromTexture : [ source + '-texture', 'blur1-texture',
							'blur2-texture', 'blur3-texture', 'blur4-texture',
							'blur5-texture' ],
					toFrameBuffer : target,
					program : 'advance',
					uniforms : getUniforms(1)
				});
			}

			function composite(source) {
				PhiloGL.Media.Image.postProcess({
					width : viewX,
					height : viewY,
					fromTexture : [ source + '-texture', 'blur1-texture',
							'blur2-texture', 'blur3-texture', 'blur4-texture',
							'blur5-texture' ],
					toScreen : true,
					aspectRatio : 1, // stretch to canvas size
					program : 'composite',
					uniforms : getUniforms(1)
				});
			}

			function calculateBlurTextures(source) {
				calculateBlurTexture(source, 'blur1', 'temp1', 1);
				calculateBlurTexture('blur1', 'blur2', 'temp2', 2);
				calculateBlurTexture('blur2', 'blur3', 'temp3', 4);
				calculateBlurTexture('blur3', 'blur4', 'temp4', 8);
				calculateBlurTexture('blur4', 'blur5', 'temp5', 16);
			}

			function calculateBlurTexture(source, target, helper, scale) {
				PhiloGL.Media.Image.postProcess({
					width : sizeX / scale,
					height : sizeY / scale,
					fromTexture : source + '-texture',
					toFrameBuffer : target,
					program : 'copy',
					uniforms : getUniforms(scale)
				}).postProcess({
					width : sizeX / scale,
					height : sizeY / scale,
					fromTexture : target + '-texture',
					toFrameBuffer : helper,
					program : 'blur-h',
					uniforms : getUniforms(scale)
				}).postProcess({
					width : sizeX / scale,
					height : sizeY / scale,
					fromTexture : helper + '-texture',
					toFrameBuffer : target,
					program : 'blur-v',
					uniforms : getUniforms(scale)
				});
			}

			function getUniforms(factor) {
				return {
					'mouse' : [ mouseX, mouseY ],
					'pixelSize' : [ factor / sizeX, factor / sizeY ]
				};
			}

			function anim() {
				if (!halted) {
					draw();
				}
				PhiloGL.Fx.requestAnimationFrame(anim);
			}
		}
	});
}
