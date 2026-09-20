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
var CUSTOM=[];                 // 用户自建角色
var sel=[];                    // 已选角色
var curTab='all', q='', saveKey='botc_script_tool_v1';
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

function allChars(){return CHARS.concat(CUSTOM);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function initial(n){return (n||'?').trim().charAt(0);}

/* ---------- 角色库 ---------- */
function renderTabs(){
  var counts={all:allChars().length};
  allChars().forEach(function(c){counts[c.t]=(counts[c.t]||0)+1;});
  var order=['all'].concat(TEAMORD).filter(function(t){return counts[t];});
  document.getElementById('tabs').innerHTML=order.map(function(t){
    var label=(t==='all')?'全部':(TEAMCN[t]||t);
    return '<button type="button" class="tab'+(curTab===t?' on':'')+'" data-t="'+t+'">'+esc(label)+
      '<span class="c">'+counts[t]+'</span></button>';
  }).join('');
}
function inSel(c){return sel.indexOf(c)>=0;}
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
}
function renderJinx(){
  var names={}; sel.forEach(function(c){ names[c.n.toLowerCase()]=c.n; });
  var hit=[];
  JINX.forEach(function(j){
    var ps=j.name.split('&');
    if(ps.length<2) ps=j.name.split('与');
    ps=ps.map(function(x){return x.trim();});
    if(ps.length<2)return;
    if(ps.every(function(p){return names[p.toLowerCase()];}))
      hit.push({pair:ps.join(' & '), ab:j.ability});
  });
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
document.getElementById('tabs').addEventListener('click',function(e){
  var t=e.target.closest('.tab'); if(!t)return;
  curTab=t.getAttribute('data-t'); renderTabs(); renderGrid();
});
document.getElementById('grid').addEventListener('click',function(e){
  var c=e.target.closest('.card'); if(!c)return;
  var ch=allChars()[+c.getAttribute('data-i')]; if(!ch)return;
  var k=sel.indexOf(ch);
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
qEl.addEventListener('input',function(){q=qEl.value.trim().toLowerCase();renderGrid();});
function clearQuery(){qEl.value='';q='';renderGrid();}
function addChar(c){
  if(sel.indexOf(c)<0) sel.push(c);
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
  var meta={id:'_meta',name:document.getElementById('mname').value.trim()||'未命名剧本'};
  var a=document.getElementById('mauthor').value.trim();
  if(a)meta.author=a;
  var out=[meta];
  sel.forEach(function(c){
    out.push({id:(c.id||('custom_'+(c.n||''))),name:c.n,team:c.t,ability:c.ab,
      // 导出永远优先写官方图标 URL（iu）；只有表外自定义角色才退回 im
      image:c.images||c.iu||c.im||'',edition:c.ed||'',flavor:c.fl||'',
      setup:c.s||0,firstNight:c.f||0,otherNight:c.o||0,
      reminders:c.r||[],remindersGlobal:c.rg||[],
      firstNightReminder:c.fr||'',otherNightReminder:c.or||''});
  });
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
  var report=ScriptChecks.analyze(sel,document.getElementById('spec').value,JINX);
  if(report.errors.length){document.getElementById('script-checks').open=true;alert('请先修正明确问题：\n'+report.errors.join('\n'));return;}
  var txt=JSON.stringify(exportObj(),null,2);
  openDlg('<h3>导出 JSON</h3><textarea readonly>'+esc(txt)+'</textarea>'+
    '<div class="tip">标准格式（_meta + 完整角色对象），可直接被 bloodstar / 官方工具载入。</div>'+
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
    try{ doImport(ScriptCore.parseJSON(document.getElementById('ta').value)); closeDlg(); }
    catch(err){ alert('解析失败：'+err.message); }
  };
};
function doImport(data){
  var result=ScriptCore.parseImport(data,CHARS);
  if((sel.length||document.getElementById('mname').value||document.getElementById('mauthor').value)&&!confirm('导入会替换当前剧本，继续？'))return false;
  CUSTOM=result.custom; sel=result.selected;
  document.getElementById('mname').value=result.name;
  document.getElementById('mauthor').value=result.author;
  renderAll();
}

document.getElementById('bClear').onclick=function(){
  if(!sel.length)return;
  if(confirm('清空当前剧本？')){ sel=[]; document.getElementById('mname').value='';
    document.getElementById('mauthor').value=''; renderAll(); }
};
document.getElementById('bRandom').onclick=function(){
  if(sel.length&&!confirm('随机生成会替换当前剧本，继续？'))return;
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
  sel=[];
  ['townsfolk','outsider','minion','demon'].forEach(function(t){
    pick(t,need[t]).forEach(function(c){sel.push(c);});
  });
  if(!document.getElementById('mname').value)
    document.getElementById('mname').value='随机剧本';
  renderAll();
};
document.getElementById('bSort').onclick=function(){
  function key(c){
    if(c.f) return [0, c.f];
    if(c.o) return [1, c.o];
    return [2, TEAMORD.indexOf(c.t)*1000 + sel.indexOf(c)];
  }
  sel.sort(function(a,b){var x=key(a),y=key(b);
    return x[0]-y[0]||x[1]-y[1];});
  renderAll();
};
document.getElementById('bNight').onclick=function(){
  var first=sel.filter(function(c){return c.f;})
    .sort(function(a,b){return a.f-b.f;});
  var other=sel.filter(function(c){return c.o;})
    .sort(function(a,b){return a.o-b.o;});
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
    '<div class="tip">内置角色采用项目保存的社区推荐夜序（2026-09-16），仅列出角色行动，不含阶段步骤。未列出不代表无需行动，请结合角色规则核对；自定义角色使用导入的夜序。</div>'+
    '<div class="foot"><button class="btn" id="cpn">复制文本</button>'+
    '<button class="btn" onclick="closeDlg()">关闭</button></div>';
  openDlg(h);
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
    if(allChars().some(function(x){return x.id===c.id;})){alert('角色 ID 已存在，请使用其他 ID');return;}
    try{c=ScriptCore.normalize({id:c.id,name:c.n,team:c.t,ability:c.ab,image:c.im});}catch(e){alert(e.message);return;}
    CUSTOM.push(c); sel.push(c); closeDlg(); renderAll();
  };
};
document.getElementById('preset').onchange=function(){
  var v=this.value; this.value='';
  if(!v)return;
  var p=PRESETS[+v]; if(!p)return;
  if(sel.length && !confirm('载入「'+p.name+'」会覆盖当前剧本，继续？'))return;
  sel=p.idxs.map(function(i){return CHARS[i];});
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
      s:document.getElementById('spec').value,custom:CUSTOM,
      sel:sel.map(function(c){return {id:c.id,name:c.n,custom:CUSTOM.indexOf(c)>=0};})}));
    status('已保存到此浏览器 · 重要剧本请导出 JSON 备份');
  }catch(e){status('本地保存失败，请立即导出 JSON 备份。');}
}
function load(){
  try{
    var raw=localStorage.getItem(saveKey);if(!raw)return false;
    var d=JSON.parse(raw);
    if(!d||!Array.isArray(d.sel)||!Array.isArray(d.custom))throw new Error('存档格式错误');
    if(d.version!==undefined&&d.version!==2)throw new Error('不支持的存档版本');
    var custom=d.custom.map(function(c){return ScriptCore.normalize({id:c.id,name:c.n,team:c.t,ability:c.ab,image:c.images||c.iu||c.im,
      flavor:c.fl,edition:c.ed,setup:c.s,firstNight:c.f,otherNight:c.o,reminders:c.r,remindersGlobal:c.rg,firstNightReminder:c.fr,otherNightReminder:c.or});});
    var selected=d.sel.map(function(k){
      var c;
      if(d.version===2){c=(k.custom?custom:CHARS).find(function(x){return x.id===k.id&&(!k.name||x.n===k.name||(x.source==='yuque'&&x.n===k.name.replace(/^[\s*★]+/,'')));});}
      else if(typeof k==='string'&&/^C\d+$/.test(k))c=custom[+k.slice(1)];
      else if(Number.isInteger(k))c=CHARS[k];
      if(!c)throw new Error('存档包含无法识别的角色');return c;
    });
    custom.forEach(function(c){var known=CHARS.find(function(x){return x.id===c.id;});if(known&&known.im&&known.iu===c.iu)c.im=known.im;});
    CUSTOM=custom;sel=Array.from(new Set(selected));
    document.getElementById('mname').value=d.n||'';
    document.getElementById('mauthor').value=d.a||'';
    document.getElementById('spec').value=['free','teensy','ravenswood'].includes(d.s)?d.s:'free';
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
  if(e.target.tagName==='IMG'){var p=document.createElement('span');p.className='ph';p.textContent='◈';p.setAttribute('aria-label','暂无图标');e.target.replaceWith(p);}
},true);

/* ---------- 启动 ---------- */
document.getElementById('preset').innerHTML='<option value="">快捷载入官方剧本…</option>'+
  PRESETS.map(function(p,i){return '<option value="'+i+'">'+esc(p.name)+
    '（'+p.idxs.length+' 人）</option>';}).join('');
load();
renderAll();
