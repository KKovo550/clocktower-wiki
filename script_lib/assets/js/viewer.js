// One scroll surface for mouse, touch and keyboard; each image keeps its own reading position.
(function() {
  var dialog=document.getElementById('pictureViewer'),stage=document.getElementById('pictureStage');
  var image=document.getElementById('pictureLarge'),status=document.getElementById('pictureStatus');
  var pictures=[],position=0,zoom=1,opener=null,oldOverflow='',ready=false;
  var views=new Map(),pointers=new Map(),gesture=null,prefetch=null;
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function bounds(){return image.getBoundingClientRect();}
  function viewport(){var box=stage.getBoundingClientRect();return {x:box.left+stage.clientLeft,y:box.top+stage.clientTop};}
  function middle(){var box=viewport();return {x:box.x+stage.clientWidth/2,y:box.y+stage.clientHeight/2};}
  function pointAt(point){var box=bounds();return {x:(point.x-box.left)/box.width,y:(point.y-box.top)/box.height};}
  function place(anchor,point){
    var box=bounds();stage.scrollLeft+=box.left+anchor.x*box.width-point.x;stage.scrollTop+=box.top+anchor.y*box.height-point.y;
  }
  function size(){
    if(!image.naturalWidth)return;
    var fit=Math.min(Math.max(1,stage.clientWidth-24)/image.naturalWidth,Math.max(1,stage.clientHeight-24)/image.naturalHeight,1);
    image.style.width=Math.max(1,image.naturalWidth*fit*zoom)+'px';
    document.getElementById('pictureFit').textContent='适应窗口 · '+Math.round(zoom*100)+'%';
    stage.classList.toggle('is-zoomed',zoom>1);
    document.getElementById('pictureZoomOut').disabled=zoom<=1;
    document.getElementById('pictureZoomIn').disabled=zoom>=6;
  }
  function remember(){
    if(!ready||!pictures[position])return;
    var url=pictures[position].url;views.delete(url);views.set(url,{zoom:zoom,center:pointAt(middle())});
    if(views.size>64)views.delete(views.keys().next().value);
  }
  function releasePointers(){
    pointers.forEach(function(p,id){if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);});
    pointers.clear();gesture=null;stage.classList.remove('is-dragging');
  }
  function preloadNext(){
    prefetch=null;if(pictures.length<2)return;
    // Only the adjacent picture, never the whole script library.
    prefetch=new Image();prefetch.decoding='async';prefetch.src=pictures[(position+1)%pictures.length].url;
  }
  function display(){
    ready=false;releasePointers();var picture=pictures[position],saved=views.get(picture.url);
    zoom=saved?saved.zoom:1;image.hidden=true;image.style.width='';stage.scrollTop=0;stage.scrollLeft=0;
    document.getElementById('pictureTitle').textContent=(position+1)+' / '+pictures.length+' · '+picture.label;
    document.getElementById('pictureOriginal').href=picture.url;
    document.getElementById('pictureOriginal').textContent=window.WIKI_SHARE_NO_ARTWORK?'打开预览图':'打开原图';
    document.getElementById('picturePrev').disabled=pictures.length<2;
    document.getElementById('pictureNext').disabled=pictures.length<2;
    status.textContent='正在加载图片…';image.alt=picture.label;image.src=picture.url;
    if(image.complete&&image.naturalWidth)loaded();
  }
  function loaded(){
    if(!dialog.open||!image.naturalWidth||ready)return;
    image.hidden=false;ready=true;size();
    var saved=views.get(pictures[position].url);if(saved)place(saved.center,middle());
    status.textContent='拖动查看 · 双击放大 / 还原 · 双指缩放 · ← → 切换 · Esc 关闭';
    preloadNext();
  }
  function move(delta){if(!pictures.length)return;remember();position=(position+delta+pictures.length)%pictures.length;display();}
  function scaleTo(value,point,anchor){
    if(!ready)return;point=point||middle();anchor=anchor||pointAt(point);
    zoom=clamp(value,1,6);size();place(anchor,point);remember();
  }
  function fit(){if(!ready)return;zoom=1;size();stage.scrollTop=0;stage.scrollLeft=0;remember();}
  image.addEventListener('load',loaded);
  image.addEventListener('error',function(){ready=false;image.hidden=true;status.textContent='图片加载失败，请重新打开图片，或点击「'+(window.WIKI_SHARE_NO_ARTWORK?'打开预览图':'打开原图')+'」。';});
  image.draggable=false;
  stage.addEventListener('dblclick',function(event){
    if(!ready||event.button>0)return;event.preventDefault();
    if(zoom>1)fit();else scaleTo(2.5,{x:event.clientX,y:event.clientY});
  });
  function startGesture(){
    var points=Array.from(pointers.values());
    if(points.length>=2){var a=points[0],b=points[1],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      gesture={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:zoom,anchor:pointAt(center)};
    }else gesture=null;
  }
  stage.addEventListener('pointerdown',function(event){
    if(!ready||event.button>0)return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');startGesture();
  });
  stage.addEventListener('pointermove',function(event){
    if(!pointers.has(event.pointerId))return;event.preventDefault();
    var previous=pointers.get(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size>=2&&gesture){var points=Array.from(pointers.values()),a=points[0],b=points[1];
      scaleTo(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},gesture.anchor);
    }else{stage.scrollLeft-=event.clientX-previous.x;stage.scrollTop-=event.clientY-previous.y;}
  });
  function endPointer(event){
    if(!pointers.has(event.pointerId))return;pointers.delete(event.pointerId);
    if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
    if(!pointers.size)stage.classList.remove('is-dragging');startGesture();remember();
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(name){stage.addEventListener(name,endPointer);});
  stage.addEventListener('scroll',remember,{passive:true});
  document.getElementById('detail').addEventListener('click',function(event){
    var link=event.target.closest('.shot-link');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button>0||typeof dialog.showModal!=='function')return;
    var gallery=link.closest('.script-gallery'),script=SCRIPTS[Number(gallery.getAttribute('data-script'))];if(!script)return;
    var groups=galleryPictures(script);
    pictures=groups.primary.concat(groups.remaining).map(function(p){return {url:imgURLOf(script,p.file),label:p.label};}).filter(function(p){return !!p.url;});
    position=pictures.findIndex(function(p){return p.url===link.getAttribute('href');});if(position<0)return;
    event.preventDefault();opener=link;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();display();
  });
  document.getElementById('picturePrev').onclick=function(){move(-1);};
  document.getElementById('pictureNext').onclick=function(){move(1);};
  document.getElementById('pictureZoomIn').onclick=function(){scaleTo(zoom*1.5);};
  document.getElementById('pictureZoomOut').onclick=function(){scaleTo(zoom/1.5);};
  document.getElementById('pictureFit').onclick=fit;
  document.getElementById('pictureClose').onclick=function(){dialog.close();};
  dialog.addEventListener('close',function(){remember();ready=false;releasePointers();prefetch=null;document.body.style.overflow=oldOverflow;image.removeAttribute('src');if(opener&&opener.isConnected)opener.focus();});
  dialog.addEventListener('keydown',function(event){
    event.stopPropagation();
    if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
    if(event.key==='ArrowRight'){event.preventDefault();move(1);}
    if(event.key==='+'||event.key==='='){event.preventDefault();scaleTo(zoom*1.5);}
    if(event.key==='-'){event.preventDefault();scaleTo(zoom/1.5);}
  });
  window.addEventListener('resize',function(){if(dialog.open&&ready){var saved=views.get(pictures[position].url);size();if(saved)place(saved.center,middle());}});
})();

