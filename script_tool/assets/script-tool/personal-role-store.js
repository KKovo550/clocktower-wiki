/* Independent role definitions and immutable versions; scripts keep snapshots. */
(function(root){
  'use strict';
  var roleLimit=200,versionLimit=20,key='botc_personal_roles_v1';
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(function(k){return JSON.stringify(k)+':'+stable(value[k]);}).join(',')+'}';return JSON.stringify(value);}
  function raw(role){return Object.assign(Object.create(null),role.raw||{},{id:role.id,name:role.n,team:role.t,ability:role.ab,image:role.images||role.iu||role.im||'',edition:role.ed||'',flavor:role.fl||'',setup:!!role.s,firstNight:role.f||0,otherNight:role.o||0,firstNightReminder:role.fr||'',otherNightReminder:role.or||'',reminders:role.r||[],remindersGlobal:role.rg||[]});}
  function definition(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('角色资料格式错误');
    var result=raw(root.ScriptCore.normalize(value));
    if(!root.ScriptCore.identity(result.id))throw Error('角色 ID 无效');
    if(JSON.stringify(result).length>220000)throw Error('单个角色资料过大，请缩减图片或附加资料');
    return result;
  }
  function validate(entry){
    if(!entry||typeof entry.key!=='string'||!Number.isInteger(entry.revision)||entry.revision<1||!Array.isArray(entry.versions)||!entry.versions.length||entry.versions.length>versionLimit)throw Error('个人角色库记录无效，原资料已保留');
    var previous=0;entry.versions.forEach(function(v){if(!Number.isInteger(v.version)||v.version<=previous||!Number.isFinite(v.at)||typeof v.reason!=='string'||root.ScriptCore.identity(definition(v.raw).id)!==entry.key)throw Error('角色版本资料无效，原资料已保留');previous=v.version;});
    if(previous!==entry.revision)throw Error('角色版本编号无效');return entry;
  }
  function summary(entry){validate(entry);return {key:entry.key,revision:entry.revision,count:entry.versions.length,latest:copy(entry.versions[entry.versions.length-1])};}
  function localBackend(storage){
    function readAll(){var text=storage.getItem(key),data=text?JSON.parse(text):{version:1,entries:[]};if(!data||data.version!==1||!Array.isArray(data.entries)||data.entries.length>roleLimit||new Set(data.entries.map(function(e){return e.key;})).size!==data.entries.length)throw Error('个人角色库格式错误，原资料已保留');data.entries.forEach(validate);return data;}
    return {mode:'备用浏览器存储',list:async function(){return readAll().entries.map(summary);},read:async function(id){return copy(readAll().entries.find(function(e){return e.key===id;})||null);},
      put:async function(entry,expected){var data=readAll(),index=data.entries.findIndex(function(e){return e.key===entry.key;}),current=data.entries[index];if((current?current.revision:0)!==expected)throw Error('此角色已在其他页面更新，请重新加载版本');if(index<0&&data.entries.length>=roleLimit)throw Error('个人角色库最多收录 '+roleLimit+' 个角色');validate(entry);if(index<0)data.entries.push(entry);else data.entries[index]=entry;storage.setItem(key,JSON.stringify(data));return copy(entry);},
      remove:async function(id,expected){var data=readAll(),entry=data.entries.find(function(e){return e.key===id;});if(!entry||entry.revision!==expected)throw Error('角色版本已更新，请重新加载');data.entries=data.entries.filter(function(e){return e.key!==id;});storage.setItem(key,JSON.stringify(data));},
      replaceEntries:async function(entries,expected){var data=readAll();if(stable(data.entries)!==stable(expected))throw Error('个人角色库已更新，请重新预览备份');storage.setItem(key,JSON.stringify({version:1,entries:entries}));},
      importEntries:async function(entries){var data=readAll(),added=entries.filter(function(entry){return !data.entries.some(function(current){return current.key===entry.key;});});if(data.entries.length+added.length>roleLimit)throw Error('导入后会超过 '+roleLimit+' 个角色');data.entries=data.entries.concat(added);storage.setItem(key,JSON.stringify(data));return added.length;}};
  }
  function indexedBackend(){return new Promise(function(resolve,reject){
    var request=root.indexedDB.open('botc_personal_roles',1),ended=false,timer=root.setTimeout(function(){ended=true;reject(Error('个人角色数据库暂不可用，请保留剧本 JSON 后重试'));},5000);
    request.onupgradeneeded=function(){if(!request.result.objectStoreNames.contains('roles'))request.result.createObjectStore('roles',{keyPath:'key'});};
    request.onerror=function(){root.clearTimeout(timer);reject(Error('无法打开个人角色库：'+(request.error&&request.error.message||'数据库不可用')));};
    request.onsuccess=function(){root.clearTimeout(timer);var db=request.result;if(ended){db.close();return;}db.onversionchange=function(){db.close();};
      function read(id){return new Promise(function(r,j){var tx=db.transaction('roles','readonly'),req=tx.objectStore('roles').get(id);req.onsuccess=function(){try{r(req.result?copy(validate(req.result)):null);}catch(e){j(e);}};req.onerror=function(){j(req.error);};});}
      resolve({mode:'浏览器数据库',read:read,list:function(){return new Promise(function(r,j){var tx=db.transaction('roles','readonly'),req=tx.objectStore('roles').openCursor(),result=[];req.onsuccess=function(){try{var cursor=req.result;if(!cursor){r(result);return;}result.push(summary(cursor.value));cursor.continue();}catch(e){j(e);tx.abort();}};req.onerror=function(){j(req.error);};});},
        replaceEntries:function(entries,expected){return new Promise(function(r,j){var tx=db.transaction('roles','readwrite'),store=tx.objectStore('roles'),req=store.getAll(),problem;req.onsuccess=function(){if(stable(req.result.slice().sort(function(a,b){return a.key.localeCompare(b.key);}))!==stable(expected.slice().sort(function(a,b){return a.key.localeCompare(b.key);}))){problem=Error('个人角色库已更新，请重新预览备份');tx.abort();return;}store.clear();entries.forEach(function(entry){store.put(entry);});};tx.oncomplete=function(){r();};tx.onabort=tx.onerror=function(){j(problem||tx.error||Error('个人角色库恢复失败'));};});},
        remove:function(id,expected){return new Promise(function(r,j){var tx=db.transaction('roles','readwrite'),store=tx.objectStore('roles'),req=store.get(id),problem;req.onsuccess=function(){if(!req.result||req.result.revision!==expected){problem=Error('角色版本已更新，请重新加载');tx.abort();return;}store.delete(id);};tx.oncomplete=function(){r();};tx.onerror=tx.onabort=function(){j(problem||tx.error||Error('移出角色库失败'));};});},
        importEntries:function(entries){return new Promise(function(r,j){var tx=db.transaction('roles','readwrite'),store=tx.objectStore('roles'),keys=store.getAllKeys(),added=[],problem;keys.onsuccess=function(){added=entries.filter(function(entry){return !keys.result.includes(entry.key);});if(keys.result.length+added.length>roleLimit){problem=Error('导入后会超过 '+roleLimit+' 个角色');tx.abort();return;}added.forEach(function(entry){store.add(entry);});};tx.oncomplete=function(){r(added.length);};tx.onerror=tx.onabort=function(){j(problem||tx.error||Error('角色库备份导入失败'));};});},
        put:function(entry,expected){return new Promise(function(r,j){
        validate(entry);var tx=db.transaction('roles','readwrite'),store=tx.objectStore('roles'),req=store.get(entry.key),count=store.count(),problem,loaded=false,counted=false;
        function save(){if(!loaded||!counted)return;if((req.result?req.result.revision:0)!==expected){problem=Error('此角色已在其他页面更新，请重新加载版本');tx.abort();return;}if(!req.result&&count.result>=roleLimit){problem=Error('个人角色库最多收录 '+roleLimit+' 个角色');tx.abort();return;}store.put(entry);}
        req.onsuccess=function(){loaded=true;save();};count.onsuccess=function(){counted=true;save();};tx.oncomplete=function(){r(copy(entry));};tx.onabort=tx.onerror=function(){j(problem||tx.error||Error('个人角色库保存失败'));};
      });}});
    };
  });}
  function open(options){
    options=options||{};var backend=options.backend?Promise.resolve(options.backend):root.indexedDB?indexedBackend():Promise.resolve(localBackend(options.storage||root.localStorage)),tail=Promise.resolve(),clock=options.clock||Date.now;
    backend.catch(function(){});
    // Serialize this page's edits. The backend also checks revisions across pages.
    function enqueue(operation){var job=tail.then(function(){return backend;}).then(operation);tail=job.catch(function(){});return job.catch(function(error){if(error&&(error.name==='QuotaExceededError'||error.code===22))throw Error('浏览器存储空间不足，个人角色库未保存。请先导出备份，再清理不需要的资料后重试。');throw error;});}
    function record(db,value,reason,expected){return (async function(){var valueRaw=definition(value),id=root.ScriptCore.identity(valueRaw.id),entry=await db.read(id);
      if(expected!==undefined&&(entry?entry.revision:0)!==expected)throw Error('角色版本已更新，请重新加载后比较');
      if(entry&&stable(entry.versions[entry.versions.length-1].raw)===stable(valueRaw)&&reason!=='restore')return copy(entry);
      var version=entry?entry.revision+1:1,next={key:id,revision:version,versions:(entry?entry.versions:[]).concat([{version:version,at:clock(),reason:reason||'save',raw:valueRaw}]).slice(-versionLimit)};
      return db.put(next,entry?entry.revision:0);
    })();}
    return {list:function(){return enqueue(function(db){return db.list();});},read:function(id){return enqueue(function(db){return db.read(root.ScriptCore.identity(id));});},
      save:function(value,reason,expected){return enqueue(function(db){return record(db,value,reason,expected);});},
      restore:function(id,version,expected){return enqueue(async function(db){var entry=await db.read(root.ScriptCore.identity(id));if(!entry||entry.revision!==expected)throw Error('角色版本已更新，请重新加载后恢复');var point=entry.versions.find(function(v){return v.version===version;});if(!point)throw Error('找不到这个版本');return record(db,point.raw,'restore',expected);});},
      remove:function(id,expected){return enqueue(function(db){return db.remove(root.ScriptCore.identity(id),expected);});},
      importBackup:function(bundle){return enqueue(function(db){if(!bundle||bundle.version!==1||!Array.isArray(bundle.entries)||bundle.entries.length>roleLimit||new Set(bundle.entries.map(function(e){return e.key;})).size!==bundle.entries.length)throw Error('个人角色库备份格式错误');var entries=copy(bundle.entries);entries.forEach(validate);return db.importEntries(entries);});},
      replaceBackup:function(bundle,expected){return enqueue(function(db){validateBackup(bundle);validateBackup(expected);return db.replaceEntries(copy(bundle.entries),copy(expected.entries));});},
      collect:function(items){return enqueue(async function(db){
        var known=new Set((await db.list()).map(function(e){return e.key;})),groups=new Map();
        items.forEach(function(item){var value=definition(item.raw),id=root.ScriptCore.identity(value.id);if(known.has(id))return;var entry=groups.get(id)||{key:id,revision:0,versions:[]},last=entry.versions[entry.versions.length-1];if(last&&stable(last.raw)===stable(value))return;entry.revision++;entry.versions.push({version:entry.revision,at:Number.isFinite(item.at)?item.at:clock(),reason:'import',raw:value});entry.versions=entry.versions.slice(-versionLimit);groups.set(id,entry);});
        return db.importEntries(Array.from(groups.values()));
      });},
      backup:function(){return enqueue(async function(db){var records=await db.list(),entries=[];for(var item of records)entries.push(await db.read(item.key));return {version:1,exportedAt:clock(),entries:entries};});}
    };
  }
  function changes(before,after){var a=before?definition(before):{},b=definition(after),keys=new Set(Object.keys(a).concat(Object.keys(b)));return Array.from(keys).filter(function(k){return stable(a[k])!==stable(b[k]);}).map(function(k){return {key:k,before:copy(a[k]===undefined?null:a[k]),after:copy(b[k]===undefined?null:b[k])};});}
  function replaceDraft(state,value,chars){
    var next=copy(state),id=root.ScriptCore.identity(value.id),matches=next.custom.filter(function(c){return root.ScriptCore.identity(c.id)===id;});if(matches.length!==1)throw Error('这份剧本没有唯一匹配的自制角色');
    var original=matches[0],role=root.ScriptCore.normalize(Object.assign({},definition(value),{id:original.id}));
    next.custom=next.custom.map(function(c){return c===original?role:c;});next.sel=next.sel.map(function(c){return c&&typeof c==='object'&&root.ScriptCore.identity(c.id)===id?Object.assign({},c,{name:role.n,custom:true}):c;});root.ScriptCore.restoreDraft(next,chars);return next;
  }
  function validateBackup(bundle){if(!bundle||bundle.version!==1||!Array.isArray(bundle.entries)||bundle.entries.length>roleLimit||new Set(bundle.entries.map(function(e){return e&&e.key;})).size!==bundle.entries.length)throw Error('个人角色库备份格式错误');bundle.entries.forEach(validate);}
  root.ScriptPersonalRoleStore={open:open,localBackend:localBackend,definition:definition,raw:raw,changes:changes,replaceDraft:replaceDraft,validateBackup:validateBackup,roleLimit:roleLimit,versionLimit:versionLimit};
})(window);
