// 所有内部逻辑使用英文阵营键；展示时再通过 TEAMCN 转为中文。
// 保留来源顺序，不凭文件编号猜测正背面；失效映射不隐藏其他图片。
function scriptPictures(script) {
  var files = Array.isArray(script[10]) ? script[10] : [];
  var unique = Array.from(new Set(files.filter(function(file) {
    return typeof file === 'string' && file.trim();
  })));
  var roles = typeof pictureRoles==='function'?pictureRoles(script):(script[11]||{}), used = new Set(), primary = [];
  [['front','正面 · 封面插画'],['back','背面 · 角色表'],['logo','logo · 标题字']]
    .forEach(function(role) {
      var file = roles[role[0]];
      if (unique.indexOf(file) < 0 || used.has(file)) return;
      used.add(file);
      primary.push({file:file, label:role[1], role:role[0]});
    });
  var remaining = unique.filter(function(file) {return !used.has(file);})
    .map(function(file) {return {file:file, label:file, role:'other'};});
  return {primary:primary, remaining:remaining, total:unique.length};
}

// 阅读区仅展示已确认的正背面；原图及导出清单仍保留全部图片。
function galleryPictures(script){
  var primary=scriptPictures(script).primary.filter(function(p){return p.role==='front'||p.role==='back';});
  return {primary:primary,remaining:[],total:primary.length};
}

function pictureCompleteness(script){
  var pictures=scriptPictures(script),sides=new Set(pictures.primary.map(function(p){return p.role;}));
  return {front:sides.has('front'),back:sides.has('back'),complete:sides.has('front')&&sides.has('back'),
    state:sides.has('front')&&sides.has('back')?'complete':sides.has('front')?'missing-back':sides.has('back')?'missing-front':pictures.total?'ancillary':'missing-images'};
}
function pictureStateLabel(script){return {complete:'正背面齐全','missing-back':'缺背面','missing-front':'缺正面',ancillary:'仅附图或未分类','missing-images':'缺图片'}[pictureCompleteness(script).state];}

function normalizeTeam(team) {
  var aliases = {
    traveler: 'traveller', '镇民': 'townsfolk', '外来者': 'outsider',
    '爪牙': 'minion', '恶魔': 'demon', '旅行者': 'traveller',
    '传奇': 'fabled', '传奇角色': 'fabled', '奇遇': 'loric', '奇遇角色': 'loric'
  };
  return Object.prototype.hasOwnProperty.call(aliases, team) ? aliases[team] : (team || '');
}

function cmpNormTeam(t){ return normalizeTeam(t); }
function isLibraryRuleTeam(team){return /jinx|bootleg[\s_-]*rule|^token$/i.test(team||'');}
function libraryCharacterCount(indices){
  var seen=new Set();indices.forEach(function(i){var c=CHARS[i];if(!c||isLibraryRuleTeam(c[1]))return;
    var role=typeof libraryRole==='function'?libraryRole(c):null;
    seen.add(role?role.t+'|'+(role.wiki||role.n):normalizeTeam(c[1])+'|'+String(c[0]).normalize('NFKC').trim());
  });return seen.size;
}

function scriptFamilyKey(script){return (script[12]||{}).family||script[3]||script;}
function scriptVersionCount(scripts){return new Set(scripts.map(function(s){return (s[12]||{}).content||s[3]||s;})).size;}
function collapseScripts(scripts,choices){
  var groups=new Map();scripts.forEach(function(s){var key=scriptFamilyKey(s);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);});
  return Array.from(groups,function(entry){var members=entry[1],path=choices&&choices.get(entry[0]);
    return members.find(function(s){return s[3]===path;})||members.find(function(s){return !/待整理/.test(s[2]);})||members[0];
  });
}

