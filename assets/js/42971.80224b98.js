"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([["42971"],{79433(e,t,i){i.d(t,{A:()=>E});var r=i(2357);let n=()=>{},s={mode:"preserve"},o={mode:"hard"},a=e=>e;class l{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:i,startProps:r,endProps:n,duration:o,easing:a}}=e,l=a(t/o),u=i.interpolateProps(r,n,l);this.propsInTransition=this.getControllerState({...this.props,...u},s).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new r.A(e.timeline),this.onViewStateChange=e.onViewStateChange||n,this.onStateChange=e.onStateChange||n}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,i=this.props;if(this.props=e,!i||this._shouldIgnoreViewportChange(i,e))return!1;if(this._isTransitionEnabled(e)){let r=i;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...i,...2===e?t:this.propsInTransition||i}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:i}=e;return(t>0||"auto"===t)&&!!i}_isUpdateDueToCurrentTransition(e){return!!this.transition.inProgress&&!!this.propsInTransition&&this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition)}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?3===this.transition.settings.interruption||this._isUpdateDueToCurrentTransition(t):!this._isTransitionEnabled(t)||t.transitionInterpolator.arePropsEqual(e,t)}_triggerTransition(e,t){let i=this.getControllerState(e,s),r=this.getControllerState(t,o).shortestPathFrom(i),n=t.transitionInterpolator,l=n.getDuration?n.getDuration(e,t):t.transitionDuration;if(0===l)return;let u=n.initializeProps(e,r);this.propsInTransition={};let c={duration:l,easing:t.transitionEasing||a,interpolator:n,interruption:t.transitionInterruption||1,startProps:u.start,endProps:u.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(c),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}}var u=i(54261),c=i(7914),h=i(67681);let d={transitionDuration:0},f=e=>1-(1-e)*(1-e),p=e=>1===e?1:1-Math.pow(2,-10*e),g=["wheel"],_=["panstart","panmove","panend"],m=["pinchstart","pinchmove","pinchend"],v=["multipanstart","multipanmove","multipanend"],b=["dblclick"],y=["dblclickdragstart","dblclickdragmove","dblclickdragend","dblclickdragcancel"],w=["keydown"],x={};class E{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode="rotate",this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround="pointer",this.keyboard=!0,this.transitionManager=new l({...e,getControllerState:(t,i)=>new this.ControllerState({...t,constraintContext:i,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case"panstart":return!t&&this._onPanStart(e);case"panmove":return this._onPan(e);case"panend":return this._onPanEnd(e);case"pinchstart":return!t&&!!this._isTrackpadGestureAllowed(e)&&this._onPinchStart(e);case"pinchmove":return!!this._isTrackpadGestureAllowed(e)&&this._onPinch(e);case"pinchend":return!!this._isTrackpadGestureAllowed(e)&&this._onPinchEnd(e);case"multipanstart":return!t&&this._onMultiPanStart(e);case"multipanmove":return this._onMultiPan(e);case"multipanend":return this._onMultiPanEnd(e);case"dblclick":return this._onDoubleClick(e);case"dblclickdragstart":return!t&&this._onDoubleClickDragStart(e);case"dblclickdragmove":return this._onDoubleClickDrag(e);case"dblclickdragend":case"dblclickdragcancel":return this._onDoubleClickDragEnd(e);case"wheel":return this._onWheel(e);case"keydown":return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:i}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-i]}getZoomPosition(e){if("pointer"===this.zoomAround)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[i,r]=(0,h.VJ)(t.center,t.pixelProjectionMatrix);return[i,r]}isPointInBounds(e,t){let{width:i,height:r}=this.props;if(t&&t.handled)return!1;let n=e[0]>=0&&e[0]<=i&&e[1]>=0&&e[1]<=r;return n&&t&&t.stopPropagation(),n}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){void 0===e.maxBoundsPadding&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,"transitionInterpolator"in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:i}=e;this.inertia=Number.isFinite(i)?i:300*(!0===i);let{scrollZoom:r=!0,dragPan:n=!0,dragRotate:s=!0,doubleClickZoom:o=!0,doubleClickDragZoom:a=!1,touchZoom:l=!0,touchRotate:u=!1,multiTouchDrag:h=u?"rotate":null,trackpadGesture:d=!1,zoomAround:f="pointer",keyboard:p=!0}=e,x=!!this.onViewStateChange;if(this.toggleEvents(g,x&&r),this.toggleEvents(_,x),this.toggleEvents(m,x&&(l||"rotate"===h)),this.toggleEvents(v,x&&!!h),this.toggleEvents(b,x&&o),this.toggleEvents(y,x&&a),this.toggleEvents(w,x&&p),this.scrollZoom=r,this.dragPan=n,this.dragRotate=s,this.doubleClickZoom=o,this.doubleClickDragZoom=a,this.touchZoom=l,this.touchRotate="rotate"===h,this.multiTouchDrag=h,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),i=t.getViewportProps();Object.keys(i).some(t=>!(0,c.b)(i[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,i={}){let r={...e.getViewportProps(),...t},n=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(i),n){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:"update"===t?"elastic":"end"===t?"rebound":"hard"}:{mode:"hard"}}_getReboundTransition(e,t){if("rebound"!==e.mode)return null;let i=t.getViewportProps();return Object.keys(i).some(e=>!(0,c.b)(this.props[e],i[e],1))?{...this._getTransitionProps(),transitionDuration:300,transitionEasing:p}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||"pan"===this.dragMode)&&(i=!i);let r=i?"pan":"rotate",n=this._getConstraintContext(r,"start"),s=i?this.controllerState.panStart({pos:t},n):this.controllerState.rotateStart({pos:t},n);return this._panMove=i,this.updateViewport(s,d,{isDragging:!0}),!0}_onPan(e){return!!this.isDragging()&&(this._panMove?this._onPanMove(e):this._onPanRotate(e))}_onPanEnd(e){return!!this.isDragging()&&(this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e))}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),i=this.controllerState.pan({pos:t},this._getConstraintContext("pan","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],n=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(n,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext("pan","end"),i=e.panEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),i=this.controllerState.rotate({pos:t},this._getConstraintContext("rotate","update"));return this.updateViewport(i,d,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],n=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(n,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext("rotate","end"),i=e.rotateEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&"mouse"!==e.device)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:i=.01,smooth:r=!1}=!0===this.scrollZoom?{}:this.scrollZoom,{delta:n}=e,s=2/(1+Math.exp(-Math.abs(n*i)));n<0&&0!==s&&(s=1/s);let o=this.getZoomPosition(t),a=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:d,l=this.controllerState.zoom({pos:o,scale:s});return this.updateViewport(l,a,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let i=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r="trackpad"===e.pointerType,n={x:i.x-(r?0:e.deltaX),y:i.y-(r?0:e.deltaY)},s={...e,offsetCenter:n},o=this.getCenter(s),a="pan"===t?this.controllerState.panStart({pos:o},this._getConstraintContext("pan","start")):this.controllerState.rotateStart({pos:o},this._getConstraintContext("rotate","start"));return this._multiPanMode=t,this._multiPanStartCenter=n,this.updateViewport(a,d,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:i}=this._getMultiPanEvent(e);return!!t&&!!i&&!!this.isDragging()&&("pan"===t?this._onPanMove(i):this._onPanRotate(i))}_onMultiPanEnd(e){let{mode:t,event:i}=this._getMultiPanEvent(e);if(!t||!i||!this.isDragging())return this._resetMultiPan(),!1;let r="pan"===t?this._onPanMoveEnd(i):this._onPanRotateEnd(i);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return"trackpad"!==e.pointerType||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return"trackpad"===e.pointerType?this.trackpadGesture&&("pan"===t?this.dragPan:this.dragRotate):"touch"===e.pointerType&&("pan"===t?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,i=this._multiPanStartCenter;return t&&i?{mode:t,event:{...e,offsetCenter:{x:i.x+e.deltaX,y:i.y+e.deltaY}}}:{mode:null,event:null}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext("zoom","start")).rotateStart({pos:t},this._getConstraintContext("rotate","start"));return x._startPinchRotation=e.rotation,x._lastPinchEvent=e,this.updateViewport(i,d,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:i}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:i},this._getConstraintContext("zoom","update"))}if(this.touchRotate){let{rotation:i}=e;t=t.rotate({deltaAngleX:x._startPinchRotation-i},this._getConstraintContext("rotate","update"))}return this.updateViewport(t,d,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),x._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:i}=x;if(this.touchZoom&&t&&i&&e.scale!==i.scale){let r=this.getCenter(e),n=this.getZoomPosition(r),s=this.controllerState.rotateEnd(),o=Math.log2(e.scale),a=(o-Math.log2(i.scale))/(e.deltaTime-i.deltaTime),l=Math.pow(2,o+a*t/2);s=s.zoom({pos:n,scale:l}).zoomEnd(),this.updateViewport(s,{...this._getTransitionProps({around:n}),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext("zoom","end"),i=this._getConstraintContext("rotate","end"),r=e.zoomEnd(t).rotateEnd(i),n=this._getReboundTransition(this.touchZoom?t:i,r);this.updateViewport(r,n,{isDragging:!1,isPanning:!!n&&this.touchZoom,isZooming:!!n&&this.touchZoom,isRotating:!!n&&this.touchRotate})}return x._startPinchRotation=null,x._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),n=this.controllerState.zoom({pos:r,scale:i?.5:2});return this.updateViewport(n,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let i=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext("zoom","start"));return 1!==e.scale&&(i=i.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext("zoom","update"))),this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let i=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext("zoom","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,i=this._getConstraintContext("zoom","end"),r=t.zoomEnd(i),n=this._getReboundTransition(i,r);return this.updateViewport(r,n,{isDragging:!1,isPanning:!!n,isZooming:!!n}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){let t;if(!this.keyboard)return!1;let i=this.isFunctionKeyPressed(e),{zoomSpeed:r,moveSpeed:n,rotateSpeedX:s,rotateSpeedY:o}=!0===this.keyboard?{}:this.keyboard,{controllerState:a}=this,l={};switch(e.srcEvent.code){case"Minus":t=i?a.zoomOut(r).zoomOut(r):a.zoomOut(r),l.isZooming=!0;break;case"Equal":t=i?a.zoomIn(r).zoomIn(r):a.zoomIn(r),l.isZooming=!0;break;case"ArrowLeft":i?(t=a.rotateLeft(s),l.isRotating=!0):(t=a.moveLeft(n),l.isPanning=!0);break;case"ArrowRight":i?(t=a.rotateRight(s),l.isRotating=!0):(t=a.moveRight(n),l.isPanning=!0);break;case"ArrowUp":i?(t=a.rotateUp(o),l.isRotating=!0):(t=a.moveUp(n),l.isPanning=!0);break;case"ArrowDown":i?(t=a.rotateDown(o),l.isRotating=!0):(t=a.moveDown(n),l.isPanning=!0);break;default:return!1}return this.updateViewport(t,this._getTransitionProps(),l),!0}_getTransitionProps(e){let{transition:t}=this;return t&&t.transitionInterpolator?e?{...t,transitionInterpolator:new u.A({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t:d}}},58532(e,t,i){i.d(t,{CI:()=>s,GT:()=>n,jo:()=>o});var r=i(33945);function n(e,t,i){let r=e-t;return r&&Number.isFinite(r)?t+r*i/(i+Math.abs(r)):t}function s(e,t,i){let n=(0,r.E9)((0,r.rk)(i?.left??0),e),s=(0,r.E9)((0,r.rk)(i?.right??0),e),o=(0,r.E9)((0,r.rk)(i?.top??0),t),a=(0,r.E9)((0,r.rk)(i?.bottom??0),t);return{x:n,y:o,width:e-n-s,height:t-o-a}}function o(e,t,i){let[r,n]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,n=Number.isFinite(n)?n:e.height/2,{left:r-i.x,right:i.x+i.width-r,top:n-i.y,bottom:i.y+i.height-n}}},60676(e,t,i){i.d(t,{A:()=>n,y:()=>r});let r=Symbol("constraintAround");class n{constructor(e,t,i,r){this.makeViewport=i,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}}},43411(e,t,i){i.d(t,{A:()=>o,k:()=>s});var r=i(3459);let n={};function s(e){n=e}function o(e,t,i,s){r.A.level>0&&n[e]&&n[e].call(null,t,i,s)}},9350(e,t,i){i.d(t,{Kx:()=>o,We:()=>u,p5:()=>a,tg:()=>l});var r=i(3459),n=i(92767);let s={DEFAULT:"default",LNGLAT:"lnglat",METER_OFFSETS:"meter-offsets",LNGLAT_OFFSETS:"lnglat-offsets",CARTESIAN:"cartesian"};Object.defineProperty(s,"IDENTITY",{get:()=>(r.A.deprecated("COORDINATE_SYSTEM.IDENTITY","COORDINATE_SYSTEM.CARTESIAN")(),s.CARTESIAN)});let o={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},a={common:0,meters:1,pixels:2},l={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},u={multipan:[n.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[n.h1,{trackpad:!0},null,["multipan"]],pan:[n.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[n.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[n.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[n.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]}},26096(e,t,i){i.d(t,{A:()=>iy});var r=i(98675);let n={number:{type:"number",validate:(e,t)=>Number.isFinite(e)&&"object"==typeof t&&(void 0===t.max||e<=t.max)&&(void 0===t.min||e>=t.min)},array:{type:"array",validate:(e,t)=>Array.isArray(e)||ArrayBuffer.isView(e)}};function s(e){return Array.isArray(e)||ArrayBuffer.isView(e)?"array":typeof e}let o={vertex:`\
#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,fragment:`\
#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`},a=/void\s+main\s*\([^)]*\)\s*\{\n?/,l=/}\n?[^{}]*$/,u=[],c="__LUMA_INJECT_DECLARATIONS__";function h(e,t,i,r=!1,n="glsl",s={}){let f="vertex"===t;for(let t in i){let r=i[t];r.sort((e,t)=>e.order-t.order),u.length=r.length;for(let e=0,t=r.length;e<t;++e)u[e]=r[e].injection;let o=`${u.join("\n")}
`;switch(t){case"vs:#decl":("wgsl"===n||f)&&(e=e.replace(c,o));break;case"vs:#main-start":("wgsl"===n||f)&&(e="wgsl"===n?d(e,"vertex",o,"start",s.vertex):e.replace(a,e=>e+o));break;case"vs:#main-end":("wgsl"===n||f)&&(e="wgsl"===n?d(e,"vertex",o,"end",s.vertex):e.replace(l,e=>o+e));break;case"fs:#decl":"wgsl"!==n&&f||(e=e.replace(c,o));break;case"fs:#main-start":"wgsl"!==n&&f||(e="wgsl"===n?d(e,"fragment",o,"start",s.fragment):e.replace(a,e=>e+o));break;case"fs:#main-end":"wgsl"!==n&&f||(e="wgsl"===n?d(e,"fragment",o,"end",s.fragment):e.replace(l,e=>o+e));break;default:e=e.replace(t,e=>e+o)}}return e=e.replace(c,""),r&&(e=e.replace(/\}\s*$/,e=>e+o[t])),e}function d(e,t,i,r,n){let s=function(e,t,i){let r="vertex"===t?"@vertex":"@fragment",n=e.indexOf(r);if(n<0)return null;let s=i?e.search(RegExp(`\\bfn\\s+${i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*\\(`)):e.indexOf("fn",n);if(s<0)return null;let o=e.indexOf("{",s);if(o<0)return null;let a=0;for(let t=o;t<e.length;t++){let i=e[t];if("{"===i)a++;else if("}"===i&&0==--a)return{openBraceIndex:o,closeBraceIndex:t}}return null}(e,t,n);if(!s)return e;if("start"===r){let t=s.openBraceIndex+1;return`${e.slice(0,t)}
${i}${e.slice(t)}`}return`${e.slice(0,s.closeBraceIndex)}${i}${e.slice(s.closeBraceIndex)}`}function f(e){e.map(e=>(function(e){var t;if(e.instance)return;f(e.dependencies||[]);let{propTypes:i={},deprecations:r=[],inject:o={}}=e,a={normalizedInjections:function(e){let t={vertex:{},fragment:{}};for(let i in e){let r=e[i];"string"==typeof r&&(r={order:0,injection:r}),t[function(e){let t=e.slice(0,2);switch(t){case"vs":return"vertex";case"fs":return"fragment";default:throw Error(t)}}(i)][i]=r}return t}(o),parsedDeprecations:((t=r).forEach(e=>{"function"===e.type?e.regex=RegExp(`\\b${e.old}\\(`):e.regex=RegExp(`${e.type} ${e.old};`)}),t)};i&&(a.propValidators=function(e){let t={};for(let[i,r]of Object.entries(e))t[i]=function(e){let t=s(e);if("object"!==t)return{value:e,...n[t],type:t};if("object"==typeof e)return e?void 0!==e.type?{...e,...n[e.type],type:e.type}:void 0===e.value?{type:"object",value:e}:(t=s(e.value),{...e,...n[t],type:t}):{type:"object",value:null};throw Error("props")}(r);return t}(i)),e.instance=a;let l={};i&&(l=Object.entries(i).reduce((e,[t,i])=>{let r=i?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...l}})(e))}function p(e,t,i){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?i.deprecated(e.old,e.new)():i.removed(e.old,e.new)())})}function g(e){f(e);let t={},i={};!function e(t){let{modules:i,level:r,moduleMap:n,moduleDepth:s}=t;if(r>=5)throw Error("Possible loop in shader dependency graph");for(let e of i)n[e.name]=e,(void 0===s[e.name]||s[e.name]<r)&&(s[e.name]=r);for(let t of i)t.dependencies&&e({modules:t.dependencies,level:r+1,moduleMap:n,moduleDepth:s})}({modules:e,level:0,moduleMap:t,moduleDepth:i});let r=Object.keys(i).sort((e,t)=>i[t]-i[e]).map(e=>t[e]);return f(r),r}let _=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,"#version 300 es\n"],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,"textureLod("],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,"texture("]],m=[..._,[y("attribute"),"in $1"],[y("varying"),"out $1"]],v=[..._,[y("varying"),"in $1"]];function b(e,t){for(let[i,r]of t)e=e.replace(i,r);return e}function y(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,"g")}function w(e,t){if(!e){let e=Error(t||"shadertools: assertion failed.");throw Error.captureStackTrace?.(e,w),e}}let x=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,E=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function P(e){return`${e.name}Uniforms`}function S(e){let t=[];for(let i of e.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"").matchAll(E)){let e=i[1]?.trim()||null;t.push({blockName:i[2],body:i[3],instanceName:i[4]||null,layoutQualifier:e,hasLayoutQualifier:!!e,isStd140:!!(e&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(e))})}return t}function A(e,t=8){if(e.length<=t)return e.join(", ");let i=e.length-t;return`${e.slice(0,t).join(", ")}, ... (${i} more)`}function M(e,t,i="glsl"){let r="";for(let n in e){let s=e[n],o="wgsl"===i?"fn":"void";if(r+=`${o} ${s.signature} {
`,s.header&&(r+=`  ${s.header}`),t[n]){let e=t[n];for(let t of(e.sort((e,t)=>e.order-t.order),e))r+=`  ${t.injection}
`}s.footer&&(r+=`  ${s.footer}`),r+="}\n"}return r}function C(e){let t={vertex:{},fragment:{}};for(let i of e){let e,r;"string"!=typeof i?r=(e=i).hook:(e={},r=i);let n=(r=r.trim()).indexOf(":"),s=r.slice(0,n),o=r.slice(n+1),a=r.replace(/\(.+/,""),l=Object.assign(e,{signature:o});switch(s){case"vs":t.vertex[a]=l;break;case"fs":t.fragment[a]=l;break;default:throw Error(s)}}return t}let T="(?:var<\\s*(uniform|storage(?:\\s*,\\s*[A-Za-z_][A-Za-z0-9_]*)?)\\s*>|var)\\s+([A-Za-z_][A-Za-z0-9_]*)",k=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${T}`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*${T}`,"g")],I=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${T}`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*${T}`,"g")],O=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${T}`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${T}`,"g")],R=[RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${T}`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)\\s*${T}`,"g"),RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${T}`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${T}`,"g")];function L(e){let t=e.split(""),i=0,r=0,n=!1,s=!1,o=!1;for(;i<e.length;){let a=e[i],l=e[i+1];if(s){o?o=!1:"\\"===a?o=!0:'"'===a&&(s=!1),i++;continue}if(n){"\n"===a||"\r"===a?n=!1:t[i]=" ",i++;continue}if(r>0){if("/"===a&&"*"===l){t[i]=" ",t[i+1]=" ",r++,i+=2;continue}if("*"===a&&"/"===l){t[i]=" ",t[i+1]=" ",r--,i+=2;continue}"\n"!==a&&"\r"!==a&&(t[i]=" "),i++;continue}if('"'===a){s=!0,i++;continue}if("/"===a&&"/"===l){t[i]=" ",t[i+1]=" ",n=!0,i+=2;continue}if("/"===a&&"*"===l){t[i]=" ",t[i+1]=" ",r=1,i+=2;continue}i++}return t.join("")}function B(e,t){let i=L(e),r=[];for(let n of t){let s;for(n.lastIndex=0,s=n.exec(i);s;){let o=n===t[0],a=s.index,l=s[0].length;r.push({match:e.slice(a,a+l),index:a,length:l,bindingToken:s[o?1:2],groupToken:s[o?2:1],accessDeclaration:s[3]?.trim(),name:s[4]}),s=n.exec(i)}}return r.sort((e,t)=>e.index-t.index)}function j(e,t,i){let r=B(e,t);if(!r.length)return e;let n="",s=0;for(let t of r)n+=e.slice(s,t.index),n+=i(t),s=t.index+t.length;return n+e.slice(s)}function z(e){return/@binding\(\s*auto\s*\)/.test(L(e))}let N=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${T}\\s*:\\s*([^;]+);`,"g"),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${T}\\s*:\\s*([^;]+);`,"g")];function D(e,t=[]){let i=L(e),r=new Map;for(let e of t)r.set(F(e.name,e.group,e.location),e.moduleName);let n=[];for(let e of N){let t;for(e.lastIndex=0,t=e.exec(i);t;){let s=e===N[0],o=Number(t[s?1:2]),a=Number(t[s?2:1]),l=t[3]?.trim(),u=t[4],c=t[5].trim(),h=r.get(F(u,a,o));n.push(function(e){var t;let i={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:"unknown",moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let t=e.accessDeclaration.split(",").map(e=>e.trim());if("uniform"===t[0])return{...i,kind:"uniform",access:"uniform"};if("storage"===t[0]){let e=t[1]||"read_write";return{...i,kind:"read"===e?"read-only-storage":"storage",access:e}}}return"sampler"===e.resourceType||"sampler_comparison"===e.resourceType?{...i,kind:"sampler",samplerKind:"sampler_comparison"===e.resourceType?"comparison":"filtering"}:e.resourceType.startsWith("texture_storage_")?{...i,kind:"storage-texture",access:function(e){let t=/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e);return t?.[1]}(e.resourceType),viewDimension:U(e.resourceType)}:e.resourceType.startsWith("texture_")?{...i,kind:"texture",viewDimension:U(e.resourceType),sampleType:(t=e.resourceType).startsWith("texture_depth_")?"depth":t.includes("<i32>")?"sint":t.includes("<u32>")?"uint":t.includes("<f32>")?"float":void 0,multisampled:e.resourceType.startsWith("texture_multisampled_")}:i}({name:u,group:a,binding:o,owner:h?"module":"application",moduleName:h,accessDeclaration:l,resourceType:c})),t=e.exec(i)}}return n.sort((e,t)=>e.group!==t.group?e.group-t.group:e.binding!==t.binding?e.binding-t.binding:e.name.localeCompare(t.name))}function F(e,t,i){return`${t}:${i}:${e}`}function U(e){return e.includes("cube_array")?"cube-array":e.includes("2d_array")?"2d-array":e.includes("cube")?"cube":e.includes("3d")?"3d":e.includes("2d")?"2d":e.includes("1d")?"1d":void 0}function V(e,t={}){let i=$(e),r=function(e){let t=[],i=0;for(let r of e){if("}"===r.value&&0===i)return null;t.push(i),"{"===r.value?i++:"}"===r.value&&i--}return 0===i?t:null}(i);if(!r)return null;let n=function(e,t){let i=new Map;for(let r=0;r<e.length;r++){if(0!==t[r]||"alias"!==e[r].value)continue;let n=e[r+1]?.value;if(!Q(n)||e[r+2]?.value!=="="||i.has(n))return null;let s=K(e,t,r+3,";");if(s<0||s===r+3)return null;i.set(n,J(e.slice(r+3,s))),r=s}return i}(i,r);if(!n)return null;let s=function(e,t,i){let r=[],n=new Set,s=new Set;for(let o=0;o<e.length;o++){if(0!==t[o]||"var"!==e[o].value)continue;let a=X(e,t,o),l=e.slice(a,o),u=G(l,"group"),c=G(l,"binding");if(null===u||null===c||void 0===u!=(void 0===c))return null;if(void 0===u||void 0===c)continue;let h=o+1,d=[];if(e[h]?.value==="<"){let t=Y(e,h,"<",">");if(t<0)return null;let i=Z(e.slice(h+1,t),",");if(!i)return null;d=i.map(J),h=t+1}let f=e[h]?.value;if(!Q(f)||e[h+1]?.value!==":")return null;let p=K(e,t,h+2,";");if(p<0||p===h+2)return null;let g=W(J(e.slice(h+2,p)),i);if(!g)return null;let _=function(e){let{name:t,group:i,location:r,addressSpace:n,resourceType:s}=e,o={name:t,group:i,location:r};if("uniform"===n[0]&&1===n.length)return{...o,type:"uniform"};if("storage"===n[0]&&n.length<=2){let e=n[1]||"read";return"read"===e?{...o,type:"read-only-storage"}:"read_write"===e?{...o,type:"storage"}:null}return n.length>0?null:"sampler"===s||"sampler_comparison"===s?{...o,type:"sampler",..."sampler_comparison"===s?{samplerType:"comparison"}:{}}:"texture_external"===s?{...o,type:"external-texture"}:function(e,t){let i=/^texture_storage_(1d|2d|2d_array|3d)<([A-Za-z0-9_]+),(read|write|read_write)>$/.exec(t);if(!i)return null;let r={read:"read-only",write:"write-only",read_write:"read-write"}[i[3]];return{...e,type:"storage",format:i[2],access:r,viewDimension:q(i[1])}}(o,s)||function(e,t){let i=/^texture_(multisampled_)?(1d|2d|2d_array|cube|cube_array|3d)<(f32|i32|u32)>$/.exec(t);if(i){if(i[1]&&"2d"!==i[2])return null;let t={f32:"float",i32:"sint",u32:"uint"}[i[3]];return{...e,type:"texture",viewDimension:q(i[2]),sampleType:t,multisampled:!!i[1]}}let r=/^texture_depth_(multisampled_)?(2d|2d_array|cube|cube_array)$/.exec(t);return!r||r[1]&&"2d"!==r[2]?null:{...e,type:"texture",viewDimension:q(r[2]),sampleType:"depth",multisampled:!!r[1]}}(o,s)}({name:f,group:u,location:c,addressSpace:d,resourceType:g}),m=`${u}:${c}`;if(!_||n.has(m)||s.has(f))return null;r.push(_),n.add(m),s.add(f),o=p}return function(e){for(let t of e){if("sampler"!==t.type||t.samplerType||!t.name.endsWith("Sampler"))continue;let i=t.name.slice(0,-7),r=e.find(e=>"texture"===e.type&&e.name===i&&e.group===t.group);r?.sampleType==="depth"&&(t.samplerType="non-filtering")}}(r),r.sort((e,t)=>e.group-t.group||e.location-t.location||e.name.localeCompare(t.name))}(i,r,n);if(!s)return null;if(!1===t.scanVertexAttributes)return{attributes:[],bindings:s};let o=function(e,t){let i=new Map;for(let r=0;r<e.length;r++){if(0!==t[r]||"struct"!==e[r].value)continue;let n=e[r+1]?.value,s=r+2;if(!Q(n)||i.has(n)||e[s]?.value!=="{")return null;let o=Y(e,s,"{","}");if(o<0)return null;i.set(n,e.slice(s+1,o)),r=o}return i}(i,r);if(!o)return null;let a=function(e,t,i,r,n){let s=function(e,t){let i=[],r=new Set;for(let n=0;n<e.length;n++){if(0!==t[n]||"fn"!==e[n].value)continue;let s=e[n+1]?.value,o=n+2;if(!Q(s)||r.has(s)||e[o]?.value!=="(")return null;let a=Y(e,o,"(",")");if(a<0)return null;let l=X(e,t,n);i.push({name:s,vertex:H(e.slice(l,n),"vertex"),parameters:e.slice(o+1,a)}),r.add(s),n=a}return i}(e,t);if(!s)return null;let o=s.filter(e=>e.vertex),a=n?o.find(e=>e.name===n):1===o.length?o[0]:void 0;if(!a)return 0!==o.length||n?null:[];let l=Z(a.parameters,",");if(!l)return null;let u=[],c=new Set,h=new Set,d=new Set;for(let e of l)if(e.length>0&&!function e(t){let{declaration:i,aliases:r,structures:n,attributes:s,attributeLocations:o,attributeNames:a,visitedStructures:l}=t,u=function(e){let t=Z(e,":");return t&&2===t.length?t[0].length:-1}(i);if(u<1||u===i.length-1)return!1;let c=function(e){for(let t=e.length-1;t>=0;t--)if(Q(e[t].value))return e[t].value;return null}(i.slice(0,u)),h=G(i.slice(0,u),"location"),d=H(i.slice(0,u),"builtin"),f=W(J(i.slice(u+1)),r);if(!c||null===h||!f||void 0!==h&&d)return!1;if(void 0!==h){var p;let e=(p=f,/^(?:i32|u32|f32|f16|vec[234]<(?:i32|u32|f32|f16)>)$/.test(p)?p:null);return!(!e||o.has(h)||a.has(c))&&(s.push({name:c,location:h,type:e}),o.add(h),a.add(c),!0)}if(d)return!0;let g=n.get(f);if(!g||l.has(f))return!1;let _=Z(g,",");if(!_)return!1;for(let i of(l.add(f),_))if(i.length>0&&!e({...t,declaration:i}))return!1;return l.delete(f),!0}({declaration:e,aliases:i,structures:r,attributes:u,attributeLocations:c,attributeNames:h,visitedStructures:d}))return null;return u.sort((e,t)=>e.location-t.location||e.name.localeCompare(t.name))}(i,r,n,o,t.vertexEntryPoint);return a?{attributes:a,bindings:s}:null}function $(e){let t=L(e),i=/[A-Za-z_][A-Za-z0-9_]*|(?:0[xX][0-9A-Fa-f]+|\d+)|[@(){}<>\[\]:,;=]/g,r=[],n=i.exec(t);for(;n;)r.push({value:n[0],index:n.index}),n=i.exec(t);return r}function W(e,t,i=new Set){let r=$(e),n="";for(let e of r){let r=t.get(e.value);if(!r){n+=function(e){let t=/^(vec[234]|mat[234]x[234])([fiuh])$/.exec(e);if(!t)return e;let i={f:"f32",i:"i32",u:"u32",h:"f16"}[t[2]];return`${t[1]}<${i}>`}(e.value);continue}if(i.has(e.value))return null;let s=new Set(i);s.add(e.value);let o=W(r,t,s);if(!o)return null;n+=o}return n}function G(e,t){let i;for(let r=0;r<e.length;r++)if("@"===e[r].value&&e[r+1]?.value===t){if(void 0!==i||e[r+2]?.value!=="("||!/^\d+$/.test(e[r+3]?.value||"")||e[r+4]?.value!==")")return null;i=Number(e[r+3].value)}return i}function H(e,t){return e.some((i,r)=>"@"===i.value&&e[r+1]?.value===t)}function q(e){return e.replace("_","-")}function Y(e,t,i,r){let n=0;for(let s=t;s<e.length;s++)if(e[s].value===i)n++;else if(e[s].value===r&&0==--n)return s;return -1}function Z(e,t){let i=[],r=0,n={"(":0,"<":0,"[":0,"{":0},s=Object.keys(n),o={")":"(",">":"<","]":"[","}":"{"};for(let a=0;a<e.length;a++){let l=e[a].value;if(l===t&&s.every(e=>0===n[e])){i.push(e.slice(r,a)),r=a+1;continue}if(l in n)n[l]++;else if(l in o){let e=o[l];if(n[e]--,n[e]<0)return null}}return s.every(e=>0===n[e])?(i.push(e.slice(r)),i):null}function K(e,t,i,r){for(let n=i;n<e.length;n++)if(0===t[n]&&e[n].value===r)return n;return -1}function X(e,t,i){for(let r=i-1;r>=0;r--)if(";"===e[r].value&&0===t[r]||"}"===e[r].value&&1===t[r])return r+1;return 0}function J(e){return e.map(e=>e.value).join("")}function Q(e){return!!(e&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))}let ee="([a-zA-Z_][a-zA-Z0-9_]*)",et=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,ei=RegExp(`^\\s*\\#\\s*ifdef\\s*${ee}\\s*$`),er=RegExp(`^\\s*\\#\\s*ifndef\\s*${ee}\\s*(?:\\/\\/.*)?$`),en=/^\s*\#\s*else\s*(?:\/\/.*)?$/,es=/^\s*\#\s*endif\s*$/,eo=RegExp(`^\\s*\\#\\s*ifdef\\s*${ee}\\s*(?:\\/\\/.*)?$`),ea=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function el(e,t){let i=e.split("\n"),r=[],n=[],s=!0;for(let e of i){let i=e.match(et),o=e.match(eo)||e.match(ei),a=e.match(er),l=e.match(en),u=e.match(ea)||e.match(es);if(i){let e=function(e,t){let i=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(i))return 0!==Number(i);if("true"===i)return!0;if("false"===i)return!1;let r=i.match(RegExp(`^!\\s*${ee}$`));if(r)return!t[r[1]];let n=i.match(RegExp(`^${ee}$`));if(n)return!!t[n[1]];let s=i.match(RegExp(`^defined\\s*\\(\\s*${ee}\\s*\\)$`));if(s)return void 0!==t[s[1]];let o=i.match(RegExp(`^!\\s*defined\\s*\\(\\s*${ee}\\s*\\)$`));if(o)return void 0===t[o[1]];throw Error(`Unsupported #if expression "${e}"`)}(i[1],t?.defines||{}),r=s&&e;n.push({parentActive:s,branchTaken:e,active:r}),s=r}else if(o||a){let e=(o||a)?.[1],i=!!t?.defines?.[e],r=o?i:!i,l=s&&r;n.push({parentActive:s,branchTaken:r,active:l}),s=l}else if(l){let e=n[n.length-1];if(!e)throw Error("Encountered #else without matching #if, #ifdef or #ifndef");e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,s=e.active}else u?(n.pop(),s=!n.length||n[n.length-1].active):s&&r.push(e)}if(n.length>0)throw Error("Unterminated conditional block in shader source");return r.join("\n")}var eu=i(62468);function ec(e){let{primitiveType:t,components:i}=eu.Co.getAttributeShaderTypeInfo(e),r="i32"===t?"int":"u32"===t?"uint":"float";return 1===i?r:`${"int"===r?"i":"uint"===r?"u":""}vec${i}`}function eh(e){let t=[],i=/@location\s*\(\s*(\d+)\s*\)/g,r=i.exec(e);for(;r;)t.push(Number(r[1])),r=i.exec(e);return t}function ed(e){let t=[],i=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=i.exec(e);for(;r;)t.push(r[1]),r=i.exec(e);return t}function ef(e,t,i,r){let n=0,s=0,o=!1;for(let a=t;a<e.length;a++){let t=e[a],l=e[a+1];if(o){"\n"===t&&(o=!1);continue}if(s>0){"/"===t&&"*"===l?(s++,a++):"*"===t&&"/"===l&&(s--,a++);continue}if("/"===t&&"/"===l){o=!0,a++;continue}if("/"===t&&"*"===l){s=1,a++;continue}if(t===i&&n++,t===r&&0==--n)return a}return -1}function ep(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function eg(e,t,i){let r=RegExp(`\\bfn\\s+${ex(t)}\\s*\\(`,"g").exec(e);if(!r)throw Error(`ShaderPlugin varyings require WGSL ${i} entry point "${t}"`);let n=e.indexOf("(",r.index),s=ew(e,n,"(",")"),o=e.indexOf("{",s),a=ew(e,o,"{","}");if(s<0||o<0||a<0)throw Error(`Unable to parse WGSL ${i} entry point "${t}"`);return{openParenthesis:n,closeParenthesis:s,openBrace:o,closeBrace:a,parameters:e.slice(n+1,s)}}function e_(e,t){let i=em(e,t);if(!i)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return i}function em(e,t){let i=RegExp(`\\bstruct\\s+${ex(t)}\\s*\\{`,"g").exec(e);if(!i)return null;let r=e.indexOf("{",i.index),n=ew(e,r,"{","}");return n<0?null:{openBrace:r,closeBrace:n,body:e.slice(r+1,n)}}function ev(e,t,i){let r=t;if("/"===e[r]&&"/"===e[r+1]){let t=e.indexOf("\n",r+2);return t<0||t>i?i:t+1}if("/"===e[r]&&"*"===e[r+1]){let t=1;for(r+=2;r<i&&t>0;)"/"===e[r]&&"*"===e[r+1]?(t++,r+=2):"*"===e[r]&&"/"===e[r+1]?(t--,r+=2):r++}return r}function eb(e){let t=[],i=/@location\s*\(\s*(\d+)\s*\)/g,r=i.exec(e);for(;r;)t.push(Number(r[1])),r=i.exec(e);return t}function ey(e){let t=[],i=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=i.exec(e);for(;r;)t.push(r[1]),r=i.exec(e);return t}function ew(e,t,i,r){let n=0,s=0,o=!1;for(let a=t;a<e.length;a++){let t=e[a],l=e[a+1];if(o){"\n"===t&&(o=!1);continue}if(s>0){"/"===t&&"*"===l?(s++,a++):"*"===t&&"/"===l&&(s--,a++);continue}if("/"===t&&"/"===l){o=!0,a++;continue}if("/"===t&&"*"===l){s=1,a++;continue}if(t===i&&n++,t===r&&0==--n)return a}return -1}function ex(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}let eE=`

${c}
`,eP=`\
precision highp float;
`;function eS(e,t){let{source:i,stage:r,language:n="glsl",modules:s,defines:o={},hookFunctions:a=[],inject:l={},pluginInjections:u={},pluginVertexInputs:c={},pluginVaryings:d={},prologue:f=!0,log:g}=t;w("string"==typeof i,"shader source must be a string");let _="glsl"===n?({name:function(e,t="unnamed"){let i=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return i?i[1]:t}(i,void 0),language:"glsl",version:function(e){let t=100,i=e.match(/[^\s]+/g);if(i&&i.length>=2&&"#version"===i[0]){let e=parseInt(i[1],10);Number.isFinite(e)&&(t=e)}if(100!==t&&300!==t)throw Error(`Invalid GLSL version ${t}`);return t}(i)}).version:-1,y=e.shaderLanguageVersion,x=100===_?"#version 100":"#version 300 es",E=i.split("\n").slice(1).join("\n"),P={};s.forEach(e=>{Object.assign(P,e.defines)}),Object.assign(P,o);let A="";switch(n){case"wgsl":break;case"glsl":A=f?`\
${x}

// ----- PROLOGUE -------------------------
#define SHADER_TYPE_${r.toUpperCase()}

${function(e){switch(e?.gpu.toLowerCase()){case"apple":return`\
#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"nvidia":return`\
#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case"intel":return`\
#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"amd":return`\
#define AMD_GPU
`;default:return`\
#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}(e)}
${"fragment"===r?eP:""}

// ----- APPLICATION DEFINES -------------------------

${function(e={}){let t="";for(let i in e){let r=e[i];(r||Number.isFinite(r))&&(t+=`#define ${i.toUpperCase()} ${e[i]}
`)}return t}(P)}

`:`${x}
`}let T=C(a),k={},I={},O={};for(let e in eM(u,k,I,O),l){let t="string"==typeof l[e]?{injection:l[e],order:0}:l[e],i=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(i){let r=i[2],n=i[3];r?"decl"===n?I[e]=[t]:O[e]=[t]:k[e]=[t]}else O[e]=[t]}if("vertex"===r){let e=function(e,t){let i=[];for(let[r,n]of Object.entries(t))(function(e,t){let i=ep(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${i}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)})(e,r),i.push(`in ${ec(n)} ${r};`);return i.join("\n")}(E,c);e&&(I["vs:#decl"]=I["vs:#decl"]||[],I["vs:#decl"].push({injection:e,order:Number.MIN_SAFE_INTEGER}))}let R=function(e,t,i){let r=[],n=[];for(let[a,l]of Object.entries(i)){var s=e,o=a;if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${ex(o)}\\s*(?:\\[|;)`).test(s))throw Error(`ShaderPlugin varying "${o}" conflicts with existing GLSL stage I/O`);let i="flat"===l.interpolation?"flat ":"",u="vertex"===t?"out":"in";r.push(`${i}${u} ${ec(l.type)} ${a};`),"vertex"===t&&n.push(`${a} = ${function(e){let{primitiveType:t,components:i}=eu.Co.getAttributeShaderTypeInfo(e),r="u32"===t?"0u":"i32"===t?"0":"0.0";return 1===i?r:`${ec(e)}(${r})`}(l.type)};`)}return{declarations:r.join("\n"),initialization:n.join("\n")}}(E,r,d);if(R.declarations){let e="vertex"===r?"vs:#decl":"fs:#decl";I[e]=I[e]||[],I[e].push({injection:R.declarations,order:Number.MIN_SAFE_INTEGER})}for(let e of(R.initialization&&(O["vs:#main-start"]=O["vs:#main-start"]||[],O["vs:#main-start"].push({injection:R.initialization,order:Number.MIN_SAFE_INTEGER})),s)){g&&p(e,E,g),A+=eC(e,r,g);let t=e.instance?.normalizedInjections[r]||{};for(let e in t){let i=/^(v|f)s:#([\w-]+)$/.exec(e);if(i){let r="decl"===i[2]?I:O;r[e]=r[e]||[],r[e].push(t[e])}else k[e]=k[e]||[],k[e].push(t[e])}}return A+="// ----- MAIN SHADER SOURCE -------------------------",A+=eE,A=h(A,r,I)+M(T[r],k)+E,A=h(A,r,O),"glsl"===n&&_!==y&&(A=function(e,t){if(300!==Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100))throw Error("luma.gl v9 only supports GLSL 3.00 shader sources");switch(t){case"vertex":return b(e,m);case"fragment":return b(e,v);default:throw Error(t)}}(A,r)),"glsl"===n&&function(e,t,i){let r=S(e).filter(e=>!e.isStd140),n=new Set;for(let e of r){if(n.has(e.blockName))continue;n.add(e.blockName);let r=e.hasLayoutQualifier?`declares ${e.layoutQualifier.replace(/\s+/g," ").trim()} instead of layout(std140)`:"does not declare layout(std140)",s=`${t} shader uniform block ${e.blockName} ${r}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;i?.warn?.(s,e)()}}(A,r,g),A.trim()}function eA(e){return function(t){let i={};for(let r of e){let e=r.getUniforms?.(t,i);Object.assign(i,e)}return i}}function eM(e,t,i,r){for(let n in e){let s=/^(v|f)s:(#)?([\w-]+)$/.exec(n);if(s){let o=s[2],a=s[3],l=o?"decl"===a?i:r:t;l[n]=l[n]||[],l[n].push(...e[n])}else r[n]=r[n]||[],r[n].push(...e[n])}}function eC(e,t,i){let r;switch(t){case"vertex":r=e.vs||"";break;case"fragment":r=e.fs||"";break;case"wgsl":r=e.source||"";break;default:w(!1)}if(!e.name)throw Error("Shader module must have a name");!function(e,t,i={}){let r=function(e,t){let i,r=Object.keys(e.uniformTypes||{});if(!r.length)return null;let n=(i="wgsl"===t?e.source:"vertex"===t?e.vs:e.fs)?function(e,t,i){var r,n;let s,o="wgsl"===t?function(e,t){let i=RegExp(`\\bstruct\\s+${t}\\b`,"m").exec(e);if(!i)return null;let r=e.indexOf("{",i.index);if(r<0)return null;let n=0;for(let t=r;t<e.length;t++){let i=e[t];if("{"===i){n++;continue}if("}"===i&&0==--n)return e.slice(r+1,t)}return null}(e,i):(r=e,n=i,s=S(r).find(e=>e.blockName===n),s?.body||null);if(!o)return null;let a=[];for(let e of o.split("\n")){let i=e.replace(/\/\/.*$/,"").trim();if(!i||i.startsWith("#"))continue;let r="wgsl"===t?i.match(/^([A-Za-z0-9_]+)\s*:/):i.match(x);r&&a.push(r[1])}return a}(i,"wgsl"===t?"wgsl":"glsl",P(e)):null;return n?{moduleName:e.name,uniformBlockName:P(e),stage:t,expectedUniformNames:r,actualUniformNames:n,matches:function(e,t){if(e.length!==t.length)return!1;for(let i=0;i<e.length;i++)if(e[i]!==t[i])return!1;return!0}(r,n)}:null}(e,t);if(!r||r.matches)return;let n=function(e){let{expectedUniformNames:t,actualUniformNames:i}=e,r=t.filter(e=>!i.includes(e)),n=i.filter(e=>!t.includes(e)),s=[`Expected ${t.length} fields, found ${i.length}.`],o=function(e,t){let i=Math.min(e.length,t.length);for(let r=0;r<i;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}(t,i);return o&&s.push(o),r.length&&s.push(`Missing from shader block (${r.length}): ${A(r)}.`),n.length&&s.push(`Unexpected in shader block (${n.length}): ${A(n)}.`),t.length<=12&&i.length<=12&&(r.length||n.length)&&(s.push(`Expected: ${t.join(", ")}.`),s.push(`Actual: ${i.join(", ")}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${s.join(" ")}`}(r);i.log?.error?.(n,r)(),!1!==i.throwOnError&&w(!1,n)}(e,t,{log:i});let n=e.name.toUpperCase().replace(/[^0-9a-z]/gi,"_"),s=`\
// ----- MODULE ${e.name} ---------------

`;return"wgsl"!==t&&(s+=`#define MODULE_${n}
`),s+=`${r}
`}function eT(e,t,i){if(0===e&&t>=100)throw Error(`Application binding "${i}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function ek(e,t,i,r){if(0===t&&i<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${i}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function eI(e,t,i,r){let n=e.get(t)||new Set;if(n.has(i))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${i}.`);n.add(i),e.set(t,n)}function eO(e,t,i){return`${e}:${t}:${i}`}class eR{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(e){return(w("glsl"===e||"wgsl"===e),"wgsl"===e)?(eR.defaultShaderAssemblers.wgsl=eR.defaultShaderAssemblers.wgsl||new eB,eR.defaultShaderAssemblers.wgsl):(eR.defaultShaderAssemblers.glsl=eR.defaultShaderAssemblers.glsl||new eL,eR.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===("string"==typeof e?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t="string"==typeof e?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),i={},r=0;for(let e=0,n=this._defaultModules.length;e<n;++e){let n=this._defaultModules[e],s=n.name;t[r++]=n,i[s]=!0}for(let n=0,s=e.length;n<s;++n){let s=e[n],o=s.name;i[o]||(t[r++]=s,i[o]=!0)}return t.length=r,f(t),t}}class eL extends eR{shaderLanguage="glsl";assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),i=this._hookFunctions;return{...function(e){let{vs:t,fs:i}=e,r=g(e.modules||[]);return{vs:eS(e.platformInfo,{...e,source:t,stage:"vertex",modules:r}),fs:eS(e.platformInfo,{...e,source:i,stage:"fragment",modules:r}),getUniforms:eA(r)}}({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:i}),modules:t}}}class eB extends eR{shaderLanguage="wgsl";_wgslBindingRegistry=new Map;assembleWGSLShader(e){let t=this._getModuleList(e.modules),i=this._hookFunctions,r=eB.getShaderPreprocessorDefines(e,t),n="wgsl"===e.platformInfo.shaderLanguage&&e.source?el(e.source,{defines:r}):e.source,{source:s,getUniforms:o,bindingAssignments:a}=function(e){let t=g(e.modules||[]),{source:i,bindingAssignments:r}=function(e,t){var i,r,n,s,o,a,l,u,c,d,f;let g,{source:_,stage:m,modules:v,defines:b={},hookFunctions:y=[],inject:x={},pluginInjections:E={},pluginVertexInputs:P={},pluginVaryings:S={},vertexEntryPoint:A="vertexMain",fragmentEntryPoint:T="fragmentMain",log:L}=t;w("string"==typeof _,"shader source must be a string");let N=function(e,t,i){let r=Object.entries(i);if(0===r.length)return{source:e,declarations:"",initialization:""};let n=function(e,t){let i=RegExp(`\\bfn\\s+${ep(t)}\\s*\\(`,"g").exec(e);if(!i)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf("(",i.index),n=ef(e,r,"(",")");if(n<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:n}}(e,t),s=e.slice(n.openParenthesis+1,n.closeParenthesis),o=function(e,t){let i=eh(t),r=new Set(ed(t));for(let n of function(e){let t=[],i=/:\s*([A-Za-z_][\w]*)\b/g,r=i.exec(e);for(;r;)t.push(r[1]),r=i.exec(e);return t}(t)){let t=function(e,t){let i=RegExp(`\\bstruct\\s+${ep(t)}\\s*\\{`,"g").exec(e);if(!i)return null;let r=e.indexOf("{",i.index),n=ef(e,r,"{","}");return n<0?null:e.slice(r+1,n)}(e,n);if(null!==t)for(let e of(i.push(...eh(t)),ed(t)))r.add(e)}return{locations:i,names:r}}(e,s),a=new Set(o.locations),l=[],u=[],c=[];for(let[t,i]of r){if(o.names.has(t)||function(e,t){let i=ep(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${i}\\b`,"g"),n=r.exec(e);for(;n;){if(0===function(e,t){let i=0,r=0,n=!1;for(let s=0;s<t;s++){let t=e[s],o=e[s+1];if(n){"\n"===t&&(n=!1);continue}if(r>0){"/"===t&&"*"===o?(r++,s++):"*"===t&&"/"===o&&(r--,s++);continue}"/"===t&&"/"===o?(n=!0,s++):"/"===t&&"*"===o?(r=1,s++):"{"===t?i++:"}"===t&&i--}return i}(e,n.index))return!0;n=r.exec(e)}return!1}(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=function(e){let t=0;for(;e.has(t);)t++;return t}(a);a.add(r);let n=`_luma_${t}`;l.push(`@location(${r}) ${n}: ${i}`),u.push(`var<private> ${t}: ${i};`),c.push(`${t} = ${n};`)}let h=s.trim()?",\n  ":"\n  ",d=s.trim()?"":"\n",f=`${s}${h}${l.join(",\n  ")}${d}`;return{source:e.slice(0,n.openParenthesis+1)+f+e.slice(n.closeParenthesis),declarations:u.join("\n"),initialization:c.join("\n")}}(el(_,{defines:b}),A,P),D=function(e,t,i,r){let n=Object.entries(r);if(0===n.length)return{source:e,declarations:"",vertexInitialization:"",fragmentInitialization:""};let s=e,o=eg(s,t,"vertex"),a=function(e,t){let i=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(i.trim());if(!r||null===em(e,r[1]))throw Error("ShaderPlugin varyings require the WGSL vertex entry point to return a named struct");return r[1]}(s,o),l=eg(s,i,"fragment"),u=function(e,t){let i=[];for(let r of function(e){let t=[],i=0,r=0,n=0;for(let s=0;s<e.length;s++){let o=e[s];"("===o&&r++,")"===o&&r--,"<"===o&&n++,">"===o&&n--,","===o&&0===r&&0===n&&(t.push(e.slice(i,s)),i=s+1)}return t.push(e.slice(i)),t}(t.parameters)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&em(e,t[2])&&i.push({name:t[1],type:t[2]})}if(1!==i.length)throw Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${i.length}`);return i[0]}(s,l),c=e_(s,a),h=e_(s,u.type),d=new Set([...ey(o.parameters),...ey(c.body),...ey(l.parameters),...ey(h.body)]),f=new Set([...eb(c.body),...eb(h.body)]),p=[],g=[],_=[],m=[];for(let[e,t]of n){if(d.has(e)||function(e,t){let i=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${ex(t)}\\b`,"g"),r=i.exec(e);for(;r;){if(0===function(e,t){let i=0;for(let r=0;r<t;r++){let n=ev(e,r,t);if(n!==r){r=n-1;continue}"{"===e[r]&&i++,"}"===e[r]&&i--}return i}(e,r.index))return!0;r=i.exec(e)}return!1}(s,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let i=function(e){let t=0;for(;e.has(t);)t++;return t}(f);f.add(i);let r="flat"===t.interpolation?" @interpolate(flat)":"";p.push(`  @location(${i})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${function(e){let{primitiveType:t,components:i}=eu.Co.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return 1===i?r:`${e}(${r})`}(t.type)};`),m.push(`${e} = ${u.name}.${e};`)}for(let e of(function(e,t,i,r){let n=RegExp(`\\b${ex(t)}\\s*\\(`,"g"),s=n.exec(e);for(;s;){if(s.index<i||s.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);s=n.exec(e)}}(s,a,o.openBrace,o.closeBrace),o=eg(s=function(e,t,i,r){let n=RegExp(`\\b${ex(t)}\\s*\\(`,"g"),s=[],o=n.exec(e);for(;o;){if(o.index>i.openBrace&&o.index<i.closeBrace){let r=e.indexOf("(",o.index),n=ew(e,r,"(",")");if(n<0||n>i.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);s.push({openParenthesis:r,closeParenthesis:n})}o=n.exec(e)}for(let t of s.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let i=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?", ":"";e=e.slice(0,t.closeParenthesis)+i+r.join(", ")+e.slice(t.closeParenthesis)}return e}(s,a,o,n.map(([e])=>e)),t,"vertex"),s=function(e,t,i){let r=function(e,t,i){let r=[],n=t;for(;n<i;)if(n=ev(e,n,i),"return"!==e.slice(n,n+6)||/[A-Za-z0-9_]/.test(e[n+6]||""))n++;else{let t=n+6,s=function(e,t,i){let r=0,n=0;for(let s=t;s<i;s++){let t=ev(e,s,i);if(t!==s){s=t-1;continue}let o=e[s];if("("===o&&r++,")"===o&&r--,"["===o&&n++,"]"===o&&n--,";"===o&&0===r&&0===n)return s}return -1}(e,t,i);if(s<0)throw Error("Unable to parse WGSL return statement in selected vertex entry point");r.push({start:n,expressionStart:t,semicolon:s}),n=s+1}return r}(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let n=r[t],s=e.slice(n.expressionStart,n.semicolon).trim();if(!s)throw Error("ShaderPlugin varying vertex entry point cannot use an empty return");let o=`_luma_vertexOutput${t}`,a=i.map(e=>`${o}.${e} = ${e};`).join("\n"),l=`{
var ${o} = ${s};
${a}
return ${o};
}`;e=e.slice(0,n.start)+l+e.slice(n.semicolon+1)}return e}(s,o,n.map(([e])=>e)),(a===u.type?[a]:[a,u.type]).map(e=>e_(s,e).closeBrace).sort((e,t)=>t-e)))s=s.slice(0,e)+`${p.join("\n")}
`+s.slice(e);if(l=eg(s,i,"fragment"),!RegExp(`\\b${ex(u.name)}\\s*:`).test(l.parameters))throw Error(`Unable to preserve WGSL fragment input "${u.name}"`);return{source:s,declarations:g.join("\n"),vertexInitialization:_.join("\n"),fragmentInitialization:m.join("\n")}}(N.source,A,T,S),F=D.source,U="",V=C(y),$={},W={},G={};for(let e in eM(E,$,W,G),x){let t="string"==typeof x[e]?{injection:x[e],order:0}:x[e],i=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(i){let r=i[2],n=i[3];r?"decl"===n?W[e]=[t]:G[e]=[t]:$[e]=[t]}else G[e]=[t]}i=N.declarations,r=N.initialization,n=W,s=G,i&&(n["vs:#decl"]=n["vs:#decl"]||[],n["vs:#decl"].push({injection:i,order:Number.MIN_SAFE_INTEGER})),r&&(s["vs:#main-start"]=s["vs:#main-start"]||[],s["vs:#main-start"].push({injection:r,order:Number.MIN_SAFE_INTEGER})),o=D,a=W,l=G,o.declarations&&(a["vs:#decl"]=a["vs:#decl"]||[],a["vs:#decl"].push({injection:o.declarations,order:Number.MIN_SAFE_INTEGER})),o.vertexInitialization&&(l["vs:#main-start"]=l["vs:#main-start"]||[],l["vs:#main-start"].push({injection:o.vertexInitialization,order:Number.MIN_SAFE_INTEGER})),o.fragmentInitialization&&(l["fs:#main-start"]=l["fs:#main-start"]||[],l["fs:#main-start"].push({injection:o.fragmentInitialization,order:Number.MIN_SAFE_INTEGER}));let H=function(e){let t=B(e,I),i=new Map;for(let e of t){if("auto"===e.bindingToken)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);eT(r,t,e.name),eI(i,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},n=j(e,I,e=>(function(e,t,i){let{match:r,bindingToken:n,groupToken:s,name:o}=e,a=Number(s);if("auto"===n){let e=function(e,t){let i=t.get(e)||new Set,r=0;for(;i.has(r);)r++;return r}(a,t);return eT(a,e,o),eI(t,a,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return i.sawSupportedBindingDeclaration=!0,r})(e,i,r));if(z(e)&&!r.sawSupportedBindingDeclaration)throw Error('Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.');return{source:n}}(F),q=function(e){let t=new Map;for(let i of B(e,O)){let e=Number(i.bindingToken),r=Number(i.groupToken);eT(r,e,i.name),eI(t,r,e,`application binding "${i.name}"`)}return t}(H.source),Y=function(e,t,i,r){let n=new Map;if(!t)return n;for(let s of e)for(let e of function(e,t){let i=[];for(let r of B(el(e.source||"",{defines:t}),k))i.push({name:r.name,group:Number(r.groupToken)});return i}(s,r)){let r=eO(e.group,s.name,e.name),o=t.get(r);if(void 0!==o){let t=n.get(e.group)||new Map,s=t.get(o);if(s&&s!==r)throw Error(`Duplicate WGSL binding reservation for modules "${s}" and "${r}": group ${e.group}, binding ${o}.`);eI(i,e.group,o,`registered module binding "${r}"`),t.set(o,r),n.set(e.group,t)}}return n}(v,t._bindingRegistry,q,b),Z=[];for(let e of v){L&&p(e,F,L);let i=function(e,t,i){let r=[],n={sawSupportedBindingDeclaration:B(e,k).length>0,nextHintedBindingLocation:"number"==typeof t.firstBindingSlot?t.firstBindingSlot:null},s=j(e,k,e=>(function(e,t){let{module:i,context:r,bindingAssignments:n,relocationState:s}=t,{match:o,bindingToken:a,groupToken:l,name:u}=e,c=Number(l);if("auto"===a){let e=eO(c,i.name,u),t=r.bindingRegistry?.get(e),a=void 0!==t?t:function(e,t,i,r,n){let s=t.get(e)||new Set,o=new Set,a=`${e}:`,l=`${a}${i}:`;for(let[e,t]of n||[])e.startsWith(l)&&o.add(t);let u=r??(0===e?100:s.size>0?Math.max(...s)+1:0);for(;s.has(u)||o.has(u);)u++;for(let[e,t]of n||[])t===u&&e.startsWith(a)&&n?.delete(e);return u}(c,r.usedBindingsByGroup,i.name,s.nextHintedBindingLocation??void 0,r.bindingRegistry);return(ek(i.name,c,a,u),void 0!==t&&function(e,t,i,r){let n=e.get(t);if(!n)return!1;let s=n.get(i);if(!s)return!1;if(s!==r)throw Error(`Registered module binding "${r}" collided with "${s}": group ${t}, binding ${i}.`);return!0}(r.reservedBindingKeysByGroup,c,a,e))?n.push({moduleName:i.name,name:u,group:c,location:a}):(eI(r.usedBindingsByGroup,c,a,`module "${i.name}" binding "${u}"`),r.bindingRegistry?.set(e,a),n.push({moduleName:i.name,name:u,group:c,location:a}),null!==s.nextHintedBindingLocation&&void 0===t&&(s.nextHintedBindingLocation=a+1)),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${a})`)}let h=Number(a);return ek(i.name,c,h,u),eI(r.usedBindingsByGroup,c,h,`module "${i.name}" binding "${u}"`),n.push({moduleName:i.name,name:u,group:c,location:h}),o})(e,{module:t,context:i,bindingAssignments:r,relocationState:n}));if(z(e)&&!n.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:s,bindingAssignments:r}}(el(eC(e,"wgsl",L),{defines:b}),e,{usedBindingsByGroup:q,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:Y});Z.push(...i.bindingAssignments),U+=i.source;let r=(u=e,{...u.instance?.normalizedInjections.vertex||{},...u.instance?.normalizedInjections.fragment||{}});for(let e in r){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let i="decl"===t[2]?W:G;i[e]=i[e]||[],i[e].push(r[e])}else $[e]=$[e]||[],$[e].push(r[e])}}return U+=eE,U=h(U,m,(g=[...(c=W)["vs:#decl"]||[],...c["fs:#decl"]||[]]).length?{"vs:#decl":g}:{},!1,"wgsl",{vertex:A,fragment:T})+(d=V,f=$,M(d.vertex,f,"wgsl")+M(d.fragment,f,"wgsl"))+function(e){if(0===e.length)return"";let t="// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------\n";for(let i of e)t+=`// ${i.moduleName}.${i.name} -> @group(${i.group}) @binding(${i.location})
`;return t+"\n"}(Z)+H.source,function(e){var t,i;let r,n=B(e,k==k||k===I?R:k).find(e=>"auto"===e.bindingToken);if(!n)return;let s=function(e,t){let i,r,n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm;for(r=n.exec(e);r&&r.index<=t;)i=r[1],r=n.exec(e);return i}(e,n.index);if(s)throw Error(`Unresolved @binding(auto) for module "${s}" binding "${n.name}" remained in assembled WGSL source.`);if(t=e,i=n.index,!((r=t.indexOf(eE))>=0)||i>r)throw Error(`Unresolved @binding(auto) for application binding "${n.name}" remained in assembled WGSL source.`);throw Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${n.match.replace(/\s+/g," ").trim()}".`)}(U=h(U,m,G,!1,"wgsl",{vertex:A,fragment:T})),{source:U,bindingAssignments:Z}}(e.platformInfo,{...e,source:e.source,stage:"vertex",modules:t});return{source:i,getUniforms:eA(t),bindingAssignments:r,bindingTable:D(i,r),shaderLayout:V(i,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}({...e,source:n,defines:r,_bindingRegistry:this._wgslBindingRegistry,modules:t,hookFunctions:i}),l="wgsl"===e.platformInfo.shaderLanguage?el(s,{defines:r}):s;return{source:l,getUniforms:o,modules:t,bindingAssignments:a,bindingTable:D(l,a),shaderLayout:V(l,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}static getShaderPreprocessorDefines(e,t){return{...eB.getPlatformPreprocessorDefines(e.platformInfo),...t.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...e.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:"webgpu"===e.type&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:"webgpu"===e.type&&"nvidia"!==e.gpu.toLowerCase()&&"amd"!==e.gpu.toLowerCase(),LUMA_FP64_INTEGER_ARITHMETIC:"webgpu"===e.type&&"apple"===e.gpu.toLowerCase()}}}let ej=[i(3065).A],ez=["vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)","vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)","vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)","fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)"],eN=[],eD=`\
layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,eF={name:"layer",source:`\
struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,vs:eD,fs:eD,getUniforms:e=>({opacity:Math.pow(e.opacity,1/2.2)}),uniformTypes:{opacity:"f32"}};var eU=i(12897),eV=i(3459),e$=i(43411),eW=i(38055);function eG(){let e;if("u">typeof window&&window.performance)e=window.performance.now();else if("u">typeof process&&process.hrtime){let t=process.hrtime();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}class eH{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=eG(),this._timerPending=!0,this}timeEnd(){return this._timerPending&&(this.addTime(eG()-this._startTime),this._timerPending=!1,this._checkSampling()),this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}}class eq{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t="count"){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:i}=e,r=this.stats[t];return r||(r=e instanceof eH?e:new eH(t,i),this.stats[t]=r),r}}var eY=i(69634);class eZ{constructor(e,t,i){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=i,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let i=++this._loadCount,r=e;for(let t of("string"==typeof e&&(r=(0,eY.H)(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e),this._subscribers))t.onChange(this.getData())}}class eK{constructor(e){this.protocol=e.protocol||"resource://",this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return!!e.startsWith(this.protocol)||e in this._resources}add({resourceId:e,data:t,forceUpdate:i=!1,persistent:r=!0}){let n=this._resources[e];n?n.setData(t,i):(n=new eZ(e,t,this._context),this._resources[e]=n),n.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let i=t[e],r=this._resources[i.resourceId];r&&r.unsubscribe(i)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:i,requestId:r="default"}){let{_resources:n,protocol:s}=this;e.startsWith(s)&&(n[e=e.replace(s,"")]||this.add({resourceId:e,data:null,persistent:!1}));let o=n[e];if(this._track(i,r,o,t),o)return o.getData()}prune(){this._pruneRequest||(this._pruneRequest=setTimeout(()=>this._prune(),0))}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,i,r){let n=this._consumers,s=n[e]=n[e]||{},o=s[t],a=o&&o.resourceId&&this._resources[o.resourceId];a&&(a.unsubscribe(o),this.prune()),i&&(o?(o.onChange=r,o.resourceId=i.id):o={onChange:r,resourceId:i.id},s[t]=o,i.subscribe(o))}_prune(){for(let e of(this._pruneRequest=null,Object.keys(this._resources))){let t=this._resources[e];t.persistent||t.inUse()||(t.delete(),delete this._resources[e])}}}var eX=i(47345);class eJ{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{(0,e$.A)("layerManager.activateViewport",this,e),e&&(this.context.viewport=e)};let{deck:i,stats:n,viewport:s,timeline:o}=t||{};this.layers=[],this.resourceManager=new eK({device:e,protocol:"deck://"}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:i,shaderAssembler:function(e){let t=eR.getDefaultShaderAssembler(e);for(let e of ej)t.addDefaultModule(e);for(let i of(t._hookFunctions.length=0,"glsl"===e?ez:eN))t.addShaderHook(i);return t}(e?.info?.shadingLanguage||"glsl"),defaultShaderModules:[eF],renderPass:void 0,stats:n||new eq({id:"deck.gl"}),viewport:s||new eX.A({id:"DEFAULT-INITIAL-VIEWPORT"}),timeline:o||new r.K,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){for(let e of(this.resourceManager.finalize(),this.layers))this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;for(let i of(e.clearRedrawFlags&&(this._needsRedraw=!1),this.layers)){let r=i.getNeedsRedraw(e);t=t||r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?"layers changed":this._defaultShaderModulesChanged?"shader modules changed":this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>0===t.id.indexOf(e))):this.layers}setProps(e){"debug"in e&&(this._debug=e.debug),"userData"in e&&(this.context.userData=e.userData),"layers"in e&&(this._nextLayers=e.layers),"onError"in e&&(this.context.onError=e.onError)}setLayers(e,t){(0,e$.A)("layerManager.setLayers",this,t,e),this._lastRenderedLayers=e;let i=(0,eW.B)(e,Boolean);for(let e of i)e.context=this.context;this._updateLayers(this.layers,i)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,i=t.findIndex(t=>t.name===e.name);i>=0&&(t.splice(i,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,i){i.raiseError(t,`${e} of ${i}`)}_updateLayers(e,t){let i={};for(let t of e)i[t.id]?eV.A.warn(`Multiple old layers with same id ${t.id}`)():i[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,i,r),this._finalizeOldLayers(i);let n=!1;for(let e of r)if(e.hasUniformTransition()){n=`Uniform transition in ${e}`;break}this._needsUpdate=n,this.layers=r}_updateSublayersRecursively(e,t,i){for(let r of e){r.context=this.context;let e=t[r.id];null===e&&eV.A.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let n=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),i.push(r),n=r.isComposite?r.getSubLayers():null}catch(e){this._handleError("matching",e,r)}n&&this._updateSublayersRecursively(n,t,i)}}_finalizeOldLayers(e){for(let t in e){let i=e[t];i&&this._finalizeLayer(i)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=eU.VD.INITIALIZED}catch(t){this._handleError("initialization",t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=eU.VD.MATCHED,t!==e&&(e.lifecycle=eU.VD.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError("update",t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=eU.VD.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=eU.VD.FINALIZED}catch(t){this._handleError("finalization",t,e)}}}var eQ=i(7914);let e0="default-canvas";class e2{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw="First render",this._needsUpdate="Initialize",this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let i=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!("x"in e)||t.containsPixel(e);return i&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t="string"==typeof e?this.getView(e):e,i=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(i):i}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t="string"==typeof e?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let i=this.getViewports(),r={x:e[0],y:e[1]};for(let n=i.length-1;n>=0;--n){let s=i[n];if(s.containsPixel(r)){let i=e.slice();return i[0]-=s.x,i[1]-=s.y,s.unproject(i,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),("width"in e||"height"in e)&&this._setSize(e.width,e.height),"pickPosition"in e&&(this._pickPosition=e.pickPosition),"eventManagers"in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate("Size changed"))}_setViews(e){e=(0,eW.B)(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate("views changed"),this.views=e}_setViewState(e){e?((0,eQ.b)(e,this.viewState,3)||this.setNeedsUpdate("viewState changed"),this.viewState=e):eV.A.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate("eventManagers changed"))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||e0}_getCanvasDimensions(e){let t=this._getCanvasContext?.(e.id),[i,r]=t?.getCSSSize()||[this.width,this.height];return{width:i,height:r}}_getViewEventManager(e){let t=this.getCanvasId(e)||e0;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,i){return e&&(t?.canvasId!==i.canvasId||t?.eventManager!==i.eventManager)?(e.finalize(),null):e}_createController(e,t){return new t.type({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,i)=>this._pickPosition?.(t,i,e.id)})}_updateController(e,t,i,r){let n=e.controller;if(n&&i){let s={...t,...n,id:e.id,x:i.x,y:i.y,width:i.width,height:i.height};return r&&r.constructor===n.type||(r=this._createController(e,s)),r&&r.setProps(s),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:i}=this._startViewportRebuild(),r=!1;for(let n=e.length;n--;){let s=e[n],{width:o,height:a}=this._getCanvasDimensions(s),l=this._getViewEventManager(s);this._viewEventManagers[s.id]=l;let u=this.getViewState(s),c=s.makeViewport({viewState:u,width:o,height:a}),h=this._getReusableController(t[s.id],i[s.id],l),d=!!s.controller;d&&!h&&(r=!0),(r||!d)&&h&&(h.finalize(),h=null),this.controllers[s.id]=this._updateController(s,u,c,h),c&&this._viewports.unshift(c)}for(let e in t){let i=t[e];i&&!this.controllers[e]&&i.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length!==t.length||e.some((i,r)=>!e[r].equals(t[r]))}}var e1=i(23062);let e3=[255,255,255],e4=0;class e6{constructor(e={}){this.type="ambient";let{color:t=e3}=e,{intensity:i=1}=e;this.id=e.id||`ambient-${e4++}`,this.color=t,this.intensity=i}}var e5=i(87597);let e8=[255,255,255],e9=[0,0,-1],e7=0;class te{constructor(e={}){this.type="directional";let{color:t=e8}=e,{intensity:i=1}=e,{direction:r=e9}=e,{_shadow:n=!1}=e;this.id=e.id||`directional-${e7++}`,this.color=t,this.intensity=i,this.type="directional",this.direction=new e5.P(r).normalize().toArray(),this.shadow=n}getProjectedLight(e){return this}}var tt=i(31886);class ti{constructor(e,t={id:"pass"}){let{id:i}=t;this.id=i,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}}let tr={depthWriteEnabled:!0,depthCompare:"less-equal",blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one-minus-src-alpha",blendAlphaOperation:"add",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha"};class tn extends ti{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,i=e.target??t.getCurrentFramebuffer(),[r,n]=t.getDrawingBufferSize(),s=e.clearCanvas??!0,o=e.clearColor??(!!s&&[0,0,0,0]),a=!!s&&1,l=!!s&&0,u=e.colorMask??15,c={viewport:[0,0,r,n]};e.colorMask&&(c.colorMask=u),e.scissorRect&&(c.scissorRect=e.scissorRect);let{shaderModuleProps:h,viewports:d,views:f,onViewportActive:p,clearStack:g=!0}=e,_=e.pass||"unknown",m="webgpu"===this.device.type;g&&(this._lastRenderIndex=-1);let v=[];if(!d.length)return this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l}).end(),this.device.submit(),v;try{for(let r of d){p?.(r);let n=this._getDrawLayerParams(r,e),s=f&&f[r.id],u=r.subViewports||[r];for(let r of m?u.map(e=>[e]):[u]){let u=this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l});try{for(let o of r){let r=this._drawLayersInViewport(u,{target:i,canvasContext:t,shaderModuleProps:h,viewport:o,view:s,pass:_,layers:e.layers,isPicking:e.isPicking},n);v.push(r)}}finally{u.end(),m&&this.device.submit()}o=!1,a=!1,l=!1}}return v}finally{m||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:i,isPicking:r=!1,layerFilter:n,cullRect:s,views:o,effects:a,canvasContext:l=this.device.canvasContext,shaderModuleProps:u},c=!1){let h=[],d=function e(t=0,i={}){let r={},n=(s,o)=>{let a,l=s.props._offset,u=s.id,c=s.parent&&s.parent.id;if(!c||c in i||n(s.parent,!1),c in r){let t=r[c]=r[c]||e(i[c],i);a=t(s,o),r[u]=t}else Number.isFinite(l)?(a=l+(i[c]||0),r[u]=null):a=t;return o&&a>=t&&(t=a+1),i[u]=a,a};return n}(this._lastRenderIndex+1),f={layer:t[0],viewport:e,isPicking:r,renderPass:i,cullRect:s},p={};for(let r=0;r<t.length;r++){let s=t[r],g=this._shouldDrawLayer(s,f,n,p),_={shouldDrawLayer:g};g&&!c&&(_.shouldDrawLayer=!0,_.layerRenderIndex=d(s,g),_.shaderModuleProps=this._getShaderModuleProps(s,a,i,l,u),_.layerParameters={..."webgpu"===s.context.device.type?tr:null,...s.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(s,r,e)}),h[r]=_}return h}_drawLayersInViewport(e,{layers:t,shaderModuleProps:i,pass:r,target:n,canvasContext:s,viewport:o,view:a,isPicking:l},u){let c=function(e,{canvasContext:t=e.canvasContext,shaderModuleProps:i,target:r,viewport:n}){let s=i?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),a=r?r.height:o;return[n.x*s,"webgpu"===e.type?n.y*s:a-(n.y+n.height)*s,n.width*s,n.height*s]}(this.device,{canvasContext:s,shaderModuleProps:i,target:n,viewport:o});if(a){let{clear:e,clearColor:t,clearDepth:i,clearStencil:r}=a.props;if(e){let e=[0,0,0,0],s=1,o=0;Array.isArray(t)&&!l?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):!1===t&&(e=!1),void 0!==i&&(s=i),void 0!==r&&(o=r),this.device.beginRenderPass({framebuffer:n,parameters:{viewport:c,scissorRect:c},clearColor:e,clearDepth:s,clearStencil:o}).end()}}let h={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:c});for(let i=0;i<t.length;i++){let n=t[i],s=u[i],{shouldDrawLayer:a}=s;if(a&&n.props.pickable&&h.pickableCount++,n.isComposite&&h.compositeCount++,n.isDrawable&&s.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:i,layerParameters:a}=s;h.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),i.project&&(i.project.viewport=o),n.context.renderPass=e;try{n._drawLayer({renderPass:e,shaderModuleProps:i,uniforms:{layerIndex:t},parameters:a})}catch(e){n.raiseError(e,`drawing ${n} to ${r}`)}}}return h}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,i){return null}getLayerParameters(e,t,i){return e.props.parameters}_shouldDrawLayer(e,t,i,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let n=e.parent;for(;n;){if(!n.props.visible||!n.filterSubLayer(t))return!1;t.layer=n,n=n.parent}if(i){let e=t.layer.id;if(e in r||(r[e]=i(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,i,r,n){let s=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,a={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:s,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let i of t)ts(a,i.getShaderModuleProps?.(e,a));for(let t of e.context.defaultShaderModules)t.name in a||(a[t.name]={});return ts(a,this.getShaderModuleProps(e,t,a),n)}}function ts(e,...t){for(let i of t)if(i)for(let t in i)e[t]?Object.assign(e[t],i[t]):e[t]=i[t];return e}class to extends tn{constructor(e,t){super(e,t);let i=e.createTexture({format:"rgba8unorm",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),r=e.createTexture({format:"depth16unorm",width:1,height:1});this.fbo=e.createFramebuffer({id:"shadowmap",width:1,height:1,colorAttachments:[i],depthStencilAttachment:r})}delete(){this.fbo&&(this.fbo.destroy(),this.fbo=null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,i=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],n=r.width*i,s=r.height*i;(n!==t.width||s!==t.height)&&t.resize({width:n,height:s}),super.render({...e,clearColor:[1,1,1,1],target:t,pass:"shadow"})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:"less-equal"}}shouldDrawLayer(e){return!1!==e.props.shadowEnabled}getShaderModuleProps(e,t,i){return{shadow:{project:i.project,drawToShadowMap:!0}}}}var ta=i(9350),tl=i(57162),tu=i(82417),tc=i(67681),th=i(74334);let td=`
layout(std140) uniform shadowUniforms {
  bool drawShadowMap;
  bool useShadowMap;
  vec4 color;
  highp int lightId;
  float lightCount;
  mat4 viewProjectionMatrix0;
  mat4 viewProjectionMatrix1;
  vec4 projectCenter0;
  vec4 projectCenter1;
} shadow;
`,tf=`
const int max_lights = 2;

