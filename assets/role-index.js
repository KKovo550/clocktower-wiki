var state={teams:[],tags:[],categories:[],sources:[],q:'',sort:'relevance',all:false,scope:'all',wiki:false};
var $=function(id){return document.getElementById(id);};
var expanded=Object.create(null), composing=false;
function normalize(text){return String(text||'').normalize('NFKC').toLowerCase().trim();}
var searchCache=new WeakMap(), tagCache=new WeakMap(), patternCache=Object.create(null);
function builtinTag(t){return Object.prototype.hasOwnProperty.call(TAGPAT,t);}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function tagRe(p,g){var key=p+'|'+!!g;return patternCache[key]||(patternCache[key]=new RegExp(p,g?'g':''));}
// 某个标签在这段文本里命中的**原文**（高亮用；标签规则来自构建期，跟 Python 共用一份）
function tagHits(text,t){
  var pats=builtinTag(t)?TAGPAT[t]:null;
  if(!pats){
    var literal=String(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return (text||'').match(new RegExp(literal,'gi'))||[];
  }
  var out=[];
  pats.forEach(function(p){
    var m=(text||'').match(tagRe(p,true));
    if(m)m.forEach(function(x){if(out.indexOf(x)<0)out.push(x);});
  });
  return out;
}
// 标签只看**技能描述**（跟构建期算 tags 时用同一段文本，不然两边结果会对不上）；
// 「唤醒提示」那些字段是搜索用的，不参与分类。
function hasTag(r,t){
  var cache=tagCache.get(r);if(!cache){cache=Object.create(null);tagCache.set(r,cache);}
  if(!Object.prototype.hasOwnProperty.call(cache,t))cache[t]=tagHits(r.ab||'',t).length>0;
  return cache[t];
}
// 把命中的关键词高亮出来：能一眼看出"为什么它被归进这一类"
function hl(text,kws){
  text=String(text||'');
  var ranges=[];
  kws.forEach(function(k){
    if(!k)return;
    var re=new RegExp(String(k).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),m;
    while((m=re.exec(text)))ranges.push([m.index,m.index+m[0].length]);
  });
  ranges.sort(function(a,b){return a[0]-b[0]||b[1]-a[1];});
  var merged=[];
  ranges.forEach(function(r){var last=merged[merged.length-1];
    if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r.slice());});
  var out='',at=0;
  merged.forEach(function(r){out+=esc(text.slice(at,r[0]))+'<mark>'+esc(text.slice(r[0],r[1]))+'</mark>';at=r[1];});
  out+=esc(text.slice(at));
  return out;
}
function kwOf(r){
  var kws=[];
  state.tags.forEach(function(t){
    tagHits(r.ab,t).forEach(function(x){if(kws.indexOf(x)<0)kws.push(x);});
  });
  return kws.concat(normalize(state.q).split(/\s+/).filter(Boolean));
}
function roleTags(r){return r.tags||[];}
function matchTeam(r){return !state.teams.length||state.teams.indexOf(r.t)>=0;}
function matchSource(r){return !(state.sources||[]).length||(state.sources||[]).some(function(s){return (r.sources||['other']).indexOf(s)>=0;});}
function sourceLabel(id){var source=ROLE_SOURCES.find(function(s){return s.id===id;});return source?source.label:id;}
function matchTags(r){
  if(!state.tags.length)return true;
  return state.all?state.tags.every(function(t){return hasTag(r,t);})
                  :state.tags.some(function(t){return hasTag(r,t);});
}
function hay(r){
  var cached=searchCache.get(r);
  if(!cached){cached={name:normalize(r.n+' '+r.id),ability:normalize(r.ab),all:normalize(
    [r.n,r.id,r.ab,r.fl,(r.r||[]).join(' '),(r.rg||[]).join(' '),r.fr,r.or,TEAMCN[r.t]||r.t].join(' '))};searchCache.set(r,cached);}
  return cached[state.scope||'all']||cached.all;
}
function matchQ(r){
  if(!state.q)return true;
  return normalize(state.q).split(/\s+/).filter(Boolean).every(function(t){
    return hay(r).indexOf(t)>=0;});
}
function matchWiki(r){return !state.wiki||!!r.wiki;}
function matchCategory(r){return !(state.categories||[]).length||(state.categories||[]).some(function(c){return c==='未归类'?!((r.categories||[]).length):(r.categories||[]).indexOf(c)>=0;});}
function relevance(r){
  var q=normalize(state.q),name=normalize(r.n),id=normalize(r.id);
  if(!q)return 5;
  if(name===q||id===q)return 0;
  if(name.indexOf(q)===0||id.indexOf(q)===0)return 1;
  if(name.indexOf(q)>=0||id.indexOf(q)>=0)return 2;
  return normalize(r.ab).indexOf(q)>=0?3:4;
}
function nightValue(value){return Number.isFinite(Number(value))&&Number(value)>0?Number(value):Infinity;}
function byNight(a,b,key){var x=nightValue(a[key]),y=nightValue(b[key]);return x===y?0:x<y?-1:1;}
function filterRoles(){
  var out=ROLES.filter(function(r){return matchSource(r)&&matchTeam(r)&&matchTags(r)&&matchQ(r)&&matchWiki(r)&&matchCategory(r);});
  var ci=function(t){return TEAMORD.indexOf(t);};
  var names=function(a,b){return a.n.localeCompare(b.n,'zh')||a.id.localeCompare(b.id);};
  if(state.sort==='name')out.sort(function(a,b){return a.n.localeCompare(b.n,'zh');});
  else if(state.sort==='night')out.sort(function(a,b){return byNight(a,b,'f')||byNight(a,b,'o')||names(a,b);});
  else if(state.sort==='otherNight')out.sort(function(a,b){return byNight(a,b,'o')||byNight(a,b,'f')||names(a,b);});
  else if(state.sort==='len')out.sort(function(a,b){return (b.ab||'').length-(a.ab||'').length||names(a,b);});
  else if(state.sort==='relevance')out.sort(function(a,b){return relevance(a)-relevance(b)||ci(a.t)-ci(b.t)||names(a,b);});
  else out.sort(function(a,b){return ci(a.t)-ci(b.t)||a.n.localeCompare(b.n,'zh');});
  return out;
}
function cardHTML(r){
  var kws=kwOf(r);
  var tags=roleTags(r).map(function(t){return '<span class="tg">'+esc(t)+'</span>';}).join('');
  var night=[];
  if(r.f)night.push('首夜'+r.f);
  if(r.o)night.push('其他夜'+r.o);
  var rem=(r.r||[]).concat(r.rg||[]);
  return '<div class="card'+(expanded[r.id]?' open':'')+'" data-id="'+esc(r.id)+'">'+
    (r.im?'<img src="'+esc(r.im)+'" width="46" height="46" loading="lazy" alt="">'
         :'<div class="ph">'+esc((r.n||'?').slice(0,1))+'</div>')+
    '<div class="body"><div class="h"><span class="nm">'+hl(r.n,kws)+'</span>'+
      '<span class="tm '+esc(r.t)+'">'+esc(TEAMCN[r.t]||r.t)+'</span>'+tags+'</div>'+
    '<div class="ab">'+hl(r.ab,kws)+'</div>'+
    (r.wiki?'<a class="wiki-detail" href="'+esc(r.wiki)+'">百科详情</a>':'<span class="hint">百科暂未收录</span>')+
    '<div class="meta">'+(night.length?night.join(' · ')+' · ':'')+
      '技能描述 '+((r.ab||'').length)+' 字</div>'+
    '<button type="button" class="expand-card" aria-expanded="'+!!expanded[r.id]+'">'+(expanded[r.id]?'收起补充信息':'展开补充信息')+'</button>'+
    '<div class="more">'+
      '<div><span class="k">剧本来源：</span>'+esc((r.sources||['other']).map(sourceLabel).join('、'))+'</div>'+
      '<div><span class="k">能力类别：</span>'+esc((r.categories||[]).join('、')||'未归类')+'</div>'+
      (r.fl?('<div><span class="k">风味文本：</span>'+esc(r.fl)+'</div>'):'')+
      (rem.length?('<div><span class="k">提示标记：</span>'+esc(rem.join('、'))+'</div>'):'')+
      (r.fr?('<div><span class="k">首夜唤醒：</span>'+esc(r.fr)+'</div>'):'')+
      (r.or?('<div><span class="k">其他夜晚唤醒：</span>'+esc(r.or)+'</div>'):'')+
      (r.s?('<div><span class="k">人数修正：</span>'+esc(String(r.s))+'</div>'):'')+
      '<div><span class="k">id：</span>'+esc(r.id)+
        (r.ed?('　<span class="k">版本：</span>'+esc(r.ed)):'')+'</div>'+
    '</div></div></div>';
}
function render(){
  var list=filterRoles();
  $('n').textContent=list.length;
  $('copyNames').disabled=!list.length;
  $('copyJson').disabled=!list.length;
  var selected=[];
  if((state.sources||[]).length)selected.push('剧本来源：'+state.sources.map(sourceLabel).join(' 或 '));
  if(state.teams.length)selected.push('角色类型：'+state.teams.map(function(t){return TEAMCN[t]||t;}).join(' 或 '));
  if((state.categories||[]).length)selected.push('能力类别：'+state.categories.join(' 或 '));
  if(state.tags.length)selected.push('技能：'+state.tags.join(state.all?' 且 ':' 或 '));
  if(state.q)selected.push('搜索：'+state.q);
  if(state.wiki)selected.push('仅已收录百科');
  $('filterSummary').textContent=selected.length?'已选 · '+selected.join('；'):'未设置筛选，显示全部角色';
  $('categoryPreview').textContent=(state.categories||[]).length?'已选 '+state.categories.length+' 项 · '+state.categories.join('、'):'31 个类别 · 未限定';
  $('skillPreview').textContent=state.tags.length?'已选 '+state.tags.length+' 项 · '+(state.all?'全部满足':'满足任一'):'未限定';
  var tc={};
  list.forEach(function(r){tc[r.t]=(tc[r.t]||0)+1;});
  $('teamStat').innerHTML=TEAMORD.filter(function(t){return tc[t];}).map(function(t){
    return (TEAMCN[t]||t)+' <b>'+tc[t]+'</b>';}).join('　');
  $('grid').innerHTML=list.length?list.map(cardHTML).join('')
    :'<div class="hint">没有命中的角色，放宽一点条件试试。</div>';
  Array.prototype.forEach.call(document.querySelectorAll('#grid .card'),function(el){
    el.addEventListener('click',function(e){
      if(e.target.closest && e.target.closest('a'))return;
      var id=el.getAttribute('data-id');expanded[id]=!expanded[id];
      el.className=expanded[id]?'card open':'card';
      var button=el.querySelector('.expand-card');button.setAttribute('aria-expanded',String(expanded[id]));
      button.textContent=expanded[id]?'收起补充信息':'展开补充信息';
    });
  });
}
function chipRow(host,items,pick,cls){
  // 每次都整条重建：以前是往 innerHTML 后面追加，点一次筛选条就翻一倍
  var h='<span class="lab">'+(host.id==='sourceChips'?'剧本来源':host.id==='teamChips'?'角色类型':host.id==='categoryChips'?'能力类别':'技能')+'</span>';
  items.forEach(function(it){
    var on=pick.indexOf(it.k)>=0;
    h+='<button type="button" aria-pressed="'+on+'" class="chip '+(cls||'')+' '+(on?'on':'')+'" data-k="'+esc(it.k)+'"'+
       (it.hint?(' title="'+esc(it.hint)+'"'):'')+'>'+esc(it.label)+
       (it.n!=null?(' <span class="c">'+it.n+'</span>'):'')+'</button>';
  });
  host.innerHTML=h;
}
function drawChips(){
  var active=document.activeElement;
  var activeKey=active&&active.getAttribute?active.getAttribute('data-k'):null;
  var activeHost=active&&active.parentNode?active.parentNode.id:null;
  var tc={},gc={};
  var sourceBase=ROLES.filter(function(r){return matchQ(r)&&matchWiki(r)&&matchTeam(r)&&matchTags(r)&&matchCategory(r);});
  chipRow($('sourceChips'),ROLE_SOURCES.map(function(s){return {k:s.id,label:s.label,n:sourceBase.filter(function(r){return (r.sources||['other']).indexOf(s.id)>=0;}).length};}),state.sources||[],'');
  var categoryBase=ROLES.filter(function(r){return matchSource(r)&&matchQ(r)&&matchWiki(r)&&matchTeam(r)&&matchTags(r);});
  var categoryItems=ABILITY_CATEGORIES.map(function(c){return {k:c.name,label:c.name,n:categoryBase.filter(function(r){return (r.categories||[]).indexOf(c.name)>=0;}).length};});
  categoryItems.push({k:'未归类',label:'未归类',n:categoryBase.filter(function(r){return !(r.categories||[]).length;}).length});
  chipRow($('categoryChips'),categoryItems,state.categories||[],'');
  var base=ROLES.filter(function(r){return matchSource(r)&&matchQ(r)&&matchWiki(r)&&matchCategory(r);});
  base.filter(matchTags).forEach(function(r){tc[r.t]=(tc[r.t]||0)+1;});
  var tagBase=base.filter(matchTeam);
  tagBase.forEach(function(r){roleTags(r).forEach(function(t){gc[t]=(gc[t]||0)+1;});});
  var teamItems=TEAMORD.filter(function(t){return ROLES.some(function(r){return r.t===t;});}).map(function(t){
    return {k:t,label:TEAMCN[t]||t,n:tc[t]||0};});
  chipRow($('teamChips'),teamItems,state.teams,'');
  var tagItems=Object.keys(TAGPAT).map(function(t){
    return {k:t,label:t,n:gc[t]||0,hint:TAGHINT[t]};});
  state.tags.forEach(function(t){
    if(!builtinTag(t))tagItems.push({k:t,label:t+'（自定义）',
      n:tagBase.filter(function(r){return hasTag(r,t);}).length,hint:'自己加的关键词'});});
  chipRow($('tagChips'),tagItems,state.tags,'');
  Array.prototype.forEach.call(document.querySelectorAll('#sourceChips .chip'),function(el){
    el.onclick=function(){var k=el.getAttribute('data-k'),chosen=state.sources||[];
      state.sources=chosen.indexOf(k)>=0?chosen.filter(function(s){return s!==k;}):chosen.concat([k]);refresh();};
  });
  Array.prototype.forEach.call(document.querySelectorAll('#teamChips .chip'),function(el){
    el.onclick=function(){var k=el.getAttribute('data-k');
      state.teams=state.teams.indexOf(k)>=0?state.teams.filter(function(x){return x!==k;})
                                          :state.teams.concat([k]);
      drawChips();render();};
  });
  Array.prototype.forEach.call(document.querySelectorAll('#tagChips .chip'),function(el){
    el.onclick=function(){var k=el.getAttribute('data-k');
      state.tags=state.tags.indexOf(k)>=0?state.tags.filter(function(x){return x!==k;})
                                        :state.tags.concat([k]);
      drawChips();render();};
  });
  Array.prototype.forEach.call(document.querySelectorAll('#categoryChips .chip'),function(el){
    el.onclick=function(){var k=el.getAttribute('data-k'),chosen=state.categories||[];
      state.categories=chosen.indexOf(k)>=0?chosen.filter(function(c){return c!==k;}):chosen.concat([k]);refresh();};
  });
  if(activeKey&&activeHost){Array.prototype.forEach.call(document.querySelectorAll('#'+activeHost+' .chip'),function(el){
    if(el.getAttribute('data-k')===activeKey&&el.focus)el.focus();});}
}
function refresh(){drawChips();render();}
function updateQuery(){state.q=normalize($('q').value);refresh();}
$('q').addEventListener('compositionstart',function(){composing=true;});
$('q').addEventListener('compositionend',function(){composing=false;updateQuery();});
$('q').addEventListener('input',function(){if(!composing)updateQuery();});
$('searchScope').addEventListener('change',function(){state.scope=this.value;refresh();});
$('wikiOnly').addEventListener('change',function(){state.wiki=this.checked;refresh();});
$('sort').addEventListener('change',function(){state.sort=this.value;render();});
$('allMode').addEventListener('change',function(){state.all=this.checked;refresh();});
$('clearTeams').onclick=function(){state.teams=[];refresh();};
$('clearSources').onclick=function(){state.sources=[];refresh();};
$('clearTags').onclick=function(){state.tags=[];refresh();};
$('clearCategories').onclick=function(){state.categories=[];refresh();};
$('kwAdd').onclick=function(){
  var v=$('kw').value.trim().slice(0,80);
  if(!v)return;
  if(!state.tags.some(function(t){return normalize(t)===normalize(v);}))state.tags.push(v);
  $('kw').value='';drawChips();render();};
