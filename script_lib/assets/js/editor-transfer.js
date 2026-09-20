function bindEditorTransfer(index){
 var button=document.getElementById('btn-edit-script');if(!button)return;
 var source=SCRIPTS_BY_INDEX[index];
 button.disabled=source[6]!=='json';
 if(button.disabled){button.textContent='暂无 JSON，无法编辑';return;}
 button.onclick=function(){
  var version=typeof chosenVersions!=='undefined'?chosenVersions[index]:null;
  var token=Array.from(crypto.getRandomValues(new Uint32Array(4))).map(function(x){return x.toString(16);}).join('-');
  var target=window.open('../script_tool/剧本工具.html#import='+token,'_blank');
  if(!target){alert('浏览器阻止了新窗口，请允许弹出窗口后重试。');return;}
  var payload=null,ready=false,done=false;button.disabled=true;button.textContent='正在准备剧本…';
  function finish(message){if(done)return;done=true;clearTimeout(timeout);window.removeEventListener('message',receive);button.disabled=false;button.textContent=message;}
  function send(){if(ready&&payload&&!done)target.postMessage({type:'wiki-script-payload',token:token,text:payload},'*');}
  function receive(event){
   if(event.source!==target||!event.data||event.data.token!==token)return;
   if(event.data.type==='wiki-script-ready'){ready=true;send();}
   if(event.data.type==='wiki-script-received')finish('已送达编辑器');
  }
  window.addEventListener('message',receive);
  var timeout=setTimeout(function(){finish('重新发送到编辑器');alert('传送超时，请重试或使用 JSON 导出、导入。');},60000);
  loadFull(function(){
   if(done)return;
   // Capture the originally selected version; do not silently import another version after async loading.
   if(SCRIPTS_BY_INDEX[index]!==source||(typeof chosenVersions!=='undefined'?chosenVersions[index]:null)!==version){finish('版本已改变，请重试');return;}
   var original=typeof selectedOriginal==='function'?selectedOriginal(index,FULL[index]):FULL[index];
   if(!original||typeof original.t!=='string'){finish('缺少剧本原文');return;}
   if(new Blob([original.t]).size>2*1024*1024){finish('剧本超过 2 MB，请手动处理');return;}
   payload=original.t;send();
  },function(message){finish('重试发送');alert(message);});
 };
}
