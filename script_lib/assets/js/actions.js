// 共享原文请求；失败清除缓存，下一次用户操作可重新加载。
var fullRequest=null,dialogRequest=0;
function loadLegacyFull(cb,err){
  if(FULL){cb();return;}
  if(!fullRequest){
    FULL_LOADING=true;expTip('正在加载剧本原文，请稍候…',true);
    fullRequest=new Promise(function(resolve,reject){
      var script=document.createElement('script'),finished=false;
      var timer=setTimeout(function(){finish('加载超时，请重试。');},30000);
      function finish(message){
        if(finished)return;finished=true;clearTimeout(timer);
        script.onload=null;script.onerror=null;script.remove();
        if(message){reject(new Error(message));return;}
        resolve(window.SCRIPT_FULL);
      }
      script.src='assets/scripts-full.js';
      if(window.WikiCache)script.src=window.WikiCache.asset(script.src);
      script.onload=function(){
        if(window.SCRIPT_FULL_BUILD!==LIBRARY_BUILD){finish('目录与剧本原文版本不一致，请重新生成数据并刷新页面。');return;}
        if(!Array.isArray(window.SCRIPT_FULL)||!window.SCRIPT_FULL.length||window.SCRIPT_FULL.length!==SCRIPTS.length){
          finish('剧本原文与目录不匹配，请恢复同一版本的数据文件。');return;
        }
        finish();
      };
      script.onerror=function(){finish('加载剧本原文失败，请检查 assets/scripts-full.js 是否存在后重试。');};
      document.head.appendChild(script);
    }).then(function(data){FULL=data;FULL_LOADING=false;expTip('');return data;},function(error){
      FULL=null;fullRequest=null;FULL_LOADING=false;expTip('');throw error;
    });
  }
  fullRequest.then(function(){cb();},function(error){err(error.message);});
}
// Content-addressed resources work on HTTPS and file:// alike. Concurrent callers
// share each request; bounded concurrency avoids flooding the browser on export.
var originalRequests=new Map(),originalQueue=[],originalActive=0;
function requestOriginal(key){
  var cache=window.SCRIPT_ORIGINALS||{},cached=Object.prototype.hasOwnProperty.call(cache,key)&&cache[key];
  if(cached&&typeof cached.f==='string'&&typeof cached.t==='string')return Promise.resolve(cached);
  if(originalRequests.has(key))return originalRequests.get(key);
  var promise=new Promise(function(resolve,reject){originalQueue.push({key:key,resolve:resolve,reject:reject});});
  originalRequests.set(key,promise);pumpOriginals();return promise;
}
function pumpOriginals(){
  while(originalActive<4&&originalQueue.length){
    (function(job){
      originalActive++;FULL_LOADING=true;
      var script=document.createElement('script'),done=false;
      var timer=setTimeout(function(){finish('加载剧本原文超时，请重试。');},30000);
      function finish(message,value){
        if(done)return;done=true;clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();
        originalRequests.delete(job.key);originalActive--;FULL_LOADING=originalActive>0||originalQueue.length>0;
        if(message)job.reject(Error(message));else job.resolve(value);pumpOriginals();
      }
      script.src='assets/data/originals/'+job.key+'.js';
      if(window.WikiCache)script.src=window.WikiCache.asset(script.src);
      script.onload=function(){var cache=window.SCRIPT_ORIGINALS||{},value=Object.prototype.hasOwnProperty.call(cache,job.key)&&cache[job.key];
        if(!value||typeof value.f!=='string'||typeof value.t!=='string'){finish('剧本原文资源无效，请重新生成目录后重试。');return;}
        finish('',value);
      };
      script.onerror=function(){finish('加载剧本原文失败，请重试。');};document.head.appendChild(script);
    })(originalQueue.shift());
  }
}
function loadFull(cb,err,indices){
  // Old offline packages retain their paired resource; current catalogs never
  // use the full-library fallback, even if an individual resource fails.
  if(SCRIPTS.some(function(s){return !s[12]||!Object.prototype.hasOwnProperty.call(s[12],'original');})){loadLegacyFull(cb,err);return;}
  var selected=Array.from(new Set(Array.isArray(indices)?indices:SCRIPTS.map(function(s,i){return i;})));
  if(!FULL)FULL=new Array(SCRIPTS.length);
  var pending=selected.filter(function(i){return SCRIPTS[i]&&SCRIPTS[i][12].original&&!FULL[i]&&!(typeof chosenVersions!=='undefined'&&chosenVersions[i]);});
  if(!pending.length){cb();return;}
  expTip('正在加载 '+pending.length+' 个剧本的原文…',true);
  Promise.all(pending.map(function(i){return requestOriginal(SCRIPTS[i][12].original).then(function(value){FULL[i]=value;});})).then(function(){if(!FULL_LOADING)expTip('');cb();},function(error){expTip('');err(error.message);});
}
// 连续点击只响应最后一次意图；捕获独立数组，避免加载期间被其他入口改写。
function requestDataDialog(kind,preset){
  scopeRequest++;
  var request=++dialogRequest,selection=Array.isArray(preset)?preset.slice():null;
  loadFull(function(){
    if(request!==dialogRequest)return;
    if(kind==='export'){
      jsonClose();expSel=selection;expDlgShow();
    }else{
      document.getElementById('expMask').className='';jsonSel=selection;jsonDlgShow();
    }
  },function(message){if(request===dialogRequest)alert(message);},selection||(typeof curIdxs==='function'?curIdxs():undefined));
}

