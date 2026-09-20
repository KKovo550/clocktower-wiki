(function(){
 var token=new URLSearchParams(location.hash.slice(1)).get('import');
 if(!token||!window.opener)return;
 var sender=window.opener,received=false;
 var notice=document.createElement('div');notice.className='workflow-import';notice.setAttribute('role','status');notice.textContent='正在接收剧本库的剧本，当前草稿不会自动替换。';document.querySelector('.script-editor').prepend(notice);
 function ready(){if(!received)sender.postMessage({type:'wiki-script-ready',token:token},'*');}
 var timer=setInterval(ready,500),timeout=setTimeout(function(){clearInterval(timer);if(!received){notice.textContent='未收到剧本，请返回剧本库重试；当前草稿未改变。';window.removeEventListener('message',receive);}},65000);
 function receive(event){
  if(received||event.source!==sender||!event.data||event.data.type!=='wiki-script-payload'||event.data.token!==token)return;
  received=true;clearInterval(timer);clearTimeout(timeout);window.removeEventListener('message',receive);
  sender.postMessage({type:'wiki-script-received',token:token},'*');
  try{
   if(typeof event.data.text!=='string'||new Blob([event.data.text]).size>2*1024*1024)throw Error('剧本大小无效');
   var data=ScriptCore.parseJSON(event.data.text),parsed=ScriptCore.parseImport(data,CHARS);
   notice.textContent='已收到「'+(parsed.name||'未命名剧本')+'」，共 '+parsed.selected.length+' 个角色。';
   var hint=document.createElement('p');hint.textContent='导入会替换当前编辑内容。若要保留当前草稿，请先导出。仅支持标准角色字段，扩展元数据不会保留。';notice.appendChild(hint);
   var apply=document.createElement('button');apply.className='btn pri';apply.textContent='确认载入此剧本';notice.appendChild(apply);
   var cancel=document.createElement('button');cancel.className='btn';cancel.textContent='保留当前草稿';notice.appendChild(cancel);
   apply.onclick=function(){try{if(doImport(data)===false)return;notice.remove();history.replaceState(null,'',location.pathname+location.search);}catch(error){alert(error.message);}};
   cancel.onclick=function(){notice.remove();history.replaceState(null,'',location.pathname+location.search);};
  }catch(error){notice.textContent='无法导入：'+error.message+'。当前草稿未改变，请回到剧本库查看原文。';}
 }
 window.addEventListener('message',receive);ready();
})();
