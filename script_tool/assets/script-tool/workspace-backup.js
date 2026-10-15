/* A portable, validated snapshot of the editor's local stores. */
(function(root){
  'use strict';
  var maxBytes=100*1024*1024,localKeys=['botc_script_drafts_v1','botc_script_tool_v1','botc_script_resume_v1'],extraKeys=['botc_custom_role_form_v1','botc_art_view_v1','botc_art_controls_width_v1'];
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function extra(key){return extraKeys.includes(key)||key.startsWith('botc_art_custom_jinx_v1:');}
  function localSnapshot(){var result={};localKeys.forEach(function(key){result[key]=root.localStorage.getItem(key);});for(var i=0;i<root.localStorage.length;i++){var key=root.localStorage.key(i);if(extra(key))result[key]=root.localStorage.getItem(key);}return result;}
  function same(a,b){return JSON.stringify(Object.keys(a).sort().map(function(k){return [k,a[k]];}))===JSON.stringify(Object.keys(b).sort().map(function(k){return [k,b[k]];}));}
  function writeLocal(values){var keys=new Set(localKeys.concat(Object.keys(localSnapshot()),Object.keys(values)));keys.forEach(function(key){if(values[key]===undefined||values[key]===null)root.localStorage.removeItem(key);else root.localStorage.setItem(key,values[key]);});}
  function draftLibrary(value){var text=JSON.stringify(value),memory={getItem:function(){return text;},setItem:function(){}};return root.ScriptDrafts.open(memory,function(state){root.ScriptCore.restoreDraft(state,root.CHARS);}).backup();}
  function raster(value){return typeof value==='string'&&value.length<=24000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);}
  function artwork(records){
    if(!Array.isArray(records)||records.length>20||new Set(records.map(function(r){return r&&r.key;})).size!==records.length)throw Error('制图备份记录无效');
    ['draft','template'].forEach(function(kind){if(records.filter(function(r){return r.kind===kind;}).length>(kind==='draft'?8:12))throw Error('制图备份超过保存数量限制');});
    records.forEach(function(record){
      if(!record||record.version!==1||!['draft','template'].includes(record.kind)||typeof record.key!=='string'||!record.key.startsWith(record.kind+':')||record.key.length>150||typeof record.name!=='string'||record.name.length>48||!Number.isFinite(record.savedAt)||!record.value)throw Error('制图备份格式错误');
      var value=record.kind==='draft'?record.value.state:record.value;
      if(!value||value.background&&!raster(value.background)||value.logo&&(!raster(value.logo.image)||!Number.isFinite(value.logo.aspect)||value.logo.aspect<=0||value.logo.aspect>16000000))throw Error('制图备份图片无效');
      var data=record.kind==='draft'?JSON.parse(value.data):value;
      if(!data.fields||typeof data.fields!=='object'||Array.isArray(data.fields)||Object.keys(data.fields).some(function(key){var v=data.fields[key];return !/^art[A-Z][A-Za-z]+$/.test(key)||typeof v!=='boolean'&&(typeof v!=='string'||v.length>2000);}))throw Error('制图参数无效');
      if(typeof data.preset!=='string')throw Error('制图版式无效');
      var numeric={artAuthorOffset:[-40,40],artAuthorOffsetY:[-40,40],artLogoOffset:[-40,40],artLogoOffsetY:[-40,40],artLogoSize:[25,160],artRuleOffset:[-40,40],artRuleOffsetY:[-40,40],artRuleWidth:[60,160],artRuleHeight:[60,160],artRuleFont:[16,28]};
      Object.keys(numeric).forEach(function(key){if(data.fields[key]===undefined)return;var v=data.fields[key],range=numeric[key];if(typeof v!=='string'||!v.trim()||!Number.isFinite(Number(v))||Number(v)<range[0]||Number(v)>range[1])throw Error('备份制图调整参数超出范围');});
      if(record.kind==='draft'){
        if(typeof record.value.identity!=='string'||!Array.isArray(JSON.parse(record.value.identity))||!Array.isArray(data.roles)||data.roles.length>200||!Array.isArray(data.customJinx))throw Error('制图角色记录无效');
        data.roles.forEach(function(role){if(!role||typeof role.id!=='string'||typeof role.n!=='string'||typeof role.ab!=='string'||role.ab.length>20000)throw Error('制图角色资料无效');});
        data.customJinx.forEach(function(rule){if(!rule||!Array.isArray(rule.roleIds)||rule.roleIds.length!==2||rule.roleIds[0]===rule.roleIds[1]||!rule.roleIds.every(function(id){return data.roles.some(function(r){return r.id===id;});})||typeof rule.ability!=='string'||rule.ability.length>2000)throw Error('制图相克资料无效');});
      }
    });return copy(records);
  }
  function validate(bundle){
    if(!bundle||bundle.kind!=='clocktower-workspace'||bundle.version!==1||new Blob([JSON.stringify(bundle)]).size>maxBytes)throw Error('请选择 100 MB 以内的剧本工具完整备份');
    var result=copy(bundle);result.drafts=draftLibrary(bundle.drafts);root.ScriptCore.restoreDraft(result.current,root.CHARS);
    if(result.current.draftId&& !result.drafts.drafts.some(function(d){return d.id===result.current.draftId;}))throw Error('备份当前草稿不存在');
    if((result.current.draftId||null)!==result.drafts.activeId)throw Error('备份当前草稿与活动记录不一致');
    root.ScriptPersonalRoleStore.validateBackup(result.personal);result.artwork=artwork(result.artwork);
    if(!result.extras||typeof result.extras!=='object'||Array.isArray(result.extras)||Object.keys(result.extras).length>200||Object.keys(result.extras).some(function(key){return !extra(key)||typeof result.extras[key]!=='string'||result.extras[key].length>24000000;}))throw Error('备份附加设置无效');
    return result;
  }
  async function capture(){
    if(!root.ScriptDraftUI||!root.ScriptPersonalRoles||!root.ScriptArtSettings)throw Error('完整备份暂不可用，请重新打开剧本工具');
    if(root.ScriptArtWorkspace)await root.ScriptArtWorkspace.flush();
    var local=localSnapshot(),values=await Promise.all([root.ScriptPersonalRoles.getStore().backup(),root.ScriptArtSettings.backup()]);
    if(!same(local,localSnapshot()))throw Error('草稿在备份期间发生变化，请重试');
    var extras={};Object.keys(local).filter(extra).forEach(function(key){extras[key]=local[key];});
    return validate({kind:'clocktower-workspace',version:1,exportedAt:Date.now(),drafts:root.ScriptDraftUI.backup(),current:copy(root.captureDraft()),personal:values[0],artwork:values[1],extras:extras});
  }
  async function restore(input,before){
    var bundle=validate(input);before=validate(before);var local=localSnapshot(),now=await capture();
    function content(value){var result=copy(value);delete result.exportedAt;delete result.personal.exportedAt;return result;}
    if(JSON.stringify(content(now))!==JSON.stringify(content(before)))throw Error('本地资料已变化，请重新预览后恢复');
    var rolesDone=false,artDone=false,localStarted=false;
    try{
      await root.ScriptPersonalRoles.getStore().replaceBackup(bundle.personal,before.personal);rolesDone=true;
      await root.ScriptArtSettings.replaceRecords(bundle.artwork,before.artwork);artDone=true;
      if(!same(local,localSnapshot()))throw Error('草稿已在另一页面更新，请重新预览');
      var current=copy(bundle.current),drafts=copy(bundle.drafts);drafts.activeId=current.draftId||drafts.activeId;
      if(drafts.activeId){var entry=drafts.drafts.find(function(d){return d.id===drafts.activeId;});current.draftId=entry.id;entry.state=current;}
      var values=Object.assign({},bundle.extras,{botc_script_drafts_v1:JSON.stringify(drafts),botc_script_tool_v1:JSON.stringify(current),botc_script_resume_v1:JSON.stringify({name:current.n,roles:current.sel.length,hasContent:root.ScriptDrafts.hasContent(current)})});
      localStarted=true;writeLocal(values);return bundle;
    }catch(error){
      var failures=[];
      if(localStarted)try{writeLocal(local);}catch(e){failures.push('浏览器草稿');}
      if(artDone)try{await root.ScriptArtSettings.replaceRecords(before.artwork,bundle.artwork);}catch(e){failures.push('制图存档');}
      if(rolesDone)try{await root.ScriptPersonalRoles.getStore().replaceBackup(before.personal,bundle.personal);}catch(e){failures.push('个人角色库');}
      throw Error('恢复失败：'+error.message+(failures.length?'。'+failures.join('、')+'未能自动还原，请使用恢复前下载的完整备份。':'。原资料已保留。'));
    }
  }
  root.ScriptWorkspaceBackup={capture:capture,validate:validate,restore:restore,maxBytes:maxBytes};
})(window);
