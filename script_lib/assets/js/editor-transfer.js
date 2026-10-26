function bindGrimoireTransfer(index){
 var button=document.getElementById('btn-grimoire-script');if(!button)return;
 var source=SCRIPTS_BY_INDEX[index];button.disabled=source[6]!=='json';
 if(button.disabled){button.textContent='暂无 JSON，无法开魔典';return;}
 button.onclick=function(){
  var version=typeof chosenVersions!=='undefined'?chosenVersions[index]:null;
  var sourceChoice=typeof librarySourceChoices!=='undefined'?librarySourceChoices.get(scriptFamilyKey(source)):null;
  // Open synchronously so mobile browsers keep the user's click gesture.
  var target=window.open('about:blank','_blank');
  if(!target){alert('浏览器阻止了新窗口，请允许弹出窗口后重试。');return;}
  target.opener=null;target.document.title='正在准备魔典';target.document.body.textContent='正在读取选中的剧本版本，请稍候…';
  var done=false;button.disabled=true;button.textContent='正在准备剧本…';
  function fail(message){if(done)return;done=true;clearTimeout(timer);button.disabled=false;button.textContent='重试打开魔典';try{if(!target.closed&&target.location.href==='about:blank')target.close();}catch(ignore){}alert(message);}
  var timer=setTimeout(function(){fail('读取剧本超时，请重试。');},60000);
  loadFull(function(){
   if(done)return;
   if(target.closed){done=true;clearTimeout(timer);button.disabled=false;button.textContent='用此剧本开魔典';return;}
   if(document.getElementById('btn-grimoire-script')!==button||SCRIPTS_BY_INDEX[index]!==source||(typeof chosenVersions!=='undefined'?chosenVersions[index]:null)!==version||(typeof librarySourceChoices!=='undefined'?librarySourceChoices.get(scriptFamilyKey(source)):null)!==sourceChoice){fail('选中的剧本或版本已变化，请重新点击打开魔典。');return;}
   var pending;
   try{
    var original=typeof selectedOriginal==='function'?selectedOriginal(index,FULL[index]):FULL[index];
    if(!original||typeof original.t!=='string')throw Error('缺少此版本的剧本 JSON 原文');
    if(new Blob([original.t]).size>2*1024*1024)throw Error('剧本超过 2 MB，请下载 JSON 后在魔典导入');
    pending=window.ToolTransfer.prepare('grimoire',JSON.parse(original.t.replace(/^\uFEFF/,'')));
    target.location.replace(pending.url);done=true;clearTimeout(timer);button.disabled=false;button.textContent='再次打开魔典';
   }catch(error){if(pending)pending.cancel();fail('无法打开魔典：'+error.message);}
  },function(message){fail(message||'读取剧本失败，请重试。');},[index]);
 };
}
function bindEditorTransfer(index){
 var button=document.getElementById('btn-edit-script');if(!button)return;
 var source=SCRIPTS_BY_INDEX[index];
 button.disabled=source[6]!=='json';
 if(button.disabled){button.textContent='暂无 JSON，无法编辑';return;}
 button.onclick=function(){
  var version=typeof chosenVersions!=='undefined'?chosenVersions[index]:null;
  var sourceChoice=typeof librarySourceChoices!=='undefined'?librarySourceChoices.get(scriptFamilyKey(source)):null;
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
   if(SCRIPTS_BY_INDEX[index]!==source||(typeof chosenVersions!=='undefined'?chosenVersions[index]:null)!==version||(typeof librarySourceChoices!=='undefined'?librarySourceChoices.get(scriptFamilyKey(source)):null)!==sourceChoice){finish('版本已改变，请重试');return;}
   var original=typeof selectedOriginal==='function'?selectedOriginal(index,FULL[index]):FULL[index];
   if(!original||typeof original.t!=='string'){finish('缺少剧本原文');return;}
   if(new Blob([original.t]).size>2*1024*1024){finish('剧本超过 2 MB，请手动处理');return;}
   payload=original.t;send();
  },function(message){finish('重试发送');alert(message);},[index]);
 };
}
