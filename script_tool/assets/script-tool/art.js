(function(){
  'use strict';
  var dialog,roles=[],icons={},plan,currentSvg='',previewUrl='',timer,revision=0,background='',backgroundRevision=0,iconPromise;
  var measureCanvas=document.createElement('canvas'),measureContext=measureCanvas.getContext('2d');
  function measure(value,size){measureContext.font=size+'px system-ui, "Microsoft YaHei", sans-serif';return measureContext.measureText(value).width;}
  function el(id){return document.getElementById(id);}
  function message(value){el('artStatus').textContent=value;}
  function enabled(value){el('artPng').disabled=!value;el('artSvg').disabled=!value;}
  function loadIcons(){
    if(window.SCRIPT_ART_ICONS)return Promise.resolve(window.SCRIPT_ART_ICONS);
    if(iconPromise)return iconPromise;
    iconPromise=new Promise(function(resolve,reject){
      var script=document.createElement('script'),timeout=setTimeout(function(){script.remove();iconPromise=null;reject(new Error('角色图标加载超时，请关闭后重试。'));},15000);
      script.src='assets/script-tool/art-icons.js';
      script.onload=function(){clearTimeout(timeout);if(window.SCRIPT_ART_ICONS)resolve(window.SCRIPT_ART_ICONS);else{iconPromise=null;reject(new Error('图标资源不可用。'));}};
      script.onerror=function(){clearTimeout(timeout);script.remove();iconPromise=null;reject(new Error('角色图标加载失败，请关闭后重试。'));};
      document.head.appendChild(script);
    });return iconPromise;
  }
  function readImage(file){
    return new Promise(function(resolve,reject){
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024){reject(new Error('请选择 12 MB 以内的 PNG、JPG 或 WebP 图片。'));return;}
      var url=URL.createObjectURL(file),image=new Image();
      image.onload=function(){
        try{
          var ratio=Math.min(1,2000/image.width,2000/image.height),canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
          canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/png'));
        }catch(error){reject(new Error('图片无法处理，请选择较小的图片。'));}finally{URL.revokeObjectURL(url);}
      };
      image.onerror=function(){URL.revokeObjectURL(url);reject(new Error('图片损坏或格式不受支持。'));};image.src=url;
    });
  }
  function options(){return {columns:el('artColumns').value,font:el('artFont').value,theme:el('artTheme').value,title:el('artTitle').value,author:el('artAuthor').value,subtitle:el('artSubtitle').value,total:roles.length,background:background};}
  function showPage(){
    var index=Number(el('artPage').value)||0;
    currentSvg=ScriptArt.svg(plan,index,options(),icons,measure);
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=URL.createObjectURL(new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}));
    el('artPreview').src=previewUrl;enabled(true);
  }
  function render(){
    if(!dialog.open)return;
    try{
      plan=ScriptArt.layout(roles,options(),measure);
      var previous=Number(el('artPage').value)||0;
      el('artPage').innerHTML=plan.pages.map(function(_,i){return '<option value="'+i+'">第 '+(i+1)+' / '+plan.pages.length+' 页</option>';}).join('');
      el('artPage').value=String(Math.min(previous,plan.pages.length-1));showPage();
      var missing=roles.filter(function(role){return !icons[role.im]&&!icons[role.id];}).length;
      message('已生成 '+plan.pages.length+' 页，下载当前预览页。'+(missing?' '+missing+' 个图标不可用，已使用文字占位。':''));
    }catch(error){currentSvg='';enabled(false);message(error.message);}
  }
  function queue(){currentSvg='';enabled(false);clearTimeout(timer);timer=setTimeout(render,160);}
  function saveBlob(blob,extension){
    var name=(el('artTitle').value.trim()||'剧本').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80);
    var a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=name+'-第'+(Number(el('artPage').value)+1)+'页.'+extension;
    document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(url);},30000);
  }
  async function downloadPng(){
    if(!currentSvg)return;
    var svg=currentSvg,scale=Number(el('artScale').value),session=revision;
    enabled(false);message('正在导出 PNG…');
    var url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    try{
      var image=new Image();await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error('图片渲染失败，可尝试下载 SVG。'));};image.src=url;});
      var canvas=document.createElement('canvas');canvas.width=1280*scale;canvas.height=1800*scale;
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});
      if(!blob)throw new Error('设备无法生成高清图片，请选择标准清晰度后重试。');
      if(session!==revision||!dialog.open||svg!==currentSvg)return;
      saveBlob(blob,'png');message('PNG 已生成；如手机未自动保存，请使用浏览器的下载列表。');
    }catch(error){if(session===revision&&dialog.open)message(error.message||'PNG 导出失败，可尝试 SVG。');}
    finally{URL.revokeObjectURL(url);if(session===revision&&dialog.open)enabled(!!currentSvg);}
  }
  function createDialog(){
    dialog=document.createElement('dialog');dialog.id='artDialog';dialog.setAttribute('aria-labelledby','artHeading');
    dialog.innerHTML='<div class="art-header"><div><p class="art-eyebrow">SCRIPT STUDIO</p><h2 id="artHeading">剧本制图</h2><p>把当前剧本排成一张可分享的角色说明图。</p></div><button type="button" id="artClose" class="btn">关闭</button></div>'+
      '<div class="art-workspace"><section class="art-controls" aria-label="制图设置">'+
      '<label>剧本标题<input id="artTitle" maxlength="100"></label><label>作者<input id="artAuthor" maxlength="48"></label><label>副标题 / 备注<input id="artSubtitle" maxlength="65" placeholder="例如：适合 9–12 人 · 第三版"></label>'+
      '<div class="art-pair"><label>分栏<select id="artColumns"><option value="1">单列</option><option value="2" selected>双列</option><option value="3">三列</option></select></label><label>配色<select id="artTheme"><option value="cloud">云白</option><option value="paper">暖纸</option><option value="night">深夜</option></select></label></div>'+
      '<label>说明字号<select id="artFont"><option value="20">紧凑</option><option value="24" selected>标准</option><option value="28">大字</option></select></label>'+
      '<label>自选背景<input type="file" id="artBackground" accept="image/png,image/jpeg,image/webp"></label><button type="button" class="btn" id="artRemoveBg">移除背景</button>'+
      '<p class="art-note">图片只在本机处理。角色按类型分组，保留组内顺序；说明过长会自动续页。缺失或远程自定义图标使用文字占位。</p>'+
      '<label>当前页面<select id="artPage"></select></label><label>PNG 清晰度<select id="artScale"><option value="1">标准 · 1280 × 1800</option><option value="2" selected>高清 · 2560 × 3600</option></select></label>'+
      '<div class="art-downloads"><button type="button" class="btn pri" id="artPng" disabled>下载 PNG</button><button type="button" class="btn" id="artSvg" disabled>下载 SVG</button></div><p id="artStatus" role="status" aria-live="polite"></p></section>'+
      '<section class="art-canvas" aria-label="剧本图片预览"><img id="artPreview" alt="当前页剧本图片预览"></section></div>';
    document.body.appendChild(dialog);
    el('artPreview').onerror=function(){enabled(false);message('预览图片未能显示，请调整设置后重试。');};
    el('artClose').onclick=function(){dialog.close();};
    dialog.addEventListener('close',function(){revision++;clearTimeout(timer);enabled(false);if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}el('artPreview').removeAttribute('src');});
    ['artTitle','artAuthor','artSubtitle','artColumns','artTheme','artFont'].forEach(function(id){el(id).addEventListener('input',queue);});
    el('artPage').onchange=function(){clearTimeout(timer);render();};
    el('artRemoveBg').onclick=function(){backgroundRevision++;background='';el('artBackground').value='';render();};
    el('artBackground').onchange=async function(){
      var file=this.files[0],session=revision,bg=++backgroundRevision;if(!file)return;enabled(false);message('正在处理背景…');
      try{var result=await readImage(file);if(session===revision&&bg===backgroundRevision&&dialog.open){background=result;render();}}
      catch(error){if(session===revision&&bg===backgroundRevision&&dialog.open){message(error.message);enabled(!!currentSvg);}}
    };
    el('artPng').onclick=downloadPng;
    el('artSvg').onclick=function(){if(currentSvg)saveBlob(new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}),'svg');};
  }
  document.getElementById('bArt').onclick=async function(){
    if(!sel.length){alert('请先在剧本工具中添加角色，或导入剧本 JSON。');return;}
    if(!dialog)createDialog();
    roles=sel.map(function(role){return Object.assign({},role);});
    el('artTitle').value=el('mname').value||'未命名剧本';el('artAuthor').value=el('mauthor').value;
    var session=++revision;dialog.showModal();enabled(false);message('正在准备角色图标…');
    try{icons=Object.assign({},await loadIcons());}
    catch(error){if(session!==revision||!dialog.open)return;icons={};message(error.message+' 将使用文字占位。');}
    if(session!==revision||!dialog.open)return;
    roles.forEach(function(role){var image=role.im||role.iu;if(/^data:image\/(png|jpeg|webp);base64,/.test(image||''))icons[role.id]=image;});
    render();
  };
})();
