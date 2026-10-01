CHARS.forEach(function(c){ if(c.t === "traveler") c.t = "traveller"; });
// Match names instead of relying on data array indices.
if(window.BOTC_NIGHT){
  ['first','other'].forEach(function(key){
    var field=key==='first'?'f':'o';
    window.BOTC_NIGHT[key].forEach(function(item,i){
      if(item.kind!=='role')return;
      var c=CHARS.find(function(x){return x.n===item.name;});
      if(c&&!c[field]){c[field]=i+1;c[field+'r']=item.desc||'';}
    });
  });
}
var NIGHT_OVERRIDES=Object.create(null);
var SCRIPT_RULES=[];            // 导入的相克与作者规则
var SCRIPT_META={};             // 保留外部工具的元数据，编辑字段在导出时覆盖
var CUSTOM=[];                 // 用户自建角色
var sel=[];                    // 已选角色
var curTab='all', q='', saveKey='botc_script_tool_v1';
var curSource='all';
var SOURCE_LABELS={all:'全部来源',official:'官方角色',stars:'群星角色',yuque:'海外自制角色',odyssey:'奥德赛角色'};
var SOURCE_BY_ID=new Map(CHARS.map(function(c){return [ScriptCore.identity(c.id),c.source];}));
function roleSource(c){return SOURCE_BY_ID.get(ScriptCore.identity(c.id))||'custom';}
function matchesSource(c){return curSource==='all'||roleSource(c)===curSource;}
var lastList=[];               // 当前筛选结果，供回车/数字键使用

/* ---------- 拼音（简写搜索） ---------- */
var PYM={};
(function(){
  // PY 形如 占zhan卜bo卜bu师shi —— 汉字紧跟其拼音，多音字重复该汉字
  var i=0;
  while(i<PY.length){
    var ch=PY[i++], j=i;
    while(j<PY.length&&PY[j]>='a'&&PY[j]<='z')j++;
    if(j>i){ (PYM[ch]||(PYM[ch]=[])).push(PY.slice(i,j)); }
    i=j;
  }
})();
function pyOf(c){
  if(c._py===undefined){
    var n=c.n||'', ini='', vars=[''];
    for(var k=0;k<n.length;k++){
      var ch=n[k], arr=PYM[ch];
      if(!arr){                                   // 非汉字原样保留
        ini+=ch;
        for(var v=0;v<vars.length;v++) vars[v]+=ch;
        continue;
      }
      ini+=arr[0][0];
      if(arr.length===1){
        for(var v=0;v<vars.length;v++) vars[v]+=arr[0];
      } else {
        // 多音字展开：占卜师既可拼 zhanboshi 也可拼 zhanbushi
        var nv=[];
        for(var v=0;v<vars.length&&nv.length<32;v++)
          for(var a=0;a<arr.length&&nv.length<32;a++) nv.push(vars[v]+arr[a]);
        vars=nv;
      }
    }
    c._py=ini.toLowerCase()+' '+vars.join(' ').toLowerCase();
  }
  return c._py;
}
function initialsOf(name){
  var s='';
  for(var k=0;k<name.length;k++){
    var a=PYM[name[k]];
    s+= a ? a[0][0] : name[k];
  }
  return s.toLowerCase();
}

function allChars(){
  var imported=new Map(CUSTOM.map(function(c){return [ScriptCore.identity(c.id),c];})),seen=new Set();
  return CHARS.concat(CUSTOM).map(function(c){return imported.get(ScriptCore.identity(c.id))||c;}).filter(function(c){var key=ScriptCore.identity(c.id);if(seen.has(key))return false;seen.add(key);return true;});
}
function selectedIndex(c){return sel.findIndex(function(role){return ScriptCore.identity(role.id)===ScriptCore.identity(c.id);});}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function initial(n){return (n||'?').trim().charAt(0);}

