(function(root){
  'use strict';
  var database,queue=Promise.resolve(),fallbackKey='botc_art_workspace_v1',lastStamp=0;
  function open(){
    if(!database)database=new Promise(function(resolve){
      if(!root.indexedDB){resolve(null);return;}
      var done=false,request,timer=setTimeout(function(){finish(null);},5000);
      function finish(db){if(done){if(db)db.close();return;}done=true;clearTimeout(timer);resolve(db);}
      try{request=root.indexedDB.open('botc_art_workspace',2);}catch(error){finish(null);return;}
      request.onupgradeneeded=function(){
        var store=request.result.objectStoreNames.contains('records')?request.transaction.objectStore('records'):request.result.createObjectStore('records',{keyPath:'key'});
        if(!store.indexNames.contains('kind'))store.createIndex('kind','kind');
        if(!store.indexNames.contains('recent'))store.createIndex('recent',['kind','savedAt']);
      };
      request.onsuccess=function(){var db=request.result;db.onversionchange=function(){db.close();database=null;};finish(db);};
      request.onerror=request.onblocked=function(){finish(null);};
    });return database;
  }
  function fallbackRecords(){var value=JSON.parse(root.localStorage.getItem(fallbackKey)||'[]');if(!Array.isArray(value))throw Error('制图存档格式损坏，请先备份浏览器数据。');return value;}
  function transaction(db,mode,action){
    return new Promise(function(resolve,reject){
      var tx=db.transaction('records',mode),result,failure;
      tx.oncomplete=function(){resolve(result);};tx.onerror=tx.onabort=function(){reject(failure||tx.error||Error('无法访问制图存档'));};
      try{action(tx.objectStore('records'),function(value){result=value;},function(error){failure=error;tx.abort();});}catch(error){failure=error;tx.abort();}
    });
  }
  function mutate(local,remote){
    var job=queue.catch(function(){}).then(async function(){var db=await open();if(db)return transaction(db,'readwrite',remote);root.localStorage.setItem(fallbackKey,JSON.stringify(local(fallbackRecords())));});queue=job;return job;
  }
  root.ScriptArtSettings={
    backup:async function(){await queue.catch(function(){});var db=await open();return db?transaction(db,'readonly',function(store,set){var request=store.getAll();request.onsuccess=function(){set(request.result);};}):fallbackRecords();},
    replaceRecords:function(records,expected){
      function signature(all){return JSON.stringify(all.slice().sort(function(a,b){return a.key.localeCompare(b.key);}));}
      return mutate(function(all){if(signature(all)!==signature(expected))throw Error('制图存档已更新，请重新预览备份');return records;},function(store,set,abort){var request=store.getAll();request.onsuccess=function(){if(signature(request.result)!==signature(expected)){abort(Error('制图存档已更新，请重新预览备份'));return;}store.clear();records.forEach(function(record){store.put(record);});};});
    },
    list:async function(kind){
      await queue.catch(function(){});var db=await open(),all=db?await transaction(db,'readonly',function(store,set){var request=store.index('kind').getAll(kind);request.onsuccess=function(){set(request.result);};}):fallbackRecords();
      return all.filter(function(r){return r&&r.version===1&&r.kind===kind;}).sort(function(a,b){return b.savedAt-a.savedAt;});
    },
    read:async function(key){
      await queue.catch(function(){});var db=await open(),record=db?await transaction(db,'readonly',function(store,set){var request=store.get(key);request.onsuccess=function(){set(request.result);};}):fallbackRecords().find(function(r){return r&&r.key===key;});
      return record&&record.version===1?record:null;
    },
    write:function(key,kind,name,value){
      lastStamp=Math.max(Date.now(),lastStamp+1);var record={version:1,key:key,kind:kind,name:String(name||'').slice(0,48),savedAt:lastStamp,value:value};
      return mutate(function(all){
        var next=all.filter(function(r){return r&&r.key!==key;});next.push(record);var same=next.filter(function(r){return r.kind===kind;}).sort(function(a,b){return b.savedAt-a.savedAt;});
        if(kind==='template'&&same.length>12)throw Error('最多保存 12 个个人方案，请先删除不需要的方案。');
        var keep=new Set(same.slice(0,kind==='draft'?8:12).map(function(r){return r.key;}));return next.filter(function(r){return r.kind!==kind||keep.has(r.key);});
      },function(store,set,abort){
        var count=store.index('kind').count(kind),existing=store.getKey(key),ready=0;
        function write(){if(++ready!==2)return;if(kind==='template'&&count.result>=12&&!existing.result){abort(Error('最多保存 12 个个人方案，请先删除不需要的方案。'));return;}
          store.put(record);
          // Prune by index keys; autosave never reads or clones other drafts' uploaded images.
          if(kind==='draft'){var request=store.index('recent').openKeyCursor(root.IDBKeyRange.bound([kind,0],[kind,Number.MAX_SAFE_INTEGER]),'prev'),seen=0;request.onsuccess=function(){var cursor=request.result;if(!cursor)return;if(seen++>=8)store.delete(cursor.primaryKey);cursor.continue();};}
        }
        count.onsuccess=existing.onsuccess=write;
      });
    },
    remove:function(key){return mutate(function(all){return all.filter(function(r){return r.key!==key;});},function(store){store.delete(key);});}
  };
})(typeof window==='undefined'?globalThis:window);
