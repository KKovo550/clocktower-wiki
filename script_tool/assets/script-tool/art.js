(function(){
  'use strict';
  var dialog,roles=[],icons={},plan,currentSvg='',previewUrl='',timer,revision=0,background='',backgroundRevision=0,iconPromise,decorationPromise,decorationReady=false;
  var savedBlob,savedURL='',savedName='';
  var logo=null,logoRevision=0,logoJob=null;
  var customJinx=[],jinxEditing=-1,jinxStorageKey='';
  var measureCanvas=document.createElement('canvas'),measureContext=measureCanvas.getContext('2d');
  function measure(value,size,kind){var typography=window.ScriptArtPresets.bodyTypography;var family=kind==='name'?typography.roleNameFamily:kind==='body'?typography.bodyFamily:'system-ui, "Microsoft YaHei", sans-serif';measureContext.font=size+'px '+family;return measureContext.measureText(value).width;}
  var bodyFontPromise;
  function loadBodyFonts(){
    if(!window.FontFace||!document.fonts)return Promise.resolve();
    if(window.ScriptArtFonts)return window.ScriptArtFonts.load();
    if(bodyFontPromise)return bodyFontPromise;
    bodyFontPromise=new Promise(function(resolve,reject){
      var script=document.createElement('script'),timeout=setTimeout(function(){script.remove();bodyFontPromise=null;reject(new Error('制图字体加载超时，请关闭后重试。'));},15000);
      script.src='assets/script-tool/art-fonts.js';
      script.onload=function(){clearTimeout(timeout);if(window.ScriptArtFonts)resolve(window.ScriptArtFonts.load());else{bodyFontPromise=null;reject(new Error('制图字体不可用。'));}};
      script.onerror=function(){clearTimeout(timeout);bodyFontPromise=null;script.remove();reject(new Error('制图字体加载失败，请关闭后重试。'));};
      document.head.appendChild(script);
    });return bodyFontPromise;
  }
  function el(id){return document.getElementById(id);}
  function artworkSource(role){
    var sources=['yuque','odyssey','stars','official'],explicit=role.source||(role.raw&&role.raw.source);
    if(sources.indexOf(explicit)>=0)return explicit;
    var catalog=typeof CHARS==='undefined'?[]:CHARS;
    var exact=catalog.filter(function(c){return ScriptCore.identity(c.id)===ScriptCore.identity(role.id);});
    if(exact.length===1)return exact[0].source||'';
    var same=catalog.filter(function(c){return c.n===role.n&&c.t===role.t;});
    var urls=[role.im,role.iu].concat(role.images||[]).filter(Boolean);
    var byImage=same.filter(function(c){return [c.im,c.iu].concat(c.images||[]).some(function(url){return url&&urls.indexOf(url)>=0;});});
    if(byImage.length===1)return byImage[0].source||'';
    var ability=String(role.ab||'').replace(/\s/g,'');
    var byAbility=ability?same.filter(function(c){return String(c.ab||'').replace(/\s/g,'')===ability;}):[];
    return byAbility.length===1?byAbility[0].source||'':'';
  }
  function message(value){el('artStatus').textContent=value;var state=el('artPreviewState');if(state&&!state.hidden&&state.dataset.state==='loading')el('artPreviewMessage').textContent=value;}
  function previewState(value,error){var state=el('artPreviewState');state.hidden=false;state.dataset.state=error?'error':'loading';el('artPreviewHeading').textContent=error?'暂时无法生成预览':'正在生成预览';el('artPreviewMessage').textContent=value;el('artReviewLayout').hidden=!error;}
  function enabled(value){el('artPng').disabled=!value;el('artSvg').disabled=!value;if(el('artSave'))el('artSave').disabled=!value;if(el('artQuickSave'))el('artQuickSave').disabled=!value;}
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
  function loadDecorations(){
    if(window.SCRIPT_ART_DECORATIONS)return Promise.resolve(window.SCRIPT_ART_DECORATIONS);
    if(decorationPromise)return decorationPromise;
    decorationPromise=new Promise(function(resolve,reject){
      var script=document.createElement('script'),timeout=setTimeout(function(){decorationPromise=null;script.remove();reject(new Error('装饰资源加载超时。'));},15000);
      script.src='assets/script-tool/art-decorations.js';
      script.onload=function(){clearTimeout(timeout);resolve(window.SCRIPT_ART_DECORATIONS||[]);};
      script.onerror=function(){clearTimeout(timeout);decorationPromise=null;script.remove();reject(new Error('装饰资源加载失败。'));};
      document.head.appendChild(script);
    });return decorationPromise;
  }
  function decorationOptions(){
    var defaults=window.ScriptArtPresets.presets[window.ScriptArtPresets.defaultPreset].fields;
    [['artBackdrop','backgrounds'],['artPattern','patterns'],['artOrnament','ornaments'],['artFrame','nightThemes'],['artFooter','footers']].forEach(function(pair){
      var select=el(pair[0]),previous=select.value;select.innerHTML=pair[0]==='artFrame'?'<option value="paper">柔和纸色（无纹理）</option><option value="charcoal">深灰（无纹理）</option><option value="midnight">靛蓝（无纹理）</option>':'<option value="">无</option>';
      if(pair[0]==='artFrame')select.insertAdjacentHTML('beforeend','<option value="vintage-red">复古酒红 · 一体夜序边框</option>');
      if(pair[0]==='artFooter')select.insertAdjacentHTML('beforeend','<option value="print-note">印刷说明栏 · 可能 / 中毒 / 醉酒</option>');
      (window.SCRIPT_ART_DECORATIONS||[]).filter(function(item){return item.group===pair[1];}).forEach(function(item){var option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.appendChild(option);});
      var value=decorationReady?previous:defaults[pair[0]];
      select.value=Array.from(select.options).some(function(option){return option.value===value;})?value:pair[0]==='artBackdrop'&&select.options.length>1?select.options[1].value:pair[0]==='artFrame'?'paper':'';
    });decorationReady=true;
  }
  function readImage(file,forLogo,trimLogo){
    return new Promise(function(resolve,reject){
      var limit=forLogo?8:12;
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>limit*1024*1024){reject(new Error('请选择 '+limit+' MB 以内的 PNG、JPG 或 WebP 图片。'));return;}
      var url=URL.createObjectURL(file),image=new Image();
      image.onload=function(){
        try{
          if(forLogo&&(!image.width||!image.height||image.width*image.height>16000000))throw new Error('Logo 图片过大，请缩小到 1600 万像素以内。');
          var bounds={x:0,y:0,width:image.width,height:image.height};
          if(trimLogo){
            var source=document.createElement('canvas');source.width=image.width;source.height=image.height;
            try{var sourceContext=source.getContext('2d');sourceContext.drawImage(image,0,0);bounds=window.ScriptLogoAI.crop(sourceContext,image.width,image.height);}finally{source.width=0;source.height=0;}
          }
          var ratio=Math.min(1,(forLogo?1600:2000)/bounds.width,(forLogo?600:2000)/bounds.height),canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));
          if(trimLogo)canvas.getContext('2d').drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height,0,0,canvas.width,canvas.height);else canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
          var data=canvas.toDataURL('image/png');resolve(forLogo?{image:data,aspect:canvas.width/canvas.height}:data);
        }catch(error){reject(new Error(trimLogo?error.message:'图片无法处理，请选择较小的图片。'));}finally{URL.revokeObjectURL(url);}
      };
      image.onerror=function(){URL.revokeObjectURL(url);reject(new Error('图片损坏或格式不受支持。'));};image.src=url;
    });
  }
  var remoteIconCache=new Map();
  function embedIcon(url){
    if(remoteIconCache.has(url))return Promise.resolve(remoteIconCache.get(url));
    return new Promise(function(resolve,reject){
      var image=new Image(),done=false;
      var timeout=setTimeout(function(){finish(new Error('图标加载超时'));},10000);
      function finish(error,value){if(done)return;done=true;clearTimeout(timeout);image.onload=image.onerror=null;if(error)reject(error);else resolve(value);}
      image.crossOrigin='anonymous';
      image.onload=function(){try{
        var width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
        if(!width||!height)throw new Error('图标尺寸无效');
        var scale=Math.min(1,256/width,256/height),canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        var data=canvas.toDataURL('image/png');
        if(remoteIconCache.size>=256)remoteIconCache.delete(remoteIconCache.keys().next().value);
        remoteIconCache.set(url,data);finish(null,data);
      }catch(error){finish(error);}};
      image.onerror=function(){finish(new Error('图标链接不可访问或不允许跨域导出'));};image.src=url;
    });
  }
  async function prepareImportedIcons(session){
    var catalog=new Map();
    (typeof CHARS==='undefined'?[]:CHARS).forEach(function(role){var icon=icons[role.im]||icons[role.id];if(!icon)return;[role.iu].concat(role.images||[]).forEach(function(url){if(url)catalog.set(url,icon);});});
    var queue=roles.slice(),completed=0,total=roles.length;
    async function worker(){while(queue.length&&session===revision&&dialog.open){
      var role=queue.shift();
      var local=ScriptCore.catalogIcon(role,typeof CHARS==='undefined'?[]:CHARS,icons);
      if(local)icons[role.id]=local;
      if(!icons[role.im]&&!icons[role.id]){
        var urls=Array.from(new Set([role.im,role.iu].concat(role.images||[]).filter(Boolean)));
        for(var i=0;i<urls.length;i++){
          if(session!==revision||!dialog.open)return;
          try{var url=urls[i],data=catalog.get(url);
            if(!data&&/^data:image\/(png|jpeg|webp);base64,/.test(url))data=url;
            if(!data&&/^(https?:\/\/|data:image\/gif;base64,)/i.test(url)){
              try{data=await embedIcon(url);}
              catch(error){
                var proxy=window.SCRIPT_ICON_PROXY;
                if(!proxy||!/^https:\/\//i.test(proxy)||!/^https:\/\//i.test(url))throw error;
                data=await embedIcon(proxy+'?url='+encodeURIComponent(url));
                if(remoteIconCache.size>=256)remoteIconCache.delete(remoteIconCache.keys().next().value);
                remoteIconCache.set(url,data);
              }
            }
            if(session!==revision||!dialog.open)return;
            if(data){icons[role.id]=data;break;}
          }catch(error){/* Try the next image in the imported array. */}
        }
      }
      completed++;message('正在准备角色图标… '+completed+'/'+total);
    }}
    await Promise.all(Array.from({length:Math.min(4,total)},worker));
  }
  function persistJinx(){
    try{localStorage.setItem(jinxStorageKey,JSON.stringify(customJinx));el('artJinxMessage').textContent='已保存到此浏览器，并应用于图片。';}
    catch(error){el('artJinxMessage').textContent='图片已更新，但浏览器保存失败；关闭页面前请下载图片。';}
  }
  function clearJinxEditor(){jinxEditing=-1;el('artJinxText').value='';el('artJinxAdd').textContent='添加相克规则';}
  function listJinx(){
    var box=el('artCustomJinxList');box.replaceChildren();
    customJinx.forEach(function(rule,index){
      var item=document.createElement('div'),text=document.createElement('p');
      text.textContent=rule.roleIds.map(function(id){return roles.find(function(r){return r.id===id;}).n;}).join(' × ')+'：'+rule.ability;item.appendChild(text);
      ['修改','删除'].forEach(function(label){var button=document.createElement('button');button.type='button';button.className='btn';button.textContent=label;
        button.onclick=function(){
          if(label==='修改'){jinxEditing=index;el('artJinxRoleA').value=rule.roleIds[0];el('artJinxRoleB').value=rule.roleIds[1];el('artJinxText').value=rule.ability;el('artJinxAdd').textContent='保存修改';el('artJinxText').focus();}
          else{customJinx.splice(index,1);clearJinxEditor();persistJinx();listJinx();render();}
        };item.appendChild(button);
      });box.appendChild(item);
    });
  }
  function prepareJinx(){
    jinxStorageKey='botc_art_custom_jinx_v1:'+JSON.stringify(roles.map(function(r){return r.id;}).sort());
    ['artJinxRoleA','artJinxRoleB'].forEach(function(id){var select=el(id);select.replaceChildren();roles.forEach(function(role){var option=document.createElement('option');option.value=role.id;option.textContent=role.n+(roles.filter(function(r){return r.n===role.n;}).length>1?'（'+role.id+'）':'');select.appendChild(option);});});
    if(roles.length>1)el('artJinxRoleB').selectedIndex=1;
    el('artJinxAdd').disabled=roles.length<2;customJinx=[];
    try{var stored=JSON.parse(localStorage.getItem(jinxStorageKey)||'[]');
      if(Array.isArray(stored))customJinx=stored.filter(function(rule){return rule&&Array.isArray(rule.roleIds)&&rule.roleIds.length===2&&rule.roleIds[0]!==rule.roleIds[1]&&rule.roleIds.every(function(id){return roles.some(function(r){return r.id===id;});})&&typeof rule.ability==='string'&&rule.ability.trim()&&rule.ability.length<=2000;});
    }catch(error){el('artJinxMessage').textContent='无法读取此前的自定义规则。';}
    clearJinxEditor();listJinx();
  }
  var history=[],historyIndex=-1,restoring=false,originalOrder=[],activeRole='',sourceSignature='',sourceTitle='',sourceAuthor='',sourceMeta='',currentPreset='';
  function defaultFooter(){
    var fields=(window.ScriptArtPresets.presets[currentPreset]||{}).fields||{};
    if(roles.some(function(role){return role.t==='fabled';}))el('artFooter').value='';
    else if(fields.artFooter!==undefined)el('artFooter').value=fields.artFooter;
  }
  var historyFields=['artSpacing','artTopDecoration','artScale','artUseLogo','artFrame','artFooter','artVersion','artPlayers','artTitleStyle','artRatio','artJinx','artPure','artStyle','artRules','artTitle','artAuthor','artSubtitle','artColumns','artTheme','artFont','artBackdrop','artPattern','artOrnament'];
  function booleanField(id){return id==='artJinx'||id==='artPure'||id==='artUseLogo'||id==='artTopDecoration';}
  function view(mode){dialog.dataset.view=mode;dialog.scrollTop=0;el('artViewSettings').setAttribute('aria-pressed',String(mode==='settings'));el('artViewPreview').setAttribute('aria-pressed',String(mode==='preview'));}
  function focusSetting(id){view('settings');el(id).focus();}
  function snapshot(){
    var fields={};historyFields.forEach(function(id){fields[id]=booleanField(id)?el(id).checked:el(id).value;});
    return JSON.stringify({roles:roles,customJinx:customJinx,fields:fields,background:background,logo:logo,preset:currentPreset});
  }
  function recordHistory(){
    if(!restoring){var current=snapshot();if(history[historyIndex]!==current){history=history.slice(0,historyIndex+1);history.push(current);if(history.length>30)history.shift();historyIndex=history.length-1;}}
    el('artUndo').disabled=historyIndex<=0;el('artRedo').disabled=historyIndex>=history.length-1;
  }
  function travelHistory(delta){
    clearTimeout(timer);if(history.length&&snapshot()!==history[historyIndex])recordHistory();
    var index=historyIndex+delta;if(index<0||index>=history.length)return;
    clearTimeout(timer);backgroundRevision++;logoRevision++;cancelAiLogo();var state=JSON.parse(history[index]);historyIndex=index;
    roles=state.roles;customJinx=state.customJinx;background=state.background;logo=state.logo||null;currentPreset=state.preset||'';el('artPreset').value=currentPreset;
    Object.keys(state.fields).forEach(function(id){if(booleanField(id))el(id).checked=state.fields[id];else el(id).value=state.fields[id];});
    clearJinxEditor();listJinx();persistJinx();el('artRoleEditor').hidden=true;restoring=true;render();restoring=false;
    // Rendering refreshes external night order; retain redo after that refresh.
    history[historyIndex]=snapshot();
  }
  function editRole(id){
    var role=roles.find(function(r){return r.id===id;});if(!role)return;activeRole=id;
    el('artRoleEditor').hidden=false;el('artRoleHeading').textContent='编辑：'+role.n;
    el('artRoleAbility').value=role.ab;var select=el('artSwapTarget');select.replaceChildren();
    roles.filter(function(r){return r.t===role.t&&r.id!==id;}).forEach(function(r){var o=document.createElement('option');o.value=r.id;o.textContent=r.n;select.appendChild(o);});
    el('artSwap').disabled=!select.options.length;focusSetting('artRoleAbility');
  }
  function swapRoles(a,b){
    var i=roles.findIndex(function(r){return r.id===a;}),j=roles.findIndex(function(r){return r.id===b;});
    if(i<0||j<0||i===j)return;
    if(roles[i].t!==roles[j].t){message('只能交换同一阵营分类中的角色。');return;}
    var role=roles[i];roles[i]=roles[j];roles[j]=role;render();
  }
  function paintOverlay(){
    var overlay=el('artOverlay');overlay.replaceChildren();var dragged='';
    function hit(label,x,y,w,h,action){
      var button=document.createElement('button');button.type='button';button.className='art-hit';button.setAttribute('aria-label',label);button.title=label;
      button.style.left=(x/plan.width*100)+'%';button.style.top=(y/plan.height*100)+'%';button.style.width=(w/plan.width*100)+'%';button.style.height=(h/plan.height*100)+'%';button.onclick=action;overlay.appendChild(button);return button;
    }
    hit('编辑标题与作者',96,50,options().style==='poster'&&options().rules?520:1088,150,function(){focusSetting('artTitle');el('artTitle').select();});
    if(plan.ruleBox){var box=plan.ruleBox;hit('编辑特殊规则',box.x,box.y,box.width*box.scale,box.height*box.scale,function(){focusSetting('artRules');});}
    plan.pages[0].filter(function(item){return item.kind==='role';}).forEach(function(item){
      var bounds=ScriptArt.roleBounds(plan,item);
      var button=hit('编辑 '+item.role.n+'；拖拽交换同类角色',bounds.x,bounds.y,bounds.width,bounds.height,function(){editRole(item.role.id);});button.dataset.roleId=item.role.id;button.draggable=true;
      button.addEventListener('dragstart',function(e){dragged=item.role.id;e.dataTransfer.setData('text/plain',dragged);e.dataTransfer.effectAllowed='move';});
      button.addEventListener('dragover',function(e){if(dragged&&roles.find(function(r){return r.id===dragged;}).t===item.role.t){e.preventDefault();e.dataTransfer.dropEffect='move';button.classList.add('art-drop');}});
      button.addEventListener('dragleave',function(){button.classList.remove('art-drop');});
      button.addEventListener('drop',function(e){e.preventDefault();swapRoles(dragged,item.role.id);dragged='';});
      button.addEventListener('dragend',function(){dragged='';overlay.querySelectorAll('.art-drop').forEach(function(b){b.classList.remove('art-drop');});});
    });
  }
  function options(){var imported=ScriptCore.ruleSections(typeof SCRIPT_RULES==='undefined'?[]:SCRIPT_RULES,roles),pure=el('artPure').checked,preset=window.ScriptArtPresets.presets[currentPreset]||{};return {spacing:el('artSpacing').value,topDecoration:!pure&&el('artTopDecoration').checked,titleDecoration:preset.titleDecoration||'',logo:el('artUseLogo').checked?logo:null,pure:pure,nightTheme:pure?'':el('artFrame').value,footer:pure?'':el('artFooter').value,frame:el('artFrame').value,version:el('artVersion').value,players:el('artPlayers').value,titleStyle:el('artTitleStyle').value,showJinx:el('artJinx').checked,jinx:(typeof JINX==='undefined'?[]:JINX).concat(customJinx,imported.jinx),style:el('artStyle').value,ratio:el('artRatio').value,rules:[el('artRules').value].concat(imported.other.map(function(rule){return rule.name+'：'+rule.ability;})).filter(Boolean).join('\n'),first:roles.filter(function(r){return r.artFirst>0;}).sort(function(a,b){return a.artFirst-b.artFirst;}),other:roles.filter(function(r){return r.artOther>0;}).sort(function(a,b){return a.artOther-b.artOther;}),columns:el('artColumns').value,font:el('artFont').value,theme:el('artTheme').value,title:el('artTitle').value,author:el('artAuthor').value,subtitle:el('artSubtitle').value,total:roles.length,background:pure?'':background,backdrop:pure||background?'':el('artBackdrop').value,pattern:pure?'':el('artPattern').value,ornament:pure?'':el('artOrnament').value,decorations:window.SCRIPT_ART_DECORATIONS||[]};}
  function showPage(){
    var index=0;
    currentSvg=ScriptArt.svg(plan,index,options(),icons,measure);
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=URL.createObjectURL(new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}));
    el('artPreviewState').hidden=true;el('artPreview').src=previewUrl;paintOverlay();enabled(true);
  }
  function render(){
    el('artLogoPreview').hidden=!logo;el('artRemoveLogo').disabled=!logo;
    el('artSaveLogo').disabled=!logo;
    if(logo)el('artLogoPreview').src=logo.image;else el('artLogoPreview').removeAttribute('src');
    resetSaved();
    if(!dialog.open)return;
    // Night order belongs to the script, not to the image editor's undo history.
    roles.forEach(function(role){var night=ScriptCore.nightOrder(role,typeof SCRIPT_NIGHT_ORDER==='undefined'?{}:SCRIPT_NIGHT_ORDER,typeof NIGHT_OVERRIDES==='undefined'?{}:NIGHT_OVERRIDES);role.artFirst=night.firstNight;role.artOther=night.otherNight;});
    el('artColumns').disabled=el('artStyle').value==='poster';
    el('artRatio').disabled=false;
    try{
      plan=ScriptArt.layout(roles,options(),measure);
      el('artCanvasInfo').textContent=(plan.fixedCanvas?'固定画布':'当前画布')+'：'+(plan.outputWidth||plan.width)+' × '+(plan.outputHeight||plan.height)+'；PNG 默认按原尺寸导出。';
      showPage();recordHistory();
      el('artPreset').value=currentPreset;
      var missing=roles.filter(function(role){return !icons[role.im]&&!icons[role.id];}).length;
      message('已生成一张完整图片 · '+(plan.outputWidth||plan.width)+' × '+(plan.outputHeight||plan.height)+'。'+(plan.fixedCanvas?' 固定参考图尺寸；内容不会自动加长。':'')+(plan.fitStage?' 已紧凑适配，正文字号 '+plan.font+'。':'')+(missing?' '+missing+' 个图标不可用，已使用文字占位。请核对图片链接、网络或图片站的跨域限制；重新打开可重试。':''));
    }catch(error){currentSvg='';enabled(false);el('artCanvasInfo').textContent='固定画布保留，内容超出时不会自动增高。';if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}el('artPreview').removeAttribute('src');el('artOverlay').replaceChildren();recordHistory();previewState(error.message,true);message(error.message);}
  }
  function resetSaved(){
    if(savedURL)URL.revokeObjectURL(savedURL);savedURL='';savedBlob=null;
    if(el('artSavePanel')){el('artSavePanel').hidden=true;el('artSavePreview').removeAttribute('src');el('artSaveOpen').removeAttribute('href');}
  }
  async function shareSaved(){
    var blob=savedBlob;if(!blob)return;
    el('artShare').disabled=true;
    try{var shared=window.ScriptMobileImages&&await window.ScriptMobileImages.share(blob,savedName);
      if(savedBlob===blob&&dialog.open)message(shared?'系统分享已完成。':'此浏览器不支持文件分享，请长按预览保存，或打开图片、下载 PNG。');
    }catch(error){if(savedBlob===blob&&dialog.open)message(error.name==='AbortError'?'已取消分享，图片仍可保存。':'分享未成功，请长按预览保存或下载 PNG。');}
    finally{if(savedBlob===blob&&dialog.open)el('artShare').disabled=false;}
  }
  function queue(){resetSaved();currentSvg='';enabled(false);clearTimeout(timer);timer=setTimeout(render,160);}
  function saveBlob(blob,extension,suffix){
    var name=(el('artTitle').value.trim()||'剧本').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80);
    var a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=name+(suffix||'-完整剧本')+'.'+extension;
    document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(url);},30000);
  }
  async function downloadPng(previewOnly){
    if(!currentSvg)return;
    var svg=currentSvg,requested=Number(el('artScale').value),height=plan.outputHeight||plan.height,width=plan.outputWidth||plan.width,session=revision;
    var scale=Math.min(requested,8192/height,8192/width,Math.sqrt(16000000/(width*height)));
    enabled(false);message('正在导出 PNG…');
    var url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    try{
      var image=new Image();await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error('图片渲染失败，可尝试下载 SVG。'));};image.src=url;});
      var canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(width*scale));canvas.height=Math.max(1,Math.floor(height*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});
      if(!blob)throw new Error('设备无法生成高清图片，请选择标准清晰度后重试。');
      if(session!==revision||!dialog.open||svg!==currentSvg)return;
      resetSaved();savedBlob=blob;savedURL=URL.createObjectURL(blob);savedName=(el('artTitle').value.trim()||'剧本').replace(/[<>:\"/\\|?*\x00-\x1f]/g,'_').slice(0,80)+'-完整剧本.png';el('artSavePreview').src=savedURL;el('artSaveOpen').href=savedURL;el('artSavePanel').hidden=false;el('artShare').disabled=false;if(!previewOnly)saveBlob(blob,'png');message('完整 PNG 已生成（'+canvas.width+' × '+canvas.height+'）'+(scale<requested?'；超长图已适配设备尺寸，SVG 保留原尺寸。':'；如未自动保存，请使用浏览器的下载列表。'));
      if(previewOnly&&el('artSavePanel').scrollIntoView)el('artSavePanel').scrollIntoView({block:'start'});
    }catch(error){if(session===revision&&dialog.open)message(error.message||'PNG 导出失败，可尝试 SVG。');}
    finally{if(canvas){canvas.width=0;canvas.height=0;}URL.revokeObjectURL(url);if(session===revision&&dialog.open)enabled(!!currentSvg);}
  }
  function logoControls(){
    var styleOptions=(window.ScriptLogoAI?window.ScriptLogoAI.styles:[]).map(function(style){return '<option value="'+style.id+'">'+style.label+'</option>';}).join('');
    return '<details class="art-logo-controls"><summary>标题 Logo · AI 生成 / 上传</summary>'+
      '<div class="art-ai-logo"><strong>AI 生成透明 Logo</strong><label>生成风格<select id="artLogoStyle">'+styleOptions+'</select></label><label>补充要求（可留空）<textarea id="artLogoPrompt" maxlength="800" rows="3" placeholder="例如：时钟、爱心、金色细描边，青蓝与酒红配色"></textarea></label>'+
      '<div class="art-downloads"><button type="button" id="artGenerateLogo" class="btn pri">AI 生成 Logo</button><button type="button" id="artCancelLogo" class="btn" hidden>取消生成</button></div><p id="artLogoStatus" class="art-note" role="status" aria-live="polite">使用当前剧本标题生成一张透明 PNG，并自动应用。需要本机 AI 服务，OpenAI API 按量计费。</p></div>'+
      '<label>上传 Logo 图片（推荐透明 PNG）<input type="file" id="artLogoFile" accept="image/png,image/jpeg,image/webp"></label><label><input type="checkbox" id="artUseLogo">使用此 Logo 替代标题</label><img id="artLogoPreview" alt="透明 Logo 预览" hidden>'+
      '<div class="art-downloads"><button type="button" id="artSaveLogo" class="btn" disabled>保存 Logo PNG</button><button type="button" id="artRemoveLogo" class="btn" disabled>移除 Logo</button></div><p class="art-note">上传支持 8 MB 以内的 PNG/JPG/WebP。Logo 等比放入标题区，支持撤销。AI 生成只发送标题、风格及补充要求；上传图片在本机处理。</p></details>';
  }
  function logoBusy(value){el('artGenerateLogo').disabled=value;el('artCancelLogo').hidden=!value;el('artGenerateLogo').textContent=value?'正在生成…':'AI 生成 Logo';}
  function cancelAiLogo(){
    if(!logoJob)return;var job=logoJob;logoJob=null;clearTimeout(job.timeout);job.controller.abort();logoBusy(false);el('artLogoStatus').textContent='已取消生成，原来的 Logo 保留。';
  }
  async function generateAiLogo(){
    if(logoJob)return;
    var title=el('artTitle').value.trim();
    if(!title){el('artLogoStatus').textContent='请先填写剧本标题。';el('artTitle').focus();return;}
    if(!window.ScriptLogoAI||!window.AbortController){el('artLogoStatus').textContent='AI Logo 模块未加载，请刷新页面后重试。';return;}
    clearTimeout(timer);render();
    var job={controller:new AbortController(),timedOut:false},session=revision,request=++logoRevision;
    logoJob=job;logoBusy(true);el('artLogoStatus').textContent='正在为“'+title+'”生成透明 Logo，可能需要一到两分钟。';
    job.timeout=setTimeout(function(){job.timedOut=true;job.controller.abort();},190000);
    try{
      var blob=await window.ScriptLogoAI.generate({title:title,style:el('artLogoStyle').value||'dimensional',details:el('artLogoPrompt').value.trim()},job.controller.signal);
      if(logoJob!==job||session!==revision||request!==logoRevision||!dialog.open)return;
      var result=await readImage(blob,true,true);
      if(logoJob!==job||session!==revision||request!==logoRevision||!dialog.open||title!==el('artTitle').value.trim())return;
      recordHistory();logo=result;el('artUseLogo').checked=true;el('artLogoFile').value='';render();
      el('artLogoStatus').textContent='透明 Logo 已应用到海报，可保存 PNG、重新生成或撤销。';
    }catch(error){
      if(logoJob!==job||session!==revision||!dialog.open)return;
      el('artLogoStatus').textContent=job.timedOut?'生成等待超时，请稍后重试。':error.name==='AbortError'?'已取消生成，原来的 Logo 保留。':error.message||'Logo 生成失败，请重试。';
    }finally{clearTimeout(job.timeout);if(logoJob===job){logoJob=null;logoBusy(false);}}
  }
  function createDialog(){
    dialog=document.createElement('dialog');dialog.id='artDialog';dialog.setAttribute('aria-labelledby','artHeading');
    dialog.innerHTML='<div class="art-header"><div><p class="art-eyebrow">SCRIPT STUDIO</p><h2 id="artHeading">剧本制图</h2><p>把当前剧本排成一张可分享的角色说明图。</p></div><button type="button" id="artClose" class="btn">关闭</button></div>'+
      '<div class="art-mobile-tools" role="group" aria-label="制图工作区"><button type="button" class="btn" id="artViewSettings" aria-pressed="true">设置</button><button type="button" class="btn" id="artViewPreview" aria-pressed="false">预览</button><button type="button" class="btn pri" id="artQuickSave" disabled>保存 / 分享</button></div>'+
      '<div class="art-workspace"><section class="art-controls" aria-label="制图设置">'+
      '<section class="art-script-info" aria-label="剧本信息"><strong>剧本信息</strong><label>剧本标题<input id="artTitle" maxlength="100"></label><label>剧本作者<input id="artAuthor" maxlength="48" placeholder="例如：Artem"></label><label>支持人数<input id="artPlayers" maxlength="24" placeholder="例如：支持 7–15 人"></label><label>版本号<input id="artVersion" maxlength="18" placeholder="例如：V 1.0"></label><p class="art-note">作者和人数在图片中使用黑字；留空则不显示。</p></section>'+
      '<label>快速版式<select id="artPreset"><option value="">选择版式预设…</option></select></label><p class="art-note">复古官方风锁定参考图原始尺寸；内容优先紧凑适配。其他预设继续保留，切换可撤销。</p><label><input type="checkbox" id="artPure">一键纯净（隐藏背景、底纹和装饰）</label>'+
      '<div class="art-downloads"><button type="button" class="btn" id="artUndo" disabled>撤销</button><button type="button" class="btn" id="artRedo" disabled>重做</button><button type="button" class="btn" id="artResetOrder">恢复角色排序</button></div><p class="art-note">点击画布上的角色编辑能力与相克，拖拽交换同类角色。修改仅用于制图；夜序仍沿用剧本工具设置。</p><section id="artRoleEditor" hidden><strong id="artRoleHeading"></strong><label>图片中的能力说明<textarea id="artRoleAbility" maxlength="20000"></textarea></label><button type="button" id="artRoleApply" class="btn">应用说明</button><button type="button" id="artRoleJinx" class="btn">添加相克</button><label>与同类角色交换<select id="artSwapTarget"></select></label><button type="button" id="artSwap" class="btn">交换位置</button><button type="button" id="artRoleClose" class="btn">收起</button></section>'+
      '<label><input type="checkbox" id="artJinx" checked>显示已选角色间的相克规则</label>'+
      '<details class="art-custom-jinx"><summary>自定义相克规则</summary><label>角色一<select id="artJinxRoleA"></select></label><label>角色二<select id="artJinxRoleB"></select></label><label>相克说明<textarea id="artJinxText" maxlength="2000" placeholder="填写这两个角色之间的特殊互动规则"></textarea></label><button type="button" class="btn" id="artJinxAdd">添加相克规则</button><button type="button" class="btn" id="artJinxCancel">取消修改</button><p id="artJinxMessage" role="status"></p><div id="artCustomJinxList"></div><p class="art-note">仅用于当前角色组合的制图，保存到此浏览器，不改变全站规则或剧本 JSON。</p></details>'+
      '<label>图片比例<select id="artRatio"><option value="fixed" selected>固定参考图尺寸</option><option value="readable">允许自动加长 · 保留字号</option><option value="reference">固定参考比例 · 约 1:1.35</option><option value="auto">允许自动加长 · 自由画布</option></select></label><p id="artCanvasInfo" class="art-size-note"></p>'+
      '<label>排版密度<select id="artSpacing"><option value="printCompact" selected>紧凑印刷排版</option><option value="comfortable">舒展排版</option></select></label><label>版式<select id="artStyle"><option value="poster" selected>参考图海报 · 阵营分区与两侧夜序</option><option value="simple">简洁分栏</option></select></label><label>特殊规则<textarea id="artRules" maxlength="2000" placeholder="例如：私货商人的特殊规则（可留空）"></textarea></label>'+
      '<label>夜序边栏<select id="artFrame"><option value="paper">柔和纸色</option><option value="charcoal">暗纹 · 朱红边线</option><option value="midnight">靛蓝 · 紫色边线</option></select></label><label>标题 Logo 预设<select id="artTitleStyle"><option value="plain">简洁黑体</option><option value="epic">立体海报 · 蓝紫描边</option><option value="brush">墨色书法</option><option value="classic">古典宋体</option><option value="gold">鎏金铭文</option><option value="crimson">暗红悬疑</option><option value="vintage-crimson" selected>古典酒红铭文</option><option value="shards">蓝晶拼字</option><option value="ember">赤焰铜刻</option><option value="obsidian">黑金徽记</option><option value="jade">青玉古篆</option><option value="lunar">月夜秘仪</option><option value="violet">紫银幻境</option></select></label>'+logoControls()+'<label><input type="checkbox" id="artTopDecoration">显示顶部古典徽记（可关闭）</label><label>副标题 / 备注<input id="artSubtitle" maxlength="65" placeholder="例如：适合 9–12 人 · 第三版"></label>'+
      '<div class="art-pair"><label>分栏<select id="artColumns"><option value="1">单列</option><option value="2" selected>双列</option><option value="3">三列</option></select></label><label>配色<select id="artTheme"><option value="cloud">云白</option><option value="paper">暖纸</option><option value="night">深夜</option></select></label></div>'+
      '<label>说明字号<select id="artFont"><option value="20">紧凑</option><option value="24" selected>标准</option><option value="28">大字</option></select></label>'+
      '<label>素材背景<select id="artBackdrop"><option value="">无</option></select></label><div class="art-pair"><label>底纹<select id="artPattern"><option value="">无</option></select></label><label>装饰<select id="artOrnament"><option value="">无</option></select></label></div><label>底部术语说明<select id="artFooter"><option value="">无</option></select></label><p class="art-note">默认不添加底部术语说明，正文会利用释放的空间增加角色间距；可手动选择说明栏，重新打开会保留手动设置。</p><p class="art-note">装饰素材来源：<a href="https://www.merlin-botc.com/create/art?lang=zh-CN" target="_blank" rel="noopener">Merlin Studio</a></p>'+
      '<label>自选背景<input type="file" id="artBackground" accept="image/png,image/jpeg,image/webp"></label><button type="button" class="btn" id="artRemoveBg">移除背景</button>'+
      '<p class="art-note">图片只在本机处理。固定尺寸会依次压缩间距、行距、分区和字号，必要时平衡双列；容纳不下会提示，不裁切文字。只有手动选择“允许自动加长”才增高画布。导入图标会尝试联网加载并嵌入图片；失效或不允许跨域读取的图标使用文字占位。</p>'+
      '<label>PNG 清晰度<select id="artScale"><option value="1" selected>原始画布尺寸（与参考图一致）</option><option value="2">手动放大 2 倍（用于高清打印）</option></select></label>'+
      '<div class="art-downloads"><button type="button" class="btn pri" id="artSave" disabled>保存 / 分享图片</button><button type="button" class="btn" id="artPng" disabled>下载 PNG</button><button type="button" class="btn" id="artSvg" disabled>下载 SVG</button></div><div id="artSavePanel" hidden><p>长按下方图片保存到相册，或点击系统分享。</p><img id="artSavePreview" alt="可长按保存的完整剧本 PNG"><div class="art-downloads"><button type="button" class="btn" id="artShare">系统分享</button><button type="button" class="btn" id="artSaveDownload">下载 PNG</button><a id="artSaveOpen" class="btn" target="_blank" rel="noopener">打开图片</a></div></div><p id="artStatus" role="status" aria-live="polite"></p></section>'+
      '<section class="art-canvas" aria-label="剧本图片预览"><div id="artPreviewState" class="art-preview-state" role="status" aria-live="polite"><strong id="artPreviewHeading">正在生成预览</strong><p id="artPreviewMessage"></p><button type="button" class="btn" id="artReviewLayout" hidden>查看尺寸与排版设置</button></div><div class="art-stage"><img id="artPreview" alt="可点击角色编辑的剧本图片预览"><div id="artOverlay"></div></div></section></div>';
    document.body.appendChild(dialog);
    var config=window.ScriptArtPresets,ref=config.reference;currentPreset=config.defaultPreset;
    Object.keys(config.presets).forEach(function(key){var option=document.createElement('option');option.value=key;option.textContent=config.presets[key].label;el('artPreset').appendChild(option);});
    el('artPreset').value=currentPreset;
    el('artRatio').options[0].textContent='固定参考图尺寸 · '+ref.width+' × '+ref.height;
    Object.keys(config.presets[config.defaultPreset].fields).forEach(function(id){var value=config.presets[config.defaultPreset].fields[id];if(booleanField(id))el(id).checked=value;else if(Array.from(el(id).options||[]).some(function(option){return option.value===value;}))el(id).value=value;});
    view('settings');el('artViewSettings').onclick=function(){view('settings');};el('artViewPreview').onclick=function(){view('preview');};
    el('artQuickSave').onclick=function(){view('settings');return downloadPng(true);};
    el('artPreset').onchange=function(){
      var presets=window.ScriptArtPresets.presets;
      var entry=presets[this.value];if(!entry)return;var preset=entry.fields;
      clearTimeout(timer);logoRevision++;cancelAiLogo();recordHistory();currentPreset=this.value;Object.keys(preset).forEach(function(id){if(booleanField(id))el(id).checked=preset[id];else el(id).value=preset[id];});defaultFooter();render();
    };
    el('artUndo').onclick=function(){travelHistory(-1);};el('artRedo').onclick=function(){travelHistory(1);};
    el('artResetOrder').onclick=function(){roles.sort(function(a,b){return originalOrder.indexOf(a.id)-originalOrder.indexOf(b.id);});render();};
    el('artRoleClose').onclick=function(){el('artRoleEditor').hidden=true;};
    el('artRoleApply').onclick=function(){var text=el('artRoleAbility').value.trim();if(!text){message('能力说明不能为空。');return;}roles.find(function(r){return r.id===activeRole;}).ab=text;render();};
    el('artSwap').onclick=function(){swapRoles(activeRole,el('artSwapTarget').value);};
    el('artRoleJinx').onclick=function(){clearJinxEditor();el('artJinxRoleA').value=activeRole;var partner=roles.find(function(r){return r.id!==activeRole;});if(partner)el('artJinxRoleB').value=partner.id;el('artJinxText').closest('details').open=true;el('artJinxText').focus();};
    dialog.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();travelHistory(e.key.toLowerCase()==='y'||e.shiftKey?1:-1);}});
    el('artJinxCancel').onclick=clearJinxEditor;
    el('artJinxAdd').onclick=function(){
      var a=el('artJinxRoleA').value,b=el('artJinxRoleB').value,text=el('artJinxText').value.trim();
      if(!a||!b||a===b){el('artJinxMessage').textContent='请选择两个不同的角色。';return;}
      if(!text||text.length>2000){el('artJinxMessage').textContent='请填写 1–2000 字的相克说明。';return;}
      var rule={roleIds:[a,b],ability:text};
      if(customJinx.some(function(r,i){return i!==jinxEditing&&r.roleIds.slice().sort().join('|')===[a,b].sort().join('|')&&r.ability===text;})){el('artJinxMessage').textContent='这条规则已经添加。';return;}
      if(jinxEditing>=0)customJinx[jinxEditing]=rule;else customJinx.push(rule);
      el('artJinx').checked=true;clearJinxEditor();persistJinx();listJinx();render();
    };
    el('artReviewLayout').onclick=function(){focusSetting('artRatio');if(el('artRatio').scrollIntoView)el('artRatio').scrollIntoView({block:'center'});};
    el('artPreview').onerror=function(){enabled(false);var text='预览图片未能显示，请调整设置后重试。';previewState(text,true);message(text);};
    el('artClose').onclick=function(){dialog.close();};
    dialog.addEventListener('close',function(){revision++;logoRevision++;cancelAiLogo();resetSaved();clearTimeout(timer);enabled(false);if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}el('artPreview').removeAttribute('src');});
    historyFields.forEach(function(id){el(id).addEventListener('input',function(){if(id==='artUseLogo'||id==='artTitle'){logoRevision++;cancelAiLogo();}queue();});});
    el('artGenerateLogo').onclick=generateAiLogo;el('artCancelLogo').onclick=cancelAiLogo;
    ['artLogoStyle','artLogoPrompt'].forEach(function(id){el(id).addEventListener('input',cancelAiLogo);});
    el('artSaveLogo').onclick=function(){if(!logo)return;var bytes=Uint8Array.from(atob(logo.image.split(',')[1]),function(ch){return ch.charCodeAt(0);});saveBlob(new Blob([bytes],{type:'image/png'}),'png','-Logo');};
    el('artRemoveLogo').onclick=function(){logoRevision++;cancelAiLogo();logo=null;el('artUseLogo').checked=false;el('artLogoFile').value='';render();};
    el('artLogoFile').onchange=async function(){
      var file=this.files[0],session=revision,upload=++logoRevision;if(!file)return;cancelAiLogo();
      clearTimeout(timer);render();resetSaved();enabled(false);message('正在处理 Logo…');
      try{var result=await readImage(file,true);if(session===revision&&upload===logoRevision&&dialog.open){logo=result;el('artUseLogo').checked=true;render();}}
      catch(error){if(session===revision&&upload===logoRevision&&dialog.open){message(error.message);enabled(!!currentSvg);}}
    };
    el('artRemoveBg').onclick=function(){backgroundRevision++;background='';el('artBackground').value='';render();};
    el('artBackground').onchange=async function(){
      var file=this.files[0],session=revision,bg=++backgroundRevision;if(!file)return;enabled(false);message('正在处理背景…');
      try{var result=await readImage(file);if(session===revision&&bg===backgroundRevision&&dialog.open){background=result;render();}}
      catch(error){if(session===revision&&bg===backgroundRevision&&dialog.open){message(error.message);enabled(!!currentSvg);}}
    };
    el('artPng').onclick=function(){return downloadPng(false);};
    el('artSave').onclick=function(){return downloadPng(true);};el('artShare').onclick=shareSaved;el('artSaveDownload').onclick=function(){if(savedBlob)saveBlob(savedBlob,'png');};el('artScale').onchange=resetSaved;
    el('artSvg').onclick=function(){if(currentSvg)saveBlob(new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}),'svg');};
  }
  document.getElementById('bArt').onclick=async function(){
    if(!sel.length){alert('请先在剧本工具中添加角色，或导入剧本 JSON。');return;}
    var imageRoles=sel.filter(function(role){return role.t!=='traveller'&&role.t!=='traveler';});
    if(!imageRoles.length){alert('剧本图片不展示旅行者，请先添加其他类型的角色。');return;}
    if(!dialog)createDialog();
    var signature=JSON.stringify(sel);var fresh=signature!==sourceSignature;
    if(sourceTitle!==el('mname').value){logoRevision++;logo=null;el('artUseLogo').checked=false;el('artLogoFile').value='';}
    if(fresh){sourceSignature=signature;history=[];historyIndex=-1;originalOrder=imageRoles.map(function(r){return r.id;});
    roles=imageRoles.map(function(role){var night=typeof ScriptCore!=='undefined'?ScriptCore.nightOrder(role,typeof SCRIPT_NIGHT_ORDER==='undefined'?{}:SCRIPT_NIGHT_ORDER,typeof NIGHT_OVERRIDES==='undefined'?{}:NIGHT_OVERRIDES):{firstNight:role.f||0,otherNight:role.o||0};return Object.assign({},role,{artSource:artworkSource(role),artFirst:night.firstNight,artOther:night.otherNight});});
    el('artJinxMessage').textContent='';prepareJinx();
    el('artRoleEditor').hidden=true;
    }
    if(fresh||sourceTitle!==el('mname').value)el('artTitle').value=el('mname').value||'未命名剧本';
    if(fresh||sourceAuthor!==el('mauthor').value)el('artAuthor').value=el('mauthor').value;
    var metadata=typeof SCRIPT_META==='undefined'?{}:SCRIPT_META,metaSignature=JSON.stringify([metadata.version,metadata.players]);
    if(fresh||sourceMeta!==metaSignature){el('artVersion').value=typeof metadata.version==='string'?metadata.version.slice(0,18):'';el('artPlayers').value=typeof metadata.players==='string'?metadata.players.slice(0,24):'';sourceMeta=metaSignature;}
    sourceTitle=el('mname').value;sourceAuthor=el('mauthor').value;
    var session=++revision;dialog.showModal();enabled(false);previewState('正在准备角色图标…',false);message('正在准备角色图标…');
    try{var loaded=await Promise.all([loadIcons(),loadDecorations(),loadBodyFonts()]);icons=Object.assign({},loaded[0]);}
    catch(error){if(session!==revision||!dialog.open)return;icons=Object.assign({},window.SCRIPT_ART_ICONS||{});message(error.message+' 将使用文字占位。');}
    if(session!==revision||!dialog.open)return;
    var firstDecorations=!decorationReady;decorationOptions();
    if(fresh||firstDecorations)defaultFooter();
    await prepareImportedIcons(session);
    if(session!==revision||!dialog.open)return;
    render();
  };
})();