/* ---------- 角色库 ---------- */
function renderTabs(){
  var sourceTabs=document.getElementById('source-tabs');
  if(sourceTabs)sourceTabs.innerHTML=Object.keys(SOURCE_LABELS).map(function(key){
    var count=allChars().filter(function(c){return (key==='all'||roleSource(c)===key)&&(curTab==='all'||c.t===curTab)&&matchChar(c,q);}).length;
    return '<button type="button" class="tab'+(curSource===key?' on':'')+'" data-source="'+key+'" aria-pressed="'+(curSource===key)+'">'+SOURCE_LABELS[key]+'<span class="c">'+count+'</span></button>';
  }).join('');
  var counts={all:0};
  allChars().filter(function(c){return matchesSource(c)&&matchChar(c,q);}).forEach(function(c){counts.all++;counts[c.t]=(counts[c.t]||0)+1;});
  var order=['all'].concat(TEAMORD);
  document.getElementById('tabs').innerHTML=order.map(function(t){
    var label=(t==='all')?'全部':(TEAMCN[t]||t);
    return '<button type="button" class="tab'+(curTab===t?' on':'')+'" data-t="'+t+'" aria-pressed="'+(curTab===t)+'">'+esc(label)+
      '<span class="c">'+(counts[t]||0)+'</span></button>';
  }).join('');
}
function inSel(c){return selectedIndex(c)>=0;}
function matchChar(c,query){
  if(!query)return true;
  if((c.n+' '+(c.searchName||'')+' '+(c.id||'')+' '+c.ab).toLowerCase().indexOf(query)>=0)return true;
  return pyOf(c).indexOf(query)>=0;      // 简写 / 全拼
}
function relevance(c,query){
  // 让最贴切的排前面；序号徽章会跟着一起变，所以按 1/2/3 始终对应屏幕顺序
  if(!query)return 0;
  var ini=initialsOf(c.n), nm=(c.n||'').toLowerCase();
  if(ini===query)return 0;
  if(ini.indexOf(query)===0)return 1;
  if(ini.indexOf(query)>0)return 2;
  if(nm.indexOf(query)===0)return 3;
  if(nm.indexOf(query)>0)return 4;
  return 5;
}
function renderGrid(){
  var list=allChars().filter(function(c){
    if(!matchesSource(c))return false;
    if(curTab!=='all'&&c.t!==curTab)return false;
    return matchChar(c,q);
  });
  if(q){
    list.sort(function(a,b){
      var d=relevance(a,q)-relevance(b,q);
      if(d)return d;
      var la=(a.n||'').length, lb=(b.n||'').length;
      if(la!==lb)return la-lb;
      return (a.n||'').localeCompare(b.n||'','zh');
    });
  }
  lastList=list;
  var h=list.map(function(c,i){
    var idx=allChars().indexOf(c);
    var img=c.im?'<img src="'+esc(c.im)+'" loading="lazy" alt="">':
      '<div class="ph">'+esc(initial(c.n))+'</div>';
    // 搜索时给前 9 个标上序号，对应键盘 1-9
    var num=(q&&i<9)?'<span class="num">'+(i+1)+'</span>':'';
    return '<div role="button" tabindex="0" aria-pressed="'+inSel(c)+'" class="card'+(inSel(c)?' on':'')+'" data-i="'+idx+'" data-team="'+
      esc(c.t)+'" title="'+esc(c.n+'：'+c.ab)+'">'+num+img+
      '<div class="nm">'+esc(c.n)+'</div>'+
      (c.source==='yuque'?'<span class="homebrew-label">海外自制</span>':'')+
      (c.source==='stars'?'<span class="homebrew-label">群星</span>':'')+
      '<div class="cid">'+esc(c.id||'')+'</div></div>';
  }).join('');
  var tip='';
  if(q&&list.length===1) tip='<div class="khint">按 <kbd>回车</kbd> 添加「'+esc(list[0].n)+'」</div>';
  else if(q&&list.length>1) tip='<div class="khint">按 <kbd>1</kbd>–<kbd>'+
    Math.min(9,list.length)+'</kbd> 添加对应角色</div>';
  document.getElementById('grid').innerHTML=
    (tip||'')+(h||'<div class="empty">没有匹配的角色</div>');
}

