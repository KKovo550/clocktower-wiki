// 共享原文请求；失败清除缓存，下一次用户操作可重新加载。
var fullRequest=null,dialogRequest=0;
function loadFull(cb,err){
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
// 连续点击只响应最后一次意图；捕获独立数组，避免加载期间被其他入口改写。
function requestDataDialog(kind,preset){
  var request=++dialogRequest,selection=Array.isArray(preset)?preset.slice():null;
  loadFull(function(){
    if(request!==dialogRequest)return;
    if(kind==='export'){
      jsonClose();expSel=selection;expDlgShow();
    }else{
      document.getElementById('expMask').className='';jsonSel=selection;jsonDlgShow();
    }
  },function(message){if(request===dialogRequest)alert(message);});
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