var scopeRequest=0;
function refreshDataScope(owner){
  var revision=++scopeRequest,dialog=dialogRequest;
  var ids=owner==='json'?['jsonCopy','jsonDl']:['expGo','expDl'];
  ids.forEach(function(id){document.getElementById(id).disabled=true;});
  if(owner==='json')document.getElementById('jsonBox').value='';
  document.getElementById(owner==='json'?'jsonStat':'expStat').textContent='正在加载所选范围的原文…';
  function active(){return revision===scopeRequest&&dialog===dialogRequest&&expPickOwner===owner;}
  loadFull(function(){
    if(!active())return;ids.forEach(function(id){document.getElementById(id).disabled=false;});
    if(owner==='json')jsonRefresh();else{expUpdateImgHint();document.getElementById('expStat').textContent='';}
  },function(message){if(!active())return;document.getElementById(owner==='json'?'jsonStat':'expStat').textContent=message+' 可重新选择此范围重试。';},pickedIdxs());
}

var comparisonRequest=null;
function loadComparison(){
  if(typeof LIBRARY_COMPARE_ROLES!=='undefined'&&LIBRARY_COMPARE_BUILD===LIBRARY_BUILD)return Promise.resolve();
  if(!comparisonRequest)comparisonRequest=new Promise(function(resolve,reject){
    var script=document.createElement('script'),done=false,timer=setTimeout(function(){finish('比对资料加载超时，请重试。');},30000);
    function finish(message){if(done)return;done=true;clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();if(message)reject(Error(message));else resolve();}
    script.src='assets/data/comparison.js';
    if(window.WikiCache)script.src=window.WikiCache.asset(script.src);
    script.onload=function(){finish(typeof LIBRARY_COMPARE_ROLES!=='undefined'&&typeof LIBRARY_COMPARE_BUILD!=='undefined'&&LIBRARY_COMPARE_BUILD===LIBRARY_BUILD?'':'比对资料与目录版本不一致，请刷新后重试。');};
    script.onerror=function(){finish('比对资料加载失败，请重试。');};document.head.appendChild(script);
  }).catch(function(error){comparisonRequest=null;throw error;});return comparisonRequest;
}

// Promise<boolean>：只有浏览器确认完成后才返回 true。
async function copy(text,button){
  if(button.disabled)return false;
  var label=button.textContent;button.disabled=true;button.textContent='正在复制…';
  var copied=false;
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      try{await navigator.clipboard.writeText(text);copied=true;}catch(error){}
    }
    if(!copied){
      var textarea=document.createElement('textarea');
      textarea.value=text;textarea.setAttribute('aria-label','待复制文本');
      document.body.appendChild(textarea);
      try{textarea.focus();textarea.select();copied=!!document.execCommand('copy');}catch(error){}
      finally{textarea.remove();}
    }
    if(copied){
      button.textContent='已复制 ✓';
      setTimeout(function(){if(button.textContent==='已复制 ✓')button.textContent=label;},1200);
    }else{
      button.textContent=label;
      var dialog=document.getElementById('manualCopy'),box=document.getElementById('manualCopyText');
      if(typeof dialog.showModal==='function'){
        box.value=text;dialog.showModal();box.focus();box.select();
        dialog.onclose=function(){box.value='';if(button.isConnected)button.focus();};
      }else{window.prompt('自动复制失败，请手动选择并复制以下文本：',text);}
    }
    return copied;
  }finally{button.disabled=false;}
}
document.getElementById('manualCopyClose').onclick=function(){document.getElementById('manualCopy').close();};
document.getElementById('manualCopy').addEventListener('keydown',function(event){event.stopPropagation();});
