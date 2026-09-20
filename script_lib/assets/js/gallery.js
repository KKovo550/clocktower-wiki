// 图片分组由 core.js 提供。详情区事件委托只注册一次，切换剧本不会累积监听器。
function imgURLOf(script, name) {
  return IMGBASE.replace(/\/$/, '')+'/'+String(script[9]||'').split(/[\\/]/).map(encodeURIComponent).join('/')+'/'+encodeURIComponent(name);
}
function shownCount(script) { return scriptPictures(script).total; }

function pictureCard(script, picture, index) {
  var url=esc(imgURLOf(script,picture.file));
  return '<figure class="shot '+picture.role+'">'+
    '<a class="shot-link" href="'+url+'" target="_blank" rel="noopener" title="查看原图：'+esc(picture.file)+'">'+
    '<img src="'+url+'" loading="'+(index===0?'eager':'lazy')+'" decoding="async" alt="'+
      esc(picture.label)+'">'+
    '<span class="shot-error" hidden>图片未能加载，请检查剧照库是否可访问。</span></a>'+
    '<figcaption>'+esc(picture.label)+'</figcaption>'+
    '<button type="button" class="btn shot-retry" hidden>重试加载</button></figure>';
}
function shots(script) {
  if(window.WIKI_SHARE_NO_ARTWORK)return '<div class="hint">此分享版不含剧本图片，可继续查看角色或下载 JSON。</div>';
  var pictures=scriptPictures(script);
  if(!pictures.total) return '<div class="team-h">剧本图</div><div class="hint">该剧本暂无剧照</div>';
  var initial=pictures.primary.length?pictures.primary:pictures.remaining.slice(0,3);
  var extra=pictures.primary.length?pictures.remaining:pictures.remaining.slice(3);
  var html='<section class="script-gallery" data-script="'+SCRIPTS.indexOf(script)+'"><div class="team-h">剧本图 · '+pictures.total+
    ' 张（点击放大）</div><div class="shots">'+
    initial.map(function(p,i){return pictureCard(script,p,i);}).join('')+'</div>';
  if(extra.length) {
    // 展开时才创建 img，避免隐藏区域也发起大量图片请求。
    html+='<details class="more-shots"><summary>查看其余 '+extra.length+' 张图片</summary>'+
      '<template>'+extra.map(function(p){return pictureCard(script,p,1);}).join('')+'</template>'+
      '<div class="shots"></div></details>';
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
  detail.addEventListener('toggle',function(event) {
    var details=event.target;
    if(!details.matches('.more-shots') || !details.open)return;
    var template=details.querySelector('template');
    if(!template)return;
    details.querySelector('.shots').appendChild(template.content.cloneNode(true));
    template.remove();
  },true);
})();
