(function(root){
  'use strict';
  var button=document.getElementById('bDrafts');if(!button)return;
  var store;
  function message(error){status(error.message||'草稿操作失败，请导出当前 JSON 备份。');var node=document.getElementById('draftNotice');if(node)node.textContent=error.message||String(error);}
  function blank(){return {version:2,n:'',a:'',s:'free',custom:[],rules:[],meta:{},nightOverrides:{},sel:[]};}
  function checkpoint(){
    if(storageBlocked)throw new Error('旧存档尚未恢复，请先导出当前 JSON 备份');
    var snapshot=captureDraft();store.check();
    if(!root.ScriptDrafts.hasContent(snapshot))return;
    if(!CURRENT_DRAFT_ID)CURRENT_DRAFT_ID=store.create(snapshot);
    else store.update(CURRENT_DRAFT_ID,snapshot,true);
  }
  function replace(){checkpoint();store.activate(null);CURRENT_DRAFT_ID='';}
  function apply(identity,snapshot){
    // Validate before moving the active pointer or changing any editor fields.
    ScriptCore.restoreDraft(snapshot,CHARS);store.activate(identity);CURRENT_DRAFT_ID=identity;applyDraftState(snapshot);renderAll();
  }
  function time(value){return new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  function render(historyId){
    var list=store.list();
    openDlg('<h3>我的草稿</h3><p class="tip">保存在当前浏览器。修改自动保存；每份保留最近 5 个恢复点。换设备或清理浏览器前，请逐份导出 JSON。</p>'+
      '<div class="draft-actions"><button type="button" class="btn pri" id="draftCheckpoint">保存当前恢复点</button><button type="button" class="btn" id="draftNew">新建空白草稿</button><button type="button" class="btn" onclick="closeDlg()">关闭</button></div>'+
      '<p id="draftNotice" role="status" aria-live="polite"></p><div class="draft-list">'+
      (list.length?list.map(function(entry){return '<article class="draft-row"><div><strong>'+esc(entry.state.n||'未命名剧本')+'</strong>'+(entry.id===CURRENT_DRAFT_ID?'<span class="draft-current">正在编辑</span>':'')+'<p>'+entry.state.sel.length+' 个角色 · '+esc(time(entry.updatedAt))+'</p></div><div class="draft-actions">'+
        '<button type="button" class="btn" data-draft-action="open" data-draft-id="'+entry.id+'">打开</button><button type="button" class="btn" data-draft-action="copy" data-draft-id="'+entry.id+'">复制</button><button type="button" class="btn" data-draft-action="history" data-draft-id="'+entry.id+'">恢复点</button><button type="button" class="btn" data-draft-action="delete" data-draft-id="'+entry.id+'"'+(entry.id===CURRENT_DRAFT_ID?' disabled':'')+'>删除</button></div></article>';}).join(''):'<p>还没有已命名的草稿。填写名称或添加角色后会自动保存到这里。</p>')+'</div><div id="draftHistory"></div>');
    document.getElementById('draftCheckpoint').onclick=function(){try{checkpoint();render();document.getElementById('draftNotice').textContent='当前内容已保存为恢复点。';}catch(error){message(error);}};
    document.getElementById('draftNew').onclick=function(){try{replace();applyDraftState(blank());renderAll();closeDlg();document.getElementById('mname').focus();}catch(error){message(error);}};
    document.querySelectorAll('[data-draft-action]').forEach(function(control){control.onclick=function(){
      var identity=this.dataset.draftId,action=this.dataset.draftAction;
      try{
        if(action==='history'){render(identity);return;}
        if(action==='delete'){if(!confirm('删除“'+(store.get(identity).state.n||'未命名剧本')+'”及其恢复点？'))return;store.remove(identity);render();return;}
        checkpoint();var snapshot=store.get(identity).state;
        if(action==='copy'){identity=store.duplicate(identity);snapshot=store.get(identity).state;}
        apply(identity,snapshot);closeDlg();status('已打开“'+(snapshot.n||'未命名剧本')+'”，修改会自动保存。');
      }catch(error){message(error);}
    };});
    if(historyId){
      var entry=store.get(historyId),history=document.getElementById('draftHistory');
      var title=document.createElement('h4');title.textContent=(entry.state.n||'未命名剧本')+' · 恢复点';history.appendChild(title);
      entry.history.forEach(function(point){
        var row=document.createElement('div');row.className='draft-row';var label=document.createElement('span');label.textContent=time(point.at)+' · '+(point.state.n||'未命名剧本')+' · '+point.state.sel.length+' 个角色';
        var restore=document.createElement('button');restore.type='button';restore.className='btn';restore.textContent='恢复此版本';restore.dataset.pointId=point.id;
        restore.onclick=function(){
          if(!confirm('恢复这份草稿？当前版本会保留为恢复点。'))return;
          try{if(historyId!==CURRENT_DRAFT_ID)checkpoint();var snapshot=store.restore(historyId,point.id);apply(historyId,snapshot);closeDlg();status('已恢复草稿版本，恢复前的内容保留在恢复点中。');}catch(error){message(error);}
        };
        row.append(label,restore);history.appendChild(row);
      });
    }
  }
  try{
    if(storageBlocked)throw new Error('旧存档无法读取，草稿管理暂不可用；原存档已保留');
    store=root.ScriptDrafts.open(localStorage,function(value){ScriptCore.restoreDraft(value,CHARS);});
    if(CURRENT_DRAFT_ID)store.get(CURRENT_DRAFT_ID);
    var migrating=!CURRENT_DRAFT_ID&&root.ScriptDrafts.hasContent(captureDraft())&&!store.list().length;
    root.ScriptDraftUI={
      beforeReplace:replace,
      prepareSave:function(snapshot){
        store.check();snapshot.savedAt=Date.now();
        if(!CURRENT_DRAFT_ID&&root.ScriptDrafts.hasContent(snapshot)){CURRENT_DRAFT_ID=store.create(snapshot);snapshot.draftId=CURRENT_DRAFT_ID;}
        else if(CURRENT_DRAFT_ID)store.update(CURRENT_DRAFT_ID,snapshot,false);
      }
    };
    button.onclick=function(){try{render();}catch(error){message(error);}};
    var current=captureDraft();
    if(!root.ScriptDrafts.hasContent(current)&&store.active())apply(store.active(),store.get(store.active()).state);
    else save();
    if(migrating&&CURRENT_DRAFT_ID){
      root.SCRIPT_DRAFT_LEGACY_ID=CURRENT_DRAFT_ID;
      // Copy existing image notes during migration, even if the artwork dialog is not opened before reload.
      var roleKey=JSON.stringify(sel.filter(function(role){return role.t!=='traveller'&&role.t!=='traveler';}).map(function(role){return role.id;}).sort());
      var oldKey='botc_art_custom_jinx_v1:'+roleKey,newKey='botc_art_custom_jinx_v1:'+CURRENT_DRAFT_ID+':'+roleKey,notes=localStorage.getItem(oldKey);
      if(notes!==null&&localStorage.getItem(newKey)===null){try{localStorage.setItem(newKey,notes);}catch(error){status('草稿已迁移，但原制图相克暂未复制：'+error.message+'。请保留原浏览器数据并下载图片备份。');}}
    }
  }catch(error){
    // A damaged library must never be replaced with an empty library.
    button.onclick=function(){alert(error.message+'。重要内容请导出 JSON 备份。');};status(error.message);
  }
})(window);