/* ---------- 我的剧本 ---------- */
function groups(){
  var by=Object.create(null);
  sel.forEach(function(c){(by[c.t]=by[c.t]||[]).push(c);});
  return by;
}
function counts(){
  var by=groups(), o={};
  TEAMORD.forEach(function(t){o[t]=(by[t]||[]).length;});
  o.total=sel.length;
  return o;
}
function specCheck(){
  var c=counts(), msg=[], spec=document.getElementById('spec').value;
  if(spec==='teensy'){
    if(c.total>9) msg.push(['bad','总数 '+c.total+' 人，汀西维尔建议 ≤9']);
    if(c.demon>1) msg.push(['bad','恶魔 '+c.demon+' 个，建议 1']);
  } else if(spec==='ravenswood'){
    if(c.townsfolk && c.townsfolk<9) msg.push(['bad','镇民 '+c.townsfolk+'，标准局建议 ≥9']);
    if(c.demon===0) msg.push(['bad','剧本尚未包含恶魔角色']);
    if(c.traveller>5) msg.push(['bad','旅行者 '+c.traveller+'，建议 ≤5']);
  }
  return msg;
}
function renderStat(){
  var c=counts(), parts=[];
  TEAMORD.forEach(function(t){ if(c[t]) parts.push((TEAMCN[t]||t)+' <b>'+c[t]+'</b>'); });
  var h='已选 <b>'+c.total+'</b> 人'+(parts.length?'　'+parts.join('　'):'');

  if(!c.total) h+='<br><span style="color:#9a8a6e">在左侧点击角色加入剧本</span>';
  document.getElementById('stat').innerHTML=h;
  var badge=document.getElementById('selectionCount');if(badge)badge.textContent=c.total;
}
function renderJinx(){
  var rulesBox=document.getElementById('scriptRules');
  if(!rulesBox){rulesBox=document.createElement('details');rulesBox.id='scriptRules';document.getElementById('jinxbox').after(rulesBox);}
  rulesBox.hidden=!SCRIPT_RULES.length;rulesBox.replaceChildren();
  if(SCRIPT_RULES.length){var summary=document.createElement('summary');summary.textContent='剧本相克 / 作者规则（'+SCRIPT_RULES.length+' 条）';rulesBox.appendChild(summary);SCRIPT_RULES.forEach(function(rule){var entry=document.createElement('div'),title=document.createElement('strong'),text=document.createElement('p');title.textContent=rule.name;text.textContent=rule.ability;entry.append(title,text);rulesBox.appendChild(entry);});}

  var hit=ScriptCore.matchJinx(sel,JINX.concat(SCRIPT_RULES)).map(function(match){return {pair:match.roles.map(function(r){return r.n;}).join(' & '),ab:match.text};});
  var box=document.getElementById('jinxbox');
  if(!hit.length){box.innerHTML='';return;}
  box.innerHTML='<div class="jinx"><b>相克提示（'+hit.length+' 条）</b>'+
    hit.map(function(x){return '<div style="margin-top:4px">'+esc(x.pair)+
      '</div><div class="jit">'+esc(x.ab)+'</div>';}).join('')+'</div>';
}
function renderSel(){
  var by=groups(), h='';
  TEAMORD.concat(['custom']).forEach(function(t){
    var arr=by[t]; if(!arr||!arr.length)return;
    h+='<div class="grp"><h4><span>'+esc(TEAMCN[t]||(t==='custom'?'其它':'其他'))+
      '</span><span>'+arr.length+'</span></h4>';
    arr.forEach(function(c){
      var gi=sel.indexOf(c);
      var img=c.im?'<img src="'+esc(c.im)+'" loading="lazy" alt="">':
        '<div class="ph">'+esc(initial(c.n))+'</div>';
      h+='<div class="row2">'+img+'<span class="nm" title="'+esc(c.n+'：'+c.ab)+'">'+
        esc(c.n)+'</span><span class="ab">'+esc(c.ab)+'</span>'+
        '<button class="mini" data-up="'+gi+'" title="上移">↑</button>'+
        '<button class="mini" data-dn="'+gi+'" title="下移">↓</button>'+
        '<button class="mini x" data-rm="'+gi+'" title="移除">✕</button></div>';
    });
    h+='</div>';
  });
  document.getElementById('sel').innerHTML=h||'<div class="empty">剧本还是空的</div>';
}
function renderAll(){
  renderTabs(); renderGrid(); renderStat(); renderJinx(); renderSel(); if(typeof renderScriptChecks==='function')renderScriptChecks(); save();
}

