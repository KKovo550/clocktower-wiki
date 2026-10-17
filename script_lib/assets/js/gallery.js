// 图片分组由 core.js 提供。详情区事件委托只注册一次，切换剧本不会累积监听器。
function previewOf(script,name){
  var manifest=window.ScriptImagePreviews,key=String(script[9]||'').replace(/\\/g,'/')+'/'+String(name);
  var entry=manifest&&manifest.entries&&Object.prototype.hasOwnProperty.call(manifest.entries,key)&&manifest.entries[key];
  return entry&&/^[a-f0-9]{24}\.webp$/.test(entry.file)?entry:null;
}
function imgURLOf(script, name) {
  if(window.WIKI_SHARE_NO_ARTWORK){var preview=previewOf(script,name);return preview?'assets/previews/'+preview.file:'';}
  return IMGBASE.replace(/\/$/, '')+'/'+String(script[9]||'').split(/[\\/]/).map(encodeURIComponent).join('/')+'/'+encodeURIComponent(name);
}
function shownCount(script) { return galleryPictures(script).primary.filter(function(p){return !!imgURLOf(script,p.file);}).length; }

function pictureCard(script, picture, index) {
  var url=esc(imgURLOf(script,picture.file));
  return '<figure class="shot '+picture.role+'">'+
    '<a class="shot-link" href="'+url+'" target="_blank" rel="noopener" title="'+(window.WIKI_SHARE_NO_ARTWORK?'查看预览图：':'查看原图：')+esc(picture.file)+'">'+
    '<img src="'+url+'" loading="'+(index===0?'eager':'lazy')+'" decoding="async" alt="'+
      esc(picture.label)+'">'+
    '<span class="shot-error" hidden>图片暂未加载成功，请重试。</span></a>'+
    '<figcaption>'+esc(picture.label)+'</figcaption>'+
    '<button type="button" class="btn shot-retry" hidden>重试加载</button></figure>';
}
function shots(script) {
  var pictures=galleryPictures(script);
  var primary=pictures.primary.filter(function(p){return !!imgURLOf(script,p.file);});
  var html='<section class="script-gallery" data-script="'+SCRIPTS.indexOf(script)+'"><div class="team-h">剧本图'+
    (primary.length?' · '+primary.length+' 张（点击放大）':'')+(primary.length&&!pictureCompleteness(script).complete?' · '+esc(pictureStateLabel(script)):'')+'</div>';
  if(primary.length){
    if(window.WIKI_SHARE_NO_ARTWORK)html+='<p class="hint">压缩预览图 · 点击可放大查看。</p>';
    html+='<div class="shots">'+primary.map(function(p,i){return pictureCard(script,p,i);}).join('')+'</div>';
  }else{
    var notice=script[12]&&script[12].pictureNotice||
      (window.WIKI_SHARE_NO_ARTWORK&&pictures.total?'该剧本的网页预览暂未提供，可继续查看角色或下载 JSON。':scriptPictures(script).total?'已有原图，正背面尚待确认，可在下方修正图片分类。':'该剧本暂无剧照');
    html+='<div class="hint">'+esc(notice)+'</div>';
  }
  return html+(typeof roleEditor==='function'?roleEditor(script):'')+'</section>';
}

(function() {
  var detail=document.getElementById('detail');
  function isPicture(img) {
    return img.tagName==='IMG' && img.closest('.script-gallery');
  }
  detail.addEventListener('error',function(event) {
    var img=event.target;
    if(!isPicture(img))return;
    var card=img.closest('.shot');
    img.hidden=true;
    card.querySelector('.shot-error').hidden=false;
    card.querySelector('.shot-retry').hidden=false;
  },true);
  detail.addEventListener('load',function(event) {
    var img=event.target;
    if(!isPicture(img))return;
    var card=img.closest('.shot');
    img.hidden=false;
    card.querySelector('.shot-error').hidden=true;
    card.querySelector('.shot-retry').hidden=true;
  },true);
  detail.addEventListener('click',function(event) {
    var retry=event.target.closest('.shot-retry');
    if(!retry)return;
    var card=retry.closest('.shot'),img=card.querySelector('img');
    // 重建请求，不附加查询参数，以兼容 file:// 和含特殊字符的文件名。
    var source=img.getAttribute('src');
    img.removeAttribute('src');
    img.setAttribute('src',source);
  });
})();
