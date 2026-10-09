(function(root){
  'use strict';
  var key='botc_script_drafts_v1',limit=50,historyLimit=5;
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function content(state){return !!(state.n||state.a||state.sel.length||state.custom.length||(state.rules||[]).length);}
  function signature(state){var value=copy(state);delete value.savedAt;delete value.draftId;return JSON.stringify(value);}
  function open(storage,validate,options){
    options=options||{};
    var clock=options.clock||Date.now,sequence=0;
    function id(){return 'draft_'+clock().toString(36)+'_'+(++sequence)+'_'+Math.random().toString(36).slice(2,9);}
    var raw=storage.getItem(key),data=raw?JSON.parse(raw):{version:1,activeId:null,drafts:[]};
    function state(value){validate(value);return copy(value);}
    if(!data||data.version!==1||!Array.isArray(data.drafts)||data.drafts.length>limit)throw new Error('草稿列表格式错误，原存档已保留');
    var seen=new Set();
    data.drafts.forEach(function(entry){
      if(!entry||typeof entry.id!=='string'||!/^draft_[a-z0-9_]+$/i.test(entry.id)||seen.has(entry.id)||!Number.isFinite(entry.updatedAt)||!Array.isArray(entry.history)||entry.history.length>historyLimit)throw new Error('草稿列表包含无效记录，原存档已保留');
      seen.add(entry.id);state(entry.state);
      var checkpoints=new Set();
      entry.history.forEach(function(point){if(!point||typeof point.id!=='string'||checkpoints.has(point.id)||!Number.isFinite(point.at))throw new Error('草稿恢复点格式错误');checkpoints.add(point.id);state(point.state);});
    });
    if(data.activeId!==null&&!seen.has(data.activeId))throw new Error('当前草稿标识无效，原存档已保留');
    function check(){if(storage.getItem(key)!==raw)throw new Error('草稿列表已在另一页面更新，请先导出当前 JSON，再刷新页面');}
    function commit(change){
      check();var next=copy(data),result=change(next),encoded=JSON.stringify(next);
      storage.setItem(key,encoded);data=next;raw=encoded;return copy(result===undefined?null:result);
    }
    function find(next,identity){var entry=next.drafts.find(function(d){return d.id===identity;});if(!entry)throw new Error('找不到这份草稿');return entry;}
    function checkpoint(entry,value){
      var last=entry.history[0];
      if(!last||signature(last.state)!==signature(value))entry.history.unshift({id:id(),at:clock(),state:state(value)});
      entry.history=entry.history.slice(0,historyLimit);
    }
    function create(value){
      var snapshot=state(value);
      return commit(function(next){
        if(next.drafts.length>=limit)throw new Error('最多保存 '+limit+' 份草稿，请先导出并删除不再需要的草稿');
        var identity=id(),time=clock();snapshot.draftId=identity;snapshot.savedAt=time;
        var entry={id:identity,createdAt:time,updatedAt:time,state:snapshot,history:[]};
        checkpoint(entry,snapshot);next.drafts.unshift(entry);next.activeId=identity;return identity;
      });
    }
    function update(identity,value,savePoint){
      var snapshot=state(value);snapshot.draftId=identity;snapshot.savedAt=clock();
      return commit(function(next){var entry=find(next,identity);entry.state=snapshot;entry.updatedAt=clock();if(savePoint)checkpoint(entry,snapshot);return entry;});
    }
    function importState(identity,previous,value,mode){
      if(mode!=='append'&&mode!=='replace')throw new Error('未知导入方式');
      var before=state(previous),after=state(value);
      return commit(function(next){
        var current=identity?find(next,identity):null,time=clock();
        function assign(entry,snapshot){snapshot.draftId=entry.id;snapshot.savedAt=time;entry.state=snapshot;entry.updatedAt=time;}
        function insert(snapshot){
          if(next.drafts.length>=limit)throw new Error('最多保存 '+limit+' 份草稿，请先导出并删除不再需要的草稿');
          var entry={id:id(),createdAt:time,updatedAt:time,state:null,history:[]};assign(entry,snapshot);next.drafts.unshift(entry);return entry;
        }
        if(mode==='append'){
          var target=current||insert(copy(before));
          if(content(before))checkpoint(target,before);
          assign(target,after);next.activeId=target.id;return target.id;
        }
        // The old checkpoint and new active draft are written together or not at all.
        if(current){assign(current,before);checkpoint(current,before);}
        else if(content(before)){var backup=insert(before);checkpoint(backup,before);}
        var created=insert(after);checkpoint(created,after);next.activeId=created.id;return created.id;
      });
    }
    return {
      check:check,
      list:function(){return copy(data.drafts).sort(function(a,b){return b.updatedAt-a.updatedAt;});},
      get:function(identity){return copy(find(data,identity));},
      active:function(){return data.activeId;},
      create:create,update:update,importState:importState,
      activate:function(identity){return commit(function(next){if(identity!==null)find(next,identity);next.activeId=identity;});},
      duplicate:function(identity){var snapshot=copy(find(data,identity).state);snapshot.n=(snapshot.n||'未命名剧本')+'（副本）';return create(snapshot);},
      restore:function(identity,pointId){
        var entry=find(data,identity),point=entry.history.find(function(p){return p.id===pointId;});if(!point)throw new Error('找不到这个恢复点');
        var snapshot=state(point.state);snapshot.draftId=identity;snapshot.savedAt=clock();
        return commit(function(next){var target=find(next,identity);checkpoint(target,target.state);target.state=snapshot;target.updatedAt=clock();next.activeId=identity;return snapshot;});
      },
      remove:function(identity){return commit(function(next){if(next.activeId===identity)throw new Error('请先切换或新建草稿，再删除当前草稿');find(next,identity);next.drafts=next.drafts.filter(function(d){return d.id!==identity;});});}
    };
  }
  root.ScriptDrafts={open:open,hasContent:content};
})(window);
