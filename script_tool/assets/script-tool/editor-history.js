(function(root){
  'use strict';
  var entries=[],index=-1,traveling=false,lastGroup='',lastAt=0;
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function key(state){var value=copy(state);delete value.savedAt;return JSON.stringify(value);}
  function refresh(){
    var undo=document.getElementById('bUndo'),redo=document.getElementById('bRedo');if(undo)undo.disabled=index<=0;if(redo)redo.disabled=index>=entries.length-1;
  }
  function reset(){entries=[copy(root.captureDraft())];index=0;lastGroup='';refresh();}
  function observe(state,group){
    if(traveling)return;
    if(index>=0&&key(entries[index])===key(state))return;
    var now=Date.now(),typing=['mname','mauthor'].includes(group);
    entries=entries.slice(0,index+1);
    if(typing&&index>0&&lastGroup===group&&now-lastAt<800)entries[index]=copy(state);
    else{entries.push(copy(state));index=entries.length-1;}
    var bytes=entries.reduce(function(n,s){return n+JSON.stringify(s).length*2;},0);
    while(entries.length>50||entries.length>2&&bytes>16*1024*1024){bytes-=JSON.stringify(entries.shift()).length*2;index--;}
    lastGroup=typing?group:'';lastAt=now;refresh();
  }
  function travel(delta){
    var target=index+delta;if(target<0||target>=entries.length||traveling)return false;
    try{
      var snapshot=copy(entries[target]);root.ScriptCore.restoreDraft(snapshot,root.CHARS);
      if(root.storageBlocked||!root.ScriptDraftUI)throw Error('草稿存储不可用，请先导出备份');
      snapshot=root.ScriptDraftUI.restoreEditor(snapshot);traveling=true;root.applyDraftState(snapshot);root.renderAll();entries[target]=copy(snapshot);index=target;lastGroup='';refresh();root.status((delta<0?'已撤销':'已重做')+' · 当前剧本已自动保存');return true;
    }catch(error){root.status('无法'+(delta<0?'撤销':'重做')+'：'+error.message);return false;}
    finally{traveling=false;}
  }
  root.ScriptEditorHistory={observe:observe,reset:reset,undo:function(){return travel(-1);},redo:function(){return travel(1);}};
  var undo=document.getElementById('bUndo'),redo=document.getElementById('bRedo');if(undo)undo.onclick=root.ScriptEditorHistory.undo;if(redo)redo.onclick=root.ScriptEditorHistory.redo;
  document.addEventListener('keydown',function(event){
    if(event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey)||document.querySelector('dialog[open]'))return;
    var target=event.target;if(target.closest&&target.closest('input,textarea,select,[contenteditable="true"]'))return;
    var key=event.key.toLowerCase();if(key==='z'||key==='y'){event.preventDefault();travel(key==='y'||event.shiftKey?1:-1);}
  });reset();
})(window);
