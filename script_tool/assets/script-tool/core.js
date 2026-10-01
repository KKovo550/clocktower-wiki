/* Import validation is independent of the DOM; commit state only after validation. */
(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  function identity(id){return String(id||'').trim().replace(/_gstone$/,'');}
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
      if(!known){var candidates=chars.filter(function(role){return identity(role.id)===identity(id);});if(candidates.length===1)known=candidates[0];}
      if(typeof e==='string'||Object.keys(e).every(function(k){return k==='id';})){
        if(!known)throw new Error('无法识别角色 ID：'+id+'，请提供完整角色对象');c=known;
      }else{
        c=normalize(e);
        // Keep exported official images offline when the matching local asset exists.
        if(known&&known.im)c.im=known.im;
        custom.push(c);
      }
      if(seen.has(identity(c.id)))throw new Error('重复角色 ID：'+c.id);
      seen.add(identity(c.id));selected.push(c);
    });
    return {selected:selected,custom:custom,name:str(meta.name,'剧本名称'),author:str(meta.author,'作者')};
  }
  function nightOrder(role,orders,overrides){
    orders=orders||{};
    var entry=Object.prototype.hasOwnProperty.call(orders,role.id)?orders[role.id]:null;
    // Standard imports may omit the catalog's _gstone suffix.
    if(!entry&&Object.prototype.hasOwnProperty.call(orders,role.id+'_gstone'))entry=orders[role.id+'_gstone'];
    if(!entry){var keys=Object.keys(orders).filter(function(id){return identity(id)===identity(role.id)&&orders[id].n===role.n;});if(keys.length===1)entry=orders[keys[0]];}
    var result=(!entry||entry.n!==role.n)?{firstNight:role.f||0,otherNight:role.o||0}:
      {firstNight:entry.f===null?(role.f||0):entry.f,otherNight:entry.o===null?(role.o||0):entry.o};
    var custom=overrides&&Object.prototype.hasOwnProperty.call(overrides,role.id)?overrides[role.id]:null;
    ['firstNight','otherNight'].forEach(function(field){if(custom&&Number.isFinite(custom[field])&&custom[field]>0&&result[field]>0)result[field]=custom[field];});
    return result;
  }
  function matchJinx(roles,rules){
    var seen=new Set(),result=[];
    (rules||[]).forEach(function(rule){
      if(!rule||typeof rule.ability!=='string'||!rule.ability.trim())return;
      var names=String(rule.name||'').split(/&|与/).map(function(n){return n.trim();});
      var ids=Array.isArray(rule.roleIds)&&rule.roleIds.length===2?rule.roleIds:null;
      if(!ids&&names.length!==2)return;
      var pair=(ids||names).map(function(value){return roles.filter(function(role){return ids?identity(role.id)===identity(value):role.n===value;});});
      if(pair.some(function(matches){return matches.length!==1;})||pair[0][0].id===pair[1][0].id)return;
      var selected=pair.map(function(matches){return matches[0];}),text=rule.ability.trim();
      var key=JSON.stringify([selected.map(function(r){return r.id;}).sort(),text]);
      if(seen.has(key))return;seen.add(key);result.push({roles:selected,text:text});
    });return result;
  }
  function restoreDraft(d,chars){
    if(!d||!Array.isArray(d.sel)||!Array.isArray(d.custom)||d.sel.length>1000||d.custom.length>1000)throw new Error('存档格式错误');
    if(d.version!==undefined&&d.version!==2)throw new Error('不支持的存档版本');
    var custom=d.custom.map(function(c){
      var role=normalize({id:c.id,name:c.n,team:c.t,ability:c.ab,image:c.images||c.iu||c.im,flavor:c.fl,edition:c.ed,setup:c.s,firstNight:c.f,otherNight:c.o,reminders:c.r,remindersGlobal:c.rg,firstNightReminder:c.fr,otherNightReminder:c.or});
      var known=chars.find(function(x){return identity(x.id)===identity(role.id)&&x.n===role.n;});
      if(known&&known.im)role.im=known.im;
      return role;
    });
    if(new Set(custom.map(function(c){return c.id;})).size!==custom.length)throw new Error('存档包含重复自定义角色 ID');
    var overrides=Object.create(null),seen=new Set(),selected=[];
    d.sel.forEach(function(key){
      var role,oldId;
      if(d.version===2){
        if(!key||typeof key.id!=='string')throw new Error('存档角色格式错误');
        oldId=key.id;
        var id=key.id;
        if(!key.custom&&id==='xizi_gstone'&&key.name==='戏子(改)')id='xizi_revised_gstone';
        var matches=(key.custom?custom:chars).filter(function(c){return identity(c.id)===identity(id)&&(!key.name||c.n===key.name||(c.source==='yuque'&&c.n===key.name.replace(/^[\s*★]+/,'')));});
        if(matches.length===1)role=matches[0];
      }else if(typeof key==='string'&&/^C\d+$/.test(key))role=custom[+key.slice(1)];
      else if(Number.isInteger(key))role=chars[key];
      if(!role)throw new Error('存档包含无法识别的角色');
      if(seen.has(identity(role.id)))throw new Error('存档包含重复角色 ID');
      seen.add(identity(role.id));selected.push(role);
      var entry=d.nightOverrides&&Object.prototype.hasOwnProperty.call(d.nightOverrides,oldId||role.id)?d.nightOverrides[oldId||role.id]:null;
      ['firstNight','otherNight'].forEach(function(field){if(entry&&Number.isFinite(entry[field])&&entry[field]>0)(overrides[role.id]||(overrides[role.id]={}))[field]=entry[field];});
    });
    return {custom:custom,selected:selected,nightOverrides:overrides,name:str(d.n,'剧本名称'),author:str(d.a,'作者'),spec:['free','teensy','ravenswood'].includes(d.s)?d.s:'free'};
  }
  function catalogIcon(role,chars,icons){
    if(icons[role.im])return icons[role.im];
    var same=chars.filter(function(c){return String(c.n||'').trim()===String(role.n||'').trim();});
    var exact=chars.filter(function(c){return identity(c.id)===identity(role.id);});
    function icon(candidates){return candidates.length===1?(icons[candidates[0].im]||icons[candidates[0].id]||''):'';}
    var found=icon(exact);if(found)return found;
    var team=function(t){return t==='traveler'?'traveller':t;};
    same=same.filter(function(c){return team(c.t)===team(role.t);});
    if(same.length>1){var ability=String(role.ab||'').replace(/\s/g,'');same=same.filter(function(c){return String(c.ab||'').replace(/\s/g,'')===ability;});}
    return icon(same);
  }
  root.ScriptCore={identity:identity,normalize:normalize,parseImport:parseImport,restoreDraft:restoreDraft,nightOrder:nightOrder,matchJinx:matchJinx,catalogIcon:catalogIcon,parseJSON:function(text){return JSON.parse(String(text).replace(/^\uFEFF/,''));}};
})(globalThis);