$('kw').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229)$('kwAdd').click();});
$('reset').onclick=function(){state={teams:[],tags:[],categories:[],sources:[],q:'',sort:'relevance',all:false,scope:'all',wiki:false};
  $('q').value='';$('kw').value='';$('allMode').checked=false;$('wikiOnly').checked=false;
  $('sort').value='relevance';$('searchScope').value='all';refresh();};
$('copyNames').onclick=function(){
  var t=filterRoles().map(function(r){return r.n;}).join('、');
  copy(t,this);};
$('copyJson').onclick=function(){
  var t=JSON.stringify(filterRoles(),null,1);
  copy(t,this);};
function copy(text,el){
  if(!text)return;
  var done=function(){var o=el.textContent;el.textContent='已复制';$('copyStatus').textContent='已复制当前筛选结果。';$('copyFallback').hidden=true;
    setTimeout(function(){el.textContent=o;},1200);};
  var fallback=function(){var ta=$('copyFallback');ta.hidden=false;ta.value=text;ta.focus();ta.select();
    var success=false;try{success=document.execCommand('copy')===true;}catch(e){}
    if(success)done();else $('copyStatus').textContent='自动复制未成功。请复制下方已选中的文本。';};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    try{return navigator.clipboard.writeText(text).then(done,fallback);}catch(e){fallback();}
  }else fallback();
}

drawChips();render();