out vec3 shadow_vPosition[max_lights];

vec4 shadow_setVertexPosition(vec4 position_commonspace) {
  mat4 viewProjectionMatrices[max_lights];
  viewProjectionMatrices[0] = shadow.viewProjectionMatrix0;
  viewProjectionMatrices[1] = shadow.viewProjectionMatrix1;
  vec4 projectCenters[max_lights];
  projectCenters[0] = shadow.projectCenter0;
  projectCenters[1] = shadow.projectCenter1;

  if (shadow.drawShadowMap) {
    return project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[shadow.lightId], projectCenters[shadow.lightId]);
  }
  if (shadow.useShadowMap) {
    for (int i = 0; i < max_lights; i++) {
      if(i < int(shadow.lightCount)) {
        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[i], projectCenters[i]);
        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;
      }
    }
  }
  return gl_Position;
}
`,tp=`
${td}
${tf}
`,tg=`
const int max_lights = 2;
uniform sampler2D shadow_uShadowMap0;
uniform sampler2D shadow_uShadowMap1;

in vec3 shadow_vPosition[max_lights];

const vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
const vec4 bitUnpackShift = 1.0 / bitPackShift;
const vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);

float shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {
  vec4 rgbaDepth = texture(shadowMap, position.xy);

  float z = dot(rgbaDepth, bitUnpackShift);
  return smoothstep(0.001, 0.01, position.z - z);
}

