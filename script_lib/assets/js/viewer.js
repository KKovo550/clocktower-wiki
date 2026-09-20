// 原生 dialog 负责模态焦点约束与 Escape；关闭后恢复缩略图焦点。
(function() {
  var dialog=document.getElementById('pictureViewer');
  var stage=document.getElementById('pictureStage');
  var image=document.getElementById('pictureLarge');
  var status=document.getElementById('pictureStatus');
  var pictures=[],position=0,zoom=1,opener=null,oldOverflow='';
  function size() {
    if(!image.naturalWidth)return;
    var fit=Math.min((stage.clientWidth-24)/image.naturalWidth,
      (stage.clientHeight-24)/image.naturalHeight,1);
    image.style.width=Math.max(1,image.naturalWidth*fit*zoom)+'px';
    document.getElementById('pictureFit').textContent='适应窗口 · '+Math.round(zoom*100)+'%';
  }
  function display() {
    var picture=pictures[position];
    zoom=1; image.hidden=true; image.style.width='';
    stage.scrollTop=0;stage.scrollLeft=0;
    document.getElementById('pictureTitle').textContent=(position+1)+' / '+pictures.length+' · '+picture.label;
    document.getElementById('pictureOriginal').href=picture.url;
    document.getElementById('picturePrev').disabled=pictures.length<2;
    document.getElementById('pictureNext').disabled=pictures.length<2;
    status.textContent='正在加载图片…';
    image.alt=picture.label;
    image.src=picture.url;
  }
  function move(delta){position=(position+delta+pictures.length)%pictures.length;display();}
  function scale(factor){zoom=Math.max(1,Math.min(6,zoom*factor));size();}
  image.addEventListener('load',function(){image.hidden=false;status.textContent='← → 切换 · ＋ − 缩放 · Esc 关闭；放大后可滚动查看。';size();});
  image.addEventListener('error',function(){image.hidden=true;status.textContent='图片加载失败，请检查剧照库，或点击「打开原图」。';});
  document.getElementById('detail').addEventListener('click',function(event){
    var link=event.target.closest('.shot-link');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button>0)return;
    if(typeof dialog.showModal!=='function')return; // 旧浏览器保留原图链接。
    var gallery=link.closest('.script-gallery');
    var script=SCRIPTS[Number(gallery.getAttribute('data-script'))];
    if(!script)return;
    var groups=scriptPictures(script);
    pictures=groups.primary.concat(groups.remaining).map(function(p){return {url:imgURLOf(script,p.file),label:p.label};});
    position=pictures.findIndex(function(p){return p.url===link.getAttribute('href');});
    if(position<0)return;
    event.preventDefault();opener=link;
    oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.showModal();display();
  });
  document.getElementById('picturePrev').onclick=function(){move(-1);};
  document.getElementById('pictureNext').onclick=function(){move(1);};
  document.getElementById('pictureZoomIn').onclick=function(){scale(1.5);};
  document.getElementById('pictureZoomOut').onclick=function(){scale(1/1.5);};
  document.getElementById('pictureFit').onclick=function(){zoom=1;size();stage.scrollTop=0;stage.scrollLeft=0;};
  document.getElementById('pictureClose').onclick=function(){dialog.close();};
  dialog.addEventListener('close',function(){document.body.style.overflow=oldOverflow;image.removeAttribute('src');if(opener&&opener.isConnected)opener.focus();});
  dialog.addEventListener('keydown',function(event){
    event.stopPropagation();
    if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
    if(event.key==='ArrowRight'){event.preventDefault();move(1);}
    if(event.key==='+'||event.key==='='){event.preventDefault();scale(1.5);}
    if(event.key==='-'){event.preventDefault();scale(1/1.5);}
  });
  window.addEventListener('resize',function(){if(dialog.open)size();});
})();