/* ---------- 交互 ---------- */
var sourceTabs=document.getElementById('source-tabs');
if(sourceTabs)sourceTabs.addEventListener('click',function(e){
  var button=e.target.closest('[data-source]'); if(!button)return;
  curSource=button.getAttribute('data-source');renderTabs();renderGrid();
});
document.getElementById('tabs').addEventListener('click',function(e){
  var t=e.target.closest('.tab'); if(!t)return;
  curTab=t.getAttribute('data-t'); renderTabs(); renderGrid();
});
document.getElementById('grid').addEventListener('click',function(e){
  var c=e.target.closest('.card'); if(!c)return;
  var ch=allChars()[+c.getAttribute('data-i')]; if(!ch)return;
  var k=selectedIndex(ch);
  if(k>=0) sel.splice(k,1); else sel.push(ch);
  renderAll();
});
document.getElementById('sel').addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b)return;
  var i;
  if(b.hasAttribute('data-rm')){ i=+b.getAttribute('data-rm'); sel.splice(i,1); }
  else if(b.hasAttribute('data-up')){ i=+b.getAttribute('data-up');
    if(i>0){var x=sel[i-1];sel[i-1]=sel[i];sel[i]=x;} }
  else if(b.hasAttribute('data-dn')){ i=+b.getAttribute('data-dn');
    if(i<sel.length-1){var y=sel[i+1];sel[i+1]=sel[i];sel[i]=y;} }
  renderAll();
});
document.getElementById('q') && null;
var qEl=document.createElement('input');
qEl.type='search';
qEl.setAttribute('aria-label','搜索角色');
qEl.placeholder='搜索角色：名称 / 简写拼音(xyf=洗衣妇) / ID / 能力（按 / 聚焦）';
qEl.style.cssText='width:100%;padding:7px 12px;margin-bottom:8px;font:inherit;'+
  'font-size:14px;border:1px solid var(--tan);border-radius:15px;background:#fffdf8';
document.querySelector('.lib').insertBefore(qEl, document.getElementById('tabs'));
qEl.addEventListener('input',function(){q=qEl.value.trim().toLowerCase();renderTabs();renderGrid();});
function clearQuery(){qEl.value='';q='';renderTabs();renderGrid();}
function addChar(c){
  if(selectedIndex(c)<0) sel.push(c);
  clearQuery(); renderAll();
}
qEl.addEventListener('keydown',function(e){
  // 与原版一致：回车加唯一结果；数字键 1-9 加对应序号
  if(e.isComposing)return;
  if(e.key==='Enter'){
    e.preventDefault();
    if(lastList.length===1) addChar(lastList[0]);
    else if(lastList.length>1) { /* 多个结果时提示用户按数字 */ }
    return;
  }
  if(q&&/^[1-9]$/.test(e.key)&&lastList.length>0){
    var i=parseInt(e.key,10)-1;
    if(i<lastList.length){ e.preventDefault(); addChar(lastList[i]); }
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){
    e.preventDefault();qEl.focus();}
});