vec4 shadow_filterShadowColor(vec4 color) {
  if (shadow.drawShadowMap) {
    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);
    rgbaDepth -= rgbaDepth.gbaa * bitMask;
    return rgbaDepth;
  }
  if (shadow.useShadowMap) {
    float shadowAlpha = 0.0;
    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);
    if(shadow.lightCount > 1.0) {
      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);
    }
    shadowAlpha *= shadow.color.a / shadow.lightCount;
    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);

    return vec4(
      mix(color.rgb, shadow.color.rgb, shadowAlpha / blendedAlpha),
      blendedAlpha
    );
  }
  return color;
}
`,t_=`
${td}
${tg}
`,tm=(0,tu.A)(function({viewport:e,center:t}){return new tt.k(e.viewProjectionMatrix).invert().transform(t)}),tv=(0,tu.A)(function({viewport:e,shadowMatrices:t}){let i=[],r=e.pixelUnprojectionMatrix,n=e.isGeospatial?void 0:1,s=[[0,0,n],[e.width,0,n],[0,e.height,n],[e.width,e.height,n],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>(function(e,t){let[i,r,n]=e,s=(0,tc.xJ)([i,r,n],t);return Number.isFinite(n)?s:[s[0],s[1],0]})(e,r));for(let r of t){let t=r.clone().translate(new e5.P(e.center).negate()),n=s.map(e=>t.transform(e)),o=new tt.k().ortho({left:Math.min(...n.map(e=>e[0])),right:Math.max(...n.map(e=>e[0])),bottom:Math.min(...n.map(e=>e[1])),top:Math.max(...n.map(e=>e[1])),near:Math.min(...n.map(e=>-e[2])),far:Math.max(...n.map(e=>-e[2]))});i.push(o.multiplyRight(r))}return i}),tb=[0,0,0,1],ty=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],tw={name:"shadow",dependencies:[tl.A],vs:tp,fs:t_,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:function(e){let{shadowEnabled:t=!0,project:i}=e;if(!t||!i||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=tl.A.getUniforms(i),n=tm({viewport:i.viewport,center:r.center}),s=[],o=tv({shadowMatrices:e.shadowMatrices,viewport:i.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],a=e.clone().translate(new e5.P(i.viewport.center).negate());r.coordinateSystem===(0,th.LB)("lnglat")&&r.projectionMode===ta.Kx.WEB_MERCATOR?(o[t]=a,s[t]=n):(o[t]=e.clone().multiplyRight(ty),s[t]=a.transform(n))}let a={drawShadowMap:!!e.drawToShadowMap,useShadowMap:!!e.shadowMaps&&e.shadowMaps.length>0,color:e.shadowColor||tb,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)a[`viewProjectionMatrix${e}`]=o[e],a[`projectCenter${e}`]=s[e];for(let t=0;t<2;t++)a[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return a},uniformTypes:{drawShadowMap:"f32",useShadowMap:"f32",color:"vec4<f32>",lightId:"i32",lightCount:"f32",viewProjectionMatrix0:"mat4x4<f32>",viewProjectionMatrix1:"mat4x4<f32>",projectCenter0:"vec4<f32>",projectCenter1:"vec4<f32>"}},tx={color:[255,255,255],intensity:1},tE=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],tP=[0,0,0,200/255];class tS{constructor(e={}){this.id="lighting-effect",this.shadowColor=tP,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:i}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),i._addDefaultShaderModule(tw),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){for(let t in this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[],e){let i=e[t];switch(i.type){case"ambient":this.ambientLight=i;break;case"directional":this.directionalLights.push(i);break;case"point":this.pointLights.push(i)}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:n}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let s=0;s<this.shadowPasses.length;s++)this.shadowPasses[s].render({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:n,shaderModuleProps:{shadow:{shadowLightId:s,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let i=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},n=e.props.material;return{shadow:i,lighting:r,phongMaterial:n,gouraudMaterial:n}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(tw))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let i=new tt.k().lookAt({eye:new e5.P(t.direction).negate()});e.push(i)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let i=new to(e);this.shadowPasses[t]=i}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:i}=this;e||0!==t.length||0!==i.length||(this.ambientLight=new e6(tx),this.directionalLights.push(new te(tE[0]),new te(tE[1])))}_getLights(e){let t=[];for(let i of(this.ambientLight&&t.push(this.ambientLight),this.pointLights))t.push(i.getProjectedLight({layer:e}));for(let i of this.directionalLights)t.push(i.getProjectedLight({layer:e}));return t}}let tA=new tS;class tM{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw="Initial render",this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let i=t.findIndex(t=>(t.order??1/0)-(e.order??1/0)>0);i<0?t.push(e):t.splice(i,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){"effects"in e&&!(0,eQ.b)(e.effects,this.effects,1)&&this._setEffects(e.effects)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let i=[];for(let r of e){let e=t[r.id],n=r;e&&e!==r?e.setProps?(e.setProps(r.props),n=e):e.cleanup(this._context):e||r.setup(this._context),i.push(n),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=i,this._resolvedEffects=i.concat(this._defaultEffects),e.some(e=>e instanceof tS)||this._resolvedEffects.push(tA),this._needsRedraw="effects changed"}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}}class tC extends tn{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes("draw")||t.includes("terrain")}render(e){return this._render(e)}}let tT={blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"zero",blendAlphaOperation:"add",blendAlphaSrcFactor:"constant",blendAlphaDstFactor:"zero"};class tk extends tn{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return"pickingFBO"in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:n,pickingFBO:s,deviceRect:{x:o,y:a,width:l,height:u},cullRect:c,effects:h,pass:d="picking",pickZ:f,canvasContext:p,shaderModuleProps:g,clearColor:_}){this.pickZ=f;let m=this._resetColorEncoder(f),v="webgpu"===this.device.type?s.height-a-u:a,b=super._render({target:s,layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:n,cullRect:c,effects:h?.filter(e=>e.useInPicking),pass:d,canvasContext:p,isPicking:!0,shaderModuleProps:g,clearColor:_??[0,0,0,0],colorMask:15,scissorRect:[o,v,l,u]});return this._colorEncoderState=null,{decodePickingColor:m&&tO.bind(null,m),stats:b}}shouldDrawLayer(e){let{pickable:t,operation:i}=e.props;return t&&i.includes("draw")||i.includes("terrain")||i.includes("mask")}getShaderModuleProps(e,t,i){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,i){let r={...e.props.parameters},{pickable:n,operation:s}=e.props;return this._colorEncoderState?n&&s.includes("draw")?(Object.assign(r,tT),r.blend=!0,"webgpu"===this.device.type?r.blendConstant=tI(this._colorEncoderState,e,i):r.blendColor=tI(this._colorEncoderState,e,i),s.includes("terrain")&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor="one")):s.includes("terrain")&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}}function tI(e,t,i){let r,{byLayer:n,byAlpha:s}=e,o=n.get(t);return o?(o.viewports.push(i),r=o.a):(r=n.size+1)<=255?(o={a:r,layer:t,viewports:[i]},n.set(t,o),s[r]=o):(eV.A.warn("Too many pickable layers, only picking the first 255")(),r=0),[0,0,0,r/255]}function tO(e,t){let i=e.byAlpha[t[3]];return i&&{pickedLayer:i.layer,pickedViewports:i.viewports,pickedObjectIndex:i.layer.decodePickingColor(t)}}class tR{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new tC(e),this.pickLayersPass=new tk(e),this.renderCount=0,this._needsRedraw="Initial render",this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw="layerFilter changed"),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw="drawPickingColors changed")}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,i={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(i),r="stats"in e?e.stats:e;this._updateStats(r);return}i.effects&&this._preRender(i.effects,i);let r=this.lastPostProcessEffect?this.renderBuffers[0]:i.target;this.lastPostProcessEffect&&(i.clearColor=[0,0,0,0],i.clearCanvas=!0);let n=t.render({...i,target:r}),s="stats"in n?n.stats:n;i.effects&&(this.lastPostProcessEffect&&(i.clearCanvas=void 0===e.clearCanvas||e.clearCanvas),this._postRender(i.effects,i)),this.renderCount++,(0,e$.A)("deckRenderer.renderLayers",this,s,e),this._updateStats(s)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers rendered").addCount(t)}_preRender(e,t){for(let i of(this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{},e))t.preRenderStats[i.id]=i.preRender(t),i.postRender&&(this.lastPostProcessEffect=i.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,i=e.getDrawingBufferSize(),[r,n]=i;for(let e of(0===t.length&&[0,1].map(e=>{let i=this.device.createTexture({sampler:{minFilter:"linear",magFilter:"linear"},width:r,height:n});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,depthStencilAttachment:0===e?"depth24plus":void 0,colorAttachments:[i]}))}),t))e.resize(i)}_postRender(e,t){let{renderBuffers:i}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,n={...t,inputBuffer:i[0],swapBuffer:i[1]};for(let t of e)if(t.postRender){n.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(n);n.inputBuffer=e,n.swapBuffer=e===i[0]?i[1]:i[0]}}}var tL=i(15608),tB=i(58601);let tj={pickedColor:null,pickedObjectIndex:-1};function tz({pickedColors:e,decodePickingColor:t,deviceX:i,deviceY:r,deviceRadius:n,deviceRect:s}){let{x:o,y:a,width:l,height:u}=s,c=n*n,h=-1,d=0;for(let t=0;t<u;t++){let n=t+a-r,s=n*n;if(s>c)d+=4*l;else for(let t=0;t<l;t++){if(e[d+3]-1>=0){let e=t+o-i,r=e*e+s;r<=c&&(c=r,h=d)}d+=4}}if(h>=0){let i=e.slice(h,h+4),r=t(i);if(r){let e=Math.floor(h/4/l),t=h/4-e*l;return{...r,pickedColor:i,pickedX:o+t,pickedY:a+e}}eV.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}return tj}function tN({pickedColors:e,decodePickingColor:t}){let i=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let n=e.slice(r,r+4),s=n.join(",");if(!i.has(s)){let e=t(n);e?i.set(s,{...e,color:n}):eV.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}}}return Array.from(i.values())}function tD({pickInfo:e,viewports:t,pixelRatio:i,x:r,y:n,z:s}){let o,a=t[0];if(t.length>1&&(a=function(e,t){for(let i=e.length-1;i>=0;i--){let r=e[i];if(r.containsPixel(t))return r}return e[0]}(e?.pickedViewports||t,{x:r,y:n})),a){let e=[r-a.x,n-a.y];void 0!==s&&(e[2]=s),o=a.unproject(e)}return{color:null,layer:null,viewport:a,index:-1,picked:!1,x:r,y:n,pixel:[r,n],coordinate:o,devicePixel:e&&"pickedX"in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:i}}function tF(e){let{pickInfo:t,lastPickedInfo:i,mode:r,layers:n}=e,{pickedColor:s,pickedLayer:o,pickedObjectIndex:a}=t,l=o?[o]:[];if("hover"===r){let e=i.index,t=i.layerId,r=o?o.props.id:null;if(r!==t||a!==e){if(r!==t){let e=n.find(e=>e.props.id===t);e&&l.unshift(e)}i.layerId=r,i.index=a,i.info=null}}let u=tD(e),c=new Map;return c.set(null,u),l.forEach(e=>{let t={...u};e===o&&(t.color=s,t.index=a,t.picked=!0);let n=(t=tU({layer:e,info:t,mode:r})).layer;e===o&&"hover"===r&&(i.info=t),c.set(n.id,t),"hover"===r&&n.updateAutoHighlight(t)}),c}function tU({layer:e,info:t,mode:i}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:i,sourceLayer:r}),e=e.parent}return t}class tV{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new tk(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){"layerFilter"in e&&(this.layerFilter=e.layerFilter),"_pickable"in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:i,viewports:r},n=this.lastPickedInfo.info){let s=n&&n.layer&&n.layer.id,o=n&&n.viewport&&n.viewport.id,a=s?i.find(e=>e.id===s):null,l=o&&r.find(e=>e.id===o)||r[0],u=l&&l.unproject([e-l.x,t-l.y]);return{...n,x:e,y:t,viewport:l,coordinate:u,layer:a}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:"rgba8unorm",width:1,height:1,usage:tL.g.RENDER_ATTACHMENT|tL.g.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"}),this.device.isTextureFormatRenderable("rgba32float")){let e=this.device.createTexture({format:"rgba32float",width:1,height:1,usage:tL.g.RENDER_ATTACHMENT|tL.g.COPY_SRC}),t=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"});this.depthFBO=t}}let[t,i]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:i}),this.depthFBO?.resize({width:t,height:i})}_getPickable(e){if(!1===this._pickable)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:i,x:r,y:n,radius:s=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:c,effects:h}){let d,f=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:Array.from(tF({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:a,layers:e,viewports:i,x:r,y:n,pixelRatio:f}).values()).filter(e=>e.layer),emptyInfo:tD({viewports:i,x:r,y:n,pixelRatio:f})};this._resizeBuffer(u);let g=u.cssToDevicePixels([r,n],!0),_=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],m=Math.round(s*f),{width:v,height:b}=this.pickingFBO,y=this._getPickingRect({deviceX:_[0],deviceY:_[1],deviceRadius:m,deviceWidth:v,deviceHeight:b}),w={x:r-s,y:n-s,width:2*s+1,height:2*s+1},x=[],E=new Set;for(let e=0;e<o;e++){let s,g;if(y){let e=await this._drawAndSampleAsync({layers:p,views:t,viewports:i,onViewportActive:c,deviceRect:y,cullRect:w,effects:h,pass:`picking:${a}`,canvasContext:u});s=tz({...e,deviceX:_[0],deviceY:_[1],deviceRadius:m,deviceRect:y})}else s={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(s,p,l);if(v.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:v,views:t,viewports:i,onViewportActive:c,deviceRect:{x:s.pickedX??_[0],y:s.pickedY??_[1],width:1,height:1},cullRect:w,effects:h,pass:`picking:${a}:z`,canvasContext:u},!0);e[3]&&(g=e[0])}for(let t of(s.pickedLayer&&e+1<o&&(E.add(s.pickedLayer),s.pickedLayer.disablePickingIndex(s.pickedObjectIndex)),(d=tF({pickInfo:s,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:n,z:g,pixelRatio:f})).values()))t.layer&&x.push(t);if(!s.pickedColor)break}for(let e of E)e.restorePickingColors();return{result:x,emptyInfo:d.get(null)}}_pickClosestObject({layers:e,views:t,viewports:i,x:r,y:n,radius:s=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:c,effects:h}){let d,f=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:Array.from(tF({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:a,layers:e,viewports:i,x:r,y:n,pixelRatio:f}).values()).filter(e=>e.layer),emptyInfo:tD({viewports:i,x:r,y:n,pixelRatio:f})};this._resizeBuffer(u);let g=u.cssToDevicePixels([r,n],!0),_=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],m=Math.round(s*f),{width:v,height:b}=this.pickingFBO,y=this._getPickingRect({deviceX:_[0],deviceY:_[1],deviceRadius:m,deviceWidth:v,deviceHeight:b}),w={x:r-s,y:n-s,width:2*s+1,height:2*s+1},x=[],E=new Set;for(let e=0;e<o;e++){let s,g;if(y){let e=this._drawAndSample({layers:p,views:t,viewports:i,onViewportActive:c,deviceRect:y,cullRect:w,effects:h,pass:`picking:${a}`,canvasContext:u});s=tz({...e,deviceX:_[0],deviceY:_[1],deviceRadius:m,deviceRect:y})}else s={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(s,p,l);if(v.length>0){let{pickedColors:e}=this._drawAndSample({layers:v,views:t,viewports:i,onViewportActive:c,deviceRect:{x:s.pickedX??_[0],y:s.pickedY??_[1],width:1,height:1},cullRect:w,effects:h,pass:`picking:${a}:z`,canvasContext:u},!0);e[3]&&(g=e[0])}for(let t of(s.pickedLayer&&e+1<o&&(E.add(s.pickedLayer),s.pickedLayer.disablePickingIndex(s.pickedObjectIndex)),(d=tF({pickInfo:s,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:n,z:g,pixelRatio:f})).values()))t.layer&&x.push(t);if(!s.pickedColor)break}for(let e of E)e.restorePickingColors();return{result:x,emptyInfo:d.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:i,x:r,y:n,width:s=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:c,effects:h}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(u);let f=u.cssToDeviceRatio(),p=u.cssToDevicePixels([r,n],!0),g=p.x,_=p.y+p.height,m=u.cssToDevicePixels([r+s,n+o],!0),v=m.x+m.width,b=m.y,y=await this._drawAndSampleAsync({layers:d,views:t,viewports:i,onViewportActive:c,deviceRect:{x:g,y:b,width:v-g,height:_-b},cullRect:{x:r,y:n,width:s,height:o},effects:h,pass:`picking:${a}`,canvasContext:u}),w=tN(y),x=new Map,E=[],P=Number.isFinite(l);for(let e=0;e<w.length&&(!P||!(E.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:n,pixelRatio:f},s=(i=tU({layer:t.pickedLayer,info:i,mode:a})).layer.id;x.has(s)||x.set(s,new Set);let o=x.get(s),l=i.object??i.index;o.has(l)||(o.add(l),E.push(i))}return E}_pickVisibleObjects({layers:e,views:t,viewports:i,x:r,y:n,width:s=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:c,effects:h}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(u);let f=u.cssToDeviceRatio(),p=u.cssToDevicePixels([r,n],!0),g=p.x,_=p.y+p.height,m=u.cssToDevicePixels([r+s,n+o],!0),v=m.x+m.width,b=m.y,y=this._drawAndSample({layers:d,views:t,viewports:i,onViewportActive:c,deviceRect:{x:g,y:b,width:v-g,height:_-b},cullRect:{x:r,y:n,width:s,height:o},effects:h,pass:`picking:${a}`,canvasContext:u}),w=tN(y),x=new Map,E=[],P=Number.isFinite(l);for(let e=0;e<w.length&&(!P||!(E.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:n,pixelRatio:f},s=(i=tU({layer:t.pickedLayer,info:i,mode:a})).layer.id;x.has(s)||x.set(s,new Set);let o=x.get(s),l=i.object??i.index;o.has(l)||(o.add(l),E.push(i))}return E}async _drawAndSampleAsync({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l},u=!1){let c=u?this.depthFBO:this.pickingFBO,h={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:c,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(h.preRenderStats[e.id]=e.preRender(h));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(h);this._updateStats(f);let{x:p,y:g,width:_,height:m}=n,v=c.colorAttachments[0]?.texture;if(!v)throw Error("Picking framebuffer color attachment is missing");let b=await this._readTextureDataAsync(v,{x:p,y:g,width:_,height:m},u?Float32Array:Uint8Array);if(!u){let e=!1;for(let t=3;t<b.length;t+=4)if(0!==b[t]){e=!0;break}!e&&b.length>0&&eV.A.warn("Async pick readback returned only zero alpha values",{deviceRect:n,bytes:Array.from(b.subarray(0,Math.min(b.length,16)))})()}return{pickedColors:b,decodePickingColor:d}}async _readTextureDataAsync(e,t,i){let{width:r,height:n}=t,s=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:s.byteLength,usage:tB.h.COPY_DST|tB.h.MAP_READ});try{let a="webgpu"===this.device.type?{...t,y:e.height-t.y-n}:t;e.readBuffer(a,o);let l=await o.readAsync(0,s.byteLength),u=i.BYTES_PER_ELEMENT;if(s.bytesPerRow%u!=0)throw Error(`Texture readback row stride ${s.bytesPerRow} is not aligned to ${u}-byte elements.`);let c=new i(l.buffer,l.byteOffset,s.byteLength/u),h=4*r,d=s.bytesPerRow/u;if(d<h)throw Error(`Texture readback row stride ${d} is smaller than packed row length ${h}.`);let f=new i(r*n*4);for(let e=0;e<n;e++){let t=("webgpu"===this.device.type?n-e-1:e)*d;f.set(c.subarray(t,t+h),e*h)}return f}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l},u=!1){let c=u?this.depthFBO:this.pickingFBO,h={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:c,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(h.preRenderStats[e.id]=e.preRender(h));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(h);this._updateStats(f);let{x:p,y:g,width:_,height:m}=n,v=new(u?Float32Array:Uint8Array)(_*m*4);return this.device.readPixelsToArrayWebGL(c,{sourceX:p,sourceY:g,sourceWidth:_,sourceHeight:m,target:v}),{pickedColors:v,decodePickingColor:d}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers picked").addCount(t)}_getDepthLayers(e,t,i){if(!i||!this.depthFBO)return[];let{pickedLayer:r}=e,n=r?.state?.terrainDrawMode==="drape";return r&&!n?[r]:t.filter(e=>e.props.operation.includes("terrain"))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:i,deviceWidth:r,deviceHeight:n}){let s=Math.max(0,e-i),o=Math.max(0,t-i),a=Math.min(r,e+i+1)-s,l=Math.min(n,t+i+1)-o;return a<=0||l<=0?null:{x:s,y:o,width:a,height:l}}}let t$={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},tW="root";class tG{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add("deck-widget-container"),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!(0,eQ.b)(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);for(let e in this.defaultWidgets.length=0,this.resolvedWidgets.length=0,this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let i=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:n}=r;if(n){let e=i[n];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=i,this._updateContainers()}onHover(e,t){for(let i of this.getWidgets()){let{viewId:r}=i;r&&r!==e.viewport?.id||i.onHover?.(e,t)}}getCanvasBounds(e){let t=this.deck?.getCanvas?.(),i=t?.getBoundingClientRect(),r=this.parentElement?.getBoundingClientRect(),n=this.deck?.getCanvasContext?.(e?.id);if(n&&r){n.updatePosition();let[e,t]=n.getPosition(),[i,s]=n.getCSSSize();return{x:e-r.left,y:t-r.top,width:i,height:s}}return{x:i&&r?i.left-r.left:0,y:i&&r?i.top-r.top:0,width:i?.width||this.deck?.width||0,height:i?.height||this.deck?.height||0}}onEvent(e,t){let i=ta.tg[t.type];if(i)for(let r of this.getWidgets()){let{viewId:n}=r;n&&n!==e.viewport?.id||r[i]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;for(let e of(this.resolvedWidgets.length=0,this.defaultWidgets))t[e.id]=null,this.resolvedWidgets.push(e);for(let i of e){let e=t[i.id];e?e.viewId!==i.viewId||e.placement!==i.placement?(this._removeWidget(e),this._addWidget(i)):i!==e&&(e.setProps(i.props),i=e):this._addWidget(i),t[i.id]=null,this.resolvedWidgets.push(i)}for(let e in t){let i=t[e];i&&this._removeWidget(i)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:i="top-left"}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,i).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&"string"!=typeof e)return e;let i=e||tW,r=this.containers[i];r||((r=document.createElement("div")).style.pointerEvents="none",r.style.position="absolute",r.style.overflow="hidden",this.parentElement?.append(r),this.containers[i]=r);let n=r.querySelector(`.${t}`);return n||((n=globalThis.document.createElement("div")).className=t,n.style.position="absolute",n.style.zIndex="2",Object.assign(n.style,t$[t]),r.append(n)),n}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,i=e===tW||t,r=this.containers[e];if(i){let e=this._getContainerBounds(t);r.style.display="block",r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display="none"}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}}function tH(e,t){t&&Object.entries(t).map(([t,i])=>{t.startsWith("--")?e.style.setProperty(t,i):e.style[t]=i})}class tq{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,i=this.rootElement;if(i&&t.className!==e.className&&(t.className&&i.classList.remove(t.className),e.className&&i.classList.add(e.className)),i&&!(0,eQ.b)(t.style,e.style,1)){var r;(r=t.style)&&Object.keys(r).map(e=>{e.startsWith("--")?i.style.removeProperty(e):i.style[e]=""}),tH(i,e.style)}Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=["deck-widget",this.className,this.props.className],t=document.createElement("div");return e.filter(e=>"string"==typeof e&&e.length>0).forEach(e=>t.classList.add(e)),tH(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}tq.defaultProps={id:"widget",style:{},_container:null,className:""};let tY={zIndex:"1",position:"absolute",pointerEvents:"none",color:"#a0a7b4",backgroundColor:"#29323c",padding:"10px",top:"0",left:"0",display:"none"};class tZ extends tq{constructor(e={}){super(e),this.id="default-tooltip",this.placement="fill",this.className="deck-tooltip",this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement("div");return e.className=this.className,Object.assign(e.style,tY),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,i=t&&t.props.getTooltip;if(!i)return;let r=i(e),n=this.widgetManager?.getCanvasBounds(e.viewport),s=e.x+(n?.x||0),o=e.y+(n?.y||0);this.setTooltip(r,s,o)}setTooltip(e,t,i){let r=this.rootElement;if(r){if("string"==typeof e)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display="none";return}this.isVisible=!0,r.style.display="block",r.style.transform=`translate(${t}px, ${i}px)`,e&&"object"==typeof e&&"style"in e&&Object.assign(r.style,e.style)}}}tZ.defaultProps={...tq.defaultProps};var tK=i(24067);class tX{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),i={},r=[],n=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);n.set(t,(n.get(t)||0)+1)}for(let{id:s,canvas:o}of t){let t=this._getEventRoot(o),a=1===n.get(t)?t:o,l=this.targets[s];if(!l||l.device!==e.device||l.canvas!==o||l.eventRoot!==a){l?.eventManager.destroy(),l?.presentationContext.destroy();let t=e.device.createPresentationContext({id:s,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});l={id:s,device:e.device,canvas:o,eventRoot:a,presentationContext:t,eventManager:this._createEventManager(a)}}this._eventRootToCanvasId.set(a,s),this._eventRootToCanvasId.set(o,s),i[s]=l,r.push(s)}for(let[e,t]of Object.entries(this.targets))i[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=i,this.order=r;let s=Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(s)||(this.eventManagers=s)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||e0]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,i)=>{let r,n;return"string"==typeof e?(r=document.getElementById(e),(0,tK.A)(r,`Canvas with id ${e} not found`),n=e):n=(r=e).id||`deckgl-canvas-${i}`,(0,tK.A)(!t.has(n),`Duplicate canvas id ${n}`),t.add(n),{id:n,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),i=Object.keys(this.eventManagers);return t.length===i.length&&t.every(t=>e[t]===this.eventManagers[t])}}var tJ=i(23459),tQ=i(97864),t0=i(48116),t2=i(97224);let t1=globalThis.loaders?.parseImageNode,t3="u">typeof Image,t4="u">typeof ImageBitmap,t6=!!t2.Bd||!!t1,t5=/^data:image\/svg\+xml/,t8=/\.svg((\?|#).*)?$/;function t9(e){return e&&(t5.test(e)||t8.test(e))}function t7(e,t){if(t9(t))throw Error("SVG cannot be parsed directly to imagebitmap");return new Blob([new Uint8Array(e)])}async function ie(e,t,i){let r=function(e,t){if(t9(t)){let t=new TextDecoder().decode(e);try{"function"==typeof unescape&&"function"==typeof encodeURIComponent&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return t7(e,t)}(e,i),n=self.URL||self.webkitURL,s="string"!=typeof r&&n.createObjectURL(r);try{return await it(s||r,t)}finally{s&&n.revokeObjectURL(s)}}async function it(e,t){let i=new Image;return(i.src=e,t.image&&t.image.decode&&i.decode)?(await i.decode(),i):await new Promise((e,t)=>{try{i.onload=()=>e(i),i.onerror=e=>{let i=e instanceof Error?e.message:"error";t(Error(i))}}catch(e){t(e)}})}let ii=!0;async function ir(e,t,i){let r;r=t9(i)?await ie(e,t,i):t7(e,i);let n=t&&t.imagebitmap;return await is(r,n)}async function is(e,t=null){if((function(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}(t)||!ii)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),ii=!1}return await createImageBitmap(e)}function io(e){var t,i;let r,n,s,o,a=ia(e);return((r=ia(a)).byteLength>=24&&0x89504e47===r.getUint32(0,!1)?{mimeType:"image/png",width:r.getUint32(16,!1),height:r.getUint32(20,!1)}:null)||function(e){let t=ia(e);if(!(t.byteLength>=3&&65496===t.getUint16(0,!1)&&255===t.getUint8(2)))return null;let{tableMarkers:i,sofMarkers:r}=function(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}(),n=2;for(;n+9<t.byteLength;){let e=t.getUint16(n,!1);if(r.has(e))return{mimeType:"image/jpeg",height:t.getUint16(n+5,!1),width:t.getUint16(n+7,!1)};if(!i.has(e))break;n+=2,n+=t.getUint16(n,!1)}return null}(a)||((n=ia(a)).byteLength>=10&&0x47494638===n.getUint32(0,!1)?{mimeType:"image/gif",width:n.getUint16(6,!0),height:n.getUint16(8,!0)}:null)||((s=ia(a)).byteLength>=14&&16973===s.getUint16(0,!1)&&s.getUint32(2,!0)===s.byteLength?{mimeType:"image/bmp",width:s.getUint32(18,!0),height:s.getUint32(22,!0)}:null)||((o=!function(e,t,i=0){let r=[...t].map(e=>e.charCodeAt(0));for(let t=0;t<r.length;++t)if(r[t]!==e[t+i])return!1;return!0}(i=new Uint8Array((t=a)instanceof DataView?t.buffer:t),"ftyp",4)||(96&i[8])==0?null:function(e){switch(String.fromCharCode(...e.slice(8,12)).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}}(i))?{mimeType:o.mimeType,width:0,height:0}:null)}function ia(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error("toDataView")}async function il(e,t){let{mimeType:i}=io(e)||{},r=globalThis.loaders?.parseImageNode;return(0,t0.v)(r),await r(e,i)}let iu={dataType:null,batchType:null,id:"image",module:"images",name:"Images",version:"4.5.2",mimeTypes:["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],extensions:["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],parse:async function e(e,t,i){let r,n=((t=t||{}).image||{}).type||"auto",{url:s}=i||{};switch(function(e){switch(e){case"auto":case"data":if(t4)return"imagebitmap";if(t3)return"image";if(t6)return"data";throw Error("Install '@loaders.gl/polyfills' to parse images under Node.js");default:return!function(e){switch(e){case"auto":return t4;case"imagebitmap":case"image":case"data":return;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}(e),e}}(n)){case"imagebitmap":r=await ir(e,t,s);break;case"image":r=await ie(e,t,s);break;case"data":r=await il(e,t);break;default:(0,t0.v)(!1)}return"data"===n&&(r=function(e){switch(function(e){var t;let i=(t=e,"u">typeof ImageBitmap&&t instanceof ImageBitmap?"imagebitmap":"u">typeof Image&&t instanceof Image?"image":t&&"object"==typeof t&&t.data&&t.width&&t.height?"data":null);if(!i)throw Error("Not an image");return i}(e)){case"data":return e;case"image":case"imagebitmap":let t=document.createElement("canvas"),i=t.getContext("2d");if(!i)throw Error("getImageData");return t.width=e.width,t.height=e.height,i.drawImage(e,0,0),i.getImageData(0,0,e.width,e.height);default:throw Error("getImageData")}}(r)),r},tests:[e=>!!io(new DataView(e))],options:{image:{type:"auto",decode:!0}}},ic={dataType:null,batchType:null,id:"JSON",name:"JSON",module:"",version:"",options:{},extensions:["json","geojson"],mimeTypes:["application/json","application/geo+json"],testText:function(e){let t=e[0],i=e[e.length-1];return"{"===t&&"}"===i||"["===t&&"]"===i},parseTextSync:JSON.parse},ih=function(){let e="9.4.0",t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(eV.A.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:eV.A,_registerLoggers:e$.k},(0,tQ.mk)([ic,[iu,{imagebitmap:{premultiplyAlpha:"none"}}]])),e}();var id=i(90984),ip=i(91191),ig=i(59787),i_=i(92767);function im(){}let iv={id:"",width:"100%",height:"100%",style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:"auto",layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:"none",eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:im,onWebGLInitialized:im,onResize:im,onViewStateChange:im,onInteractionStateChange:im,onBeforeRender:im,onAfterRender:im,onLoad:im,onError:e=>eV.A.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?"grabbing":"grab",getTooltip:null,debug:!1,drawPickingColors:!1};class ib{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new eq({id:"deck.gl"}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw="Initial render",this._canvasManager=new tX({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:"hover",x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,i=this._getCanvasIdFromEvent(e);if("pointerleave"===e.type)t.x=-1,t.y=-1,t.radius=0,t.canvasId=i;else{if(e.leftButton||e.rightButton)return;let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=i}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=ta.tg[e.type],i=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!i||!this.layerManager)return;let n=this.layerManager.getLayers(),s=this._getInternalPickingMode();if(s){if("sync"===s){let t="click"===e.type&&this._shouldUnproject3D(n)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(i.x,i.y,{unproject3D:!0,canvasId:r},n))):this._getLastPointerDownPickingInfo(i.x,i.y,r,n);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(i.x,i.y,r,n))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,i=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let n=this.layerManager?.getLayers()||[],s=++this._pointerDownPickSequence;if("sync"===r){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:i,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:i},n)).then(e=>this._getFirstPickedInfo(e)).then(e=>(s===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,i,n):{};return s===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...iv,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&eV.A.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let i=this.device;!i&&e.gl&&(e.gl instanceof WebGLRenderingContext&&eV.A.error("WebGL1 context not supported.")(),i=ip.l.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),i||(i=this._createDevice(e)),this.animationLoop=this._createAnimationLoop(i,e),this.setProps(t),e._typedArrayManagerProps&&tJ.A.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get("setProps Time").timeStart(),"onLayerHover"in e&&eV.A.removed("onLayerHover","onHover")(),"onLayerClick"in e&&eV.A.removed("onLayerClick","onClick")(),e.initialViewState&&!(0,eQ.b)(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),(0,tK.A)(!("_canvases"in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),this._isMultiCanvasMode()||this.canvas===t.canvas||(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),eV.A.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),void 0!==e.useDevicePixels&&this._canvasContext?.setProps)for(let t of(this._canvasContext.setProps({useDevicePixels:e.useDevicePixels}),Object.values(this._canvasManager.targets)))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels});this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get("setProps Time").timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return"Deck._animate";let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let i=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),n=this.effectManager.needsRedraw(e),s=this.deckRenderer.needsRedraw(e);return t||i||r||n||s}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});(t=e||t)&&(this.stats.get("Redraw Count").incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return null!==this.viewManager}getViews(){return(0,tK.A)(this.viewManager),this.viewManager.views}getView(e){return(0,tK.A)(this.viewManager),this.viewManager.getView(e)}getViewports(e){return(0,tK.A)(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||e0;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync("pickObjectAsync","pickObject Time",e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync("pickObjectsAsync","pickObjects Time",e)}pickObject(e){let t=this._pick("pickObject","pickObject Time",e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick("pickObject","pickMultipleObjects Time",e).result}pickObjects(e){return this._pick("pickObjects","pickObjects Time",e)}_pickPositionForController(e,t,i){return"sync"!==this._getInternalPickingMode()?null:this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:i?this.viewManager?.getCanvasId(i):void 0})}_addResources(e,t=!1){for(let i in e)this.layerManager.resourceManager.add({resourceId:i,data:e[i],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if("auto"===e)return"webgpu"===t?"async":"sync";if("sync"===e&&"webgpu"===t)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>"3d"===e.props.pickable)}_getPointPickOptions(e,t,i={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:i.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...i}}_pickPointSync(e){return this._pick("pickObject","pickObject Time",e)}_pickPointAsync(e){return this._pickAsync("pickObjectAsync","pickObject Time",e)}_getLastPointerDownPickingInfo(e,t,i,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:i})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},i){if(!this.widgetManager)return;this.cursorState.isHovering=e.some(e=>e.picked);let r=t,n=!1;for(let t of e)r=t,n=t.layer?.onHover(t,i)||n;n||(this.props.onHover?.(r,i),this.widgetManager.onHover(r,i))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let i=ta.tg[t.type];if(!i)return;let{layer:r}=e,n=r&&(r[i]||r.props[i]),s=this.props[i],o=!1;n&&(o=n.call(r,e,t)),o||(s?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,i){(0,tK.A)(this.deckPicker);let{stats:r}=this,n=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,s=this._getCanvasContext(n)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(n);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:n}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:n,canvasContext:s});return r.get(t).timeEnd(),o}_pick(e,t,i){(0,tK.A)(this.deckPicker);let{stats:r}=this,n=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,s=this._getCanvasContext(n)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(n);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:n}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:n,canvasContext:s});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return"string"==typeof t&&(t=document.getElementById(t),(0,tK.A)(t)),t?this._ownedCanvas=null:((t=document.createElement("canvas")).id=e.id||"deckgl-overlay",e.width&&"number"==typeof e.width&&(t.width=e.width),e.height&&"number"==typeof e.height&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||e0}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&((0,tK.A)(!e.canvas),(0,tK.A)(!e.gl),(0,tK.A)(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new i_.EU(e,{touchAction:this.props.touchAction,recognizers:Object.keys(ta.We).map(e=>{let[t,i,r,n]=ta.We[e],s=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...i,...s,event:e}),recognizeWith:r,requireFailure:n}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in ta.tg)"dblclick"===e?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(".deck-events-root")||this.props.parent?.querySelector(".deck-events-root")||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,"style"in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let i=e.getDefaultCanvasContext();this._setCanvasContext(i),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let i=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=i;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:i}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=im),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:i}=e;if(t||0===t){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(i||0===i){let t=Number.isFinite(i)?`${i}px`:i;this.canvas.style.position=e.style?.position||"absolute",this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[i,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(i,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t("number"==typeof e.width&&Number.isFinite(e.width)?e.width:1,"number"==typeof e.height&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode())return void this._updateMultiCanvasDimensions();let{canvas:t}=this,[i,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(i!==this.width||r!==this.height)&&(this.width=i,this.height=r,this.viewManager?.setProps({width:i,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:i,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:i}=e.canvas;e.setDrawingBufferSize(t,i)}this._needsRedraw="Canvas resized",this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw="Canvas resized",this.viewManager?.setNeedsUpdate("Canvas resized"),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:i,onError:r}=t;return new ig.F({device:e,autoResizeDrawingBuffer:!i&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,i={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};i.adapters.includes(ip.l)||i.adapters.push(ip.l);let r={alphaMode:this.props.deviceProps?.type==="webgpu"?"premultiplied":void 0};return id.a.createDevice({_reuseDevices:!0,type:"webgl",...i,createCanvasContext:{...r,..."object"==typeof t?t:void 0,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new e1.A({id:"default-view"})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error("WebGL context is lost"))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,i=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},i),n=this._getInternalPickingMode(),s=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!n)return;if("sync"===n)return void this._applyHoverCallbacks(this._pickPointSync(r),t);this._pickPointAsync(r).then(({result:e,emptyInfo:i})=>{s===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:i},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),"webgl"===this.device.type&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),"webgl"===this.device.type&&this.props.onWebGLInitialized(this.device.gl);let t=new r.K;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);(0,tK.A)(e),this.eventManager=this._createEventManager(e),this.eventManagers={[e0]:this.eventManager}}this.viewManager=new e2({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let i=this.viewManager.getViewports()[0];this.layerManager=new eJ(this.device,{deck:this,stats:this.stats,viewport:i,timeline:t}),this.effectManager=new tM({deck:this,device:this.device}),this.deckRenderer=new tR(this.device,{stats:this.stats}),this.deckPicker=new tV(this.device,{stats:this.stats});let n=this.props.parent?.querySelector(".deck-widgets-root")||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new tG({deck:this,parentElement:n}),this.widgetManager.addDefault(new tZ),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:i,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:i,gl:r});let n={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:"screen",effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&"screen"===n.pass&&!n.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=n.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...n,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let i=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=i.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...n,canvasContext:i.presentationContext,target:r,viewports:t}),i.presentationContext.present()}else this.deckRenderer?.renderLayers(n);"screen"===n.pass&&this.widgetManager.onRedraw({viewports:n.viewports,layers:n.layers}),this.props.onAfterRender({device:i,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),eV.A.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},!this.props.viewState&&this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get("frameRate").timeEnd(),e.get("frameRate").timeStart();let t=this.animationLoop.stats;e.get("GPU Time").addTime(t.get("GPU Time").lastTiming),e.get("CPU Time").addTime(t.get("CPU Time").lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get("frameRate").getHz(),e.setPropsTime=t.get("setProps Time").time,e.updateAttributesTime=t.get("Update Attributes").time,e.framesRedrawn=t.get("Redraw Count").count,e.pickTime=t.get("pickObject Time").time+t.get("pickMultipleObjects Time").time+t.get("pickObjects Time").time,e.pickCount=t.get("Pick Count").count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get("Layers rendered").lastSampleCount,e.pickLayersCount=t.get("Layers picked").lastSampleCount,e.updateLayersCount=t.get("Layer updates").count,e.updateAttributesCount=t.get("Attributes updated").count,e.gpuTime=t.get("GPU Time").time,e.cpuTime=t.get("CPU Time").time,e.gpuTimePerFrame=t.get("GPU Time").getAverageTime(),e.cpuTimePerFrame=t.get("CPU Time").getAverageTime();let i=id.a.stats.get("GPU Time and Memory");e.bufferMemory=i.get("Buffer Memory").count,e.textureMemory=i.get("Texture Memory").count,e.renderbufferMemory=i.get("Renderbuffer Memory").count,e.gpuMemory=i.get("GPU Memory").count}}ib.defaultProps=iv,ib.VERSION=ih;let iy=ib},81943(e,t,i){i.d(t,{A:()=>eK});var r=i(58601),n=i(9078),s=i(55529),o=i(12042);let a=o.r.getDataType.bind(o.r);function l(e,t,i){if(t.size>4)return null;let r="webgpu"===i&&"uint8"===t.type?"unorm8":t.type,n=t.size,s=!!("webgpu"!==i&&3===n&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:e,format:n>1?`${r}x${n}${s?"-webgl":""}`:t.type,byteOffset:t.offset||0}}function u(e){return e.stride||e.size*e.bytesPerElement}var c=i(23459),h=i(25667),d=i(3459);function f(e,t){t.offset&&d.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=u(e),r=(void 0!==t.vertexOffset?t.vertexOffset:e.vertexOffset||0)*i+(t.elementOffset||0)*e.bytesPerElement+(e.offset||0);return{...t,offset:r,stride:i}}class p{constructor(e,t,i){let r;this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let n=t.logicalType||t.type,o="float64"===n,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0),r=o?"float32":!n&&t.isIndexed?"uint32":n||"float32";let l=function(e){switch(e){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,s.Ak)(e)}}(n||r);this.doublePrecision=o,o&&!1===t.fp64&&(l=Float32Array),this.value=null,this.settings={...t,defaultType:l,defaultValue:a,logicalType:n,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:l.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*u(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),c.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[e]=this._buffer;else if(t){let n=f(this.getAccessor(),t),s=n.offset/r.BYTES_PER_ELEMENT,o=n.size||this.size;i[e]=r.subarray(s,s+o)}else i[e]=r}else i[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${e}64Low`]=i[e]:i[`${e}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(e=this.id,t=null){let i=this.getAccessor(),r=[],n={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:u(i)};if(this.doublePrecision){let n,s={high:n=f(i,t||{}),low:{...n,offset:n.offset+4*i.size}};r.push(l(e,{...i,...s.high},this.device.type),l(`${e}64Low`,{...i,...s.low},this.device.type))}else if(t){let n=f(i,t);r.push(l(e,{...i,...n},this.device.type))}else r.push(l(e,i,this.device.type));return n.attributes=r.filter(Boolean),n}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:i,size:r}=this,n=i*r;if(t&&n&&t.length>=n){let i=Array(r).fill(1/0),s=Array(r).fill(-1/0);for(let e=0;e<n;)for(let n=0;n<r;n++){let r=t[e++];r<i[n]&&(i[n]=r),r>s[n]&&(s[n]=r)}e=[i,s]}}return this.state.bounds=e,e}setData(e){let t,{state:i}=this;t=ArrayBuffer.isView(e)?{value:e}:e instanceof r.h?{buffer:e}:e;let n={...this.settings,...t};if(ArrayBuffer.isView(t.value)){if(!t.type)if(this.doublePrecision&&t.value instanceof Float64Array)n.type="float32";else{let e=a(t.value);n.type=n.normalized?e.replace("int","norm"):e}n.bytesPerElement=t.value.BYTES_PER_ELEMENT,n.stride=u(n)}if(i.bounds=null,t.constant){let e=t.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!i.constant||!this._areValuesEqual(e,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(t.buffer)i.externalBuffer=t.buffer,i.constant=!1,this.value=t.value||null;else if(t.value){this._checkExternalBuffer(t);let e=t.value,r=e;i.externalBuffer=null,i.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(r)&&(r=(0,h.cT)(r,n),e instanceof Float32Array&&(n.stride=2*n.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:s}=this,o=u(n),a=(n.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;r.constructor!==e&&(r=new e(r))}let l=r.byteLength+a+2*o;(!s||s.byteLength<l)&&(s=this._createBuffer(l)),s.write(r,a)}return this.setAccessor(n),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:i=0,endOffset:r}=e,n=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(n?(0,h.cT)(t,{size:this.size,startIndex:i,endIndex:r}):t.subarray(i,r),i*(n?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:i}=this,r=i.allocatedValue,n=c.A.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=n;let s=this._shouldSplitDoublePrecisionValue(n),o=s&&n instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:a}=this,{buffer:l}=this,u=n.byteLength*(s&&n instanceof Float32Array?2:1);return(!l||l.byteLength<u+a)&&(l=this._createBuffer(u+a),t&&r&&l.write(this._shouldSplitDoublePrecisionValue(r)?(0,h.cT)(r,this):r,a)),i.allocatedValue=n,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||"webgpu"===this.device.type&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);t instanceof i||!this.settings.normalized||"normalized"in e||d.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(e=>(e+128)/255*2-1);case"snorm16":return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(e=>e/255);case"unorm16":return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,i){let{defaultValue:r,size:n}=this.settings;if(Number.isFinite(e))return t[i]=e,t;if(!e){let e=n;for(;--e>=0;)t[i+e]=r[e];return t}switch(n){case 4:t[i+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[i+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[i+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[i+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let s=n;for(;--s>=0;)t[i+s]=Number.isFinite(e[s])?e[s]:r[s]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:i}=this.settings,n="webgpu"!==this.device.type||t?(t?r.h.INDEX:r.h.VERTEX)|r.h.COPY_DST:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:n,indexType:t?i:void 0,byteLength:e}),this._buffer}}var g=i(24067);let _=[],m=[];function v(e){return e&&e[Symbol.asyncIterator]}var b=i(38055);let y=[],w=[[0,1/0]],x={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function E(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:"interpolation",duration:e});let i=e.type||"interpolation";return{...x[i],...t,...e,type:i}}class P extends p{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:w}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t,i;(t=this.state).layoutChanged||(i=this.getAccessor(),t.layoutChanged=e.type!==i.type||e.size!==i.size||u(e)!==u(i)||(e.offset||0)!==(i.offset||0)),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat("function"!=typeof e&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,i=this.settings.transition;return E(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],i)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:i=1/0}=t;this.state.updateRanges=function(e,t){if(e===w||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let i=[],r=e.length,n=0;for(let s=0;s<r;s++){let r=e[s];r[1]<t[0]?(i.push(r),n=s+1):r[0]>t[1]?i.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return i.splice(n,0,t),i}(this.state.updateRanges,[e,i])}else this.state.updateRanges=w}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=y}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==w),t.layoutChanged||(t.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:e,data:t,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:n},settings:{update:s,noAlloc:o}}=this,a=!0;if(s){for(let[o,a]of n)s.call(r,this,{data:t,startRow:o,endRow:a,props:i,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,i]of n){let r=Number.isFinite(t)?this.getVertexOffset(t):0,n=Number.isFinite(i)?this.getVertexOffset(i):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:n})}this._checkAttributeArray()}else a=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),a}setConstantValue(e,t){var i;if(void 0===t||"function"==typeof t)return!1;let r=this.isConstant,n=this.settings.transform&&e?this.settings.transform.call(e,t):t,s=this.settings.defaultType;this.state.constantValue=this._normalizeValue(n,new s(this.size),0);let o=this.setData({constant:!0,value:n});if("webgpu"===this.device.type){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=(0,h.cT)(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(i=this.state).layoutChanged||(i.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:i,settings:r}=this;if(!e)return i.binaryValue=null,i.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(i.binaryValue===e)return this.clearNeedsUpdate(),!0;if(i.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let n=e;(0,g.A)(ArrayBuffer.isView(n.value),`invalid ${r.accessor}`);let s=!!n.size&&n.size!==this.size;return i.binaryAccessor=function(e,t){let{size:i,stride:r,offset:n,startIndices:s,nested:o}=t,a=e.BYTES_PER_ELEMENT,l=r?r/a:i,u=n?n/a:0,c=Math.floor((e.length-u)/l);return(t,{index:r,target:n})=>{let a;if(!s){let t=r*l+u;for(let r=0;r<i;r++)n[r]=e[t+r];return n}let h=s[r],d=s[r+1]||c;if(o){a=Array(d-h);for(let t=h;t<d;t++){let r=t*l+u;n=Array(i);for(let t=0;t<i;t++)n[t]=e[r+t];a[t-h]=n}}else if(l===i)a=e.subarray(h*i+u,d*i+u);else{a=new e.constructor((d-h)*i);let t=0;for(let r=h;r<d;r++){let n=r*l+u;for(let r=0;r<i;r++)a[t++]=e[n+r]}}return a}}(n.value,{size:n.size||this.size,stride:n.stride,offset:n.offset,startIndices:t,nested:s}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let i in e)Object.assign(t,super.getValue(i,e[i]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=e?e.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!t)return i;for(let e in t){let r=super._getBufferLayout(e,t[e]);i.attributes.push(...r.attributes)}return i}_autoUpdater(e,{data:t,startRow:i,endRow:r,props:n,numInstances:s}){let{settings:o,state:a,value:l,size:u,startIndices:c}=e,{accessor:h,transform:d}=o,f=a.binaryAccessor||("function"==typeof h?h:n[h]);(0,g.A)("function"==typeof f,`accessor "${h}" is not a function`);let p=e.getVertexOffset(i),{iterable:v,objectInfo:y}=function(e,t=0,i=1/0){let r=_,n={index:-1,data:e,target:[]};return e?"function"==typeof e[Symbol.iterator]?r=e:e.length>0&&(m.length=e.length,r=m):r=_,(t>0||Number.isFinite(i))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,i),n.index=t-1),{iterable:r,objectInfo:n}}(t,i,r);for(let t of v){y.index++;let i=f(t,y);if(d&&(i=d.call(this,i)),c){let t=(y.index<c.length-1?c[y.index+1]:s)-c[y.index];if(i&&Array.isArray(i[0])){let t=p;for(let r of i)e._normalizeValue(r,l,t),t+=u}else i&&i.length>u?l.set(i,p):(e._normalizeValue(i,y.target,0),(0,b.R)({target:l,source:y.target,start:p,count:t}));p+=t*u}else e._normalizeValue(i,l,p),p+=u}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||"function"==typeof e.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let i=!0;switch(t){case 4:i=i&&Number.isFinite(e[3]);case 3:i=i&&Number.isFinite(e[2]);case 2:i=i&&Number.isFinite(e[1]);case 1:i=i&&Number.isFinite(e[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}var S=i(48394),A=i(55042),M=i(24559),C=i(7033),T=i(79743);class k{constructor(e,{id:t,isTransitionAttribute:i}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=i,"webgpu"===this.device.type&&S.G.add("webgpu",{interleave:T.C})}hasGroups(e){return"webgpu"===this.device.type&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let i=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,i,t)}getBindings(e,t,i,r){let n=this._getPackedGroups(e,i,{requireValues:!0,excludeAttributes:r}),s={},o=new Set;for(let e of n.values()){let i=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);for(let t of(s[e.id]=this._getPackedBuffer(e,i),e.attributes))o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,n,i).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:s,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:i,excludeAttributes:r}){let n=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let i=n.get(e)||[];i.push(t),n.set(e,i)}let s=new Map;for(let[e,o]of n){let n=this._getPackedGroup(e,o,t,i,r);n&&s.set(e,n)}return s}_getPackedGroup(e,t,i,r,n){if(t.length<2)return null;let s=t.map(e=>e.getBufferLayout(i)),o=s[0].stepMode,a=Math.max(1,t[0].numInstances),l=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let i=t[e],l=i.getAccessor(),c=l.size*l.bytesPerElement;if(n[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||s[e].stepMode!==o||i.numInstances!==t[0].numInstances||0!==(l.offset||0)||0!==(l.vertexOffset||0)||u(l)!==c||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<c:!ArrayBuffer.isView(i.value)||i.value.byteLength<a*c))return null}let c={},h=[],d=0;for(let e=0;e<t.length;e++){let i=t[e];for(let t of(d=I(d),c[i.id]=d,s[e].attributes||[]))h.push({...t,byteOffset:d+(t.byteOffset||0)});d+=u(i.getAccessor())}return{id:e,attributes:t,byteStride:d=I(d),byteOffsets:c,rowCount:a,layout:{name:e,byteStride:l?0:d,stepMode:o,attributes:h}}}_getBufferLayouts(e,t,i){let r=[],n=new Set,s=new Set;for(let e of t.values())for(let t of e.attributes)s.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,a=e&&t.get(e);a&&s.has(o.id)?n.has(a.id)||(r.push(a.layout),n.add(a.id)):r.push(o.getBufferLayout(i))}return r}_getPackedBuffer(e,t){let i=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if(r&&r.layoutKey===i||(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:i},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=e.attributes.map(t=>this._getInterleaveInput(e,t)),i=(0,A.C)(...t);return(0,M.o)(this.device,i),i}_getInterleaveInput(e,t){let i=u(t.getAccessor()),r=e.byteOffsets[t.id];if(O(`${e.id}.${t.id} rowByteLength`,i),O(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return O(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new C.GL({id:t.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let n=t.getBuffer(),s=t.byteOffset,o=t.getAccessor().stride||i;if(O(`${e.id}.${t.id} byteOffset`,s),O(`${e.id}.${t.id} stride`,o),!n)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new C.GL({id:t.id,type:"uint32",size:i/4,offset:s,stride:o,length:e.rowCount,buffer:n})}}function I(e){return 4*Math.ceil(e/4)}function O(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}var R=i(82417),L=i(43411),B=i(88262);function j(e,t=[],i=0){let r=Math.fround(e),n=e-r;return t[i]=r,t[i+1]=n,t}let z=`\

layout(std140) uniform fp64arithmeticUniforms {
  uniform float ONE;
  uniform float SPLIT;
} fp64;

/*
About LUMA_FP64_CODE_ELIMINATION_WORKAROUND

The purpose of this workaround is to prevent shader compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' form.

These helpers implement Dekker/Veltkamp-style error tracking. If the compiler
folds constants or reassociates the arithmetic, the high/low split can stop
tracking the rounding error correctly. That failure mode tends to look fine in
simple coordinate setup, but then breaks down inside iterative arithmetic such
as fp64 Mandelbrot loops.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be 1 only at runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

float prevent_fp64_optimization(float value) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  return value + fp64.ONE * 0.0;
#else
  return value;
#endif
}

// Divide float number to high and low floats to extend fraction bits
vec2 split(float a) {
  // Keep SPLIT as a runtime uniform so the compiler cannot fold the Dekker
  // split into a constant expression and reassociate the recovery steps.
  float split = prevent_fp64_optimization(fp64.SPLIT);
  float t = prevent_fp64_optimization(a * split);
  float temp = t - a;
  float a_hi = t - temp;
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

// Divide float number again when high float uses too many fraction bits
vec2 split2(vec2 a) {
  vec2 b = split(a.x);
  b.y += a.y;
  return b;
}

// Special sum operation when a > b
vec2 quickTwoSum(float a, float b) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float sum = (a + b) * fp64.ONE;
  float err = b - (sum - a) * fp64.ONE;
#else
  float sum = a + b;
  float err = b - (sum - a);
#endif
  return vec2(sum, err);
}

// General sum operation
vec2 twoSum(float a, float b) {
  float s = (a + b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE + (b - v);
#else
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
#endif
  return vec2(s, err);
}

vec2 twoSub(float a, float b) {
  float s = (a - b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE - (b + v);
#else
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
#endif
  return vec2(s, err);
}

vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err = ((a_fp64.x * a_fp64.x - prod) * fp64.ONE + 2.0 * a_fp64.x *
    a_fp64.y * fp64.ONE * fp64.ONE) + a_fp64.y * a_fp64.y * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
#endif
  return vec2(prod, err);
}

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  // twoProd is especially sensitive because mul_fp64 and div_fp64 both depend
  // on the split terms and cross terms staying in the original evaluation
  // order. If the compiler folds or reassociates them, the low part tends to
  // collapse to zero or NaN on some drivers.
  float highProduct = prevent_fp64_optimization(a_fp64.x * b_fp64.x);
  float crossProduct1 = prevent_fp64_optimization(a_fp64.x * b_fp64.y);
  float crossProduct2 = prevent_fp64_optimization(a_fp64.y * b_fp64.x);
  float lowProduct = prevent_fp64_optimization(a_fp64.y * b_fp64.y);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err1 = (highProduct - prod) * fp64.ONE;
  float err2 = crossProduct1 * fp64.ONE * fp64.ONE;
  float err3 = crossProduct2 * fp64.ONE * fp64.ONE * fp64.ONE;
  float err4 = lowProduct * fp64.ONE * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err1 = highProduct - prod;
  float err2 = crossProduct1;
  float err3 = crossProduct2;
  float err4 = lowProduct;
#endif
  float err = ((err1 + err2) + err3) + err4;
  return vec2(prod, err);
}

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  prod.y += a.y * b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  vec2 yn = mul_fp64(a, vec2(xn, 0));
#else
  vec2 yn = a * xn;
#endif
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {
  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * fp64.ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2(yn, 0.0), prod);
#endif
}
`,N=`\
struct Fp64F32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent.
fn fp64_decode_f32_bits(bits: u32) -> Fp64F32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64F32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64F32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64F32Bits(sign, i32(exponentBits) - 150, 0x800000u | fraction, false, false, false);
}

fn fp64_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return exactSign << 31u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;

  // A normal two-sum/two-product residual never needs a shift this large.
  // This guard gives deterministic underflow behavior outside that contract.
  if (exactShift >= 64 || highShift >= 64) {
    return exactSign << 31u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let lowBits = fp64_make_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  return vec2u(highBits, lowBits);
}

fn fp64_two_sum_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u((a.sign & b.sign) << 31u, 0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = select(
    b.baseExponent - a.baseExponent,
    a.baseExponent - b.baseExponent,
    a.baseExponent >= b.baseExponent
  );

  // Beyond half an ulp, rounding cannot change the larger operand. Returning
  // the smaller operand intact also avoids an unbounded integer alignment.
  // At a power-of-two boundary the spacing below the larger operand is half
  // the spacing above it, so an opposite-sign gap-25 operand can still change
  // the rounded high limb. Gap 26 is the first universally safe early-out.
  if (exponentDifference > 25) {
    if (fp64_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u, 0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_accumulator_bits(resultSign, resultMagnitude, commonBaseExponent);
}

fn fp64_two_sum_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_multiply_significands(a: u32, b: u32) -> vec2u {
  let aLow = a & 0xffffu;
  let aHigh = a >> 16u;
  let bLow = b & 0xffffu;
  let bHigh = b >> 16u;
  let lowProduct = aLow * bLow;
  let crossProduct = aLow * bHigh + aHigh * bLow;
  let highProduct = aHigh * bHigh;

  var result = vec2u(0u, lowProduct);
  result = fp64_u64_add(
    result,
    fp64_u64_shift_left(vec2u(0u, crossProduct), 16u)
  );
  result = fp64_u64_add(result, vec2u(highProduct, 0u));
  return result;
}

fn fp64_two_prod_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);
  let resultSign = a.sign ^ b.sign;

  if (a.isNan || b.isNan || ((a.isZero || b.isZero) && (a.isInf || b.isInf))) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    return vec2u((resultSign << 31u) | 0x7f800000u, resultSign << 31u);
  }
  if (a.isZero || b.isZero) {
    return vec2u(resultSign << 31u, resultSign << 31u);
  }

  let magnitude = fp64_multiply_significands(a.significand, b.significand);
  return fp64_split_accumulator_bits(
    resultSign,
    magnitude,
    a.baseExponent + b.baseExponent
  );
}

fn fp64_two_prod_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_prod_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_round_add_integer(a: f32, b: f32) -> f32 {
  return fp64_two_sum_integer(a, b).x;
}

fn fp64_round_mul_integer(a: f32, b: f32) -> f32 {
  return fp64_two_prod_integer(a, b).x;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_finite_exponent(value: Fp64F32Bits) -> i32 {
  let mostSignificantBit = 31u - countLeadingZeros(value.significand);
  return value.baseExponent + i32(mostSignificantBit);
}

fn fp64_scale_f32_integer(value: f32, exponent: i32) -> f32 {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(value));
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return value;
  }
  let resultBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent + exponent
  );
  return bitcast<f32>(resultBits);
}

// Divide normalized significands so the hardware operation cannot overflow,
// underflow, or flush a subnormal result. Reapply the exponent with integer
// packing, which also produces subnormal correction limbs without relying on
// floating-point arithmetic to preserve them.
fn fp64_divide_f32_integer(aValue: f32, bValue: f32) -> f32 {
  let a = fp64_decode_f32_bits(bitcast<u32>(aValue));
  let b = fp64_decode_f32_bits(bitcast<u32>(bValue));
  if (a.isZero || b.isZero || a.isInf || b.isInf || a.isNan || b.isNan) {
    return aValue / bValue;
  }

  let aMostSignificantBit = 31u - countLeadingZeros(a.significand);
  let bMostSignificantBit = 31u - countLeadingZeros(b.significand);
  let normalizedABits = fp64_make_f32_bits_from_u64(
    a.sign,
    vec2u(0u, a.significand),
    -i32(aMostSignificantBit)
  );
  let normalizedBBits = fp64_make_f32_bits_from_u64(
    b.sign,
    vec2u(0u, b.significand),
    -i32(bMostSignificantBit)
  );
  let normalizedQuotient = bitcast<f32>(normalizedABits) / bitcast<f32>(normalizedBBits);
  let quotient = fp64_decode_f32_bits(bitcast<u32>(normalizedQuotient));
  let exponentShift =
    a.baseExponent + i32(aMostSignificantBit) -
    b.baseExponent - i32(bMostSignificantBit);
  let quotientBits = fp64_make_f32_bits_from_u64(
    quotient.sign,
    vec2u(0u, quotient.significand),
    quotient.baseExponent + exponentShift
  );
  return bitcast<f32>(quotientBits);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  // Rounding the high limb of a maximum-exponent value can overflow even
  // though the original value is finite. Truncate only in that boundary case
  // so split remains an exact finite decomposition.
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = fp64_round_add_integer(result.y, a.y);
  return result;
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let negatedB = vec2f(
    bitcast<f32>(bitcast<u32>(b.x) ^ 0x80000000u),
    bitcast<f32>(bitcast<u32>(b.y) ^ 0x80000000u)
  );
  return sum_fp64(a, negatedB);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var product = fp64_two_prod_integer(a.x, b.x);
  let crossProduct1 = fp64_round_mul_integer(a.x, b.y);
  product.y = fp64_round_add_integer(product.y, crossProduct1);
  product = fp64_two_sum_integer(product.x, product.y);
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  product.y = fp64_round_add_integer(product.y, crossProduct2);
  return fp64_two_sum_integer(product.x, product.y);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_scale_fp64_integer(value: vec2f, exponent: i32) -> vec2f {
  let high = fp64_scale_f32_integer(value.x, exponent);
  let low = fp64_scale_f32_integer(value.y, exponent);
  return sum_fp64(vec2f(high, 0.0), vec2f(low, 0.0));
}

fn fp64_div_fp64_normalized(a: vec2f, b: vec2f) -> vec2f {
  let quotientHigh = fp64_divide_f32_integer(a.x, b.x);
  var quotient = vec2f(quotientHigh, 0.0);

  let remainder = sub_fp64(a, mul_fp64(b, quotient));
  let quotientLow = fp64_divide_f32_integer(remainder.x, b.x);
  quotient = sum_fp64(quotient, vec2f(quotientLow, 0.0));

  let secondRemainder = sub_fp64(a, mul_fp64(b, quotient));
  let correction = fp64_divide_f32_integer(secondRemainder.x, b.x);
  return sum_fp64(quotient, vec2f(correction, 0.0));
}

fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let decodedA = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedB = fp64_decode_f32_bits(bitcast<u32>(b.x));
  if (
    decodedA.isZero || decodedB.isZero ||
    decodedA.isInf || decodedB.isInf ||
    decodedA.isNan || decodedB.isNan
  ) {
    return fp64_div_fp64_normalized(a, b);
  }

  let exponentA = fp64_f32_finite_exponent(decodedA);
  let exponentB = fp64_f32_finite_exponent(decodedB);
  // Correct the quotient near unity so b * q and the remainder stay clear of
  // both f32 underflow and overflow. The exponent difference is applied once.
  let normalizedA = fp64_scale_fp64_integer(a, -exponentA);
  let normalizedB = fp64_scale_fp64_integer(b, -exponentB);
  let normalizedQuotient = fp64_div_fp64_normalized(normalizedA, normalizedB);
  return fp64_scale_fp64_integer(normalizedQuotient, exponentA - exponentB);
}

fn fp64_sqrt_fp64_normalized(a: vec2f) -> vec2f {
  let estimate = sqrt(a.x);
  let difference = sub_fp64(a, fp64_two_prod_integer(estimate, estimate)).x;
  let denominator = fp64_round_add_integer(estimate, estimate);
  let correction = fp64_divide_f32_integer(difference, denominator);
  return sum_fp64(vec2f(estimate, 0.0), vec2f(correction, 0.0));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  if (decoded.isZero && decodedLow.isZero) {
    return vec2f(0.0, 0.0);
  }
  if (decoded.sign == 1u) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  if (decoded.isInf || decoded.isNan) {
    return fp64_sqrt_fp64_normalized(a);
  }
  let exponent = fp64_f32_finite_exponent(decoded);
  // An even scale lets the final square-root rescale use an integer exponent.
  let evenExponent = exponent - (exponent & 1);
  let normalizedA = fp64_scale_fp64_integer(a, -evenExponent);
  let normalizedRoot = fp64_sqrt_fp64_normalized(normalizedA);
  return fp64_scale_fp64_integer(normalizedRoot, evenExponent / 2);
}
#endif
`,D={name:"fp64arithmetic",source:`\
struct Fp64ArithmeticUniforms {
  ONE: f32,
  SPLIT: f32,
};

@group(0) @binding(auto) var<uniform> fp64arithmetic : Fp64ArithmeticUniforms;

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64Bits {
  sign: u32,
  exponent: i32,
  significand: vec2u,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_nan(seed: f32) -> f32 {
  let nanBits = 0x7fc00000u | select(0u, 1u, seed < 0.0);
  return bitcast<f32>(nanBits);
}
#endif

fn fp64_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn fp64_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn fp64_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn fp64_u64_sub(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn fp64_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn fp64_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn fp64_u64_get_bit(value: vec2u, bitIndex: u32) -> bool {
  if (bitIndex >= 64u) {
    return false;
  }
  if (bitIndex >= 32u) {
    return ((value.x >> (bitIndex - 32u)) & 1u) != 0u;
  }
  return ((value.y >> bitIndex) & 1u) != 0u;
}

fn fp64_u64_has_bits_below(value: vec2u, bitCount: u32) -> bool {
  if (bitCount == 0u) {
    return false;
  }
  if (bitCount >= 64u) {
    return !fp64_u64_is_zero(value);
  }
  if (bitCount > 32u) {
    let highBitCount = bitCount - 32u;
    let highMask = (1u << highBitCount) - 1u;
    return value.y != 0u || (value.x & highMask) != 0u;
  }
  if (bitCount == 32u) {
    return value.y != 0u;
  }
  let lowMask = (1u << bitCount) - 1u;
  return (value.y & lowMask) != 0u;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_u64_shift_right_sticky(value: vec2u, shift: u32) -> vec2u {
  var shifted = fp64_u64_shift_right(value, shift);
  if (fp64_u64_has_bits_below(value, shift)) {
    shifted.y = shifted.y | 1u;
  }
  return shifted;
}
#endif

fn fp64_u64_count_leading_zeros(value: vec2u) -> u32 {
  if (value.x != 0u) {
    return countLeadingZeros(value.x);
  }
  return 32u + countLeadingZeros(value.y);
}

fn fp64_round_shift_right_to_u32(value: vec2u, shift: u32) -> u32 {
  if (shift == 0u) {
    return value.y;
  }

  let truncated = fp64_u64_shift_right(value, shift);
  var rounded = truncated.y;
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded & 1u) == 1u)) {
    rounded = rounded + 1u;
  }
  return rounded;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_round_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }

  var rounded = fp64_u64_shift_right(value, shift);
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded.y & 1u) == 1u)) {
    rounded = fp64_u64_add(rounded, vec2u(0u, 1u));
  }
  return rounded;
}
#endif

fn fp64_make_f32_bits_from_u64(sign: u32, significand: vec2u, baseExponent: i32) -> u32 {
  if (fp64_u64_is_zero(significand)) {
    return sign << 31u;
  }

  let leadingZeros = fp64_u64_count_leading_zeros(significand);
  let mostSignificantBit = 63u - leadingZeros;
  var exponent = baseExponent + i32(mostSignificantBit);

  if (exponent > 127) {
    return (sign << 31u) | 0x7f800000u;
  }

  if (exponent >= -126) {
    let shift = i32(mostSignificantBit) - 23;
    var significand24: u32;
    if (shift > 0) {
      significand24 = fp64_round_shift_right_to_u32(significand, u32(shift));
    } else {
      significand24 = fp64_u64_shift_left(significand, u32(-shift)).y;
    }

    if (significand24 >= 0x1000000u) {
      significand24 = significand24 >> 1u;
      exponent = exponent + 1;
      if (exponent > 127) {
        return (sign << 31u) | 0x7f800000u;
      }
    }

    return (sign << 31u) | (u32(exponent + 127) << 23u) | (significand24 & 0x7fffffu);
  }

  let scaleExponent = baseExponent + 149;
  var mantissa: u32;
  if (scaleExponent >= 0) {
    mantissa = fp64_u64_shift_left(significand, u32(scaleExponent)).y;
  } else {
    mantissa = fp64_round_shift_right_to_u32(significand, u32(-scaleExponent));
  }

  if (mantissa >= 0x800000u) {
    return (sign << 31u) | 0x00800000u;
  }
  return (sign << 31u) | mantissa;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_decode_bits(bits: vec2u) -> Fp64Bits {
  let sign = bits.x >> 31u;
  let exponentBits = (bits.x >> 20u) & 0x7ffu;
  let fractionHigh = bits.x & 0xfffffu;
  let fractionLow = bits.y;
  let fraction = vec2u(fractionHigh, fractionLow);

  if (exponentBits == 0x7ffu) {
    let isInf = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, 0, vec2u(0u), false, isInf, !isInf);
  }

  if (exponentBits == 0u) {
    let isZero = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, -1022, fraction, isZero, false, false);
  }

  return Fp64Bits(sign, i32(exponentBits) - 1023, vec2u((1u << 20u) | fractionHigh, fractionLow), false, false, false);
}

fn fp64_finite_magnitude_compare(a: Fp64Bits, b: Fp64Bits) -> i32 {
  if (a.exponent != b.exponent) {
    return select(-1, 1, a.exponent > b.exponent);
  }
  return fp64_u64_compare(a.significand, b.significand);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64RawF32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent. This shared
// integer representation lets normalization remain independent of the
// selected double-single arithmetic implementation.
fn fp64_decode_raw_f32_bits(bits: u32) -> Fp64RawF32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64RawF32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64RawF32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64RawF32Bits(
    sign,
    i32(exponentBits) - 150,
    0x800000u | fraction,
    false,
    false,
    false
  );
}

fn fp64_raw_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_raw_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_raw_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return 0u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;
  if (exactShift >= 64 || highShift >= 64) {
    return 0u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_raw_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let rawLowBits = fp64_make_raw_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  let lowBits = select(rawLowBits, 0u, (rawLowBits & 0x7fffffffu) == 0u);
  if ((highBits & 0x7fffffffu) == 0u && (lowBits & 0x7fffffffu) == 0u) {
    return vec2u(0u);
  }
  return vec2u(highBits, lowBits);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
// Round an arithmetic accumulator to binary64 before splitting it. The
// aligned add/subtract paths retain three guard bits plus a sticky bit, which
// is sufficient for round-to-nearest-even at the binary64 boundary.
fn fp64_split_binary64_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }

  let mostSignificantBit = 63u - fp64_u64_count_leading_zeros(magnitude);
  let exponent = baseExponent + i32(mostSignificantBit);
  if (exponent > 1023) {
    return vec2u((sign << 31u) | 0x7f800000u, 0u);
  }

  var roundedMagnitude = magnitude;
  var roundedBaseExponent = baseExponent;
  if (exponent >= -1022) {
    if (mostSignificantBit > 52u) {
      let shift = mostSignificantBit - 52u;
      roundedMagnitude = fp64_round_shift_right(magnitude, shift);
      roundedBaseExponent = baseExponent + i32(shift);
    }
  } else {
    let shift = -1074 - baseExponent;
    if (shift > 0) {
      roundedMagnitude = fp64_round_shift_right(magnitude, u32(shift));
      roundedBaseExponent = -1074;
    }
  }

  if (fp64_u64_is_zero(roundedMagnitude)) {
    return vec2u(0u);
  }
  return fp64_split_raw_accumulator_bits(sign, roundedMagnitude, roundedBaseExponent);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_add_raw_f32_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_raw_f32_bits(aBits);
  let b = fp64_decode_raw_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = abs(a.baseExponent - b.baseExponent);
  if (exponentDifference > 25) {
    if (fp64_raw_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_raw_accumulator_bits(
    resultSign,
    resultMagnitude,
    commonBaseExponent
  );
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_add_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_sub_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_add_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

fn fp64_sub_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

// Subtract two raw binary64 values and round the exact result once to f32.
// The input words are canonical high/low words: .x contains sign/exponent/high
// fraction bits, and .y contains the low 32 fraction bits.
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32 {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return 0x7fc00000u;
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return (a.sign << 31u) | 0x7f800000u;
    }
    return 0x7fc00000u;
  }
  if (a.isInf) {
    return (a.sign << 31u) | 0x7f800000u;
  }
  if (b.isInf) {
    return (bSubtractionSign << 31u) | 0x7f800000u;
  }
  if (a.isZero && b.isZero) {
    return select(0u, 0x80000000u, a.sign == 1u && b.sign == 0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return 0u;
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_f32_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_f32_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32 {
  return bitcast<f32>(sub_fp64u32_to_f32_bits(aBits, bBits));
}

// Subtract two raw binary64 values, round once to binary64, then split the
// result into normalized f32 limbs. Finite results must fit within the f32
// exponent range; larger magnitudes map to infinity and smaller magnitudes
// map to zero. The input words use canonical high/low word order.
fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
    }
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf) {
    return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
  }
  if (b.isInf) {
    return vec2u((bSubtractionSign << 31u) | 0x7f800000u, 0u);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return vec2u(0u);
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_fp64_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f {
  let resultBits = sub_fp64u32_to_fp64_bits(aBits, bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_runtime_zero() -> f32 {
  return fp64arithmetic.ONE * 0.0;
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return value + fp64_runtime_zero();
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${N}
#else
fn split(a: f32) -> vec2f {
  let splitValue = prevent_fp64_optimization(fp64arithmetic.SPLIT + fp64_runtime_zero());
  let t = prevent_fp64_optimization(a * splitValue);
  let temp = prevent_fp64_optimization(t - a);
  let aHi = prevent_fp64_optimization(t - temp);
  let aLo = prevent_fp64_optimization(a - aHi);
  return vec2f(aHi, aLo);
}

fn split2(a: vec2f) -> vec2f {
  var b = split(a.x);
  b.y = b.y + a.y;
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let sum = prevent_fp64_optimization((a + b) * fp64arithmetic.ONE);
  let err = prevent_fp64_optimization(b - (sum - a) * fp64arithmetic.ONE);
#else
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - (sum - a));
#endif
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) +
    prevent_fp64_optimization(b - v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) + prevent_fp64_optimization(b - v);
#endif
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) -
    prevent_fp64_optimization(b + v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) - prevent_fp64_optimization(b + v);
#endif
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err =
    (prevent_fp64_optimization(highProduct - prod) * fp64arithmetic.ONE +
      crossProduct * fp64arithmetic.ONE * fp64arithmetic.ONE) +
    lowProduct * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
#else
  let err = ((prevent_fp64_optimization(highProduct - prod) + crossProduct) + lowProduct);
#endif
  return vec2f(prod, err);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * b);
  let aFp64 = split(a);
  let bFp64 = split(b);
  let highProduct = prevent_fp64_optimization(aFp64.x * bFp64.x);
  let crossProduct1 = prevent_fp64_optimization(aFp64.x * bFp64.y);
  let crossProduct2 = prevent_fp64_optimization(aFp64.y * bFp64.x);
  let lowProduct = prevent_fp64_optimization(aFp64.y * bFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err1 = (highProduct - prod) * fp64arithmetic.ONE;
  let err2 = crossProduct1 * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err3 = crossProduct2 * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err4 =
    lowProduct *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE;
#else
  let err1 = highProduct - prod;
  let err2 = crossProduct1;
  let err3 = crossProduct2;
  let err4 = lowProduct;
#endif
  let err12InputA = prevent_fp64_optimization(err1);
  let err12InputB = prevent_fp64_optimization(err2);
  let err12 = prevent_fp64_optimization(err12InputA + err12InputB);
  let err123InputA = prevent_fp64_optimization(err12);
  let err123InputB = prevent_fp64_optimization(err3);
  let err123 = prevent_fp64_optimization(err123InputA + err123InputB);
  let err1234InputA = prevent_fp64_optimization(err123);
  let err1234InputB = prevent_fp64_optimization(err4);
  let err = prevent_fp64_optimization(err1234InputA + err1234InputB);
  return vec2f(prod, err);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSum(a.x, b.x);
  let t = twoSum(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSub(a.x, b.x);
  let t = twoSub(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var prod = twoProd(a.x, b.x);
  let crossProduct1 = prevent_fp64_optimization(a.x * b.y);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct1);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  let crossProduct2 = prevent_fp64_optimization(a.y * b.x);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct2);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let xn = prevent_fp64_optimization(1.0 / b.x);
  let yn = mul_fp64(a, vec2f(xn, fp64_runtime_zero()));
  let diff = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, yn)).x);
  let prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let x = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let yn = prevent_fp64_optimization(a.x * x);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let ynSqr = twoSqr(yn) * fp64arithmetic.ONE;
#else
  let ynSqr = twoSqr(yn);
#endif
  let diff = prevent_fp64_optimization(sub_fp64(a, ynSqr).x);
  let prod = twoProd(prevent_fp64_optimization(x * 0.5), diff);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2f(yn, 0.0), prod);
#endif
}
#endif
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_bits_is_nan(bits: u32) -> bool {
  return (bits & 0x7fffffffu) > 0x7f800000u;
}

fn fp64_f32_bits_is_inf(bits: u32) -> bool {
  return (bits & 0x7fffffffu) == 0x7f800000u;
}

fn fp64_compare_f32_bits(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == 0u && bMagnitude == 0u) {
    return 0;
  }
  let aSign = aBits >> 31u;
  let bSign = bBits >> 31u;
  if (aSign != bSign) {
    return select(1, -1, aSign == 1u);
  }
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  let magnitudeComparison = select(-1, 1, aMagnitude > bMagnitude);
  return select(magnitudeComparison, -magnitudeComparison, aSign == 1u);
}

// Normalize an arbitrary pair of finite f32 limbs with integer accumulation.
// This is independent of LUMA_FP64_INTEGER_ARITHMETIC and canonicalizes every
// representation of zero to vec2f(+0.0, +0.0).
fn normalize_fp64(value: vec2f) -> vec2f {
  let resultBits = fp64_add_raw_f32_bits(bitcast<u32>(value.x), bitcast<u32>(value.y));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn is_nan_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  return fp64_f32_bits_is_nan(bitcast<u32>(normalized.x)) ||
    fp64_f32_bits_is_nan(bitcast<u32>(normalized.y));
}

fn is_finite_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  return !fp64_f32_bits_is_nan(highBits) && !fp64_f32_bits_is_nan(lowBits) &&
    !fp64_f32_bits_is_inf(highBits) && !fp64_f32_bits_is_inf(lowBits);
}

// Returns -1, 0, or 1. NaN is unordered and returns 0; call is_nan_fp64 or
// is_finite_fp64 first when 0 must mean a finite zero.
fn sign_fp64(value: vec2f) -> i32 {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  if (fp64_f32_bits_is_nan(highBits) || fp64_f32_bits_is_nan(lowBits)) {
    return 0;
  }
  if ((highBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (highBits >> 31u) == 1u);
  }
  if ((lowBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (lowBits >> 31u) == 1u);
  }
  return 0;
}

// Compares double-single values and returns -1, 0, or 1. NaN is unordered
// and returns 0; callers that require equality semantics must first check
// is_nan_fp64 or is_finite_fp64.
fn compare_fp64(a: vec2f, b: vec2f) -> i32 {
  let normalizedA = normalize_fp64(a);
  let normalizedB = normalize_fp64(b);
  let aHighBits = bitcast<u32>(normalizedA.x);
  let aLowBits = bitcast<u32>(normalizedA.y);
  let bHighBits = bitcast<u32>(normalizedB.x);
  let bLowBits = bitcast<u32>(normalizedB.y);
  if (fp64_f32_bits_is_nan(aHighBits) || fp64_f32_bits_is_nan(aLowBits) ||
      fp64_f32_bits_is_nan(bHighBits) || fp64_f32_bits_is_nan(bLowBits)) {
    return 0;
  }
  let highComparison = fp64_compare_f32_bits(aHighBits, bHighBits);
  if (highComparison != 0) {
    return highComparison;
  }
  return fp64_compare_f32_bits(aLowBits, bLowBits);
}
#endif
`,fs:z,vs:z,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:j,fp64LowPart:function(e){return e-Math.fround(e)},fp64ifyMatrix4:function(e){let t=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let n=4*i+r;j(e[4*r+i],t,2*n)}return t}};function F(e){let{source:t,target:i,start:r=0,size:n,getData:s}=e,o=e.end||i.length,a=t.length,l=o-r;if(a>l)return void i.set(t.subarray(0,l),r);if(i.set(t,r),!s)return;let u=a;for(;u<l;){let e=s(u,t);for(let t=0;t<n;t++)i[r+u]=e[t]||0,u++}}function U(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${e}"`)}}function V(e){switch(e){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function $(e){e.push(e.shift())}function W({device:e,source:t,target:i}){return(!i||i.byteLength<t.byteLength)&&(i?.destroy(),i=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),i}function G({device:e,buffer:t,attribute:i,fromLength:r,toLength:n,fromStartIndices:s,getData:o=e=>e}){let a=i.isDoublePrecisionBuffer?2:1,l=i.size*a,u=i.byteOffset,c=i.settings.bytesPerElement<4?u/i.settings.bytesPerElement*4:u,h=i.startIndices,d=s&&h,f=i.isConstant;if(!d&&t&&r>=n)return t;let p=i.value instanceof Float64Array?Float32Array:i.value.constructor,g=f?i.value:new p(i.getBuffer().readSyncWebGL(u,n*p.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!f){let e=o;o=(t,r)=>i.normalizeConstant(e(t,r))}let _=f?(e,t)=>o(g,t):(e,t)=>o(g.subarray(e+u,e+u+l),t),m=new Float32Array(t?t.readSyncWebGL(c,4*r).buffer:0),v=new Float32Array(n);return!function({source:e,target:t,size:i,getData:r,sourceStartIndices:n,targetStartIndices:s}){if(!n||!s)return F({source:e,target:t,size:i,getData:r});let o=0,a=0,l=r&&((e,t)=>r(e+a,t)),u=Math.min(n.length,s.length);for(let r=1;r<u;r++){let u=n[r]*i,c=s[r]*i;F({source:e.subarray(o,u),target:t,start:a,end:c,size:i,getData:l}),o=u,a=c}a<t.length&&F({source:[],target:t,start:a,size:i,getData:l})}({source:m,target:v,sourceStartIndices:s,targetStartIndices:h,size:l,getData:_}),(!t||t.byteLength<v.byteLength+c)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+c,usage:35050})),t.write(v,c),t}var H=i(2357);class q{constructor({device:e,attribute:t,timeline:i}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new H.A(i),this.attribute=t,this.attributeInTransition=function(e){let{device:t,settings:i,value:r}=e,n=new P(t,i);return n.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),n}(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,i=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(e,t){let{settings:i,value:r,size:n}=e,s=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:a}=e.settings;if(a)for(let e of Object.values(a))o=Math.max(o,e.vertexOffset??0);return(i.noAlloc?r.length:(t+o)*n)*s}(this.attribute,t),this.transition.start({...e,duration:i})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){for(let e of(this.cancel(),this.buffers))e.destroy();this.buffers.length=0}}let Y={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},Z=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,K=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aFrom64Low;
in ATTRIBUTE_TYPE aTo;
in ATTRIBUTE_TYPE aTo64Low;
out ATTRIBUTE_TYPE vCurrent;
out ATTRIBUTE_TYPE vCurrent64Low;

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

void main(void) {
  for (int i=0; i<ATTRIBUTE_SIZE; i++) {
    vec2 value = mix_fp64(vec2(aFrom[i], aFrom64Low[i]), vec2(aTo[i], aTo64Low[i]), interpolation.time);
    vCurrent[i] = value.x;
    vCurrent64Low[i] = value.y;
  }
  gl_Position = vec4(0.0);
}
`;function X(e){return e.isDoublePrecisionBuffer}let J={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},Q=`\
#version 300 es
#define SHADER_NAME spring-transition-vertex-shader

#define EPSILON 0.00001

in ATTRIBUTE_TYPE aPrev;
in ATTRIBUTE_TYPE aCur;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vNext;
out float vIsTransitioningFlag;

ATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {
  ATTRIBUTE_TYPE velocity = cur - prev;
  ATTRIBUTE_TYPE delta = dest - cur;
  ATTRIBUTE_TYPE force = delta * spring.stiffness;
  ATTRIBUTE_TYPE resistance = velocity * spring.damping;
  return force - resistance + velocity + cur;
}

void main(void) {
  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;
  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;

  vNext = getNextValue(aCur, aPrev, aTo);
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
`,ee=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,et={interpolation:class extends q{constructor({device:e,attribute:t,timeline:i}){var r,n;let s,o,a,l;super({device:e,attribute:t,timeline:i}),this.type="interpolation",this.transform=(r=e,o=U(s=(n=t).size),a=V(s),l=n.getBufferLayout(),X(n)?new B.p(r,{vs:K,bufferLayout:[{name:"aFrom",byteStride:8*s,attributes:[{attribute:"aFrom",format:a,byteOffset:0},{attribute:"aFrom64Low",format:a,byteOffset:4*s}]},{name:"aTo",byteStride:8*s,attributes:[{attribute:"aTo",format:a,byteOffset:0},{attribute:"aTo64Low",format:a,byteOffset:4*s}]}],modules:[D,Y],defines:{ATTRIBUTE_TYPE:o,ATTRIBUTE_SIZE:s},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new B.p(r,{vs:Z,bufferLayout:[{name:"aFrom",format:a},{name:"aTo",format:l.attributes[0].format}],modules:[Y],defines:{ATTRIBUTE_TYPE:o},varyings:["vCurrent"],disableWarnings:!0}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0)return void this.transition.cancel();let{buffers:n,attribute:s}=this;$(n),n[0]=G({device:this.device,buffer:n[0],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),n[1]=W({device:this.device,source:n[0],target:n[1]}),this.setBuffer(n[1]);let{transform:o}=this,a=o.model,l=Math.floor(this.currentLength/s.size);X(s)&&(l/=2),a.setVertexCount(l),s.isConstant?(a.setAttributes({aFrom:n[0]}),a.setConstantAttributes({aTo:s.value})):a.setAttributes({aFrom:n[0],aTo:s.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:n[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:i}=this.transition,r=i/e;t&&(r=t(r));let{model:n}=this.transform,s={time:r};n.shaderInputs.setProps({interpolation:s}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},spring:class extends q{constructor({device:e,attribute:t,timeline:i}){var r,n,s,o;let a,l;super({device:e,attribute:t,timeline:i}),this.type="spring",this.texture=e.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=e,n=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[n]})),this.transform=(s=e,a=U((o=t).size),l=V(o.size),new B.p(s,{vs:Q,fs:ee,bufferLayout:[{name:"aPrev",format:l},{name:"aCur",format:l},{name:"aTo",format:o.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[J],defines:{ATTRIBUTE_TYPE:a},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:n,attribute:s}=this;for(let t=0;t<2;t++)n[t]=G({device:this.device,buffer:n[t],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});n[2]=W({device:this.device,source:n[0],target:n[2]}),this.setBuffer(n[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/s.size)),s.isConstant?o.setConstantAttributes({aTo:s.value}):o.setAttributes({aTo:s.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:i,transition:r}=this,n=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let s={stiffness:n.stiffness,damping:n.damping};t.model.shaderInputs.setProps({spring:s}),t.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),$(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class ei{constructor(e,{id:t,timeline:i}){if(!e)throw Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:i}){for(let r in this.numInstances=i||1,e){let i=e[r],n=i.getTransitionSetting(t);n&&this._updateAttribute(r,i,n)}for(let i in this.transitions){let r=e[i];r&&r.getTransitionSetting(t)||this._removeTransition(i)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let i=this.transitions[t];i.inProgress&&(e[t]=i.attributeInTransition)}return e}run(){if(0===this.numInstances)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,i){let r=this.transitions[e],n=!r||r.type!==i.type;if(n){r&&this._removeTransition(e);let s=et[i.type];s?this.transitions[e]=new s({attribute:t,timeline:this.timeline,device:this.device}):(d.A.error(`unsupported transition type '${i.type}'`)(),n=!1)}(n||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(i,this.numInstances))}}let er="attributeManager.invalidate";class en{constructor(e,{id:t="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,R.A)(h._Z),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new ei(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===e.type?new k(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){for(let e in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)void 0!==this.attributes[t]&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let i=this._invalidateTrigger(e,t);(0,L.A)(er,this,e,i)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);(0,L.A)(er,this,"all")}update({data:e,numInstances:t,startIndices:i=null,transitions:r,props:n={},buffers:s={},context:o={}}){let a=!1;for(let r in(0,L.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],u=l.settings.accessor;l.startIndices=i,l.numInstances=t,n[r]&&d.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(s[r])||l.setBinaryValue("string"==typeof u?s[u]:void 0,e.startIndices)||"string"==typeof u&&!s[u]&&l.setConstantValue(o,n[u])||l.needsUpdate()&&(a=!0,this._updateAttribute({attribute:l,numInstances:t,data:e,props:n,context:o})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}a&&(0,L.A)("attributeManager.updateEnd",this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),a&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let n in t){let s=t[n];s.needsRedraw(e)&&!i.hasAttribute(n)&&(r[n]=s)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,i):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let i in e){let r=e[i],n={...r,id:i,size:r.isIndexed&&1||r.size||1,...t};this.attributes[i]=new P(this.device,n)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:i,updateTriggers:r}=this,n=r[e];return n&&n.forEach(e=>{let r=i[e];r&&r.setNeedsUpdate(r.id,t)}),n}_updateAttribute(e){let{attribute:t,numInstances:i}=e;((0,L.A)("attribute.updateStart",t),t.constant)?t.setConstantValue(e.context,t.value):(t.allocate(i)&&(0,L.A)("attribute.allocate",t,i),t.updateBuffer(e)&&(this.needsRedraw=!0,(0,L.A)("attribute.updateEnd",t,i)))}}var es=i(54901);class eo extends H.A{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:i,duration:r,easing:n}}=this,s=n(e/r);this._value=(0,es.Cc)(t,i,s)}}function ea(e,t,i,r,n){let s=t-e;return(i-t)*n+-s*r+s+t}function el(e,t){if(Array.isArray(e)){let i=0;for(let r=0;r<e.length;r++){let n=e[r]-t[r];i+=n*n}return Math.sqrt(i)}return Math.abs(e-t)}class eu extends H.A{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:i,stiffness:r}=this.settings,{_prevValue:n=e,_currValue:s=e}=this,o=function(e,t,i,r,n){if(Array.isArray(i)){let s=[];for(let o=0;o<i.length;o++)s[o]=ea(e[o],t[o],i[o],r,n);return s}return ea(e,t,i,r,n)}(n,s,t,i,r),a=el(o,t),l=el(o,s);a<1e-5&&l<1e-5&&(o=t,this.end()),this._prevValue=s,this._currValue=o}}let ec={interpolation:eo,spring:eu};class eh{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,i,r){let{transitions:n}=this;if(n.has(e)){let i=n.get(e),{value:r=i.settings.fromValue}=i;t=r,this.remove(e)}if(!(r=E(r)))return;let s=ec[r.type];if(!s)return void d.A.error(`unsupported transition type '${r.type}'`)();let o=new s(this.timeline);o.start({...r,fromValue:t,toValue:i}),n.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,i]of this.transitions)i.update(),e[t]=i.value,i.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}}var ed=i(12897);function ef({newProps:e,oldProps:t,ignoreProps:i={},propTypes:r={},triggerName:n="props"}){if(t===e)return!1;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return`${n} changed shallowly`;for(let s of Object.keys(e))if(!(s in i)){if(!(s in t))return`${n}.${s} added`;let i=ep(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}for(let s of Object.keys(t))if(!(s in i)){if(!(s in e))return`${n}.${s} dropped`;if(!Object.hasOwnProperty.call(e,s)){let i=ep(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}}return!1}function ep(e,t,i){let r=i&&i.equal;return r&&!r(e,t,i)||!r&&(r=e&&t&&e.equals)&&!r.call(e,t)?"changed deeply":r||t===e?null:"changed shallowly"}function eg(e,t,i){let r=e.updateTriggers[i];r=null==r?{}:r;let n=t.updateTriggers[i];return ef({oldProps:n=null==n?{}:n,newProps:r,triggerName:i})}function e_(e,t){if(!t)return e;let i={...e,...t};if("defines"in t&&(i.defines={...e.defines,...t.defines}),"modules"in t&&(i.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>"project64"===e.name))){let e=i.modules.findIndex(e=>"project32"===e.name);e>=0&&i.modules.splice(e,1)}if("inject"in t)if(e.inject){let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||"")+t.inject[e];i.inject=r}else i.inject=t.inject;return i}var em=i(74334),ev=i(78374),eb=i(82859),ey=i(39426),ew=i(67681);let ex=[0,0,0];function eE(e,t,i=!1){let r=t.projectPosition(e);if(i&&t instanceof ev.A){let[i,n,s=0]=e,o=t.getDistanceScales([i,n]);r[2]=s*o.unitsPerMeter[2]}return r}function eP(e,{viewport:t,modelMatrix:i,coordinateSystem:r,coordinateOrigin:n,offsetMode:s}){let[o,a,l=0]=e;switch(i&&([o,a,l]=ey.Z0([],[o,a,l,1],i)),r){case"default":return eP(e,{viewport:t,modelMatrix:i,coordinateSystem:t.isGeospatial?"lnglat":"cartesian",coordinateOrigin:n,offsetMode:s});case"lnglat":return eE([o,a,l],t,s);case"lnglat-offsets":return eE([o+n[0],a+n[1],l+(n[2]||0)],t,s);case"meter-offsets":return eE((0,ew.dT)(n,[o,a,l]),t,s);case"cartesian":return t.isGeospatial?[o+n[0],a+n[1],l+n[2]]:t.projectPosition([o,a,l]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}var eS=i(74358),eA=i(15608);let eM={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},eC={};var eT=i(7914);let ek={boolean:{validate:(e,t)=>!0,equal:(e,t,i)=>!!e==!!t},number:{validate:(e,t)=>Number.isFinite(e)&&(!("max"in t)||e<=t.max)&&(!("min"in t)||e>=t.min)},color:{validate:(e,t)=>t.optional&&!e||eO(e)&&(3===e.length||4===e.length),equal:(e,t,i)=>(0,eT.b)(e,t,1)},accessor:{validate(e,t){let i=eR(e);return"function"===i||i===eR(t.value)},equal:(e,t,i)=>"function"==typeof t||(0,eT.b)(e,t,1)},array:{validate:(e,t)=>t.optional&&!e||eO(e),equal(e,t,i){let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,eT.b)(e,t,n):e===t}},object:{equal(e,t,i){if(i.ignore)return!0;let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,eT.b)(e,t,n):e===t}},function:{validate:(e,t)=>t.optional&&!e||"function"==typeof e,equal:(e,t,i)=>!i.compare&&!1!==i.ignore||e===t},data:{transform:(e,t,i)=>{if(!e)return e;let{dataTransform:r}=i.props;return r?r(e):"string"==typeof e.shape&&e.shape.endsWith("-table")&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,i)=>{let r=i.context;return r&&r.device?function(e,t,i,r){if(i instanceof eA.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let n=null;i.compressed&&(n={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:s,height:o}=i.data,a=t.createTexture({...i,sampler:{...eM,...n,...r},mipLevels:t.getMipLevelCount(s,o)});return"webgl"===t.type?a.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(a),eC[a.id]=e,a}(i.id,r.device,e,{...t.parameters,...i.props.textureParameters}):null},release:(e,t,i)=>{var r;r=i.id,e&&e instanceof eA.g&&eC[e.id]===r&&(e.delete(),delete eC[e.id])}}};function eI(e,t){return"type"in t?{name:e,...ek[t.type],...t}:"value"in t?{name:e,type:eR(t.value),...t}:{name:e,type:"object",value:t}}function eO(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function eR(e){return eO(e)?"array":null===e?"null":typeof e}function eL(e,t){return Object.prototype.hasOwnProperty.call(e,t)}let eB=0;class ej{constructor(...e){this.props=function(e,t){let i;for(let e=t.length-1;e>=0;e--){let r=t[e];"extensions"in r&&(i=r.extensions)}let r=Object.create(function e(t,i){var r,n;if(!(t instanceof ez.constructor))return{};let s="_mergedDefaultProps";if(i)for(let e of i){let t=e.constructor;t&&(s+=`:${t.extensionName||t.name}`)}let o=eL(r=t,n=s)&&r[n];return o||(t[s]=function(t,i){var r;let n;if(!t.prototype)return null;let s=e(Object.getPrototypeOf(t)),o=function(e){let t={},i={},r={};for(let[n,s]of Object.entries(e)){let e=s?.deprecatedFor;if(e)r[n]=Array.isArray(e)?e:[e];else{let e=function(e,t){switch(eR(t)){case"object":return eI(e,t);case"array":return eI(e,{type:"array",value:t,compare:!1});case"boolean":return eI(e,{type:"boolean",value:t});case"number":return eI(e,{type:"number",value:t});case"function":return eI(e,{type:"function",value:t,compare:!0});default:return{name:e,type:"unknown",value:t}}}(n,s);t[n]=e,i[n]=e.value}}return{propTypes:t,defaultProps:i,deprecatedProps:r}}(function(e,t){return eL(e,t)&&e[t]}(t,"defaultProps")||{}),a=Object.assign(Object.create(null),s,o.defaultProps),l=Object.assign(Object.create(null),s?.[ed.fW],o.propTypes),u=Object.assign(Object.create(null),s?.[ed.uH],o.deprecatedProps);for(let t of i){let i=e(t.constructor);i&&(Object.assign(a,i),Object.assign(l,i[ed.fW]),Object.assign(u,i[ed.uH]))}return Object.defineProperties(a,{id:{writable:!0,value:((n=(r=t).componentName)||d.A.warn(`${r.name}.componentName not specified`)(),n||r.name)}}),function(e,t){let i={},r={};for(let e in t){let n=t[e],{name:s,value:o}=n;n.async&&(i[s]=o,r[s]=function(e){return{enumerable:!0,set(t){"string"==typeof t||t instanceof Promise||v(t)?this[ed.YN][e]=t:this[ed.vf][e]=t},get(){if(this[ed.vf]){if(e in this[ed.vf])return this[ed.vf][e]||this[ed.jA][e];if(e in this[ed.YN]){let t=this[ed.r3]&&this[ed.r3].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[ed.jA][e]}}return this[ed.jA][e]}}}(s))}e[ed.jA]=i,e[ed.YN]={},Object.defineProperties(e,r)}(a,l),function(e,t){for(let i in t)Object.defineProperty(e,i,{enumerable:!1,set(e){let r=`${this.id}: ${i}`;for(let r of t[i])eL(this,r)||(this[r]=e);d.A.deprecated(r,t[i].join("/"))()}})}(a,u),a[ed.fW]=l,a[ed.uH]=u,0!==i.length||eL(t,"_propTypes")||(t._propTypes=l),a}(t,i||[]))}(e.constructor,i));r[ed.r3]=e,r[ed.YN]={},r[ed.vf]={};for(let e=0;e<t.length;++e){let i=t[e];for(let e in i)r[e]=i[e]}return Object.freeze(r),r}(this,e),this.id=this.props.id,this.count=eB++}clone(e){let{props:t}=this,i={};for(let e in t[ed.jA])e in t[ed.vf]?i[e]=t[ed.vf][e]:e in t[ed.YN]&&(i[e]=t[ed.YN][e]);return new this.constructor({...t,...i,...e})}}ej.componentName="Component",ej.defaultProps={};let ez=ej,eN=Object.freeze({});class eD{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||eN}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[ed.r3]||this.component;let t=e[ed.vf]||{},i=e[ed.YN]||e,r=e[ed.jA]||{};for(let e in t){let i=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,i),t[e]=this.getAsyncProp(e)}for(let e in i){let t=i[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if("string"==typeof t&&(t=this._fetch(e,t)),t instanceof Promise)return void this._watchPromise(e,t);if(v(t))return void this._resolveAsyncIterable(e,t);this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let e in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}_didAsyncInputValueChange(e,t){let i=this.asyncProps[e];return t!==i.resolvedValue&&t!==i.lastValue&&(i.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let i=this.asyncProps[e];i&&(t=this._postProcessValue(i,t),i.resolvedValue=t,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(e,t,i){let r=this.asyncProps[e];r&&i>=r.resolvedLoadCount&&void 0!==t&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=i,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let i=this.asyncProps[e];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(i,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if("data"!==e)return void this._setPropValue(e,t);let i=this.asyncProps[e];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,n=[],s=0;for await(let i of t){if(!this.component)return;let{dataTransform:t}=this.component.props;Object.defineProperty(n=t?t(i,n):n.concat(i),"__diff",{enumerable:!1,value:[{startRow:s,endRow:n.length}]}),s=n.length,this._setAsyncPropValue(e,n,r)}this._onResolve(e,n)}_postProcessValue(e,t){let i=e.type;return i&&this.component&&(i.release&&i.release(e.resolvedValue,i,this.component),i.transform)?i.transform(t,i,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[ed.fW];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}}class eF extends eD{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let i=this.layer,r=i?.props.fetch;return r?r(t,{propName:e,layer:i}):super._fetch(e,t)}_onResolve(e,t){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===e&&r&&r(t,{propName:e,layer:i})}}_onError(e,t){let i=this.layer;i&&i.raiseError(t,`loading ${e} of ${this.layer}`)}}var eU=i(69634);let eV=Object.freeze([]),e$=(0,R.A)(({oldViewport:e,viewport:t})=>e.equals(t)),eW=new Uint8ClampedArray(0);function eG(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function eH(e){return e.rowIndexes}function eq(e){return e.pickingColors||e.instancePickingColors}let eY={data:{type:"data",value:eV,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:e=>e&&e.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(e,{propName:t,layer:i,loaders:r,loadOptions:n,signal:s})=>{let{resourceManager:o}=i.context;n=n||i.getLoadOptions(),r=r||i.props.loaders,s&&(n={...n,core:{...n?.core,fetch:{...n?.core?.fetch,signal:s}}});let a=o.contains(e);return(a||n||(o.add({resourceId:e,data:(0,eU.H)(e,r),persistent:!1}),a=!0),a)?o.subscribe({resourceId:e,onChange:e=>i.internalState?.reloadAsyncProp(t,e),consumerId:i.id,requestId:t}):(0,eU.H)(e,r,n)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:"default",coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:e})=>[0,-(100*e)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class eZ extends ez{constructor(){super(...arguments),this.internalState=null,this.lifecycle=ed.VD.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){let e=this.constructor.layerName||this.constructor.name;return`${e}({id: '${this.props.id}'})`}project(e){(0,g.A)(this.internalState);let t=this.internalState.viewport||this.context.viewport,i=eP(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),[r,n,s]=(0,ew.VJ)(i,t.pixelProjectionMatrix);return 2===e.length?[r,n]:[r,n,s]}unproject(e){return(0,g.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return(0,g.A)(this.internalState),function(e,t){let{viewport:i,coordinateSystem:r,coordinateOrigin:n,modelMatrix:s,fromCoordinateSystem:o,fromCoordinateOrigin:a}=function(e){let{viewport:t,modelMatrix:i,coordinateOrigin:r}=e,{coordinateSystem:n,fromCoordinateSystem:s,fromCoordinateOrigin:o}=e;return"default"===n&&(n=t.isGeospatial?"lnglat":"cartesian"),void 0===s?s=n:"default"===s&&(s=t.isGeospatial?"lnglat":"cartesian"),void 0===o&&(o=r),{viewport:t,coordinateSystem:n,coordinateOrigin:r,modelMatrix:i,fromCoordinateSystem:s,fromCoordinateOrigin:o}}(t),{autoOffset:l=!0}=t,{geospatialOrigin:u=ex,shaderCoordinateOrigin:c=ex,offsetMode:h=!1}=l?(0,em.ow)(i,r,n):{},d=eP(e,{viewport:i,modelMatrix:s,coordinateSystem:o,coordinateOrigin:a,offsetMode:h});if(h){let e=i.projectPosition(u||c);eb.jb(d,d,e)}return d}(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this.internalState.isAsyncPropLoading()}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return"default"===e||"lnglat"===e||"cartesian"===e}onHover(e,t){return!!this.props.onHover&&(this.props.onHover(e,t)||!1)}onClick(e,t){return!!this.props.onClick&&(this.props.onClick(e,t)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){(0,g.A)(e instanceof Uint8Array);let[t,i,r]=e;return t+256*i+65536*r-1}getNumInstances(){if(Number.isFinite(this.props.numInstances))return this.props.numInstances;if(this.state&&void 0!==this.state.numInstances)return this.state.numInstances;var e,t,i=this.props.data;if(null===(e=i)||"object"!=typeof e)throw Error("count(): argument not an object");if("function"==typeof i.count)return i.count();if(Number.isFinite(i.size))return i.size;if(Number.isFinite(i.length))return i.length;if(null!==(t=i)&&"object"==typeof t&&t.constructor===Object)return Object.keys(i).length;throw Error("count(): argument not a container")}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}getShaders(e){for(let t of(e=e_(e,{disableWarnings:!0,modules:this.context.defaultShaderModules}),this.props.extensions))e=e_(e,t.getShaders.call(this,t));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:i}=e.changeFlags;if(i&&t)if(Array.isArray(i))for(let e of i)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:i}=e,r=this.internalState.hasPickingBuffer,n=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==n){this.internalState.hasPickingBuffer=n;let e=eG(t.attributes);e&&(n&&e.constant&&(e.constant=!1,t.invalidate(e.id)),e.value||n||(e.constant=!0,e.value=eH(t.attributes)?[eS.Z1]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:i}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,t&&e$({oldViewport:t,viewport:e})||(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&("all"===e?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let i in e)e[i].layoutChanged()&&(t=!0);for(let i of this.getModels())this._setModelAttributes(i,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,i=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:i,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let n=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(n)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),i=Object.create(this.props);for(let e in t)Object.defineProperty(i,e,{value:t[e]});return i}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let i=Math.floor(eW.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&0===eW[0];if(i<t||r){t>0xffffff&&d.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let e=Math.floor((eW=c.A.allocate(eW,t,{size:4,copy:!0,maxCount:Math.max(t,0xffffff)})).length/4),n=[0,0,0],s=r?0:i;for(let t=s;t<e;t++)this.encodePickingColor(t,n),eW[4*t+0]=n[0],eW[4*t+1]=n[1],eW[4*t+2]=n[2],eW[4*t+3]=0}e.value=eW.subarray(0,4*t)}_setModelAttributes(e,t,i=!1){if(!Object.keys(t).length)return;let n=this.getAttributeManager();if(n?.hasBufferGroups())return void this._setGroupedModelAttributes(e,n,t);if(i){let i=this.getAttributeManager();e.setBufferLayout(i.getBufferLayouts(e)),t=i.getAttributes()}let s=e.userData?.excludeAttributes||{},o={},a={};for(let i in t){if(s[i])continue;let n=t[i].getValue();for(let s in n){let l=n[s];l instanceof r.h?t[i].settings.isIndexed?e.setIndexBuffer(l):o[s]=l:l&&(a[s]=l)}}e.setAttributes(o),e.setConstantAttributes(a)}_setGroupedModelAttributes(e,t,i){let n=e.userData?.excludeAttributes||{},s=t.getBufferGroupBindings(i,e,n);e.setBufferLayout(s.bufferLayouts);let o={...s.buffers},a={},l=t.getAttributes();for(let t in l){if(n[t]||s.groupedAttributeIds.has(t))continue;let i=l[t],u=i.getValue();for(let t in u){let n=u[t];n instanceof r.h?i.settings.isIndexed?e.setIndexBuffer(n):o[t]=n:n&&(a[t]=n)}}e.setAttributes(o),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t))return void this._disablePickingIndex(e);let i=this.getAttributeManager().attributes,r=eH(i),n=eq(i),s=r&&t.attributes&&t.attributes[r.id];if(s&&s.value){let i=s.value;for(let n=0;n<t.length;n++)i[r.getVertexOffset(n)]===e&&this._disablePickingIndex(n);return}let o=n&&t.attributes&&t.attributes[n.id];if(o&&o.value){let i=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=n.getVertexOffset(e);i[t]===r[0]&&i[t+1]===r[1]&&i[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,i=eH(t);if(i){let t=i.getVertexOffset(e),r=new Uint32Array(i.getVertexOffset(e+1)-t);r.fill(eS.Z1),i.buffer.write(r,t*r.BYTES_PER_ELEMENT);return}let r=eq(t);if(!r){this.internalState&&(0,eS.uz)(this.internalState.disabledPickingIndices,e);return}let n=r.getVertexOffset(e),s=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(s-n),n)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=eG(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=eq(e);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==eW.buffer&&(i.value=eW.subarray(0,i.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){(0,g.A)(!this.internalState),(0,L.A)("layer.initialize",this);let e=this._getAttributeManager();for(let t of(this.internalState=new eF({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,"attributeManager",{get:()=>(d.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),e)}),this.internalState.uniformTransitions=new eh(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))t.initializeState.call(this,this.context,t);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){(0,L.A)("layer.matched",this,this===e);let{state:t,internalState:i}=e;this!==e&&(this.internalState=i,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if((0,L.A)("layer.update",this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,i=this.context,r=this.internalState,n=i.viewport,s=this._updateUniformTransition();r.propsInTransition=s,i.viewport=r.viewport||n,this.props=s;try{let e=this._getUpdateParams(),t=this.getModels();if(i.device)this.updateState(e);else try{this.updateState(e)}catch(e){}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{i.viewport=n,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){for(let e of((0,L.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let s=this.props,o=this.context;this.props=this.internalState.propsInTransition||s;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:s}=this.props,a=s&&s(i)||[0,0];o.device instanceof n.WebGLDevice&&o.device.setParametersWebGL({polygonOffset:a});let l=o.device instanceof n.WebGLDevice?null:function(e){let{blendConstant:t,...i}=e;return t?{pipelineParameters:i,renderPassParameters:{blendConstant:t}}:{pipelineParameters:i}}(r);if(function(e,t,i,r){for(let n of e)"webgpu"===n.device.type?(function(e,t){let i=t.props.framebuffer||(t.framebuffer??null);if(!i)return;let r=i.colorAttachments.map(e=>e?.texture?.format??null),n=i.depthStencilAttachment?.texture?.format;(!function(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let i=0;i<e.length;i++)if(e[i]!==t[i])return!1;return!0}(e.props.colorAttachmentFormats,r)||e.props.depthStencilAttachmentFormat!==n)&&(e.props.colorAttachmentFormats=r,e.props.depthStencilAttachmentFormat=n,e._setPipelineNeedsUpdate("attachment formats"))}(n,t),n.setParameters({...n.parameters,...r?.pipelineParameters})):n.setParameters(i)}(this.getModels(),e,r,l),o.device instanceof n.WebGLDevice)o.device.withParametersWebGL(r,()=>{let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)});else{l?.renderPassParameters&&e.setParameters(l.renderPassParameters);let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)}}finally{this.props=s}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let r=!1;if("dataChanged"===i){let n=e[i],s=t[i];n&&Array.isArray(s)&&(t.dataChanged=Array.isArray(n)?s.concat(n):n,r=!0)}t[i]||(t[i]=e[i],r=!0),r&&(0,L.A)("layer.changeFlag",this,i,e)}let i=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=i,t.somethingChanged=i||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let i,r,n,s=(i=ef({newProps:e,oldProps:t,propTypes:e[ed.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=function(e,t){if(null===t)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:n}=e;return r?r(e.data,t.data)||(i="Data comparator detected a change"):e.data!==t.data&&(i="A new data container was supplied"),i&&n&&(i=n(e.data,t.data)||i),i}(e,t),n=!1,r||(n=function(e,t){if(null===t||"all"in e.updateTriggers&&eg(e,t,"all"))return{all:!0};let i={},r=!1;for(let n in e.updateTriggers)"all"!==n&&eg(e,t,n)&&(i[n]=!0,r=!0);return!!r&&i}(e,t)),{dataChanged:r,propsChanged:i,updateTriggersChanged:n,extensionsChanged:function(e,t){if(null===t)return!0;let i=t.extensions,{extensions:r}=e;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(i[e]))return!0;return!1}(e,t),transitionsChanged:function(e,t){if(!e.transitions)return!1;let i={},r=e[ed.fW],n=!1;for(let s in e.transitions){let o=r[s],a=o&&o.type;("number"===a||"color"===a||"array"===a)&&ep(e[s],t[s],o)&&(i[s]=!0,n=!0)}return!!n&&i}(e,t)});if(s.updateTriggersChanged)for(let e in s.updateTriggersChanged)s.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(s.transitionsChanged)for(let i in s.transitionsChanged)this.internalState.uniformTransitions.add(i,t[i],e[i],e.transitions?.[i]);return this.setChangeFlags(s)}validateProps(){!function(e){let t=e[ed.fW];for(let i in t){let r=t[i],{validate:n}=r;if(n&&!n(e[i],r))throw Error(`Invalid prop ${i}: ${e[i]}`)}}(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:i}=this.props;e.picked&&"function"==typeof i&&(t.highlightColor=i(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new en(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:i,oldProps:r}=e,n=this.state.model;n?.isInstanced&&n.setInstanceCount(this.getNumInstances());let{autoHighlight:s,highlightedObjectIndex:o,highlightColor:a}=i;if(t||r.autoHighlight!==s||r.highlightedObjectIndex!==o||r.highlightColor!==a){let e={};Array.isArray(a)&&(e.highlightColor=a),(t||r.autoHighlight!==s||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(e);if(t=t||r)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}eZ.defaultProps=eY,eZ.layerName="Layer";let eK=eZ},12897(e,t,i){i.d(t,{VD:()=>r,YN:()=>l,fW:()=>s,jA:()=>a,r3:()=>n,uH:()=>o,vf:()=>u});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},n=Symbol.for("component"),s=Symbol.for("propTypes"),o=Symbol.for("deprecatedProps"),a=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),u=Symbol.for("asyncPropResolved")},3065(e,t,i){i.d(t,{A:()=>n});let r="#define SMOOTH_EDGE_RADIUS 0.5",n={name:"geometry",source:`\
const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,vs:`\
${r}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,fs:`\
${r}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`}},74358(e,t,i){i.d(t,{Z1:()=>s,Ay:()=>d,uz:()=>o});let r={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`,fs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`,getUniforms:function(e={},t){let i={},r=function(e,t=!0){return e??t}(e.useByteColors,!0);return void 0===e.highlightedObjectColor||(null===e.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(i.highlightColor=function(e,t=!0){let i=function(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}(e.slice(0,3),t),r=Number.isFinite(e[3]),n=r?e[3]:1;return[i[0],i[1],i[2],t&&r?n/255:n]}(e.highlightColor,r)),void 0!==e.isActive&&(i.isActive=!!e.isActive,i.isAttribute=!!e.isAttribute),void 0!==e.useByteColors&&(i.useByteColors=!!e.useByteColors),i}};var n=i(3459);let s=0xffffff;function o(e,t){10===e.length?n.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():e.push(t)}let a=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function l(e){return e.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${a}} picking;`)}function u(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}let c=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${s}.0) {
    return vec3(0.0);
  }

  for (int i = 0; i < 10; i++) {
    if (float(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    vec4 disabledIndices = i < 4
      ? picking.disabledPickingIndices0
      : (i < 8 ? picking.disabledPickingIndices1 : picking.disabledPickingIndices2);
    float disabledIndex = disabledIndices[i - (i / 4) * 4];
    if (disabledIndex == objectIndex) {
      return vec3(0.0);
    }
  }

  float encodedIndex = objectIndex + 1.0;
  return vec3(
    mod(encodedIndex, 256.0),
    mod(floor(encodedIndex / 256.0), 256.0),
    mod(floor(encodedIndex / 65536.0), 256.0)
  );
}

vec3 picking_getPickingColorFromIndex(uint objectIndex) {
  return picking_getPickingColorFromIndex(float(objectIndex));
}

vec3 picking_getPickingColorFromInstanceID() {
  return picking_getPickingColorFromIndex(float(gl_InstanceID));
}

void picking_setPickingColorFromInstanceID() {
  picking_setPickingColor(picking_getPickingColorFromInstanceID());
}
`,h=`\
struct pickingUniforms {
  isActive: f32,
  isAttribute: f32,
  isHighlightActive: f32,
  useByteColors: f32,
  highlightedObjectColor: vec3<f32>,
  highlightColor: vec4<f32>,
  disabledPickingIndexCount: f32,
  disabledPickingIndices0: vec4<f32>,
  disabledPickingIndices1: vec4<f32>,
  disabledPickingIndices2: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> picking: pickingUniforms;

fn picking_normalizeColor(color: vec3<f32>) -> vec3<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_normalizeColor4(color: vec4<f32>) -> vec4<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_isColorZero(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) < 0.00001;
}

fn picking_isColorValid(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) > 0.00001;
}

fn picking_getPickingColorFromIndex(objectIndex: u32) -> vec3<f32> {
  if (objectIndex >= ${s}u) {
    return vec3<f32>(0.0);
  }

  for (var i = 0; i < 10; i = i + 1) {
    if (f32(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    let disabledIndices = select(
      picking.disabledPickingIndices2,
      select(picking.disabledPickingIndices1, picking.disabledPickingIndices0, i < 4),
      i < 8
    );
    let disabledIndex = disabledIndices[i % 4];
    if (disabledIndex == f32(objectIndex)) {
      return vec3<f32>(0.0);
    }
  }

  let encodedIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(encodedIndex % 256u),
    f32((encodedIndex / 256u) % 256u),
    f32((encodedIndex / 65536u) % 256u)
  ) / 255.0;
}
`,d={...r,vs:`${l(r.vs)}
${c}`,fs:l(r.fs),source:h,uniformTypes:{...r.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...r.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let i=r.getUniforms(e,t),n=e.disabledPickingIndices||[];return i.disabledPickingIndexCount=n.length,i.disabledPickingIndices0=u(n,0),i.disabledPickingIndices1=u(n,4),i.disabledPickingIndices2=u(n,8),i},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}}},57162(e,t,i){i.d(t,{A:()=>v});let r=`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`,n=`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`;var s=i(3065),o=i(74334),a=i(9350);let l=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll("-","_")}: i32 = ${(0,o.LB)(e)};`).join(""),u=Object.keys(a.Kx).map(e=>`const PROJECTION_MODE_${e}: i32 = ${a.Kx[e]};`).join(""),c=Object.keys(a.p5).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${a.p5[e]};`).join(""),h=`\
${l}
${u}
${c}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`,d=`\
${h}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u{2011}axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  var ux = vec3<f32>(1.0, 0.0, 0.0);
  if (abs(uz.z) != 1.0) {
    ux = normalize(vec3<f32>(uz.y, -uz.x, 0.0));
  }
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`,f=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll("-","_")} = ${(0,o.LB)(e)};`).join(""),p=Object.keys(a.Kx).map(e=>`const int PROJECTION_MODE_${e} = ${a.Kx[e]};`).join(""),g=Object.keys(a.p5).map(e=>`const int UNIT_${e.toUpperCase()} = ${a.p5[e]};`).join(""),_=`\
${f}
${p}
${g}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`,m={},v={name:"project",dependencies:[{name:"fp32",source:n,vs:r},s.A],source:d,vs:_,getUniforms:function(e=m){return"viewport"in e?(0,o.aY)(e):{}},uniformTypes:{wrapLongitude:"f32",coordinateSystem:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32"}}},74334(e,t,i){i.d(t,{LB:()=>f,aY:()=>_,ow:()=>g});var r=i(90218),n=i(39426),s=i(9350),o=i(82417);let a=[0,0,0,0],l=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],u=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],c=[0,0,0],h=[0,0,0],d={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function f(e){let t=d[e];if(void 0===t)throw Error(`Invalid coordinateSystem: ${e}`);return t}let p=(0,o.A)(function({viewport:e,devicePixelRatio:t,coordinateSystem:i,coordinateOrigin:o}){let{projectionCenter:h,viewProjectionMatrix:d,originCommon:p,cameraPosCommon:_,shaderCoordinateOrigin:m,geospatialOrigin:v}=function(e,t,i){let{viewMatrixUncentered:s,projectionMatrix:o}=e,{viewMatrix:u,viewProjectionMatrix:c}=e,h=a,d=a,f=e.cameraPosition,{geospatialOrigin:p,shaderCoordinateOrigin:_,offsetMode:m}=g(e,t,i);return m&&(d=e.projectPosition(p||_),f=[f[0]-d[0],f[1]-d[1],f[2]-d[2]],d[3]=1,h=n.Z0([],d,c),u=s||u,c=r.lw([],o,u),c=r.lw([],c,l)),{viewMatrix:u,viewProjectionMatrix:c,projectionCenter:h,originCommon:d,cameraPosCommon:f,shaderCoordinateOrigin:_,geospatialOrigin:p}}(e,i,o),b=e.getDistanceScales(),y=[e.width*t,e.height*t],w=n.Z0([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,x={coordinateSystem:f(i),projectionMode:e.projectionMode,coordinateOrigin:m,commonOrigin:p.slice(0,3),center:h,pseudoMeters:!!e._pseudoMeters,viewportSize:y,devicePixelRatio:t,focalDistance:w,commonUnitsPerMeter:b.unitsPerMeter,commonUnitsPerWorldUnit:b.unitsPerMeter,commonUnitsPerWorldUnit2:c,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:d,modelMatrix:u,cameraPosition:_};if(v){let t=e.getDistanceScales(v);switch(i){case"meter-offsets":x.commonUnitsPerWorldUnit=t.unitsPerMeter,x.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case"lnglat":case"lnglat-offsets":e._pseudoMeters||(x.commonUnitsPerMeter=t.unitsPerMeter),x.commonUnitsPerWorldUnit=t.unitsPerDegree,x.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case"cartesian":x.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],x.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]]}}if(e.projectionMode===s.Kx.GLOBE&&"meter-offsets"===i){let e=o[0]*Math.PI/180,t=o[1]*Math.PI/180,i=Math.cos(t),r=((o[2]||0)/6370972+1)*256;x.commonOrigin=[Math.sin(e)*i*r,-Math.cos(e)*i*r,Math.sin(t)*r]}return x});function g(e,t,i=h){let r;i.length<3&&(i=[i[0],i[1],0]);let n=i,o=!0;switch(r="lnglat-offsets"===t||"meter-offsets"===t?i:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case s.Kx.WEB_MERCATOR:("lnglat"===t||"cartesian"===t)&&(r=[0,0,0],o=!1);break;case s.Kx.WEB_MERCATOR_AUTO_OFFSET:"lnglat"===t?n=r:"cartesian"===t&&(n=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],r=e.unprojectPosition(n),n[0]-=i[0],n[1]-=i[1],n[2]-=i[2]);break;case s.Kx.IDENTITY:(n=e.position.map(Math.fround))[2]=n[2]||0;break;case s.Kx.GLOBE:o=!1,r=null;break;default:o=!1}return{geospatialOrigin:r,shaderCoordinateOrigin:n,offsetMode:o}}function _({viewport:e,devicePixelRatio:t=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:n=h,autoWrapLongitude:s=!1}){"default"===r&&(r=e.isGeospatial?"lnglat":"cartesian");let o=p({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:n});return o.wrapLongitude=s,o.modelMatrix=i||u,o}},84175(e,t,i){i.d(t,{A:()=>o});var r=i(57162);let n=`\
// Define a structure to hold both the clip-space position and the common position.
struct ProjectResult {
  clipPosition: vec4<f32>,
  commonPosition: vec4<f32>,
};

// This function mimics the GLSL version with the 'out' parameter by returning both values.
fn project_position_to_clipspace_and_commonspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> ProjectResult {
  // Compute the projected position.
  let projectedPosition: vec3<f32> = project_position_vec3_f64(position, position64Low);

  // Start with the provided offset.
  var finalOffset: vec3<f32> = offset;

  // Get whether a rotation is needed and the rotation matrix.
  let rotationResult = project_needs_rotation(projectedPosition);

  // If rotation is needed, update the offset.
  if (rotationResult.needsRotation) {
    finalOffset = rotationResult.transform * offset;
  }

  // Compute the common position.
  let commonPosition: vec4<f32> = vec4<f32>(projectedPosition + finalOffset, 1.0);

  // Convert to clip-space.
  let clipPosition: vec4<f32> = project_common_position_to_clipspace(commonPosition);

  return ProjectResult(clipPosition, commonPosition);
}

// A convenience overload that returns only the clip-space position.
fn project_position_to_clipspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> vec4<f32> {
  return project_position_to_clipspace_and_commonspace(position, position64Low, offset).clipPosition;
}
`,s=`\
vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition
) {
  vec3 projectedPosition = project_position(position, position64Low);
  mat3 rotation;
  if (project_needs_rotation(projectedPosition, rotation)) {
    // offset is specified as ENU
    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe
    offset = rotation * offset;
  }
  commonPosition = vec4(projectedPosition + offset, 1.0);
  return project_common_position_to_clipspace(commonPosition);
}

vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset
) {
  vec4 commonPosition;
  return project_position_to_clipspace(position, position64Low, offset, commonPosition);
}
`,o={name:"project32",dependencies:[r.A],source:n,vs:s}},54261(e,t,i){i.d(t,{A:()=>l});var r=i(54901),n=i(24067);class s{constructor(e){let{compare:t,extract:i,required:r}=e;this._propsToCompare=t,this._propsToExtract=i||t,this._requiredProps=r}arePropsEqual(e,t){for(let i of this._propsToCompare)if(!(i in e)||!(i in t)||!(0,r.aI)(e[i],t[i]))return!1;return!0}initializeProps(e,t){let i={},r={};for(let n of this._propsToExtract)(n in e||n in t)&&(i[n]=e[n],r[n]=t[n]);return this._checkRequiredProps(i),this._checkRequiredProps(r),{start:i,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let i=e[t];(0,n.A)(Number.isFinite(i)||Array.isArray(i),`${t} is required for transition`)})}}let o=["longitude","latitude","zoom","bearing","pitch"],a=["longitude","latitude","zoom"];class l extends s{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,i=Array.isArray(e)?{}:e;i.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:o,required:a},super(i.transitionProps),this.opts=i}initializeProps(e,t){let i=super.initializeProps(e,t),{makeViewport:r,around:n}=this.opts;if(r&&n){let s=r(e),o=r(t),a=s.unproject(n);i.start.around=n,Object.assign(i.end,{around:o.project(a),aroundPosition:a,width:t.width,height:t.height})}return i}interpolateProps(e,t,i){let n={};for(let s of this._propsToExtract)n[s]=(0,r.Cc)(e[s]||0,t[s]||0,i);if(t.aroundPosition&&this.opts.makeViewport){let s=this.opts.makeViewport({...t,...n});Object.assign(n,s.panByPosition(t.aroundPosition,(0,r.Cc)(e.around,t.around,i)))}return n}}},2357(e,t,i){i.d(t,{A:()=>r});class r{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(null===this._handle){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}}},24067(e,t,i){i.d(t,{A:()=>r});function r(e,t){if(!e)throw Error(t||"deck.gl: assertion failed.")}},7914(e,t,i){i.d(t,{b:()=>function e(t,i,r){if(t===i)return!0;if(!r||!t||!i)return!1;if(Array.isArray(t)){if(!Array.isArray(i)||t.length!==i.length)return!1;for(let n=0;n<t.length;n++)if(!e(t[n],i[n],r-1))return!1;return!0}if(Array.isArray(i))return!1;if("object"==typeof t&&"object"==typeof i){let n=Object.keys(t),s=Object.keys(i);if(n.length!==s.length)return!1;for(let s of n)if(!i.hasOwnProperty(s)||!e(t[s],i[s],r-1))return!1;return!0}return!1}})},38055(e,t,i){function r(e,t=()=>!0){return Array.isArray(e)?function e(t,i,r){let n=-1;for(;++n<t.length;){let s=t[n];Array.isArray(s)?e(s,i,r):i(s)&&r.push(s)}return r}(e,t,[]):t(e)?[e]:[]}function n({target:e,source:t,start:i=0,count:r=1}){let s=t.length,o=r*s,a=0;for(let r=i;a<s;a++)e[r++]=t[a];for(;a<o;)a<o-a?(e.copyWithin(i+a,i,i+a),a*=2):(e.copyWithin(i+a,i,i+o-a),a=o);return e}i.d(t,{B:()=>r,R:()=>n})},3459(e,t,i){i.d(t,{A:()=>r});let r=new(i(90928)).h({id:"deck"})},25667(e,t,i){let r;i.d(t,{$M:()=>o,Vl:()=>l,_Z:()=>f,cT:()=>d,on:()=>u,zi:()=>a});var n=i(23459),s=i(87597);function o(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function a(e,t){let i=e%t;return i<0?t+i:i}function l(e){return[e[12],e[13],e[14]]}function u(e){return{left:h(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:h(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:h(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:h(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:h(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:h(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}let c=new s.P;function h(e,t,i,r){c.set(e,t,i);let n=c.len();return{distance:r/n,normal:new s.P(-e/n,-t/n,-i/n)}}function d(e,t){let{size:i=1,startIndex:s=0}=t,o=void 0!==t.endIndex?t.endIndex:e.length,a=(o-s)/i;r=n.A.allocate(r,a,{type:Float32Array,size:2*i});let l=s,u=0;for(;l<o;){for(let t=0;t<i;t++){let n=e[l++];r[u+t]=n,r[u+t+i]=n-Math.fround(n)}u+=2*i}return r.subarray(0,a*i*2)}function f(e){let t=null,i=!1;for(let r of e)r&&(t?(i||(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],i=!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}},82417(e,t,i){i.d(t,{A:()=>r});function r(e){let t,i={};return r=>{for(let n in r)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(r[n],i[n])){t=e(r),i=r;break}return t}}},33945(e,t,i){i.d(t,{E9:()=>s,rk:()=>n});let r=/^(?:\d+\.?\d*|\.\d+)$/;function n(e){switch(typeof e){case"number":if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:"literal",value:e};case"string":try{let t=function(e){let t=[],i=0;for(;i<e.length;){let n=e[i];if(/\s/.test(n)){i++;continue}if("+"===n||"-"===n||"("===n||")"===n||"%"===n){t.push({type:"symbol",value:n}),i++;continue}if(a(n)||"."===n){let s=i,o="."===n;for(i++;i<e.length;){let t=e[i];if(a(t)){i++;continue}if("."===t&&!o){o=!0,i++;continue}break}let l=e.slice(s,i);if(!r.test(l))throw Error("Invalid number token");t.push({type:"number",value:parseFloat(l)});continue}if(l(n)){let r=i;for(;i<e.length&&l(e[i]);)i++;let n=e.slice(r,i).toLowerCase();t.push({type:"word",value:n});continue}throw Error("Invalid token in position string")}return t}(e);return new o(t).parseExpression()}catch(i){let t=i instanceof Error?i.message:String(i);throw Error(`Could not parse position string ${e}: ${t}`)}default:throw Error(`Could not parse position string ${e}`)}}function s(e,t){return function e(t,i){switch(t.type){case"literal":return t.value;case"percentage":return Math.round(t.value*i);case"binary":let r=e(t.left,i),n=e(t.right,i);return"+"===t.operator?r+n:r-n;default:throw Error("Unknown layout expression type")}}(e,t)}class o{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error("Unexpected token at end of expression");return e}parseBinaryExpression(){var e;let t=this.parseFactor(),i=this.peek();for(;(e=i)&&"symbol"===e.type&&("+"===e.value||"-"===e.value);){this.index++;let e=this.parseFactor();t={type:"binary",operator:i.value,left:t,right:e},i=this.peek()}return t}parseFactor(){let e=this.peek();if(!e)throw Error("Unexpected end of expression");if("symbol"===e.type&&"+"===e.value)return this.index++,this.parseFactor();if("symbol"===e.type&&"-"===e.value)return this.index++,{type:"binary",operator:"-",left:{type:"literal",value:0},right:this.parseFactor()};if("symbol"===e.type&&"("===e.value){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("word"===e.type&&"calc"===e.value){if(this.index++,!this.consumeSymbol("("))throw Error("Missing opening parenthesis after calc");let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("number"===e.type){this.index++;let t=e.value,i=this.peek();return i&&"symbol"===i.type&&"%"===i.value?(this.index++,{type:"percentage",value:t/100}):(i&&"word"===i.type&&"px"===i.value&&this.index++,{type:"literal",value:t})}throw Error("Unexpected token in expression")}consumeSymbol(e){let t=this.peek();return!!t&&"symbol"===t.type&&t.value===e&&(this.index++,!0)}peek(){return this.tokens[this.index]||null}}function a(e){return e>="0"&&e<="9"}function l(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"}},23459(e,t,i){i.d(t,{A:()=>r});let r=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:i=1,type:r,padding:n=0,copy:s=!1,initialize:o=!1,maxCount:a}){let l=r||e&&e.constructor||Float32Array,u=t*i+n;if(ArrayBuffer.isView(e)){if(u<=e.length)return e;if(u*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new l(e.buffer,0,u)}let c=1/0;a&&(c=a*i+n);let h=this._allocate(l,u,o,c);return e&&s?h.set(e):o||h.fill(0,0,4),this._release(e),h}release(e){this._release(e)}_allocate(e,t,i,r){let n=Math.max(Math.ceil(t*this.opts.overAlloc),1);n>r&&(n=r);let s=this._pool,o=e.BYTES_PER_ELEMENT*n,a=s.findIndex(e=>e.byteLength>=o);if(a>=0){let t=new e(s.splice(a,1)[0],0,n);return i&&t.fill(0),t}return new e(n)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:i}=e,{byteLength:r}=i,n=t.findIndex(e=>e.byteLength>=r);n<0?t.push(i):(n>0||t.length<this.opts.poolSize)&&t.splice(n,0,i),t.length>this.opts.poolSize&&t.shift()}}},47345(e,t,i){i.d(t,{A:()=>_});var r=i(3459),n=i(25667),s=i(31886),o=i(54901),a=i(87597),l=i(90218),u=i(67681),c=i(9350);let h=Math.PI/180,d=(0,n.$M)(),f=[0,0,0],p={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};class g{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||"viewport",this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||p,this.focalDistance=e.focalDistance||1,this.position=e.position||f,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:i}=e;this.isGeospatial=Number.isFinite(i)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?c.Kx.WEB_MERCATOR:c.Kx.WEB_MERCATOR_AUTO_OFFSET:c.Kx.IDENTITY}equals(e){return e instanceof g&&(this===e||e.width===this.width&&e.height===this.height&&e.scale===this.scale&&e.projectionMode===this.projectionMode&&e.resolution===this.resolution&&(0,o.aI)(e.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&(0,o.aI)(e.projectionMatrix,this.projectionMatrix)&&(0,o.aI)(e.viewMatrix,this.viewMatrix))}project(e,{topLeft:t=!0}={}){let i=this.projectPosition(e),r=(0,u.VJ)(i,this.pixelProjectionMatrix),[n,s]=r,o=t?s:this.height-s;return 2===e.length?[n,o]:[n,o,r[2]]}unproject(e,{topLeft:t=!0,targetZ:i}={}){let[r,n,s]=e,o=t?n:this.height-n,a=i&&i*this.distanceScales.unitsPerMeter[2],l=(0,u.xJ)([r,o,s],this.pixelUnprojectionMatrix,a),[c,h,d]=this.unprojectPosition(l);return Number.isFinite(s)?[c,h,d]:Number.isFinite(i)?[c,h,i]:[c,h]}projectPosition(e){let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,i]=this.unprojectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=(0,u.Gw)(e);return t[1]=(0,o.qE)(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?(0,u.iV)(e):e}getBounds(e={}){let t={targetZ:e.z||0},i=this.unproject([0,0],t),r=this.unproject([this.width,0],t),n=this.unproject([0,this.height],t),s=this.unproject([this.width,this.height],t);return[Math.min(i[0],r[0],n[0],s[0]),Math.min(i[1],r[1],n[1],s[1]),Math.max(i[0],r[0],n[0],s[0]),Math.max(i[1],r[1],n[1],s[1])]}getDistanceScales(e){return e&&this.isGeospatial?(0,u.nI)({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:i=1,height:r=1}){return e<this.x+this.width&&this.x<e+i&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,(0,n.on)(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,i){return null}_initProps(e){let t=e.longitude,i=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=(0,u.fO)({latitude:i})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||(0,u.nI)({latitude:i,longitude:t}));let r=Math.pow(2,this.zoom);this.scale=r;let{position:n,modelMatrix:o}=e,l=f;if(n&&(l=o?new s.k(o).transformAsVector(n,[]):n),this.isGeospatial){let e=this.projectPosition([t,i,0]);this.center=new a.P(l).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(l)}_initMatrices(e){let{viewMatrix:t=d,projectionMatrix:i=null,orthographic:u=!1,fovyRadians:c,fovy:f=75,near:p=.1,far:g=1e3,padding:_=null,focalDistance:m=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new s.k().multiplyRight(t).translate(new a.P(this.center).negate()),this.projectionMatrix=i||function({width:e,height:t,orthographic:i,fovyRadians:r,focalDistance:n,padding:a,near:l,far:u}){let c=e/t,h=i?new s.k().orthographic({fovy:r,aspect:c,focalDistance:n,near:l,far:u}):new s.k().perspective({fovy:r,aspect:c,near:l,far:u});if(a){let{left:i=0,right:r=0,top:n=0,bottom:s=0}=a,l=(0,o.qE)((i+e-r)/2,0,e)-e/2,u=(0,o.qE)((n+t-s)/2,0,t)-t/2;h[8]-=2*l/e,h[9]+=2*u/t}return h}({width:this.width,height:this.height,orthographic:u,fovyRadians:c||f*h,focalDistance:m,padding:_,near:p,far:g});let v=(0,n.$M)();l.lw(v,v,this.projectionMatrix),l.lw(v,v,this.viewMatrix),this.viewProjectionMatrix=v,this.viewMatrixInverse=l.B8([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=(0,n.Vl)(this.viewMatrixInverse);let b=(0,n.$M)(),y=(0,n.$M)();l.hs(b,b,[this.width/2,-this.height/2,1]),l.Tl(b,b,[1,-1,0]),l.lw(y,b,this.viewProjectionMatrix),this.pixelProjectionMatrix=y,this.pixelUnprojectionMatrix=l.B8((0,n.$M)(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||r.A.warn("Pixel project matrix not invertible")()}}g.displayName="Viewport";let _=g},78374(e,t,i){i.d(t,{A:()=>p});var r=i(47345),n=i(67681),s=i(46540),o=i(231);let a=Math.PI/180;function l(e,t,i){let{pixelUnprojectionMatrix:r}=e,a=(0,o._U)(r,[t,0,1,1]),l=(0,o._U)(r,[t,e.height,1,1]),u=(i*e.distanceScales.unitsPerMeter[2]-a[2])/(l[2]-a[2]),c=s.Cc([],a,l,u),h=(0,n.iV)(c);return h.push(i),h}var u=i(26369),c=i(54901),h=i(31886),d=i(83588);class f extends r.A{constructor(e={}){let t,{latitude:i=0,longitude:r=0,zoom:s=0,pitch:o=0,bearing:a=0,nearZMultiplier:l=.1,farZMultiplier:u=1.01,nearZ:d,farZ:f,orthographic:p=!1,projectionMatrix:g,repeat:_=!1,worldOffset:m=0,position:v,padding:b,legacyMeterSizes:y=!1}=e,{width:w,height:x,altitude:E=1.5}=e,P=Math.pow(2,s);w=w||1,x=x||1;let S=null;if(g)E=g[5]/2,t=(0,n.Os)(E);else{let r;if(e.fovy?(t=e.fovy,E=(0,n.wZ)(t)):t=(0,n.Os)(E),b){let{top:e=0,bottom:t=0}=b;r=[0,(0,c.qE)((e+x-t)/2,0,x)-x/2]}S=(0,n.om)({width:w,height:x,scale:P,center:v&&[0,0,v[2]*(0,n.mY)(i)],offset:r,pitch:o,fovy:t,nearZMultiplier:l,farZMultiplier:u}),Number.isFinite(d)&&(S.near=d),Number.isFinite(f)&&(S.far=f)}let A=(0,n.rY)({height:x,pitch:o,bearing:a,scale:P,altitude:E});m&&(A=new h.k().translate([512*m,0,0]).multiplyLeft(A)),super({...e,width:w,height:x,viewMatrix:A,longitude:r,latitude:i,zoom:s,...S,fovy:t,focalDistance:E}),this.latitude=i,this.longitude=r,this.zoom=s,this.pitch=o,this.bearing=a,this.altitude=E,this.fovy=t,this.orthographic=p,this._subViewports=_?[]:null,this._pseudoMeters=y,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let e=this.getBounds(),t=Math.floor((e[0]+180)/360),i=Math.ceil((e[2]-180)/360);for(let e=t;e<=i;e++){let t=e?new f({...this,worldOffset:e}):this;this._subViewports.push(t)}}return this._subViewports}equals(e){return e instanceof f&&e._pseudoMeters===this._pseudoMeters&&super.equals(e)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*(0,n.mY)(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,i]=this.unprojectFlat(e),r=(e[2]||0)/(0,n.mY)(i);return[t,i,r]}addMetersToLngLat(e,t){return(0,n.dT)(e,t)}panByPosition(e,t,i){let r=(0,n.xJ)(t,this.pixelUnprojectionMatrix),s=this.projectFlat(e),o=d.WQ([],s,d.ze([],r)),a=d.WQ([],this.center,o),[l,u]=this.unprojectFlat(a);return{longitude:l,latitude:u}}panByPosition3D(e,t){let i=e[2]||0,r=d.jb([],e,this.unproject(t,{targetZ:i}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=function(e,t=0){let i,r,{width:n,height:s,unproject:o}=e,u={targetZ:t},c=o([0,s],u),h=o([n,s],u);return(e.fovy?.5*e.fovy*a:Math.atan(.5/e.altitude))>(90-e.pitch)*a-.01?(i=l(e,0,t),r=l(e,n,t)):(i=o([0,0],u),r=o([n,0],u)),[c,h,r,i]}(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(e,t={}){let{width:i,height:r}=this,{longitude:s,latitude:a,zoom:l}=function(e){let{width:t,height:i,bounds:r,minExtent:s=0,maxZoom:a=24,offset:l=[0,0]}=e,[[c,h],[d,f]]=r,p=function(e=0){return"number"==typeof e?{top:e,bottom:e,left:e,right:e}:((0,u.v)(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}(e.padding),g=(0,n.Gw)([c,(0,o.qE)(f,-n.aH,n.aH)]),_=(0,n.Gw)([d,(0,o.qE)(h,-n.aH,n.aH)]),m=[Math.max(Math.abs(_[0]-g[0]),s),Math.max(Math.abs(_[1]-g[1]),s)],v=[t-p.left-p.right-2*Math.abs(l[0]),i-p.top-p.bottom-2*Math.abs(l[1])];(0,u.v)(v[0]>0&&v[1]>0);let b=v[0]/m[0],y=v[1]/m[1],w=(p.right-p.left)/2/b,x=(p.top-p.bottom)/2/y,E=[(_[0]+g[0])/2+w,(_[1]+g[1])/2+x],P=(0,n.iV)(E),S=Math.min(a,(0,o.p6)(Math.abs(Math.min(b,y))));return(0,u.v)(Number.isFinite(S)),{longitude:P[0],latitude:P[1],zoom:S}}({width:i,height:r,bounds:e,...t});return new f({width:i,height:r,longitude:s,latitude:a,zoom:l})}}f.displayName="WebMercatorViewport";let p=f},23062(e,t,i){i.d(t,{A:()=>v});var r=i(12041),n=i(78374),s=i(54901),o=i(79433),a=i(60676),l=i(58532),u=i(67681),c=i(24067),h=i(25667),d=i(54261);let f=[[-1/0,-90],[1/0,90]];function p([e,t]){if(Math.abs(t)>90&&(t=90*Math.sign(t)),Number.isFinite(e)){let[i,r]=(0,u.Gw)([e,t]);return[i,(0,s.qE)(r,0,512)]}let[,i]=(0,u.Gw)([0,t]);return[e,(0,s.qE)(i,0,512)]}class g extends a.A{constructor(e){let{width:t,height:i,latitude:r,longitude:n,zoom:s,bearing:o=0,pitch:l=0,altitude:u=1.5,position:h=[0,0,0],maxZoom:d=20,minZoom:p=0,maxPitch:g=60,minPitch:_=0,startPanLngLat:m,startZoomLngLat:v,startRotatePos:b,startRotateLngLat:y,startBearing:w,startPitch:x,startZoom:E,normalize:P=!0,rubberBand:S=!1}=e,{[a.y]:A}=e;(0,c.A)(Number.isFinite(n)),(0,c.A)(Number.isFinite(r)),(0,c.A)(Number.isFinite(s));let M=e.maxBounds||(P?f:null);super({width:t,height:i,latitude:r,longitude:n,zoom:s,bearing:o,pitch:l,altitude:u,maxZoom:d,minZoom:p,maxPitch:g,minPitch:_,normalize:P,position:h,maxBounds:M,maxBoundsPadding:e.maxBoundsPadding||null,rubberBand:S,...{[a.y]:A}},{startPanLngLat:m,startZoomLngLat:v,startRotatePos:b,startRotateLngLat:y,startBearing:w,startPitch:x,startZoom:E},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},i){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let n=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(n,i)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:void 0!==t?this._unproject3D(e,t):void 0,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:i=0}){let r,{startRotatePos:n,startRotateLngLat:s,startBearing:o,startPitch:a}=this.getState();if(!n||void 0===o||void 0===a)return this;if(r=e?this._getNewRotation(e,n,a,o):{bearing:o+t,pitch:a+i},s){let e=this.makeViewport({...this.getViewportProps(),...r}),t="panByPosition3D"in e?"panByPosition3D":"panByPosition";return this._getUpdatedState({...r,...e[t](s,n)})}return this._getUpdatedState(r)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:i},r){let{startZoom:n,startZoomLngLat:s}=this.getState();return(s||(n=this.getViewportProps().zoom,s=this._unproject(t)||this._unproject(e)),s)?this._getUpdatedState({zoom:n+Math.log2(i),[a.y]:{position:s,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),i={...this.getViewportProps()},{bearing:r,longitude:n}=i;return Math.abs(r-t.bearing)>180&&(i.bearing=r<0?r+360:r-360),Math.abs(n-t.longitude)>180&&(i.longitude=n<0?n+360:n-360),i}applyConstraints(e,t){let i=e[a.y];delete e[a.y];let{maxPitch:r,minPitch:n,pitch:o,bearing:c,normalize:d,maxBounds:f,rubberBand:g}=e;d&&(c<-180||c>180)&&(e.bearing=(0,h.zi)(c+180,360)-180),e.pitch=(0,s.qE)(o,n,r);let _=this._constrainZoom(e.zoom,e),m=g&&t?.mode==="elastic";if(e.zoom=t?.mode==="preserve"?e.zoom:m?(0,l.GT)(e.zoom,_,1):_,i){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(i.position,i.screenPosition))}if(d&&(e.longitude<-180||e.longitude>180)&&(e.longitude=(0,h.zi)(e.longitude+180,360)-180),f){let i=(0,l.CI)(e.width,e.height,e.maxBoundsPadding),r=this.makeViewport({...e,bearing:0,pitch:0}),n=(0,l.jo)(r,[e.longitude,e.latitude],i),o=p(f[0]),a=p(f[1]),c=2**e.zoom,h=[o[0]+n.left/c,o[1]+n.bottom/c],d=[a[0]-n.right/c,a[1]-n.top/c],g=p([e.longitude,e.latitude]),_=[(0,s.qE)(g[0],h[0],d[0]),(0,s.qE)(g[1],h[1],d[1])],v=g.slice();if(i.width>=0&&(v[0]=t?.mode==="preserve"?g[0]:m?(0,l.GT)(g[0],_[0],i.width/2/c):_[0]),i.height>=0&&(v[1]=t?.mode==="preserve"?g[1]:m?(0,l.GT)(g[1],_[1],i.height/2/c):_[1]),v[0]!==g[0]||v[1]!==g[1]){let[t,i]=(0,u.iV)(v);v[0]!==g[0]&&(e.longitude=t),v[1]!==g[1]&&(e.latitude=i)}}return e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:i,maxBounds:r}=t,n=null!==r&&t.width>0&&t.height>0,{minZoom:o}=t;if(n){let e=(0,l.CI)(t.width,t.height,t.maxBoundsPadding),n=p(r[0]),s=p(r[1]),a=s[0]-n[0],u=s[1]-n[1];e.width>0&&Number.isFinite(a)&&a>0&&(o=Math.max(o,Math.log2(e.width/a))),e.height>0&&Number.isFinite(u)&&u>0&&(o=Math.max(o,Math.log2(e.height/u))),o>i&&(o=i)}return(0,s.qE)(e,o,i)}_zoomFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.zoom({pos:[i/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.pan({startPos:[i/2,r/2],pos:[i/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,i,r){let n=e[0]-t[0],o=e[1]-t[1],a=e[1],l=t[1],{width:u,height:c}=this.getViewportProps(),h=0;o>0?Math.abs(c-l)>5&&(h=o/(l-c)*1.2):o<0&&l>5&&(h=1-a/l),h=(0,s.qE)(h,-1,1);let{minPitch:d,maxPitch:f}=this.getViewportProps(),p=i;return h>0?p=i+h*(f-i):h<0&&(p=i-h*(d-i)),{pitch:p,bearing:r+n/u*180}}}class _ extends o.A{constructor(){super(...arguments),this.ControllerState=g,this.transition={transitionDuration:300,transitionInterpolator:new d.A({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch","position"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this.rotationPivot="center",this._getAltitude=e=>{if("2d"===this.rotationPivot)return 0;if("3d"===this.rotationPivot&&this.pickPosition){let{x:t,y:i}=this.props,r=this.pickPosition(t+e[0],i+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){"rotationPivot"in e&&(this.rotationPivot=e.rotationPivot||"center"),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(!1===e.normalize?null:f),super.setProps(e)}updateViewport(e,t=null,i={}){let r=e.getState();i.isDragging&&r.startRotateLngLat?i={...i,rotationPivotPosition:r.startRotateLngLat}:!1===i.isDragging&&(i={...i,rotationPivotPosition:void 0}),super.updateViewport(e,t,i)}}class m extends r.A{constructor(e={}){super(e)}getViewportType(){return n.A}get ControllerType(){return _}}m.displayName="MapView";let v=m},12041(e,t,i){i.d(t,{A:()=>s});var r=i(33945),n=i(7914);class s{constructor(e){let{id:t,x:i=0,y:n=0,width:s="100%",height:o="100%",padding:a=null}=e;this.id=t||this.constructor.displayName||"view",this.props={...e,id:this.id},this._x=(0,r.rk)(i),this._y=(0,r.rk)(n),this._width=(0,r.rk)(s),this._height=(0,r.rk)(o),this._padding=a&&{left:(0,r.rk)(a.left||0),right:(0,r.rk)(a.right||0),top:(0,r.rk)(a.top||0),bottom:(0,r.rk)(a.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e||this.constructor===e.constructor&&(0,n.b)(this.props,e.props,2)}clone(e){return new this.constructor({...this.props,...e})}makeViewport({width:e,height:t,viewState:i}){i=this.filterViewState(i);let r=this.getDimensions({width:e,height:t});return r.height&&r.width?new(this.getViewportType(i))({...i,...this.props,...r}):null}getViewStateId(){let{viewState:e}=this.props;return"string"==typeof e?e:e?.id||this.id}filterViewState(e){if(this.props.viewState&&"object"==typeof this.props.viewState){if(!this.props.viewState.id)return this.props.viewState;var t=this.props.viewState;let i={...e};for(let e in t)"id"!==e&&(Array.isArray(i[e])&&Array.isArray(t[e])?i[e]=function(e,t){e=e.slice();for(let i=0;i<t.length;i++){let r=t[i];Number.isFinite(r)&&(e[i]=r)}return e}(i[e],t[e]):i[e]=t[e]);return i}return e}getDimensions({width:e,height:t}){let i={x:(0,r.E9)(this._x,e),y:(0,r.E9)(this._y,t),width:(0,r.E9)(this._width,e),height:(0,r.E9)(this._height,t)};return this._padding&&(i.padding={left:(0,r.E9)(this._padding.left,e),top:(0,r.E9)(this._padding.top,t),right:(0,r.E9)(this._padding.right,e),bottom:(0,r.E9)(this._padding.bottom,t)}),i}get controller(){let e=this.props.controller;return e?!0===e?{type:this.ControllerType}:"function"==typeof e?{type:e}:{type:this.ControllerType,...e}:null}}},69634(e,t,i){let r;i.d(t,{H:()=>em});var n=i(15481),s=i(24969);let o={};class a extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response}let l=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,u=/^([-\w.]+\/[-\w.+]+)/;function c(e,t){return e.toLowerCase()===t.toLowerCase()}function h(e){let t=l.exec(e);return t?t[1]:""}var d=i(15715);function f(e){return(0,n.Sv)(e)?e.url:(0,n.qf)(e)?("name"in e?e.name:"")||"":"string"==typeof e?e:""}function p(e){if((0,n.Sv)(e)){let t,i=e.headers.get("content-type")||"",r=(0,d.S3)(e.url);return((t=u.exec(i))?t[1]:i)||h(r)}return(0,n.qf)(e)?e.type||"":"string"==typeof e?h(e):""}async function g(e){var t;if((0,n.Sv)(e))return e;let i={},r=(t=e,(0,n.Sv)(t)?t.headers["content-length"]||-1:(0,n.qf)(t)?t.size:"string"==typeof t?t.length:t instanceof ArrayBuffer||ArrayBuffer.isView(t)?t.byteLength:-1);r>=0&&(i["content-length"]=String(r));let s=f(e),o=p(e);o&&(i["content-type"]=o);let a=await v(e);a&&(i["x-first-bytes"]=a),"string"==typeof e&&(e=new TextEncoder().encode(e));let l=new Response(e,{headers:i});return Object.defineProperty(l,"url",{value:s}),l}async function _(e){if(!e.ok)throw await m(e)}async function m(e){let t=(0,d.E1)(e.url),i=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;i=i.length>100?`${i.slice(0,100)}...`:i;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get("Content-Type");r.reason=!e.bodyUsed&&t?.includes("application/json")?await e.json():await e.text()}catch(e){}return new a(i,r)}async function v(e){if("string"==typeof e)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let i=new FileReader;i.onload=t=>e(t?.target?.result),i.readAsDataURL(t)})}if(e instanceof ArrayBuffer){let t=function(e){let t="",i=new Uint8Array(e);for(let e=0;e<i.byteLength;e++)t+=String.fromCharCode(i[e]);return btoa(t)}(e.slice(0,5));return`data:base64,${t}`}return null}async function b(e,t){if("string"==typeof e){var i;let r=function(e){for(let t in o)if(e.startsWith(t)){let i=o[t];e=e.replace(t,i)}return e.startsWith("http://")||e.startsWith("https://")||(e=`${e}`),e}(e);return!((i=r).startsWith("http:")||i.startsWith("https:"))&&!r.startsWith("data:")&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(r,t):await fetch(r,t)}return await g(e)}var y=i(10982);function w(e,t){let i=(0,y.pp)(),r=e||i,s=r.fetch??r.core?.fetch;return"function"==typeof s?s:(0,n.Gv)(s)?e=>b(e,s):t?.fetch?t?.fetch:b}let x={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};x.self||x.window||x.global,x.window||x.self||x.global,x.global||x.self||x.window,x.document;let E="object"!=typeof process||"[object process]"!==String(process)||process.browser,P="u">typeof window&&void 0!==window.orientation,S="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);S&&parseFloat(S[1]);class A{terminate(){}}function M(e,t){if(!e)throw Error(t||"loaders.gl assertion failed.")}let C=new Map;function T(e){let t=new Blob([e],{type:"application/javascript"});return URL.createObjectURL(t)}function k(e){return!!e&&!!(e instanceof ArrayBuffer||"u">typeof MessagePort&&e instanceof MessagePort||"u">typeof ImageBitmap&&e instanceof ImageBitmap||"u">typeof OffscreenCanvas&&e instanceof OffscreenCanvas)}let I=()=>{};class O{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL="";static isSupported(){return"u">typeof Worker&&E||!E}constructor(e){let{name:t,source:i,url:r}=e;M(i||r),this.name=t,this.source=i,this.url=r,this.onMessage=I,this.onError=e=>console.log(e),this.worker=E?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=I,this.onError=I,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t=t||function e(t,i=!0,r){let n=r||new Set;if(t){if(k(t))n.add(t);else if(k(t.buffer))n.add(t.buffer);else if(ArrayBuffer.isView(t));else if(i&&"object"==typeof t)for(let r in t)e(t[r],i,n)}return void 0===r?Array.from(n):[]}(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t="Failed to load ";return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){var e,t,i;let r;this._loadableURL=(M((e={source:this.source,url:this.url}).source&&!e.url||!e.source&&e.url),(r=C.get(e.source||e.url))||(e.url&&(r=(t=e.url).startsWith("http")?T((i=t,`\
try {
  importScripts('${i}');
} catch (error) {
  console.error(error);
  throw error;
}`)):t,C.set(e.url,r)),e.source&&(r=T(e.source),C.set(e.source,r))),M(r),r);let n=new Worker(this._loadableURL,{name:this.name});return n.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error("No data received"))},n.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},n.onmessageerror=e=>console.error(e),n}_createNodeWorker(){let e;if(this.url)e=new A(this.url.includes(":/")||this.url.startsWith("/")?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(".ts")||this.url.endsWith(".mjs")?"module":"commonjs"});else if(this.source)e=new A(this.source,{eval:!0});else throw Error("no worker");return e.on("message",e=>{this.onMessage(e)}),e.on("error",e=>{this.onError(e)}),e.on("exit",e=>{}),e}}class R{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:"loaders.gl",type:e,payload:t})}done(e){M(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){M(this.isRunning),this.isRunning=!1,this._reject(e)}}class L{name="unnamed";source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return O.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},void 0!==e.name&&(this.name=e.name),void 0!==e.maxConcurrency&&(this.maxConcurrency=e.maxConcurrency),void 0!==e.maxMobileConcurrency&&(this.maxMobileConcurrency=e.maxMobileConcurrency),void 0!==e.reuseWorkers&&(this.reuseWorkers=e.reuseWorkers),void 0!==e.onDebug&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,i)=>e.done(i),i=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:i,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:"Starting job",name:t.name,workerThread:e,backlog:this.jobQueue.length});let i=new R(t.name,e);e.onMessage=e=>t.onMessage(i,e.type,e.payload),e.onError=e=>t.onError(i,e),t.onStart(i);try{await i.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!E||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new O({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return P?this.maxMobileConcurrency:this.maxConcurrency}}let B={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}};class j{props;workerPools=new Map;static _workerFarm;static isSupported(){return O.isSupported()}static getWorkerFarm(e={}){return j._workerFarm=j._workerFarm||new j({}),j._workerFarm.setProps(e),j._workerFarm}constructor(e){this.props={...B},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){for(let t of(this.props={...this.props,...e},this.workerPools.values()))t.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:i,url:r}=e,n=this.workerPools.get(t);return n||((n=new L({name:t,source:i,url:r})).setProps(this._getWorkerPoolProps()),this.workerPools.set(t,n)),n}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}}async function z(e,t,i,r,n){let s=e.id,o=function(e,t={}){let i=t[e.id]||{},r=E?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,n=i.workerUrl;if(n||"compression"!==e.id||(n=t.workerUrl),"test"===(t._workerType||t?.core?._workerType)&&(n=E?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!n){let t=e.version;"latest"===t&&(t="latest");let i=t?`@${t}`:"";n=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${r}`}return M(n),n}(e,i),a=j.getWorkerFarm(i?.core).getWorkerPool({name:s,url:o});(i=JSON.parse(JSON.stringify(i||{})))._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let l=await a.startJob("process-on-worker",N.bind(null,n));l.postMessage("process",{input:t,options:i,context:r});let u=await l.result;return await u.result}async function N(e,t,i,r){switch(i){case"done":t.done(r);break;case"error":t.error(Error(r.error));break;case"process":let{id:n,input:s,options:o}=r;try{let i=await e(s,o);t.postMessage("done",{id:n,result:i})}catch(i){let e=i instanceof Error?i.message:"unknown error";t.postMessage("error",{id:n,error:e})}break;default:console.warn(`parse-with-worker unknown message ${i}`)}}let D=(globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version="4.5.2"),globalThis._loadersgl_.version);function F(e){return e&&"object"==typeof e&&e.isBuffer}function U(e){if(F(e)||e instanceof ArrayBuffer)return e;if((0,n.L8)(e))return $(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if("string"==typeof e)return new TextEncoder().encode(e).buffer;if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw Error("toArrayBuffer")}function V(e){if(e instanceof ArrayBuffer)return e;if((0,n.L8)(e))return $(e);let{buffer:t,byteOffset:i,byteLength:r}=e;return t instanceof ArrayBuffer&&0===i&&r===t.byteLength?t:$(t,i,r)}function $(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),n=new Uint8Array(r.length);return n.set(r),n.buffer}async function W(e){let t=[];for await(let i of e)t.push(function(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:i,byteLength:r}=e;return G(t,i,r)}return G(e)}(i));return function(...e){var t=e;let i=t.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),r=new Uint8Array(i.reduce((e,t)=>e+t.byteLength,0)),n=0;for(let e of i)r.set(e,n),n+=e.byteLength;return r.buffer}(...t)}function G(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),n=new Uint8Array(r.length);return n.set(r),n.buffer}async function*H(e,t){let i=t?.chunkSize||1048576,r=0;for(;r<e.size;){let t=r+i,n=await e.slice(r,t).arrayBuffer();r=t,yield n}}var q=i(97224);function Y(e,t){return q.Bd?Z(e,t):K(e,t)}async function*Z(e,t){let i,r=e.getReader();try{for(;;){let e=i||r.read();t?._streamReadAhead&&(i=r.read());let{done:n,value:s}=await e;if(n)return;yield U(s)}}catch(e){r.releaseLock()}}async function*K(e,t){for await(let t of e)yield U(t)}let X="Cannot convert supplied data type";async function J(e,t,i){if("string"==typeof e||(0,n.B1)(e)){var r,s=e;if(t.text&&"string"==typeof s)return s;if(F(s)&&(s=s.buffer),(0,n.B1)(s)){let e=ArrayBuffer.isView(r=s)?r:new Uint8Array(r);return t.text&&!t.binary?new TextDecoder("utf8").decode(e):U(e)}throw Error(X)}if((0,n.qf)(e)&&(e=await g(e)),(0,n.Sv)(e))return await _(e),t.binary?await e.arrayBuffer():await e.text();if((0,n.H1)(e)&&(e=function(e,t){if("string"==typeof e)return function*(e,t){let i=t?.chunkSize||262144,r=0,n=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,i),s=e.slice(r,r+t);r+=t,yield V(n.encode(s))}}(e,t);if(e instanceof ArrayBuffer)return function*(e,t={}){let{chunkSize:i=262144}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,i),n=new ArrayBuffer(t),s=new Uint8Array(e,r,t);new Uint8Array(n).set(s),r+=t,yield n}}(e,t);if((0,n.qf)(e))return H(e,t);if((0,n.H1)(e))return Y(e,t);if((0,n.Sv)(e)){let i=e.body;if(!i)throw Error("Readable stream not available on Response");return Y(i,t)}throw Error("makeIterator")}(e,i)),(0,n.xZ)(e)||(0,n.Td)(e))return W(e);throw Error(X)}var Q=i(15111),ee=i(90928);let et="4.5.2",ei=et[0]>="0"&&et[0]<="9"?`v${et}`:"",er=(r=new ee.h({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=ei,globalThis.probe||={},globalThis.probe.loaders=r,r);var en=i(97864);let es=/\.([^.]+)$/;async function eo(e,t=[],i,r){if(!eu(e))return null;let s=(0,y.Rf)(i||{});if(s.core||={},e instanceof Response&&ea(e)){let i=el(await e.clone().text(),t,{...s,core:{...s.core,nothrow:!0}},r);if(i)return i}let o=el(e,t,{...s,core:{...s.core,nothrow:!0}},r);if(o)return o;if((0,n.qf)(e)&&(o=el(e=await e.slice(0,10).arrayBuffer(),t,s,r)),!o&&e instanceof Response&&ea(e)&&(o=el(await e.clone().text(),t,s,r)),!o&&!s.core.nothrow)throw Error(ec(e));return o}function ea(e){let t=p(e);return!!(t&&(t.startsWith("text/")||"application/json"===t||t.endsWith("+json")))}function el(e,t=[],i,r){var n,o,a,l,u,c;let h,g,_,m,v,b,w;if(!eu(e))return null;let x=(0,y.Rf)(i||{});if(x.core||={},t&&!Array.isArray(t))return(0,s.D)(t);let E=[];t&&(E=E.concat(t)),x.core.ignoreRegisteredLoaders||E.push(...(0,en.Ph)()),function(e){for(let t of e)(0,s.D)(t)}(E);let P=(n=e,o=E,a=x,l=r,h=f(n),g=p(n),_=(0,d.S3)(h)||l?.url,m=null,v="",a?.core?.mimeType&&(m=eh(o,a?.core?.mimeType),v=`match forced by supplied MIME type ${a?.core?.mimeType}`),m=m||(u=o,(w=(b=(c=_)&&es.exec(c))&&b[1])?function(e,t){for(let i of(t=t.toLowerCase(),e))for(let e of i.extensions)if(e.toLowerCase()===t)return i;return null}(u,w):null),v=v||(m?`matched url ${_}`:""),m=m||eh(o,g),v=v||(m?`matched MIME type ${g}`:""),m=m||function(e,t){if(!t)return null;for(let i of e)if("string"==typeof t){if(function(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}(t,i))return i}else if(ArrayBuffer.isView(t)){if(ed(t.buffer,t.byteOffset,i))return i}else if(t instanceof ArrayBuffer&&ed(t,0,i))return i;return null}(o,n),v=v||(m?`matched initial data ${ef(n)}`:""),a?.core?.fallbackMimeType&&(m=m||eh(o,a?.core?.fallbackMimeType),v=v||(m?`matched fallback MIME type ${g}`:"")),v&&er.log(1,`selectLoader selected ${m?.name}: ${v}.`),m);if(!P&&!x.core.nothrow)throw Error(ec(e));return P}function eu(e){return!(e instanceof Response)||204!==e.status}function ec(e){let t=f(e),i=p(e),r="No valid loader found (";r+=(t?`${Q.iW(t)}, `:"no url provided, ")+`MIME type: ${i?`"${i}"`:"not provided"}, `;let n=e?ef(e):"";return r+((n?` first bytes: "${n}"`:"first bytes: not available")+")")}function eh(e,t){for(let i of e)if(i.mimeTypes?.some(e=>c(t,e))||c(t,`application/x.${i.id}`))return i;return null}function ed(e,t,i){return(Array.isArray(i.tests)?i.tests:[i.tests]).some(i=>(function(e,t,i){if((0,n.B1)(i))return function(e,t,i){if(i=i||e.byteLength,e.byteLength<i||t.byteLength<i)return!1;let r=new Uint8Array(e),n=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==n[e])return!1;return!0}(i,e,i.byteLength);switch(typeof i){case"function":return i(V(e));case"string":let r=ep(e,t,i.length);return i===r;default:return!1}})(e,t,i))}function ef(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?ep(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?ep(e,0,t):""}function ep(e,t,i){if(e.byteLength<t+i)return"";let r=new DataView(e),n="";for(let e=0;e<i;e++)n+=String.fromCharCode(r.getUint8(t+e));return n}async function eg(e,t,i,r){!t||Array.isArray(t)||(0,s.l)(t)||(r=void 0,i=t,t=void 0),e=await e,i=i||{};let n=f(e),o=function(e,t){let i;if(e&&!Array.isArray(e))return e;if(e&&(i=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];i=i?[...i,...e]:e}return i&&i.length?i:void 0}(t,r),a=await eo(e,o,i);if(!a)return null;let l=(0,y.a5)(i,a,o,n);return r=function(e,t,i){if(i)return i;let r={fetch:w(t,e),...e};if(r.url){let e=(0,d.S3)(r.url);r.baseUrl=e,r.queryString=(0,d.by)(r.url),r.filename=Q.iW(e),r.baseUrl=Q.pD(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}({url:n,_parse:eg,loaders:o},l,r||null),await e_(a,e,l,r)}async function e_(e,t,i,r){if(!function(e,t=D){M(e,"no worker provided");e.version}(e),i=function e(t,i,r=0){if(r>3)return i;let n={...t};for(let[t,s]of Object.entries(i))s&&"object"==typeof s&&!Array.isArray(s)?n[t]=e(n[t]||{},i[t],r+1):n[t]=i[t];return n}(e.options||{},i),(0,n.Sv)(t)){let{ok:e,redirected:i,status:n,statusText:s,type:o,url:a}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:i,status:n,statusText:s,type:o,url:a}}if(t=await J(t,e,i),e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i,r);if(function(e,t){if(!j.isSupported())return!1;let i=t?._nodeWorkers??t?.core?._nodeWorkers;if(!E&&!i)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}(e,i))return await z(e,t,i,r,eg);if(e.parseText&&"string"==typeof t)return await e.parseText(t,i,r);if(e.parse)return await e.parse(t,i,r);throw M(!e.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function em(e,t,i,r){let o,a;Array.isArray(t)||(0,s.l)(t)?(o=t,a=i):(o=[],a=t);let l=w(a),u=e;if("string"==typeof e&&(u=await l(e)),(0,n.qf)(e)&&(u=await l(e)),"string"==typeof e){let t=(0,y.Rf)(a||{});t.core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})}return Array.isArray(o),await eg(u,o,a)}},97864(e,t,i){i.d(t,{Ph:()=>a,mk:()=>o});var r=i(24969),n=i(10982);let s=()=>{let e=(0,n.K2)();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function o(e){let t=s();for(let i of e=Array.isArray(e)?e:[e]){let e=(0,r.D)(i);t.find(t=>e===t)||t.unshift(e)}}function a(){return s()}},24969(e,t,i){i.d(t,{D:()=>s,l:()=>n});var r=i(48116);function n(e){return!!e&&(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions))}function s(e){let t;return(0,r.v)(e,"null loader"),(0,r.v)(n(e),"invalid loader"),Array.isArray(e)&&(t=e[1],e={...e=e[0],options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}},10982(e,t,i){i.d(t,{a5:()=>p,Rf:()=>g,K2:()=>d,pp:()=>f});var r=i(15481),n=i(15111);let s=new(i(90928)).h({id:"loaders.gl"});class o{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}}var a=i(97224);let l={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:"https://unpkg.com/@loaders.gl",worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:a.Bd,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},u={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"};var c=i(15715);let h=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","maxConcurrency","maxMobileConcurrency","reuseWorkers","_nodeWorkers","_workerType","limit","_limitMB","batchSize","batchDebounceMs","metadata","transforms"];function d(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||(e._state={}),e._state}function f(){let e=d();return e.globalOptions=e.globalOptions||{...l,core:{...l.core}},g(e.globalOptions)}function p(e,t,i,r){var s,a,d,p,b;let y,w;return function(e,t){for(let i of(_(e,null,l,u,t),t)){let r=e&&e[i.id]||{},n=i.options&&i.options[i.id]||{},s=i.deprecatedOptions&&i.deprecatedOptions[i.id]||{};_(r,i.id,n,s,t)}}(e,i=Array.isArray(i=i||[])?i:[i]),g((s=t,a=e,d=r,w={...y=s.options||{}},y.core&&(w.core={...y.core}),v(w),w.core?.log===null&&(w.core={...w.core,log:new o}),m(w,g(f())),m(w,g(a)),p=w,(b=d)&&p.core?.baseUrl===void 0&&(p.core||={},p.core.baseUrl=n.pD((0,c.S3)(b))),function(e){let t=e.core;if(t)for(let i of h)void 0!==t[i]&&(e[i]=t[i])}(w),w))}function g(e){var t;let i,r=(i={...t=e},t.core&&(i.core={...t.core}),i);for(let e of(v(r),h))r.core&&void 0!==r.core[e]&&delete r[e];return r.core&&void 0!==r.core._workerType&&delete r._worker,r}function _(e,t,i,n,o){let a=t||"Top level",l=t?`${t}.`:"";for(let u in e){let c=!t&&(0,r.Gv)(e[u]),h="baseUri"===u&&!t,d="workerUrl"===u&&t;if(!(u in i)&&!h&&!d){if(u in n)s.level>0&&s.warn(`${a} loader option '${l}${u}' no longer supported, use '${n[u]}'`)();else if(!c&&s.level>0){let e=function(e,t){let i=e.toLowerCase(),r="";for(let n of t)for(let t in n.options){if(e===t)return`Did you mean '${n.id}.${t}'?`;let s=t.toLowerCase();(i.startsWith(s)||s.startsWith(i))&&(r=r||`Did you mean '${n.id}.${t}'?`)}return r}(u,o);s.warn(`${a} loader option '${l}${u}' not recognized. ${e}`)()}}}}function m(e,t){for(let i in t)if(i in t){let n=t[i];(0,r.aC)(n)&&(0,r.aC)(e[i])?e[i]={...e[i],...t[i]}:e[i]=t[i]}}function v(e){for(let t of(void 0!==e.baseUri&&(e.core||={},void 0===e.core.baseUrl&&(e.core.baseUrl=e.baseUri)),h))if(void 0!==e[t]){let i=e.core=e.core||{};void 0===i[t]&&(i[t]=e[t])}let t=e._worker;void 0!==t&&(e.core||={},void 0===e.core._workerType&&(e.core._workerType=t))}},15715(e,t,i){i.d(t,{E1:()=>o,S3:()=>s,by:()=>n});let r=/\?.*/;function n(e){let t=e.match(r);return t&&t[0]}function s(e){return e.replace(r,"")}function o(e){if(e.length<50)return e;let t=e.slice(e.length-15),i=e.substr(0,32);return`${i}...${t}`}},48116(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"loader assertion failed.")}},97224(e,t,i){i.d(t,{Bd:()=>n});let r={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};r.self||r.window||r.global,r.window||r.self||r.global,r.global||r.self||r.window,r.document;let n=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),s="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);s&&parseFloat(s[1])},15481(e,t,i){i.d(t,{B1:()=>o,Gv:()=>r,H1:()=>h,L8:()=>s,Sv:()=>u,Td:()=>l,aC:()=>n,qf:()=>c,xZ:()=>a});let r=e=>null!==e&&"object"==typeof e,n=e=>r(e)&&e.constructor===({}).constructor,s=e=>"u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer,o=e=>r(e)&&"number"==typeof e.byteLength&&"function"==typeof e.slice,a=e=>!!e&&"function"==typeof e[Symbol.iterator],l=e=>!!e&&"function"==typeof e[Symbol.asyncIterator],u=e=>"u">typeof Response&&e instanceof Response||r(e)&&"function"==typeof e.arrayBuffer&&"function"==typeof e.text&&"function"==typeof e.json,c=e=>"u">typeof Blob&&e instanceof Blob,h=e=>{let t,i;return t=e,"u">typeof ReadableStream&&t instanceof ReadableStream||r(t)&&"function"==typeof t.tee&&"function"==typeof t.cancel&&"function"==typeof t.getReader||r(i=e)&&"function"==typeof i.read&&"function"==typeof i.pipe&&"boolean"==typeof i.readable}},15111(e,t,i){function r(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):e}function n(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}i.d(t,{iW:()=>r,pD:()=>n})},32536(e,t,i){i.d(t,{M:()=>o});var r=i(58073),n=i(73731);function s(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}class o extends r.a{get x(){return this[0]}set x(e){this[0]=(0,n.ws)(e)}get y(){return this[1]}set y(e){this[1]=(0,n.ws)(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let i=0;i<this.ELEMENTS;++i){let r=this[i]-e[i];t+=r*r}return(0,n.ws)(t)}dot(e){let t=0;for(let i=0;i<this.ELEMENTS;++i)t+=this[i]*e[i];return(0,n.ws)(t)}normalize(){let e=this.magnitude();if(0!==e)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return s(e>=0&&e<this.ELEMENTS,"index is out of range"),(0,n.ws)(this[e])}setComponent(e,t){return s(e>=0&&e<this.ELEMENTS,"index is out of range"),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]+=e[i]*t;return this.check()}}},87597(e,t,i){let r;i.d(t,{P:()=>c});var n=i(32536),s=i(54901),o=i(73731),a=i(82859),l=i(90606);let u=[0,0,0];class c extends n.M{static get ZERO(){return r||Object.freeze(r=new c(0,0,0)),r}constructor(e=0,t=0,i=0){super(-0,-0,-0),1==arguments.length&&(0,s.cy)(e)?this.copy(e):(s.$W.debug&&((0,o.ws)(e),(0,o.ws)(t),(0,o.ws)(i)),this[0]=e,this[1]=t,this[2]=i)}set(e,t,i){return this[0]=e,this[1]=t,this[2]=i,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return s.$W.debug&&((0,o.ws)(e.x),(0,o.ws)(e.y),(0,o.ws)(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=(0,o.ws)(e)}angle(e){return(0,a.g7)(this,e)}cross(e){return(0,a.$A)(this,this,e),this.check()}rotateX({radians:e,origin:t=u}){return(0,a.eL)(this,this,t,e),this.check()}rotateY({radians:e,origin:t=u}){return(0,a.Z8)(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=u}){return(0,a.x6)(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return(0,a.Z0)(this,this,e),this.check()}transformAsVector(e){return(0,l.cL)(this,this,e),this.check()}transformByMatrix3(e){return(0,a.ei)(this,this,e),this.check()}transformByMatrix2(e){return(0,l.J4)(this,this,e),this.check()}transformByQuaternion(e){return(0,a.gL)(this,this,e),this.check()}}},26369(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"@math.gl/web-mercator: assertion failed.")}},231(e,t,i){let r;i.d(t,{_U:()=>o,$M:()=>s,qE:()=>a,p6:()=>l});var n=i(4602);function s(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function o(e,t){var i,r;let n,s,o,a,l=(i=[],n=t[0],s=t[1],o=t[2],a=t[3],i[0]=e[0]*n+e[4]*s+e[8]*o+e[12]*a,i[1]=e[1]*n+e[5]*s+e[9]*o+e[13]*a,i[2]=e[2]*n+e[6]*s+e[10]*o+e[14]*a,i[3]=e[3]*n+e[7]*s+e[11]*o+e[15]*a,i);return r=1/l[3],l[0]=l[0]*r,l[1]=l[1]*r,l[2]=l[2]*r,l[3]=l[3]*r,l}function a(e,t,i){return e<t?t:e>i?i:e}r=new n.tb(4),n.tb!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0,r[3]=0);let l=Math.log2||function(e){return Math.log(e)*Math.LOG2E}},67681(e,t,i){let r;i.d(t,{Gw:()=>p,xJ:()=>S,iV:()=>g,VJ:()=>P,rY:()=>y,mY:()=>m,wZ:()=>E,dT:()=>b,Os:()=>x,nI:()=>v,fO:()=>_,aH:()=>f,om:()=>w});var n=i(231);function s(e,t,i){let r,n,s,o,a,l,u,c,h,d,f,p,g=i[0],_=i[1],m=i[2];return t===e?(e[12]=t[0]*g+t[4]*_+t[8]*m+t[12],e[13]=t[1]*g+t[5]*_+t[9]*m+t[13],e[14]=t[2]*g+t[6]*_+t[10]*m+t[14],e[15]=t[3]*g+t[7]*_+t[11]*m+t[15]):(r=t[0],n=t[1],s=t[2],o=t[3],a=t[4],l=t[5],u=t[6],c=t[7],h=t[8],d=t[9],f=t[10],p=t[11],e[0]=r,e[1]=n,e[2]=s,e[3]=o,e[4]=a,e[5]=l,e[6]=u,e[7]=c,e[8]=h,e[9]=d,e[10]=f,e[11]=p,e[12]=r*g+a*_+h*m+t[12],e[13]=n*g+l*_+d*m+t[13],e[14]=s*g+u*_+f*m+t[14],e[15]=o*g+c*_+p*m+t[15]),e}var o=i(4602);r=new o.tb(3),o.tb!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0);var a=i(46540),l=i(26369);let u=Math.PI,c=u/4,h=u/180,d=180/u,f=85.051129;function p(e){let[t,i]=e;(0,l.v)(Number.isFinite(t)),(0,l.v)(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let r=512*(u+Math.log(Math.tan(c+i*h*.5)))/(2*u);return[512*(t*h+u)/(2*u),r]}function g(e){let[t,i]=e,r=2*(Math.atan(Math.exp(i/512*(2*u)-u))-c);return[(t/512*(2*u)-u)*d,r*d]}function _(e){var t;let{latitude:i}=e;return(0,l.v)(Number.isFinite(i)),t=4003e4*Math.cos(i*h),(0,n.p6)(t)-9}function m(e){return 512/4003e4/Math.cos(e*h)}function v(e){let{latitude:t,longitude:i,highPrecision:r=!1}=e;(0,l.v)(Number.isFinite(t)&&Number.isFinite(i));let n=Math.cos(t*h),s=512/360/n,o=512/4003e4/n,a={unitsPerMeter:[o,o,o],metersPerUnit:[1/o,1/o,1/o],unitsPerDegree:[512/360,s,o],degreesPerUnit:[1/(512/360),1/s,1/o]};if(r){let e=h*Math.tan(t*h)/n,i=512/4003e4*e,r=i/s*o;a.unitsPerDegree2=[0,512/360*e/2,i],a.unitsPerMeter2=[r,0,r]}return a}function b(e,t){let[i,r,n]=e,[s,o,a]=t,{unitsPerMeter:l,unitsPerMeter2:u}=v({longitude:i,latitude:r,highPrecision:!0}),c=p(e);c[0]+=s*(l[0]+u[0]*o),c[1]+=o*(l[1]+u[1]*o);let h=g(c);return Number.isFinite(n)||Number.isFinite(a)?[h[0],h[1],(n||0)+(a||0)]:h}function y(e){var t,i,r,o;let a,l,u,c,d,f,p,g,_,m,v,b,y,w,x,E,P,S,A,M,C,T,k,{height:I,pitch:O,bearing:R,altitude:L,scale:B,center:j}=e,z=(0,n.$M)();s(z,z,[0,0,-L]),a=Math.sin(t=-O*h),l=Math.cos(t),u=z[4],c=z[5],d=z[6],f=z[7],p=z[8],g=z[9],_=z[10],m=z[11],z!=z&&(z[0]=z[0],z[1]=z[1],z[2]=z[2],z[3]=z[3],z[12]=z[12],z[13]=z[13],z[14]=z[14],z[15]=z[15]),z[4]=u*l+p*a,z[5]=c*l+g*a,z[6]=d*l+_*a,z[7]=f*l+m*a,z[8]=p*l-u*a,z[9]=g*l-c*a,z[10]=_*l-d*a,z[11]=m*l-f*a,v=Math.sin(i=R*h),b=Math.cos(i),y=z[0],w=z[1],x=z[2],E=z[3],P=z[4],S=z[5],A=z[6],M=z[7],z!=z&&(z[8]=z[8],z[9]=z[9],z[10]=z[10],z[11]=z[11],z[12]=z[12],z[13]=z[13],z[14]=z[14],z[15]=z[15]),z[0]=y*b+P*v,z[1]=w*b+S*v,z[2]=x*b+A*v,z[3]=E*b+M*v,z[4]=P*b-y*v,z[5]=S*b-w*v,z[6]=A*b-x*v,z[7]=M*b-E*v;let N=B/I;return C=(r=[N,N,N])[0],T=r[1],k=r[2],z[0]=z[0]*C,z[1]=z[1]*C,z[2]=z[2]*C,z[3]=z[3]*C,z[4]=z[4]*T,z[5]=z[5]*T,z[6]=z[6]*T,z[7]=z[7]*T,z[8]=z[8]*k,z[9]=z[9]*k,z[10]=z[10]*k,z[11]=z[11]*k,z[12]=z[12],z[13]=z[13],z[14]=z[14],z[15]=z[15],j&&s(z,z,((o=[])[0]=-j[0],o[1]=-j[1],o[2]=-j[2],o)),z}function w(e){let{width:t,height:i,altitude:r,pitch:s=0,offset:o,center:a,scale:l,nearZMultiplier:u=1,farZMultiplier:c=1}=e,{fovy:d=x(1.5)}=e;void 0!==r&&(d=x(r));let f=d*h,p=s*h,g=E(d),_=g;a&&(_+=a[2]*l/Math.cos(p)/i);let m=f*(.5+(o?o[1]:0)/i),v=Math.sin(m)*_/Math.sin((0,n.qE)(Math.PI/2-p-m,.01,Math.PI-.01));return{fov:f,aspect:t/i,focalDistance:g,near:u,far:Math.min((Math.sin(p)*v+_)*c,10*_)}}function x(e){return 2*Math.atan(.5/e)*d}function E(e){return .5/Math.tan(.5*e*h)}function P(e,t){let[i,r,s=0]=e;return(0,l.v)(Number.isFinite(i)&&Number.isFinite(r)&&Number.isFinite(s)),(0,n._U)(t,[i,r,s,1])}function S(e,t,i=0){let[r,s,o]=e;if((0,l.v)(Number.isFinite(r)&&Number.isFinite(s),"invalid pixel coordinate"),Number.isFinite(o))return(0,n._U)(t,[r,s,o,1]);let u=(0,n._U)(t,[r,s,0,1]),c=(0,n._U)(t,[r,s,1,1]),h=u[2],d=c[2];return a.Cc([],u,c,h===d?0:((i||0)-h)/(d-h))}},4602(e,t,i){i.d(t,{tb:()=>r});let r="u">typeof Float32Array?Float32Array:Array},46540(e,t,i){let r;i.d(t,{Cc:()=>s});var n=i(4602);function s(e,t,i,r){let n=t[0],s=t[1];return e[0]=n+r*(i[0]-n),e[1]=s+r*(i[1]-s),e}r=new n.tb(2),n.tb!=Float32Array&&(r[0]=0,r[1]=0)},90928(e,t,i){var r,n;function s(){return!("object"==typeof process&&"[object process]"===String(process)&&!process?.browser)||function(){if("u">typeof window&&window.process?.type==="renderer"||"u">typeof process&&process.versions?.electron)return!0;let e="u">typeof navigator&&navigator.userAgent;return!!(e&&e.indexOf("Electron")>=0)}()}i.d(t,{h:()=>v});let o="4.1.1";function a(e,t){if(!e)throw Error(t||"Assertion failed")}function l(e){let t;if(!e)return 0;switch(typeof e){case"number":t=e;break;case"object":t=e.logLevel||e.priority||0;break;default:return 0}return a(Number.isFinite(t)&&t>=0),t}let u=()=>{};class c{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log("warn",0,e,t,{once:!0})}error(e,...t){return this._log("error",0,e,t)}log(e,t,...i){return this._log("log",e,t,i)}info(e,t,...i){return this._log("info",e,t,i)}once(e,t,...i){return this._log("once",e,t,i,{once:!0})}_log(e,t,i,r,n={}){let s=function(e){let{logLevel:t,message:i}=e;e.logLevel=l(t);let r=e.args?Array.from(e.args):[];for(;r.length&&r.shift()!==i;);switch(typeof t){case"string":case"function":void 0!==i&&r.unshift(i),e.message=t;break;case"object":Object.assign(e,t)}"function"==typeof e.message&&(e.message=e.message());let n=typeof e.message;return a("string"===n||"object"===n),Object.assign(e,{args:r},e.opts)}({logLevel:t,message:i,args:this._buildArgs(t,i,r),opts:n});return this._createLogFunction(e,s,n)}_buildArgs(e,t,i){return[e,t,...i]}_createLogFunction(e,t,i){if(!this._shouldLog(t.logLevel))return u;let r=this._getOnceTag(i.tag??t.tag??t.message);if((i.once||t.once)&&void 0!==r){if(this._onceCache.has(r))return u;this._onceCache.add(r)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=l(e)}_getOnceTag(e){if(void 0!==e)try{return"string"==typeof e?e:String(e)}catch{return}}}class h{constructor(e,t,i="sessionStorage"){this.storage=function(e){try{let t=window[e],i="__storage_test__";return t.setItem(i,i),t.removeItem(i),t}catch(e){return null}}(i),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let e=JSON.stringify(this.config);this.storage.setItem(this.id,e)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}}function d(e){return"string"!=typeof e?e:r[e=e.toUpperCase()]||r.WHITE}(n=r||(r={}))[n.BLACK=30]="BLACK",n[n.RED=31]="RED",n[n.GREEN=32]="GREEN",n[n.YELLOW=33]="YELLOW",n[n.BLUE=34]="BLUE",n[n.MAGENTA=35]="MAGENTA",n[n.CYAN=36]="CYAN",n[n.WHITE=37]="WHITE",n[n.BRIGHT_BLACK=90]="BRIGHT_BLACK",n[n.BRIGHT_RED=91]="BRIGHT_RED",n[n.BRIGHT_GREEN=92]="BRIGHT_GREEN",n[n.BRIGHT_YELLOW=93]="BRIGHT_YELLOW",n[n.BRIGHT_BLUE=94]="BRIGHT_BLUE",n[n.BRIGHT_MAGENTA=95]="BRIGHT_MAGENTA",n[n.BRIGHT_CYAN=96]="BRIGHT_CYAN",n[n.BRIGHT_WHITE=97]="BRIGHT_WHITE";let f=globalThis,p=globalThis.process||{};function g(){let e;if(s()&&f.performance)e=f?.performance?.now?.();else if("hrtime"in p){let t=p?.hrtime?.();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}let _={debug:s()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},m={enabled:!0,level:0};class v extends c{constructor({id:e}={id:""}){super({level:0}),this.VERSION=o,this._startTs=g(),this._deltaTs=g(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new h(`__probe-${this.id}__`,{[this.id]:m}),this.timeStamp(`${this.id} started`),function(e,t=["constructor"]){for(let i of Object.getOwnPropertyNames(Object.getPrototypeOf(e))){let r=e[i];"function"!=typeof r||t.find(e=>i===e)||(e[i]=r.bind(e))}}(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((g()-this._startTs).toPrecision(10))}getDelta(){return Number((g()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw Error(t||"Assertion failed")}warn(e,...t){return this._log("warn",0,e,t,{method:_.warn,once:!0})}error(e,...t){return this._log("error",0,e,t,{method:_.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed \
in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...i){return this._log("log",e,t,i,{method:_.log,time:!0,once:!0})}log(e,t,...i){return this._log("log",e,t,i,{method:_.debug})}info(e,t,...i){return this._log("info",e,t,i,{method:console.info})}once(e,t,...i){return this._log("once",e,t,i,{method:_.debug||_.info,once:!0})}table(e,t,i){return t?this._log("table",e,t,i&&[i]||[],{method:console.table||u,tag:function(e){for(let t in e)for(let i in e[t])return i||"untitled";return"empty"}(t)}):u}time(e,t){return this._log("time",e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log("time",e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log("time",e,t,[],{method:console.timeStamp||u})}group(e,t,i={collapsed:!1}){let r=(i.collapsed?console.groupCollapsed:console.group)||console.info;return this._log("group",e,t,[],{method:r})}groupCollapsed(e,t,i={}){return this.group(e,t,Object.assign({},i,{collapsed:!0}))}groupEnd(e){return this._log("groupEnd",e,"",[],{method:console.groupEnd||u})}withGroup(e,t,i){this.group(e,t)();try{i()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let i=t.method;a(i),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=g();let r=function(e,t,i){if("string"==typeof t){var r;let n=i.time?function(e,t=8){let i=Math.max(t-e.length,0);return`${" ".repeat(i)}${e}`}((r=i.total)<10?`${r.toFixed(2)}ms`:r<100?`${r.toFixed(1)}ms`:r<1e3?`${r.toFixed(0)}ms`:`${(r/1e3).toFixed(2)}s`):"";t=function(e,t,i){if(!s&&"string"==typeof e){if(t){let i=d(t);e=`\u001b[${i}m${e}\u001b[39m`}if(i){let t=d(i);e=`\u001b[${t+10}m${e}\u001b[49m`}}return e}(t=i.time?`${e}: ${n}  ${t}`:`${e}: ${t}`,i.color,i.background)}return t}(this.id,t.message,t);return i.bind(console,r,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(m),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...m};this._storage.setConfiguration({[this.id]:{...t,...e}})}}v.VERSION=o},92767(e,t,i){var r,n,s,o,a,l;i.d(t,{Cx:()=>j,uq:()=>D,Cp:()=>B,EU:()=>er,h1:()=>U}),(o=r||(r={}))[o.Start=1]="Start",o[o.Move=2]="Move",o[o.End=4]="End",o[o.Cancel=8]="Cancel",(a=n||(n={}))[a.None=0]="None",a[a.Left=1]="Left",a[a.Right=2]="Right",a[a.Up=4]="Up",a[a.Down=8]="Down",a[a.Horizontal=3]="Horizontal",a[a.Vertical=12]="Vertical",a[a.All=15]="All",(l=s||(s={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let u="manipulation";class c{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){"compute"===e&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));var t=e.join(" ");if(t.includes("none"))return"none";let i=t.includes("pan-x"),r=t.includes("pan-y");return i&&r?"none":i||r?i?"pan-x":"pan-y":t.includes(u)?u:"auto"}}function h(e){return e.trim().split(/\s+/g)}function d(e,t,i){if(e)for(let r of h(t))e.addEventListener(r,i,!1)}function f(e,t,i){if(e)for(let r of h(t))e.removeEventListener(r,i,!1)}function p(e){return(e.ownerDocument||e).defaultView}function g(e){let t=e.length;if(1===t)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let i=0,r=0,n=0;for(;n<t;)i+=e[n].clientX,r+=e[n].clientY,n++;return{x:Math.round(i/t),y:Math.round(r/t)}}function _(e){let t=[],i=0;for(;i<e.pointers.length;)t[i]={clientX:Math.round(e.pointers[i].clientX),clientY:Math.round(e.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:t,center:g(t),deltaX:e.deltaX,deltaY:e.deltaY}}function m(e,t){let i=t.x-e.x,r=t.y-e.y;return Math.sqrt(i*i+r*r)}function v(e,t){let i=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(i*i+r*r)}function b(e,t){let i=t.clientX-e.clientX;return 180*Math.atan2(t.clientY-e.clientY,i)/Math.PI}function y(e,t){return e===t?n.None:Math.abs(e)>=Math.abs(t)?e<0?n.Left:n.Right:t<0?n.Up:n.Down}function w(e,t,i){return{x:t/e||0,y:i/e||0}}function x(e,t){return"pointerId"in e?e.pointerId:t}function E(e,t){e.movementOrigin=new Map(t.map((e,t)=>[x(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}class P{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){var i;let n,s,o,a,l;i=this.manager,n=t.pointers.length,s=t.changedPointers.length,o=e&r.Start&&n-s==0,a=e&(r.End|r.Cancel)&&n-s==0,t.isFirst=!!o,t.isFinal=!!a,o&&(i.session={}),t.eventType=e,l=function(e,t){var i,n;let s,o,a,l,u,{session:c}=e,{pointers:h}=t,{length:d}=h;c.firstInput||(c.firstInput=_(t)),d>1&&!c.firstMultiple?c.firstMultiple=_(t):1===d&&(c.firstMultiple=!1);let{firstInput:f,firstMultiple:p}=c,P=p?p.center:f.center,S=t.center=g(h);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-f.timeStamp;let A=t.pointers.map(x);if(c.movementOrigin?.size===A.length&&A.every(e=>c.movementOrigin.has(e))||E(c,t.pointers),t.distancePerPointer=t.pointers.map((e,t)=>v(c.movementOrigin.get(A[t]),e)),t.eventType&r.Move&&t.distancePerPointer.some(e=>e>0)&&(c.firstMovementTime??(c.firstMovementTime=t.timeStamp)),t.movementDeltaTime=void 0===c.firstMovementTime?0:t.timeStamp-c.firstMovementTime,t.eventType&(r.End|r.Cancel)){let e=t.changedPointers.map(e=>x(e,t.pointers.indexOf(e)));E(c,t.pointers.filter((t,i)=>!e.includes(A[i])))}s=S.x-P.x,t.angle=180*Math.atan2(S.y-P.y,s)/Math.PI,t.distance=m(P,S);let{deltaX:M,deltaY:C}=(o=t.center,a=c.offsetDelta,l=c.prevDelta,u=c.prevInput,(t.eventType===r.Start||u?.eventType===r.End)&&(l=c.prevDelta={x:u?.deltaX||0,y:u?.deltaY||0},a=c.offsetDelta={x:o.x,y:o.y}),{deltaX:l.x+(o.x-a.x),deltaY:l.y+(o.y-a.y)});t.deltaX=M,t.deltaY=C,t.offsetDirection=y(t.deltaX,t.deltaY);let T=w(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=T.x,t.overallVelocityY=T.y,t.overallVelocity=Math.abs(T.x)>Math.abs(T.y)?T.x:T.y,t.scale=p?(i=p.pointers,v(h[0],h[1])/v(i[0],i[1])):1,t.rotation=p?(n=p.pointers,b(h[1],h[0])-b(n[1],n[0])):0,t.maxPointers=c.prevInput?t.pointers.length>c.prevInput.maxPointers?t.pointers.length:c.prevInput.maxPointers:t.pointers.length;let k=e.element;return function(e,t){let i=e;for(;i;){if(i===t)return!0;i=i.parentNode}return!1}(t.srcEvent.target,k)&&(k=t.srcEvent.target),t.target=k,!function(e,t){let i,n,s,o,a=e.lastInterval||t,l=t.timeStamp-a.timeStamp;if(t.eventType!==r.Cancel&&(l>25||void 0===a.velocity)){let r=t.deltaX-a.deltaX,u=t.deltaY-a.deltaY,c=w(l,r,u);n=c.x,s=c.y,i=Math.abs(c.x)>Math.abs(c.y)?c.x:c.y,o=y(r,u),e.lastInterval=t}else i=a.velocity,n=a.velocityX,s=a.velocityY,o=a.direction;t.velocity=i,t.velocityX=n,t.velocityY=s,t.direction=o}(c,t),t}(i,t),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(p(this.element),this.evWin,this.domHandler)}destroy(){f(this.element,this.evEl,this.domHandler),f(this.target,this.evTarget,this.domHandler),f(p(this.element),this.evWin,this.domHandler)}}let S={pointerdown:r.Start,pointermove:r.Move,pointerup:r.End,pointercancel:r.Cancel,pointerout:r.Cancel};class A extends P{constructor(e){super(e),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,i=!1,n=S[e.type],s=e.pointerType,o="touch"===s,a=t.findIndex(t=>t.pointerId===e.pointerId);n&r.Start&&(e.buttons||o)?a<0&&(t.push(e),a=t.length-1):n&(r.End|r.Cancel)&&(i=!0),!(a<0)&&(t[a]=e,this.callback(n,{pointers:t,changedPointers:[e],eventType:n,pointerType:s,srcEvent:e}),i&&t.splice(a,1))}}let M=["","webkit","Moz","MS","ms","o"],C={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class T{constructor(e,t){this.options={...C,...t,cssProps:{...C.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new A(this),this.touchAction=new c(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?2:1}recognize(e){let t,{session:i}=this;if(i.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let{recognizers:r}=this,{curRecognizer:n}=i;(!n||n&&n.state&s.Recognized)&&(n=i.curRecognizer=null);let o=0;for(;o<r.length;)t=r[o],2!==i.stopped&&(!n||t===n||t.canRecognizeWith(n))?t.recognize(e):t.reset(),!n&&t.state&(s.Began|s.Changed|s.Ended)&&(n=i.curRecognizer=t),o++}get(e){let{recognizers:t}=this;for(let i=0;i<t.length;i++)if(t[i].options.event===e)return t[i];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t="string"==typeof e?this.get(e):e;if(t){let{recognizers:e}=this,i=e.indexOf(t);-1!==i&&(e.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:i}=this;for(let r of h(e))i[r]=i[r]||[],i[r].push(t)}off(e,t){if(!e)return;let{handlers:i}=this;for(let r of h(e))t?i[r]&&i[r].splice(i[r].indexOf(t),1):delete i[r]}emit(e,t){let i=this.handlers[e]&&this.handlers[e].slice();if(!i||!i.length)return;t.type=e,t.preventDefault=function(){t.srcEvent.preventDefault()};let r=0;for(;r<i.length;)i[r](t),r++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[i,r]of Object.entries(this.options.cssProps)){let n=function(e,t){let i=t[0].toUpperCase()+t.slice(1);for(let r of M){let n=r?r+i:t;if(n in e)return n}}(t.style,i);e?(this.oldCssProps[n]=t.style[n],t.style[n]=r):t.style[n]=this.oldCssProps[n]||""}e||(this.oldCssProps={})}}}let k=1;function I(e){return e&s.Cancelled?"cancel":e&s.Ended?"end":e&s.Changed?"move":e&s.Began?"start":""}class O{constructor(e){this.options=e,this.id=k++,this.state=s.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:i}=this;return i[t.id]||(i[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}return(t="string"==typeof e?this.manager.get(e):e)&&delete this.simultaneous[t.id],this}requireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:i}=this;return -1===i.indexOf(t)&&(i.push(t),t.requireFailure(this)),this}dropRequireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}if(t="string"==typeof e?this.manager.get(e):e){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<s.Ended&&this.manager.emit(this.options.event+I(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=s.Ended&&this.manager.emit(this.options.event+I(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=s.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(s.Failed|s.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=s.Failed;return}this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible),this.state=this.process(t),this.state&(s.Began|s.Changed|s.Ended|s.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}}class R extends O{attrTest(e){let t=this.options.pointers;return 0===t||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>{var i,r;return i=e,(void 0===(r=t).distance||i.distance>=r.distance)&&(void 0===r.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(e=>e>=r.distancePerPointer))&&(void 0===r.movementDeltaTime||i.movementDeltaTime>=r.movementDeltaTime)&&(void 0===r.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=r.rotation)&&(void 0===r.scale||Math.abs(i.scale-1)>=r.scale)})}process(e){let{state:t}=this,{eventType:i}=e,n=t&(s.Began|s.Changed),o=this.attrTest(e);return n&&(i&r.Cancel||!o)?t|s.Cancelled:n||o?i&r.End?t|s.Ended:t&s.Began?t|s.Changed:s.Began:s.Failed}}let L=["","start","move","end","cancel"];class B extends O{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[u]}getEventNames(){return L.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length!==t.pointers?(this.reset(),s.Failed):e.eventType&r.Start?this._handleStart(e):e.eventType&r.Move?this._handleMove(e):e.eventType&r.Cancel?this._handleEnd(e,!0):e.eventType&r.End?this._handleEnd(e,!1):s.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===s.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===s.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,s.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,s.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return s.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?s.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?s.Changed:s.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:i,startCenter:r}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,s.Failed;let n=r.y-e.center.y;return e.scale=Math.pow(2,n/this.options.pixelsPerScale),t?s.Cancelled:s.Ended}return this._tapStart&&this._isSamePointer(e,this._tapStart.pointerId)?(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):t&&this.reset(),s.Failed}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&m(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return null===t||this._getPointerId(e)===t}}class j extends O{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[u]}process(e){let{options:t}=this,i=e.pointers.length===t.pointers,n=e.distance<t.threshold,o=e.deltaTime<t.time;if(this.reset(),e.eventType&r.Start&&0===this.count)return this.failTimeout();if(n&&o&&i){if(e.eventType!==r.End)return this.failTimeout();let i=!this.pTime||e.timeStamp-this.pTime<t.interval,n=!this.pCenter||m(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,n&&i?this.count+=1:this.count=1,this._input=e,0==this.count%t.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=s.Recognized,this.tryEmit(this._input)},t.interval),s.Began):s.Recognized}return s.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=s.Failed},this.options.interval),s.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===s.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}}class z extends R{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{"trackpad"===e.device&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...i}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:i}=e,r=t.deltaX??e.deltaX,n=t.deltaY??e.deltaY,s=y(r,n),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:n,angle:180*Math.atan2(n,r)/Math.PI,distance:Math.sqrt(r*r+n*n),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:s,offsetDirection:s,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let N=["","start","move","end","cancel","up","down","left","right"];class D extends z{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:n.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&n.Horizontal&&t.push("pan-y"),e&n.Vertical&&t.push("pan-x"),t}getEventNames(){return N.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,i=!0,{distance:r}=e,{direction:s}=e,o=e.deltaX,a=e.deltaY;return s&t.direction||(t.direction&n.Horizontal?(s=0===o?n.None:o<0?n.Left:n.Right,i=o!==this.pX,r=Math.abs(e.deltaX)):(s=0===a?n.None:a<0?n.Up:n.Down,i=a!==this.pY,r=Math.abs(e.deltaY))),e.direction=s,i&&r>t.threshold&&!!(s&t.direction)}attrTest(e){let t=!!(this.state&s.Began),i=!(this.options.coherent?.length&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(t||i&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=n[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}}let F=["","start","move","end","cancel","in","out"];class U extends z{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return F.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,i=!!(this.state&s.Began),n=!(t&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(i||n&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(1!==e.scale){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}}class V{constructor(e,t,i){this.element=e,this.callback=t,this.options=i}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}}let $=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class W extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&($&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=40)),e.shiftKey&&t&&(t*=.25),this.callback({type:"wheel",center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??"unknown",srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){"wheel"===e&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let G={classificationDelay:32,endDelay:80};class H{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{var t,i;let r,n;if(!this.hasSubscribers)return"unknown";let s=(t=e,i=this.pressedControlKeys.size>0,r=t.deltaX,n=t.deltaY,1===t.deltaMode&&(r*=40,n*=40),{event:t,timeStamp:t.timeStamp,deltaX:r,deltaY:n,isControlKeyDown:i}),o=this.session;if(o&&s.timeStamp-o.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";o=null}o?(this.scheduleEnd(),this.addSample(o,s)):(o=this.startPendingSession(s),this.scheduleEnd());let{device:a}=o;return"unknown"===a&&"unknown"!==(a=q(o.samples,!1))&&this.begin(o,a),a},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let e=this.session,t=q(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let e=this.session,t=q(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)}if(!this.session)return;let e=this.session;this.emit(r.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{"Control"===e.key&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{"Control"===e.key&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...G,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&"unknown"!==e.device&&this.emit(r.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,"unknown"!==e.device){let i=e.samples[e.samples.length-2],n=t.timeStamp-i.timeStamp;e.velocityX=n>0?t.deltaX/n:0,e.velocityY=n>0?t.deltaY/n:0,this.emit(r.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(r.Start,e.samples[0].event);let i=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=i>0?e.totalDeltaX/i:0,e.velocityY=i>0?e.totalDeltaY/i:0,this.emit(r.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,i){let n=this.session;if(!n||"unknown"===n.device)return;let s=e===r.Start,o=e===r.End||e===r.Cancel,a=s?n.firstTimeStamp:n.lastTimeStamp,l=s?0:Math.max(0,a-n.firstTimeStamp),u=s?0:n.totalDeltaX,c=s?0:n.totalDeltaY,h=l>0?u/l:0,d=l>0?c/l:0,f=s?0:i?.velocityX??n.velocityX,p=s?0:i?.velocityY??n.velocityY,g={eventType:e,device:n.device,srcEvent:t,timeStamp:a,center:{x:t.clientX,y:t.clientY},deltaX:u,deltaY:c,deltaTime:l,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(h)>Math.abs(d)?h:d,overallVelocityX:h,overallVelocityY:d,isFirst:s,isFinal:o};for(let{listener:e}of[...this.subscriptions.values()])e(g)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t="u">typeof window?window:globalThis.document?.defaultView;t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function q(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?"trackpad":e.some(({event:e})=>0!==e.deltaMode)||e.some(Y)||e.every(({event:e})=>{let t=e.wheelDelta;return void 0!==t&&Math.abs(t)%40==0})?"mouse":e.some(({deltaX:e})=>0!==e)||e.length>1&&function(e){for(let t=0;t<e.length;t++){let i=e[t];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||t>0&&i.timeStamp-e[t-1].timeStamp>40)return!1}return!0}(e)?"trackpad":t?"mouse":"unknown"}function Y({event:e,deltaX:t,deltaY:i}){if(0!==t||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let r=e.wheelDelta;return"number"==typeof r&&0!==r&&r%120==0}let Z=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class K extends V{constructor(e,t,i){super(e,t,{enable:!0,...i}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Z.forEach(e=>this.listen(e,!0))}destroy(){Z.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t))}}handleOverEvent(e){this.enableOverEvent&&"mouseover"===e.type&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&"mouseout"===e.type&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&"mouseenter"===e.type&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&"mouseleave"===e.type&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":0===e.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}}let X=["keydown","keyup"];class J extends V{constructor(e,t,i){super(e,t,{enable:!0,tabIndex:0,...i}),this.handleEvent=e=>{let t=e.target||e.srcElement;("INPUT"!==t.tagName||"text"!==t.type)&&"TEXTAREA"!==t.tagName&&(this.enableDownEvent&&"keydown"===e.type&&this.callback({type:"keydown",srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&"keyup"===e.type&&this.callback({type:"keyup",srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline="none",r&&X.forEach(e=>this.listen(e,!0))}destroy(){X.forEach(e=>this.listen(e,!1))}enableEventType(e,t){"keydown"===e&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),"keyup"===e&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}}class Q extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){"contextmenu"===e&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}}let ee={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},et={srcElement:"root",priority:0};class ei{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),i=e.srcEvent.target;for(;i&&i!==t.rootElement;){if(this._emit(t,i),t.handled)return;i=i.parentNode}this._emit(t,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,i,r=!1,n=!1){let{handlers:s,handlersByElement:o}=this,a={...et,...i},l=o.get(a.srcElement);l||(l=[],o.set(a.srcElement,l));let u={type:e,handler:t,srcElement:a.srcElement,priority:a.priority};r&&(u.once=!0),n&&(u.passive=!0),s.push(u),this._active=this._active||!u.passive;let c=l.length-1;for(;c>=0&&!(l[c].priority>=u.priority);)c--;l.splice(c+1,0,u)}remove(e,t){let{handlers:i,handlersByElement:r}=this;for(let n=i.length-1;n>=0;n--){let s=i[n];if(s.type===e&&s.handler===t){i.splice(n,1);let e=r.get(s.srcElement);e.splice(e.indexOf(s),1),0===e.length&&r.delete(s.srcElement)}}this._active=i.some(e=>!e.passive)}_emit(e,t){let i=this.handlersByElement.get(t);if(i){let t=!1,r=()=>{e.handled=!0},n=()=>{e.handled=!0,t=!0},s=[];for(let o=0;o<i.length;o++){let{type:a,handler:l,once:u}=i[o];if(l({...e,type:a,stopPropagation:r,stopImmediatePropagation:n}),u&&s.push(i[o]),t)break}for(let e=0;e<s.length;e++){let{type:t,handler:i}=s[e];this.remove(t,i)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...function(e){let t=ee[e.srcEvent.type];if(!t)return null;let{buttons:i,button:r}=e.srcEvent,n=!1,s=!1,o=!1;return 2===t?(n=!!(1&i),s=!!(4&i),o=!!(2&i)):(n=0===r,s=1===r,o=2===r),{leftButton:n,middleButton:s,rightButton:o}}(e),...function(e,t){let i=e.center;if(!i)return null;let r=t.getBoundingClientRect(),n=r.width/t.offsetWidth||1,s=r.height/t.offsetHeight||1,o={x:(i.x-r.left-t.clientLeft)/n,y:(i.y-r.top-t.clientTop)/s};return{center:i,offsetCenter:o}}(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}}class er{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new H(e),!e)return;for(let t of(this.manager=new T(e,this.options),this.options.recognizers)){let{recognizer:e,recognizeWith:i,requireFailure:r}=function(e){let t;if("recognizer"in e)return e;let i=Array.isArray(e)?[...e]:[e];return{recognizer:t="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(t);this.manager.add(e),i&&e.recognizeWith(i),r&&e.requireFailure(r)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new W(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new K(e,this._onOtherEvent,{enable:!1}),this.keyInput=new J(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new Q(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(e,t,i){this._addEventHandler(e,t,i,!1)}once(e,t,i){this._addEventHandler(e,t,i,!0)}watch(e,t,i){this._addEventHandler(e,t,i,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:i}=this;if(!i)return;let r=i.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,i,r,n){if("string"!=typeof e){for(let[s,o]of(i=t,Object.entries(e)))this._addEventHandler(s,o,i,r,n);return}let{manager:s,events:o}=this;if(!s)return;let a=o.get(e);!a&&(a=new ei(this,this._getRecognizerName(e)||e),o.set(e,a),s&&s.on(e,a.handleEvent)),a.add(e,t,i,r,n),a.isEmpty()||this._toggleRecognizer(a.recognizerName,!0)}_removeEventHandler(e,t){if("string"!=typeof e){for(let[t,i]of Object.entries(e))this._removeEventHandler(t,i);return}let{events:i}=this,r=i.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of i.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}}}}]);