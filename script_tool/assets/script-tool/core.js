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
    var name=str(e.name,'名称',e.id),id=str(e.id,'ID','custom_'+name).trim();
    if(!name.trim()||!id.trim()||id==='_meta')throw new Error('角色名称和 ID 不能为空或使用保留值');
    var team=str(e.team===undefined?e.type:e.team,'角色类型','townsfolk').trim().toLowerCase();
    if(team==='traveler')team='traveller';if(team==='encounter')team='loric';
    if(!teams.includes(team))throw new Error('未知阵营：'+team);
    var images=Array.isArray(e.image)?e.image.map(function(value){if(typeof value!=='string')throw new Error('图标数组必须只包含文本');return str(value,'图标');}):null;
    var image=images?(images.find(function(value){return value;})||''):str(e.image,'图标');
    (images||[image]).forEach(function(value){
    if(value&&!/^(https?:\/\/|(?:\.\.\/)?icons\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(value))throw new Error('图标仅支持 HTTP(S)、本地图标或位图 data URL');
    });
    if(e.setup!==undefined&&typeof e.setup!=='boolean'&&e.setup!==0&&e.setup!==1)throw new Error('setup 必须是布尔值或 0/1');
    return {id:id,n:name,t:team,ab:str(e.ability===undefined?(e.skill===undefined?e.description:e.skill):e.ability,'能力'),im:image,iu:image,images:images,raw:JSON.parse(JSON.stringify(e)),
      fl:str(e.flavor,'背景'),ed:str(e.edition,'版本'),s:e.setup||0,
      f:number(e.firstNight,'首夜顺序'),o:number(e.otherNight,'其他夜顺序'),
      r:list(e.reminders,'提醒'),rg:list(e.remindersGlobal,'全局提醒'),
      fr:str(e.firstNightReminder,'首夜提示'),or:str(e.otherNightReminder,'其他夜提示')};
  }
  function isRule(e){return !!e&&typeof e==='object'&&typeof e.team==='string'&&/^a\s+jinx(?:ed)?$/i.test(e.team.trim());}
  function normalizeRule(e){
    if(!isRule(e))throw new Error('未知剧本规则类型');
    var id=str(e.id,'规则 ID'),name=str(e.name,'规则名称'),ability=str(e.ability,'规则说明');
    if(!id.trim()||id==='_meta'||!name.trim()||!ability.trim())throw new Error('规则 ID、名称和说明不能为空');
    return JSON.parse(JSON.stringify(e));
  }
  function ruleSections(rules,roles){
    var result={jinx:[],other:[]};
    (rules||[]).forEach(function(rule){if(matchJinx(roles,[rule]).length)result.jinx.push(rule);else result.other.push(rule);});return result;
  }
  function parseImport(data,chars){
    if(!Array.isArray(data)||data.length>1000)throw new Error('顶层必须是数组，最多 1000 项');
    var byId=new Map(chars.map(function(c){return [c.id,c];})),seen=new Set(),selected=[],custom=[],rules=[],entries=[],meta={};
    data.forEach(function(e,index){
      try{
      if(e&&typeof e==='object'&&!Array.isArray(e)&&e.id==='_meta'){
        if(meta.id)throw new Error('只能包含一份 _meta');meta=e;return;
      }
      if(typeof e!=='string'&&(!e||typeof e!=='object'||Array.isArray(e)))throw new Error('角色必须是 ID 或对象');
      if(isRule(e)){var rule=normalizeRule(e);if(seen.has(identity(rule.id)))throw new Error('重复角色或规则 ID：'+rule.id);seen.add(identity(rule.id));rules.push(rule);return;}
      var id=typeof e==='string'?e:e.id;
      if(typeof id==='string')id=id.trim();
      var known=byId.get(id)||byId.get(id+'_gstone'),c;
      if(!known){var candidates=chars.filter(function(role){return identity(role.id)===identity(id);});if(candidates.length===1)known=candidates[0];}
      if(typeof e==='string'||Object.keys(e).every(function(k){return k==='id';})){
        if(!known)throw new Error('无法识别角色 ID：'+id+'，请提供完整角色对象');c=known;
      }else{
        // Partial catalog objects inherit only omitted fields, never overwrite supplied abilities.
        var defaults=known?Object.assign({},known.raw||{},{id:known.id,name:known.n,team:known.t,ability:known.ab,image:known.iu||known.im,
          flavor:known.fl,edition:known.ed,setup:known.s,firstNight:known.f,otherNight:known.o,
          reminders:known.r,remindersGlobal:known.rg,firstNightReminder:known.fr,otherNightReminder:known.or}):{};
        if(e.type!==undefined)delete defaults.team;
        if(e.skill!==undefined||e.description!==undefined)delete defaults.ability;
        c=normalize(Object.assign(defaults,e));
        // Keep exported official images offline when the matching local asset exists.
        if(known&&known.im)c.im=known.im;
        custom.push(c);
      }
      if(seen.has(identity(c.id)))throw new Error('重复角色 ID：'+c.id);
      seen.add(identity(c.id));selected.push(c);entries.push(e);
      }catch(error){throw new Error('第 '+(index+1)+' 项：'+error.message);}
    });
    return {selected:selected,custom:custom,rules:rules,entries:entries,meta:JSON.parse(JSON.stringify(meta)),name:str(meta.name,'剧本名称'),author:str(meta.author,'作者')};
  }
  function planImport(result,current,mode){
    if(mode==='replace')return Object.assign({},result,{added:result.selected.length,skipped:[],skippedRules:0});
    if(mode!=='append')throw new Error('请选择替换或追加角色');
    var selected=current.selected.slice(),rules=current.rules.slice(),skipped=[],skippedRules=0,addedIds=new Set();
    var roleIds=new Set(selected.map(function(c){return identity(c.id);})),ruleIds=new Set(rules.map(function(r){return identity(r.id);}));
    result.selected.forEach(function(c){
      var id=identity(c.id);
      if(ruleIds.has(id))throw new Error('角色 ID 与当前附加规则冲突：'+c.id);
      if(roleIds.has(id)){skipped.push(c.n);return;}
      selected.push(c);roleIds.add(id);addedIds.add(id);
    });
    result.rules.forEach(function(rule){
      var id=identity(rule.id);
      if(roleIds.has(id))throw new Error('规则 ID 与当前角色冲突：'+rule.id);
      if(ruleIds.has(id)){skippedRules++;return;}
      rules.push(rule);ruleIds.add(id);
    });
    if(selected.length+rules.length>1000)throw new Error('追加后角色和规则总数不能超过 1000 项');
    var custom=current.custom.filter(function(c){return !addedIds.has(identity(c.id));})
      .concat(result.custom.filter(function(c){return addedIds.has(identity(c.id));}));
    return {selected:selected,custom:custom,rules:rules,meta:current.meta,name:current.name,author:current.author,
      added:addedIds.size,skipped:skipped,skippedRules:skippedRules};
  }
  function parseJSON(text){
    var value=String(text).trim().replace(/^\uFEFF/,'');
    if(value.length>2*1024*1024)throw new Error('JSON 内容不能超过 2 MB');
    var fenced=value.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);if(fenced)value=fenced[1];
    if(!value.trim())throw new Error('请选择 JSON 文件或粘贴剧本内容');
    try{return JSON.parse(value);}catch(error){throw new Error('JSON 格式错误，请检查引号、逗号和括号。'+error.message);}
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
      if(c.raw!==undefined&&(!c.raw||typeof c.raw!=='object'||Array.isArray(c.raw)))throw new Error('存档角色原始数据格式错误');
      var role=normalize(Object.assign(Object.create(null),c.raw||{},{id:c.id,name:c.n,team:c.t,ability:c.ab,image:c.images||c.iu||c.im,flavor:c.fl,edition:c.ed,setup:c.s,firstNight:c.f,otherNight:c.o,reminders:c.r,remindersGlobal:c.rg,firstNightReminder:c.fr,otherNightReminder:c.or}));
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
    if(d.rules!==undefined&&(!Array.isArray(d.rules)||d.rules.length>1000))throw new Error('存档规则格式错误');
    var rules=(d.rules||[]).map(normalizeRule);rules.forEach(function(rule){if(seen.has(identity(rule.id)))throw new Error('存档包含重复规则 ID');seen.add(identity(rule.id));});
    if(d.meta!==undefined&&(!d.meta||typeof d.meta!=='object'||Array.isArray(d.meta)))throw new Error('存档元数据格式错误');
    return {meta:JSON.parse(JSON.stringify(d.meta||{})),rules:rules,custom:custom,selected:selected,nightOverrides:overrides,name:str(d.n,'剧本名称'),author:str(d.a,'作者'),spec:['free','teensy','ravenswood'].includes(d.s)?d.s:'free'};
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
  root.ScriptCore={isRule:isRule,ruleSections:ruleSections,identity:identity,normalize:normalize,parseImport:parseImport,planImport:planImport,restoreDraft:restoreDraft,nightOrder:nightOrder,matchJinx:matchJinx,catalogIcon:catalogIcon,parseJSON:parseJSON};
})(globalThis);