/* ---------- 导出 / 导入 ---------- */
function exportObj(){
  var meta=Object.assign(Object.create(null),typeof SCRIPT_META==='undefined'?{}:SCRIPT_META,{id:'_meta',name:document.getElementById('mname').value.trim()||'未命名剧本'});
  var a=document.getElementById('mauthor').value.trim();
  if(a)meta.author=a;else delete meta.author;
  var out=[meta];
  sel.forEach(function(c){
    var night=ScriptCore.nightOrder(c,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES);
    out.push(Object.assign(Object.create(null),c.raw||{},{id:(c.id||('custom_'+(c.n||''))),name:c.n,team:c.t,ability:c.ab,
      // 已收录角色使用统一图床；未匹配自定义角色保留导入图片。
      image:ScriptCore.catalogIcon(c,CHARS,typeof HOSTED_ROLE_ICONS==='undefined'?{}:HOSTED_ROLE_ICONS)||c.images||c.iu||c.im||'',edition:c.ed||'',flavor:c.fl||'',
      setup:c.s||0,firstNight:night.firstNight,otherNight:night.otherNight,
      reminders:c.r||[],remindersGlobal:c.rg||[],
      firstNightReminder:c.fr||'',otherNightReminder:c.or||''}));
  });
  if(typeof SCRIPT_RULES!=='undefined')out=out.concat(SCRIPT_RULES.map(function(rule){return JSON.parse(JSON.stringify(rule));}));
  return out;
}
function download(name,text){
  var b=new Blob([text],{type:'application/json;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(b); a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
}
function openDlg(html){document.getElementById('dlgBody').innerHTML=html;
  document.getElementById('dlg').showModal();}
function closeDlg(){document.getElementById('dlg').close();}

document.getElementById('bExport').onclick=function(){
  var report=ScriptChecks.analyze(sel,document.getElementById('spec').value,JINX.concat(SCRIPT_RULES));
  if(report.errors.length){document.getElementById('script-checks').open=true;alert('请先修正明确问题：\n'+report.errors.join('\n'));return;}
  var txt=JSON.stringify(exportObj(),null,2);
  openDlg('<h3>导出 JSON</h3><textarea readonly>'+esc(txt)+'</textarea>'+
    '<div class="tip">标准格式（_meta + 完整角色对象），可直接被 bloodstar / 官方工具载入。已收录角色使用本站夜晚行动顺序表；未定位的行动与表外角色保留原夜序。</div>'+
    '<div class="foot"><button class="btn" id="cp">复制</button>'+
    '<button class="btn pri" id="dl">下载 .json</button>'+
    '<button class="btn" onclick="closeDlg()">关闭</button></div>');
  document.getElementById('dl').onclick=function(){
    download((document.getElementById('mname').value.trim()||'script')+'.json',txt);};
  document.getElementById('cp').onclick=function(){
    copyText(txt,this);};
};
document.getElementById('bImport').onclick=function(){
  openDlg('<h3>导入 JSON</h3>'+
    '<label>选择文件</label><input type="file" id="f" accept=".json,application/json">'+
    '<label>或直接粘贴 JSON</label><textarea id="ta" placeholder="[{&quot;id&quot;:&quot;_meta&quot;,...}]"></textarea>'+
    '<div class="foot"><button class="btn pri" id="go">导入</button>'+
    '<button class="btn" onclick="closeDlg()">取消</button></div>');
  document.getElementById('f').onchange=function(){
    if(!this.files.length)return;
    if(this.files[0].size>2*1024*1024){alert('文件不能超过 2 MB');return;}
    var fr=new FileReader();
    fr.onerror=function(){alert('文件读取失败，请重试');};
    fr.onload=function(){document.getElementById('ta').value=fr.result;};
    fr.readAsText(this.files[0]);};
  document.getElementById('go').onclick=function(){
    try{ if(doImport(ScriptCore.parseJSON(document.getElementById('ta').value))!==false)closeDlg(); }
    catch(err){ alert('解析失败：'+err.message); }
  };
};
function doImport(data){
  var result=ScriptCore.parseImport(data,CHARS);
  if((sel.length||document.getElementById('mname').value||document.getElementById('mauthor').value||SCRIPT_RULES.length)&&!confirm('导入会替换当前剧本，继续？'))return false;
  CUSTOM=result.custom; SCRIPT_RULES=result.rules; SCRIPT_META=result.meta;sel=result.selected; NIGHT_OVERRIDES=Object.create(null);
  document.getElementById('mname').value=result.name;
  document.getElementById('mauthor').value=result.author;
  renderAll();
}

document.getElementById('bClear').onclick=function(){
  if(!sel.length&&!SCRIPT_RULES.length)return;
  if(confirm('清空当前剧本？')){ SCRIPT_META={};SCRIPT_RULES=[];sel=[]; NIGHT_OVERRIDES=Object.create(null); document.getElementById('mname').value='';
    document.getElementById('mauthor').value=''; renderAll(); }
};
document.getElementById('bRandom').onclick=function(){
  if((sel.length||SCRIPT_RULES.length)&&!confirm('随机生成会替换当前剧本，继续？'))return;
  var need={townsfolk:13,outsider:4,minion:4,demon:4};
  var spec=document.getElementById('spec').value;
  if(spec==='teensy') need={townsfolk:5,outsider:1,minion:1,demon:1};
  if(spec==='free') need={townsfolk:9,outsider:2,minion:2,demon:1};
  function pick(t,n){
    var pool=CHARS.filter(function(c){return c.t===t;});
    for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));
      var x=pool[i];pool[i]=pool[j];pool[j]=x;}
    return pool.slice(0,n);
  }
  SCRIPT_META={};SCRIPT_RULES=[];sel=[]; NIGHT_OVERRIDES=Object.create(null);
  ['townsfolk','outsider','minion','demon'].forEach(function(t){
    pick(t,need[t]).forEach(function(c){sel.push(c);});
  });
  if(!document.getElementById('mname').value)
    document.getElementById('mname').value='随机剧本';
  renderAll();
};
document.getElementById('bSort').onclick=function(){
  function key(c){
    var night=ScriptCore.nightOrder(c,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES);
    if(night.firstNight) return [0, night.firstNight];
    if(night.otherNight) return [1, night.otherNight];
    return [2, TEAMORD.indexOf(c.t)*1000 + sel.indexOf(c)];
  }
  sel.sort(function(a,b){var x=key(a),y=key(b);
    return x[0]-y[0]||x[1]-y[1];});
  renderAll();
};
document.getElementById('bNight').onclick=function(){
  function ordered(field){
    return sel.filter(function(c){return ScriptCore.nightOrder(c,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES)[field];})
      .sort(function(a,b){return ScriptCore.nightOrder(a,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES)[field]-ScriptCore.nightOrder(b,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES)[field];});
  }
  var first=ordered('firstNight'),other=ordered('otherNight');
  function li(c,k){return '<li>'+esc(c.n)+' <span style="color:#9a8a6e;font-size:11.5px">'+
    (c[k+((k==='f')?'r':'r')]||'')+'</span></li>';}
  var h='<h3>夜晚行动顺序</h3><div class="night">'+
    '<div><h5>首夜（'+first.length+'）</h5><ol>'+
      (first.map(function(c){return '<li>'+esc(c.n)+
        (c.fr?' <span style="color:#9a8a6e;font-size:11.5px">'+esc(c.fr)+'</span>':'')+
        '</li>';}).join('')||'<li style="color:#9a8a6e">无</li>')+'</ol></div>'+
    '<div><h5>其他夜晚（'+other.length+'）</h5><ol>'+
      (other.map(function(c){return '<li>'+esc(c.n)+
        (c.or?' <span style="color:#9a8a6e;font-size:11.5px">'+esc(c.or)+'</span>':'')+
        '</li>';}).join('')||'<li style="color:#9a8a6e">无</li>')+'</ol></div></div>'+
    '<div class="tip">拖拽角色调整本夜顺序，也可用上下按钮移动。修改立即保存并用于 JSON 导出；首夜与其他夜晚独立调整。列表序号不是 JSON 中的夜序值。</div>'+
    '<div class="foot"><button class="btn" id="resetNight">恢复默认夜序</button><button class="btn" id="cpn">复制文本</button>'+
    '<button class="btn" onclick="closeDlg()">关闭</button></div>';
  openDlg(h);
  var dragged=null;
  function move(list,field,from,to){
    if(from===to)return;
    // Reuse ordered slots, splitting ties so the chosen order exports exactly.
    var slots=list.map(function(c){return ScriptCore.nightOrder(c,SCRIPT_NIGHT_ORDER,NIGHT_OVERRIDES)[field];});
    for(var i=0;i<slots.length;i++){
      if(i>0&&slots[i]<=slots[i-1])slots[i]=slots[i-1]+0.001;
    }
    list.splice(to,0,list.splice(from,1)[0]);
    list.forEach(function(c,i){(NIGHT_OVERRIDES[c.id]||(NIGHT_OVERRIDES[c.id]={}))[field]=slots[i];});
    save();document.getElementById('bNight').onclick();
  }
  document.querySelectorAll('#dlgBody .night ol').forEach(function(ol,night){
    var list=night===0?first:other,field=night===0?'firstNight':'otherNight';
    Array.from(ol.children).forEach(function(li,index){
      if(!list.length)return;
      li.draggable=true;li.classList.add('night-sortable');
      li.addEventListener('dragstart',function(e){dragged={night:night,index:index};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(index));});
      li.addEventListener('dragover',function(e){if(dragged&&dragged.night===night){e.preventDefault();e.dataTransfer.dropEffect='move';}});
      li.addEventListener('drop',function(e){e.preventDefault();if(dragged&&dragged.night===night)move(list,field,dragged.index,index);dragged=null;});
      li.addEventListener('dragend',function(){dragged=null;});
      [-1,1].forEach(function(delta){
        var button=document.createElement('button');button.type='button';button.className='night-move';
        button.textContent=delta<0?'↑':'↓';button.setAttribute('aria-label',(delta<0?'上移':'下移')+list[index].n);
        button.disabled=index+delta<0||index+delta>=list.length;
        button.onclick=function(){move(list,field,index,index+delta);var next=document.querySelectorAll('#dlgBody .night ol')[night].children[index+delta];next.querySelector(delta<0?'button':'button:last-child').focus();};
        li.appendChild(button);
      });
    });
  });
  document.getElementById('resetNight').onclick=function(){NIGHT_OVERRIDES=Object.create(null);save();document.getElementById('bNight').onclick();};
  document.getElementById('cpn').onclick=function(){
    var t='【首夜】\n'+first.map(function(c,i){return (i+1)+'. '+c.n;}).join('\n')+
      '\n\n【其他夜晚】\n'+other.map(function(c,i){return (i+1)+'. '+c.n;}).join('\n');
    copyText(t,this);};
};
document.getElementById('bCustom').onclick=function(){
  var opts=TEAMORD.map(function(t){return '<option value="'+t+'">'+
    esc(TEAMCN[t])+'</option>';}).join('');
  openDlg('<h3>自定义角色</h3>'+
    '<label>角色名称 *</label><input type="text" id="cn" placeholder="例如：戏子">'+
    '<label>英文 id（可留空，自动生成）</label><input type="text" id="ci" placeholder="xizi">'+
    '<label>阵营</label><select id="ct">'+opts+'</select>'+
    '<label>能力文本</label><textarea class="small" id="ca" style="height:70px"></textarea>'+
    '<label>图标 URL（可留空）</label><input type="text" id="cm" placeholder="https://...">'+
    '<div class="foot"><button class="btn pri" id="cok">加入并选中</button>'+
    '<button class="btn" onclick="closeDlg()">取消</button></div>');
  document.getElementById('cok').onclick=function(){
    var n=document.getElementById('cn').value.trim();
    if(!n){alert('请填写角色名称');return;}
    var c={n:n,id:document.getElementById('ci').value.trim()||('custom_'+n),
      t:document.getElementById('ct').value,
      ab:document.getElementById('ca').value.trim(),
      im:document.getElementById('cm').value.trim(),
      fl:'',ed:'custom',s:0,f:0,o:0,r:[],rg:[],fr:'',or:''};
    if(allChars().some(function(x){return ScriptCore.identity(x.id)===ScriptCore.identity(c.id);})){alert('角色 ID 已存在，请使用其他 ID');return;}
    try{c=ScriptCore.normalize({id:c.id,name:c.n,team:c.t,ability:c.ab,image:c.im});}catch(e){alert(e.message);return;}
    CUSTOM.push(c); sel.push(c); closeDlg(); renderAll();
  };
};
document.getElementById('preset').onchange=function(){
  var v=this.value; this.value='';
  if(!v)return;
  var p=PRESETS[+v]; if(!p)return;
  if((sel.length||SCRIPT_RULES.length) && !confirm('载入「'+p.name+'」会覆盖当前剧本，继续？'))return;
  NIGHT_OVERRIDES=Object.create(null);
  SCRIPT_META={};SCRIPT_RULES=[];sel=p.idxs.map(function(i){return CHARS[i];});
  document.getElementById('mname').value=p.name;
  renderAll();
};
document.getElementById('spec').onchange=function(){renderStat();renderScriptChecks();save();};
['mname','mauthor'].forEach(function(id){document.getElementById(id).addEventListener('input',save);});

