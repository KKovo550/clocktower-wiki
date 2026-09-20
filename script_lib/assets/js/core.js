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

function normalizeTeam(team) {
  var aliases = {
    traveler: 'traveller', '镇民': 'townsfolk', '外来者': 'outsider',
    '爪牙': 'minion', '恶魔': 'demon', '旅行者': 'traveller',
    '传奇': 'fabled', '传奇角色': 'fabled', '奇遇': 'loric', '奇遇角色': 'loric'
  };
  return Object.prototype.hasOwnProperty.call(aliases, team) ? aliases[team] : (team || '');
}

function cmpNormTeam(t){ return normalizeTeam(t); }

function cmpParse(text){
  var data=JSON.parse(String(text).replace(/^\uFEFF/,''));
  if(!Array.isArray(data))throw new Error('顶层必须是数组（剧本 JSON 的格式）');
  var meta={},chars=[],seen=Object.create(null);
  data.forEach(function(e){
    if(!e)return;
    if(typeof e==='string'){                       // 只给了 id，名字认不出来
      if(!seen[e]){seen[e]=1;chars.push({n:e,t:'',idOnly:true});}
      return;
    }
    if(typeof e!=='object')return;
    if(e.id==='_meta'){meta=e;return;}
    var n=e.name||e.id;
    if(!n||seen[n])return;
    seen[n]=1;
    chars.push({n:n,t:cmpNormTeam(e.team),ability:e.ability||''});
  });
  if(!chars.length)throw new Error('没读到任何角色');
  return {name:meta.name||'(未命名)',author:meta.author||'',
          chars:chars,idOnly:chars.filter(function(c){return c.idOnly;}).length};
}

function cmpRank(mine, opts){
  var top=opts&&opts.top||10, withBig=opts&&opts.withBig;
  var myList=(mine||[]).map(function(c){
    return (typeof c==='string')?{n:c,t:''}:{n:c.n,t:normalizeTeam(c.t)};
  }).filter(function(c){return c.n;});
  var mySet=Object.create(null);
  myList.forEach(function(c){mySet[c.n]=c.t;});
  var out=[];
  for(var i=0;i<SCRIPTS.length;i++){
    var s=SCRIPTS[i];
    var n=s[4]||0;
    if(!withBig&&n>60)continue;                    // 收集类大合集不算
    var theirs=Object.create(null),tnames=[];
    (s[5]||[]).forEach(function(ci){
      var c=CHARS[ci]; if(!c)return;
      if(!(c[0] in theirs)){theirs[c[0]]=c[1];tnames.push(c[0]);}
    });
    if(!tnames.length)continue;
    var common=[],onlyMine=[],onlyTheirs=[],teamDiff=[];
    myList.forEach(function(c){
      if(c.n in theirs){common.push(c.n);if(theirs[c.n]&&c.t&&theirs[c.n]!==c.t)teamDiff.push(c.n);}
      else onlyMine.push(c.n);
    });
    if(!common.length)continue;
    tnames.forEach(function(nm){if(!(nm in mySet))onlyTheirs.push(nm);});
    var union=myList.length+tnames.length-common.length;
    out.push({i:i,name:s[0],author:s[1]||'',n:n,common:common.length,
              jac:union?common.length/union:0,
              covMine:common.length/myList.length,
              covTheirs:common.length/tnames.length,
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
  return out.slice(0,top);
}