function cmpRoleKey(value){return String(value||'').normalize('NFKC').trim().toLowerCase();}
function cmpAbilityKey(value){var h=2166136261;for(var c of String(value||'').normalize('NFKC').replace(/\s+/g,''))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16);}
var comparisonAliases=null,comparisonSource=null;
function cmpAliases(){
  var source=typeof LIBRARY_COMPARE_ROLES==='undefined'?null:LIBRARY_COMPARE_ROLES;
  if(source!==comparisonSource){comparisonAliases=null;comparisonSource=source;}
  if(comparisonAliases)return comparisonAliases;
  var aliases=new Map(),keys=new Map();
  function add(value,role){var key=cmpRoleKey(value);if(!key)return;if(!aliases.has(key))aliases.set(key,new Map());aliases.get(key).set(role.k,role);}
  (source||[]).forEach(function(r){
    keys.set(r.k,r);[r.n,r.id,r.en].forEach(function(v){add(v,r);});
    // Only known official IDs get legacy suffix aliases; custom IDs stay exact.
    if(r.k.indexOf('wiki:')===0)add(r.id.replace(/(?:button|_gstone)$/i,''),r);
  });
  Object.entries((window.LIBRARY_ROLE_DETAILS||{}).names||{}).forEach(function(entry){var r=keys.get('wiki:'+entry[1].wiki);if(r)add(entry[0],r);});
  comparisonAliases=aliases;return aliases;
}
function cmpResolve(input){
  var value=typeof input==='string'?{n:input,id:input,idOnly:true}:input;
  if(value.k)return Object.assign({},value,{t:normalizeTeam(value.t)});
  var n=value.n||value.name||value.id||'',id=value.id||'',a=value.a||(value.ability?cmpAbilityKey(value.ability):''),aliases=cmpAliases();
  var known=(window.LIBRARY_ROLE_DETAILS||{}).names||{};
  function findKnown(v){var key=cmpRoleKey(v),clean=key.replace(/(?:_?button|_gstone)$/,'');return Object.prototype.hasOwnProperty.call(known,key)?known[key]:Object.prototype.hasOwnProperty.call(known,clean)?known[clean]:null;}
  var info=findKnown(id||n),nameInfo=findKnown(n);
  if(info&&(!id||!nameInfo||nameInfo.wiki===info.wiki))return {n:info.n,t:normalizeTeam(value.t||value.team||info.t),id:id,k:'wiki:'+info.wiki,a:a,idOnly:false};
  var matches=aliases.get(cmpRoleKey(id||n));
  if(matches){
    var choices=Array.from(matches.values());
    if(id&&nameInfo)choices=choices.filter(function(r){return r.k.indexOf('wiki:')!==0||r.k==='wiki:'+nameInfo.wiki;});
    if(a&&id)choices=choices.filter(function(r){return r.k.indexOf('wiki:')===0||r.a===a;});
    if(choices.length===1){var r=choices[0];return {n:r.n,t:normalizeTeam(value.t||value.team||r.t),id:id||r.id,k:r.k,a:a,idOnly:false};}
  }
  return {n:n,t:normalizeTeam(value.t||value.team),id:id,a:a,k:matches&&!a?'unresolved:'+cmpRoleKey(id||n):(id?'id:'+cmpRoleKey(id)+'|'+(a||cmpAbilityKey('')):'name:'+cmpRoleKey(n)),idOnly:value.idOnly===true,unresolved:!!matches};
}
function comparisonRoster(script){
  var meta=script[12]||{};
  if(meta.comparisonText)return cmpParse(meta.comparisonText).chars;
  if(Array.isArray(meta.roster)&&typeof LIBRARY_COMPARE_ROLES!=='undefined')return meta.roster.map(function(i){return LIBRARY_COMPARE_ROLES[i];}).filter(Boolean);
  return (script[5]||[]).map(function(i){var c=CHARS[i];return c&&!isLibraryRuleTeam(c[1])?cmpResolve({n:c[0],t:c[1]}):null;}).filter(Boolean);
}

function cmpParse(text){
  var data=JSON.parse(String(text).replace(/^\uFEFF/,''));
  if(!Array.isArray(data))throw new Error('顶层必须是数组（剧本 JSON 的格式）');
  var meta={},chars=[],seen=Object.create(null);
  data.forEach(function(e){
    if(!e)return;
    if(typeof e!=='object'&&typeof e!=='string')return;
    if(e.id==='_meta'){meta=e;return;}
    if(isLibraryRuleTeam(e.team))return;
    var role=cmpResolve(typeof e==='string'?e:{n:e.name||e.id,id:e.id,t:e.team,ability:e.ability});
    if(!role.n||seen[role.k])return;
    seen[role.k]=1;chars.push(role);
  });
  if(!chars.length)throw new Error('没读到任何角色');
  return {name:meta.name||'(未命名)',author:meta.author||'',
          chars:chars,idOnly:chars.filter(function(c){return c.idOnly;}).length};
}

function cmpRank(mine, opts){
  var top=opts&&opts.top||10, withBig=opts&&opts.withBig;
  var unique=new Map();(mine||[]).map(cmpResolve).filter(function(c){return c.n&&!isLibraryRuleTeam(c.t);}).forEach(function(c){unique.set(c.k,c);});
  var myList=Array.from(unique.values()),mySet=new Map(myList.map(function(c){return [c.k,c];}));
  var out=[];
  for(var i=0;i<SCRIPTS.length;i++){
    var s=SCRIPTS[i];
    var n=s[4]||0;
    if(!withBig&&n>60)continue;                    // 收集类大合集不算
    var theirs=new Map();comparisonRoster(s).forEach(function(r){if(!isLibraryRuleTeam(r.t))theirs.set(r.k,r);});
    if(!theirs.size)continue;
    var common=[],onlyMine=[],onlyTheirs=[],teamDiff=[];
    myList.forEach(function(c){
      if(theirs.has(c.k)){var t=normalizeTeam(theirs.get(c.k).t);common.push(c.n);if(t&&c.t&&t!==c.t)teamDiff.push(c.n);}
      else onlyMine.push(c.n);
    });
    if(!common.length)continue;
    theirs.forEach(function(c,key){if(!mySet.has(key))onlyTheirs.push(c.n);});
    var union=myList.length+theirs.size-common.length;
    out.push({i:i,name:s[0],author:s[1]||'',n:n,common:common.length,
              jac:union?common.length/union:0,
              covMine:common.length/myList.length,
              covTheirs:common.length/theirs.size,
              onlyMine:onlyMine,onlyTheirs:onlyTheirs,teamDiff:teamDiff,big:n>60});
  }
  var sortBy=(opts&&opts.sort)||'jac';
  if(sortBy==='common'){
    // 按「一样几个」排：收集类大剧本会霸榜（它们角色多，能包含你的全部角色），
    // 所以界面上要并排显示人数、并给大剧本打标签，别让人误以为那是"最像的板子"。
    out.sort(function(a,b){return b.common-a.common||b.jac-a.jac;});
  }else{
    out.sort(function(a,b){return b.jac-a.jac||b.common-a.common;});
  }
  var seen=new Set();return out.filter(function(match){var key=scriptFamilyKey(SCRIPTS[match.i]);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,top);
}