/* ---------- 本地保存 ---------- */
var storageBlocked=false;
function status(text){document.getElementById('saveStatus').textContent=text;}
function save(){
  if(storageBlocked)return;
  try{
    localStorage.setItem(saveKey,JSON.stringify({version:2,
      n:document.getElementById('mname').value,a:document.getElementById('mauthor').value,
      s:document.getElementById('spec').value,custom:CUSTOM,rules:SCRIPT_RULES,meta:SCRIPT_META,nightOverrides:NIGHT_OVERRIDES,
      sel:sel.map(function(c){return {id:c.id,name:c.n,custom:CUSTOM.indexOf(c)>=0};})}));
    status('已保存到此浏览器 · 重要剧本请导出 JSON 备份');
  }catch(e){status('本地保存失败，请立即导出 JSON 备份。');}
}
function load(){
  try{
    var raw=localStorage.getItem(saveKey);if(!raw)return false;
    var draft=ScriptCore.restoreDraft(JSON.parse(raw),CHARS);
    CUSTOM=draft.custom;SCRIPT_RULES=draft.rules;SCRIPT_META=draft.meta;sel=draft.selected;NIGHT_OVERRIDES=draft.nightOverrides;
    document.getElementById('mname').value=draft.name;
    document.getElementById('mauthor').value=draft.author;
    document.getElementById('spec').value=draft.spec;
    return true;
  }catch(e){storageBlocked=true;status('无法读取旧存档，已保护原始数据，当前修改不会自动保存。请导出备份后检查浏览器存储。');return false;}
}
async function copyText(text,button){
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(text);
    else throw new Error('clipboard unavailable');
    button.textContent='已复制 ✓';
  }catch(e){
    var ta=document.createElement('textarea');ta.value=text;document.getElementById('dlgBody').appendChild(ta);ta.select();
    var ok=false;try{ok=document.execCommand('copy');}catch(ignore){}
    if(ok){ta.remove();button.textContent='已复制 ✓';}else{button.textContent='请手动复制下方文本';}
  }
}
document.getElementById('grid').addEventListener('keydown',function(e){
  if(e.target.matches('.card')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();}
});
document.addEventListener('error',function(e){
  if(e.target.id==='artPreview')return;
  if(e.target.tagName==='IMG'){var p=document.createElement('span');p.className='ph';p.textContent='◈';p.setAttribute('aria-label','暂无图标');e.target.replaceWith(p);}
},true);

/* ---------- 启动 ---------- */
document.getElementById('preset').innerHTML='<option value="">快捷载入官方剧本…</option>'+
  PRESETS.map(function(p,i){return '<option value="'+i+'">'+esc(p.name)+
    '（'+p.idxs.length+' 人）</option>';}).join('');
load();
renderAll();
