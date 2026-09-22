(function(){
  'use strict';
  var dialog,roles=[],icons={},plan,currentSvg='',previewUrl='',timer,revision=0,background='',backgroundRevision=0,iconPromise,decorationPromise,decorationReady=false;
  var customJinx=[],jinxEditing=-1,jinxStorageKey='';
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
    [['artBackdrop','backgrounds','backgrounds-2'],['artPattern','patterns','patterns-0'],['artOrnament','ornaments','ornaments-0']].forEach(function(pair){
      var select=el(pair[0]),previous=select.value;select.innerHTML='<option value="">无</option>';
      (window.SCRIPT_ART_DECORATIONS||[]).filter(function(item){return item.group===pair[1];}).forEach(function(item){var option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.appendChild(option);});
      select.value=decorationReady?previous:pair[2];
    });decorationReady=true;
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
  var history=[],historyIndex=-1,restoring=false,originalOrder=[],activeRole='',sourceSignature='';
  var historyFields=['artRatio','artJinx','artStyle','artRules','artTitle','artAuthor','artSubtitle','artColumns','artTheme','artFont','artBackdrop','artPattern','artOrnament'];
  function snapshot(){
    var fields={};historyFields.forEach(function(id){fields[id]=id==='artJinx'?el(id).checked:el(id).value;});
    return JSON.stringify({roles:roles,customJinx:customJinx,fields:fields,background:background});
  }
  function recordHistory(){
    if(!restoring){var current=snapshot();if(history[historyIndex]!==current){history=history.slice(0,historyIndex+1);history.push(current);if(history.length>30)history.shift();historyIndex=history.length-1;}}
    el('artUndo').disabled=historyIndex<=0;el('artRedo').disabled=historyIndex>=history.length-1;
  }
  function travelHistory(delta){
    clearTimeout(timer);if(history.length&&snapshot()!==history[historyIndex])recordHistory();
    var index=historyIndex+delta;if(index<0||index>=history.length)return;
    clearTimeout(timer);backgroundRevision++;var state=JSON.parse(history[index]);historyIndex=index;
    roles=state.roles;customJinx=state.customJinx;background=state.background;
    Object.keys(state.fields).forEach(function(id){if(id==='artJinx')el(id).checked=state.fields[id];else el(id).value=state.fields[id];});
    clearJinxEditor();listJinx();persistJinx();el('artRoleEditor').hidden=true;restoring=true;render();restoring=false;
  }
  function editRole(id){
    var role=roles.find(function(r){return r.id===id;});if(!role)return;activeRole=id;
    el('artRoleEditor').hidden=false;el('artRoleHeading').textContent='编辑：'+role.n;
    el('artRoleAbility').value=role.ab;var select=el('artSwapTarget');select.replaceChildren();
    roles.filter(function(r){return r.t===role.t&&r.id!==id;}).forEach(function(r){var o=document.createElement('option');o.value=r.id;o.textContent=r.n;select.appendChild(o);});
    el('artSwap').disabled=!select.options.length;el('artRoleAbility').focus();
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
    hit('编辑标题与作者',96,50,options().rules?520:1088,150,function(){el('artTitle').focus();el('artTitle').select();});
    if(options().style==='poster'&&options().rules)hit('编辑特殊规则',660,45,530,Math.min(530,plan.bodyTop-70),function(){el('artRules').focus();});
    plan.pages[0].filter(function(item){return item.kind==='role';}).forEach(function(item){
      var scale=plan.bodyScale||1,x=640*(1-scale)+item.x*scale,y=(plan.bodyTop||0)*(1-scale)+item.y*scale;
      var height=item.noteTop+(item.notes||[]).reduce(function(n,note){return n+note.height+8;},0);
      var button=hit('编辑 '+item.role.n+'；拖拽交换同类角色',x,y,item.width*scale,height*scale,function(){editRole(item.role.id);});button.dataset.roleId=item.role.id;button.draggable=true;
      button.addEventListener('dragstart',function(e){dragged=item.role.id;e.dataTransfer.setData('text/plain',dragged);e.dataTransfer.effectAllowed='move';});
      button.addEventListener('dragover',function(e){if(dragged&&roles.find(function(r){return r.id===dragged;}).t===item.role.t){e.preventDefault();e.dataTransfer.dropEffect='move';button.classList.add('art-drop');}});
      button.addEventListener('dragleave',function(){button.classList.remove('art-drop');});
      button.addEventListener('drop',function(e){e.preventDefault();swapRoles(dragged,item.role.id);dragged='';});
      button.addEventListener('dragend',function(){dragged='';overlay.querySelectorAll('.art-drop').forEach(function(b){b.classList.remove('art-drop');});});
    });
  }
  function options(){return {showJinx:el('artJinx').checked,jinx:(typeof JINX==='undefined'?[]:JINX).concat(customJinx),style:el('artStyle').value,ratio:el('artRatio').value,rules:el('artRules').value,first:roles.filter(function(r){return r.artFirst>0;}).sort(function(a,b){return a.artFirst-b.artFirst;}),other:roles.filter(function(r){return r.artOther>0;}).sort(function(a,b){return a.artOther-b.artOther;}),columns:el('artColumns').value,font:el('artFont').value,theme:el('artTheme').value,title:el('artTitle').value,author:el('artAuthor').value,subtitle:el('artSubtitle').value,total:roles.length,background:background,backdrop:background?'':el('artBackdrop').value,pattern:el('artPattern').value,ornament:el('artOrnament').value,decorations:window.SCRIPT_ART_DECORATIONS||[]};}
  function showPage(){
    var index=0;
    currentSvg=ScriptArt.svg(plan,index,options(),icons,measure);
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=URL.createObjectURL(new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}));
    el('artPreview').src=previewUrl;paintOverlay();enabled(true);
  }
  function render(){
    if(!dialog.open)return;
    el('artColumns').disabled=el('artStyle').value==='poster';
    el('artRatio').disabled=el('artStyle').value!=='poster';
    try{
      plan=ScriptArt.layout(roles,options(),measure);
      showPage();recordHistory();
      var missing=roles.filter(function(role){return !icons[role.im]&&!icons[role.id];}).length;
      message('已生成一张完整图片 · '+plan.width+' × '+plan.height+'。'+(missing?' '+missing+' 个图标不可用，已使用文字占位。':''));
    }catch(error){currentSvg='';enabled(false);message(error.message);}
  }
  function queue(){currentSvg='';enabled(false);clearTimeout(timer);timer=setTimeout(render,160);}
  function saveBlob(blob,extension){
    var name=(el('artTitle').value.trim()||'剧本').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,80);
    var a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=name+'-完整剧本.'+extension;
    document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(url);},30000);
  }
  async function downloadPng(){
    if(!currentSvg)return;
    var svg=currentSvg,requested=Number(el('artScale').value),height=plan.height,width=plan.width,session=revision;
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
      saveBlob(blob,'png');message('完整 PNG 已生成（'+canvas.width+' × '+canvas.height+'）'+(scale<requested?'；超长图已适配设备尺寸，SVG 保留原尺寸。':'；如未自动保存，请使用浏览器的下载列表。'));
    }catch(error){if(session===revision&&dialog.open)message(error.message||'PNG 导出失败，可尝试 SVG。');}
    finally{URL.revokeObjectURL(url);if(session===revision&&dialog.open)enabled(!!currentSvg);}
  }
  function createDialog(){
    dialog=document.createElement('dialog');dialog.id='artDialog';dialog.setAttribute('aria-labelledby','artHeading');
    dialog.innerHTML='<div class="art-header"><div><p class="art-eyebrow">SCRIPT STUDIO</p><h2 id="artHeading">剧本制图</h2><p>把当前剧本排成一张可分享的角色说明图。</p></div><button type="button" id="artClose" class="btn">关闭</button></div>'+
      '<div class="art-workspace"><section class="art-controls" aria-label="制图设置">'+
      '<div class="art-downloads"><button type="button" class="btn" id="artUndo" disabled>撤销</button><button type="button" class="btn" id="artRedo" disabled>重做</button><button type="button" class="btn" id="artResetOrder">恢复角色排序</button></div><p class="art-note">点击画布上的角色编辑能力与相克，拖拽交换同类角色。修改仅用于制图；夜序仍沿用剧本工具设置。</p><section id="artRoleEditor" hidden><strong id="artRoleHeading"></strong><label>图片中的能力说明<textarea id="artRoleAbility" maxlength="20000"></textarea></label><button type="button" id="artRoleApply" class="btn">应用说明</button><button type="button" id="artRoleJinx" class="btn">添加相克</button><label>与同类角色交换<select id="artSwapTarget"></select></label><button type="button" id="artSwap" class="btn">交换位置</button><button type="button" id="artRoleClose" class="btn">收起</button></section>'+
      '<label><input type="checkbox" id="artJinx" checked>显示已选角色间的相克规则</label>'+
      '<details class="art-custom-jinx"><summary>自定义相克规则</summary><label>角色一<select id="artJinxRoleA"></select></label><label>角色二<select id="artJinxRoleB"></select></label><label>相克说明<textarea id="artJinxText" maxlength="2000" placeholder="填写这两个角色之间的特殊互动规则"></textarea></label><button type="button" class="btn" id="artJinxAdd">添加相克规则</button><button type="button" class="btn" id="artJinxCancel">取消修改</button><p id="artJinxMessage" role="status"></p><div id="artCustomJinxList"></div><p class="art-note">仅用于当前角色组合的制图，保存到此浏览器，不改变全站规则或剧本 JSON。</p></details>'+
      '<label>图片比例<select id="artRatio"><option value="reference" selected>参考图比例 · 约 1:1.35</option><option value="auto">随内容自动加长</option></select></label>'+
      '<label>版式<select id="artStyle"><option value="poster" selected>参考图海报 · 阵营分区与两侧夜序</option><option value="simple">简洁分栏</option></select></label><label>特殊规则<textarea id="artRules" maxlength="2000" placeholder="例如：私货商人的特殊规则（可留空）"></textarea></label>'+
      '<label>剧本标题<input id="artTitle" maxlength="100"></label><label>作者<input id="artAuthor" maxlength="48"></label><label>副标题 / 备注<input id="artSubtitle" maxlength="65" placeholder="例如：适合 9–12 人 · 第三版"></label>'+
      '<div class="art-pair"><label>分栏<select id="artColumns"><option value="1">单列</option><option value="2" selected>双列</option><option value="3">三列</option></select></label><label>配色<select id="artTheme"><option value="cloud">云白</option><option value="paper">暖纸</option><option value="night">深夜</option></select></label></div>'+
      '<label>说明字号<select id="artFont"><option value="20">紧凑</option><option value="24" selected>标准</option><option value="28">大字</option></select></label>'+
      '<label>素材背景<select id="artBackdrop"><option value="">无</option></select></label><div class="art-pair"><label>底纹<select id="artPattern"><option value="">无</option></select></label><label>装饰<select id="artOrnament"><option value="">无</option></select></label></div><p class="art-note">装饰素材来源：<a href="https://www.merlin-botc.com/create/art?lang=zh-CN" target="_blank" rel="noopener">Merlin Studio</a></p>'+
      '<label>自选背景<input type="file" id="artBackground" accept="image/png,image/jpeg,image/webp"></label><button type="button" class="btn" id="artRemoveBg">移除背景</button>'+
      '<p class="art-note">图片只在本机处理。角色按类型分组，保留组内顺序；参考图比例会紧凑排版并等比缩放内容，不裁切文字；也可选择自动加长。缺失或远程自定义图标使用文字占位。</p>'+
      '<label>PNG 清晰度<select id="artScale"><option value="1">标准 · 1280 像素宽</option><option value="2" selected>高清 · 2560 像素宽</option></select></label>'+
      '<div class="art-downloads"><button type="button" class="btn pri" id="artPng" disabled>下载 PNG</button><button type="button" class="btn" id="artSvg" disabled>下载 SVG</button></div><p id="artStatus" role="status" aria-live="polite"></p></section>'+
      '<section class="art-canvas" aria-label="剧本图片预览"><div class="art-stage"><img id="artPreview" alt="可点击角色编辑的剧本图片预览"><div id="artOverlay"></div></div></section></div>';
    document.body.appendChild(dialog);
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
    el('artPreview').onerror=function(){enabled(false);message('预览图片未能显示，请调整设置后重试。');};
    el('artClose').onclick=function(){dialog.close();};
    dialog.addEventListener('close',function(){revision++;clearTimeout(timer);enabled(false);if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}el('artPreview').removeAttribute('src');});
    ['artRatio','artJinx','artStyle','artRules','artTitle','artAuthor','artSubtitle','artColumns','artTheme','artFont','artBackdrop','artPattern','artOrnament'].forEach(function(id){el(id).addEventListener('input',queue);});
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
    var signature=JSON.stringify(sel);var fresh=signature!==sourceSignature;
    if(fresh){sourceSignature=signature;history=[];historyIndex=-1;originalOrder=sel.map(function(r){return r.id;});
    roles=sel.map(function(role){var night=typeof ScriptCore!=='undefined'?ScriptCore.nightOrder(role,typeof SCRIPT_NIGHT_ORDER==='undefined'?{}:SCRIPT_NIGHT_ORDER,typeof NIGHT_OVERRIDES==='undefined'?{}:NIGHT_OVERRIDES):{firstNight:role.f||0,otherNight:role.o||0};return Object.assign({},role,{artFirst:night.firstNight,artOther:night.otherNight});});
    el('artJinxMessage').textContent='';prepareJinx();
    el('artTitle').value=el('mname').value||'未命名剧本';el('artAuthor').value=el('mauthor').value;el('artRoleEditor').hidden=true;
    }
    var session=++revision;dialog.showModal();enabled(false);message('正在准备角色图标…');
    try{var loaded=await Promise.all([loadIcons(),loadDecorations()]);icons=Object.assign({},loaded[0]);}
    catch(error){if(session!==revision||!dialog.open)return;icons=Object.assign({},window.SCRIPT_ART_ICONS||{});message(error.message+' 将使用文字占位。');}
    if(session!==revision||!dialog.open)return;
    decorationOptions();
    roles.forEach(function(role){var image=role.im||role.iu;if(/^data:image\/(png|jpeg|webp);base64,/.test(image||''))icons[role.id]=image;});
    render();
  };
})();
