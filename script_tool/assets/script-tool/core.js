/* Import validation is independent of the DOM; commit state only after validation. */
(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  function str(value,field,fallback){
    if(value===undefined||value===null)return fallback||'';
    if(typeof value!=='string')throw new Error(field+' 必须是文本');
    if(value.length>20000)throw new Error(field+' 内容过长');
    return value;
  }
  function list(value,field){
    if(value===undefined)return [];
    if(!Array.isArray(value)||value.some(function(x){return typeof x!=='string';}))throw new Error(field+' 必须是文本数组');
    return value.slice();
  }
  function number(value,field){
    if(value===undefined||value==='')return 0;
    if(typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim()))value=Number(value.trim());
    if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw new Error(field+' 必须是非负数字');
    return value;
  }
  function normalize(e){
    var name=str(e.name,'名称',e.id),id=str(e.id,'ID','custom_'+name);
    if(!name.trim()||!id.trim()||id==='_meta')throw new Error('角色名称和 ID 不能为空或使用保留值');
    var team=e.team==='traveler'?'traveller':(e.team||'townsfolk');
    if(!teams.includes(team))throw new Error('未知阵营：'+team);
    var images=Array.isArray(e.image)?e.image.map(function(value){if(typeof value!=='string')throw new Error('图标数组必须只包含文本');return str(value,'图标');}):null;
    var image=images?(images.find(function(value){return value;})||''):str(e.image,'图标');
    (images||[image]).forEach(function(value){
    if(value&&!/^(https?:\/\/|(?:\.\.\/)?icons\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(value))throw new Error('图标仅支持 HTTP(S)、本地图标或位图 data URL');
    });
    if(e.setup!==undefined&&typeof e.setup!=='boolean'&&e.setup!==0&&e.setup!==1)throw new Error('setup 必须是布尔值或 0/1');
    return {id:id,n:name,t:team,ab:str(e.ability,'能力'),im:image,iu:image,images:images,
      fl:str(e.flavor,'背景'),ed:str(e.edition,'版本'),s:e.setup||0,
      f:number(e.firstNight,'首夜顺序'),o:number(e.otherNight,'其他夜顺序'),
      r:list(e.reminders,'提醒'),rg:list(e.remindersGlobal,'全局提醒'),
      fr:str(e.firstNightReminder,'首夜提示'),or:str(e.otherNightReminder,'其他夜提示')};
  }
  function parseImport(data,chars){
    if(!Array.isArray(data)||data.length>1000)throw new Error('顶层必须是数组，最多 1000 项');
    var byId=new Map(chars.map(function(c){return [c.id,c];})),seen=new Set(),selected=[],custom=[],meta={};
    data.forEach(function(e){
      if(e&&typeof e==='object'&&!Array.isArray(e)&&e.id==='_meta'){
        if(meta.id)throw new Error('只能包含一份 _meta');meta=e;return;
      }
      if(typeof e!=='string'&&(!e||typeof e!=='object'||Array.isArray(e)))throw new Error('角色必须是 ID 或对象');
      var id=typeof e==='string'?e:e.id;
      var known=byId.get(id)||byId.get(id+'_gstone'),c;
      if(typeof e==='string'||Object.keys(e).every(function(k){return k==='id';})){
        if(!known)throw new Error('无法识别角色 ID：'+id+'，请提供完整角色对象');c=known;
      }else{
        c=normalize(e);
        // Keep exported official images offline when the matching local asset exists.
        if(known&&known.im&&c.iu===known.iu)c.im=known.im;
        custom.push(c);
      }
      if(seen.has(c.id))throw new Error('重复角色 ID：'+c.id);
      seen.add(c.id);selected.push(c);
    });
    return {selected:selected,custom:custom,name:str(meta.name,'剧本名称'),author:str(meta.author,'作者')};
  }
  root.ScriptCore={normalize:normalize,parseImport:parseImport,parseJSON:function(text){return JSON.parse(String(text).replace(/^\uFEFF/,''));}};
})(globalThis);
