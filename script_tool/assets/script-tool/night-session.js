// Independent, versioned storyteller sessions. Never write to editor drafts.
(function(root){
  'use strict';
  var kind='clocktower-night-session',key='botc_night_session_v1';
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function byteLength(value){return root.TextEncoder?new root.TextEncoder().encode(value).length:encodeURIComponent(value).replace(/%[a-f\d]{2}|./gi,'x').length;}
  function fresh(script,source){return {kind:kind,version:1,script:copy(script),source:source==='wiki'?'wiki':'json',players:[],presentOnly:false,night:1,mode:'run',progress:[],notes:''};}
  function validate(value,build,chars,orders){
    if(!value||value.kind!==kind||value.version!==1)throw Error('不支持的对局备份格式');
    if(byteLength(JSON.stringify(value))>8*1024*1024)throw Error('对局备份不能超过 8 MB');
    if(!['json','wiki'].includes(value.source)||!['run','reference'].includes(value.mode)||typeof value.presentOnly!=='boolean'||!Number.isInteger(value.night)||value.night<1||value.night>99)throw Error('对局设置无效');
    var roles=build(value.script,chars,orders,value.source).roles,ids=new Set(roles.map(function(r){return r.id;})),seen=new Set();
    if(!Array.isArray(value.players)||value.players.length>100)throw Error('玩家名单无效（最多 100 位）');
    var players=value.players.map(function(p){
      if(!p||typeof p.id!=='string'||!/^player_[a-z0-9_]+$/i.test(p.id)||seen.has(p.id)||!ids.has(p.roleId)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||typeof p.alive!=='boolean'||!['normal','drunk','poisoned'].includes(p.condition)||typeof p.note!=='string'||p.note.length>500)throw Error('玩家记录无效');
      seen.add(p.id);return {id:p.id,name:p.name,roleId:p.roleId,alive:p.alive,condition:p.condition,note:p.note};
    });
    if(!Array.isArray(value.progress)||value.progress.length>99)throw Error('夜间进度无效');
    var nights=new Set(),progress=value.progress.map(function(p){
      if(!p||!Number.isInteger(p.night)||p.night<1||p.night>99||nights.has(p.night)||!Array.isArray(p.steps)||p.steps.length>roles.length)throw Error('夜间进度无效');
      nights.add(p.night);var stepIds=new Set();
      return {night:p.night,steps:p.steps.map(function(s){if(!s||!ids.has(s.id)||stepIds.has(s.id)||!['done','skipped'].includes(s.status))throw Error('行动记录无效');stepIds.add(s.id);return {id:s.id,status:s.status};})};
    });
    if(typeof value.notes!=='string'||value.notes.length>4000)throw Error('对局备注无效');
    return Object.assign(fresh(value.script,value.source),{players:players,presentOnly:value.presentOnly,night:value.night,mode:value.mode,progress:progress,notes:value.notes});
  }
  function steps(session){var entry=session.progress.find(function(p){return p.night===session.night;});return entry?entry.steps:[];}
  function mark(session,id,status){
    var entry=session.progress.find(function(p){return p.night===session.night;});
    if(!entry){entry={night:session.night,steps:[]};session.progress.push(entry);}
    entry.steps=entry.steps.filter(function(s){return s.id!==id;});if(status)entry.steps.push({id:id,status:status});
  }
  function invalidate(session,ids){ids.forEach(function(id){mark(session,id,null);});}
  function queue(session,view){
    var records=steps(session),rows=session.night===1?view.first:view.other;
    return rows.map(function(row){var record=records.find(function(s){return s.id===row.role.id;});return {row:row,status:record?record.status:'pending'};});
  }
  function open(storage,validator){
    var previous=storage.getItem(key);
    return {read:function(){return previous?validator(JSON.parse(previous)):null;},save:function(session){
      if(storage.getItem(key)!==previous)throw Error('另一页面已更新此对局，请先备份当前对局，再刷新');
      var value=JSON.stringify(validator(session));storage.setItem(key,value);previous=value;
    }};
  }
  root.ScriptNightSession={kind:kind,key:key,byteLength:byteLength,fresh:fresh,validate:validate,steps:steps,mark:mark,invalidate:invalidate,queue:queue,open:open};
})(typeof window==='undefined'?globalThis:window);
