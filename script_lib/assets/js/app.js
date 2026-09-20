// 搜索、详情、导出和比对界面。依赖 config.js、catalog.js、core.js。
var catSel=document.getElementById('cat');
document.getElementById('librarySummary').textContent='剧本库 · '+SCRIPTS.length+' 个剧本 · '+
  SCRIPTS.filter(function(s){return s[10]&&s[10].length;}).length+' 个有剧照（'+
  SCRIPTS.reduce(function(total,s){return total+(s[10]||[]).length;},0)+' 张关联图片）';
// 预建小写检索串
CHARS.forEach(function(c){ c[1]=normalizeTeam(c[1]); });
var scriptIndexes=new Map();
SCRIPTS.forEach(function(s,i){
  scriptIndexes.set(s,i);
  var cn=s[5].map(function(i){return CHARS[i][0];}).join(' ');
  s._s=((s[0]+' '+s[1]+' '+s[2]+' '+cn)||'').toLowerCase();
  s._cn=cn;
});
var cur=[],currentPage=1,pageSize=50;
var filterIds=['includeRoles','excludeRoles','q','cat','team','minc','maxc','sort','onlypic','completionFilter','personalFilter'];
var lastFilter='';
function saveFilters(){
  var state={page:currentPage,pageSize:pageSize};
  filterIds.forEach(function(id){var el=document.getElementById(id);state[id]=id==='onlypic'?el.checked:el.value;});
  writePreference('scriptlib-filters',state);
}
function restoreFilters(){
  var state=readPreference('scriptlib-filters',{});
  filterIds.forEach(function(id){var el=document.getElementById(id);if(id==='onlypic')el.checked=state[id]===true;else if(typeof state[id]==='string')el.value=state[id];});
  pageSize=[50,100,200].includes(Number(state.pageSize))?Number(state.pageSize):50;
  currentPage=Math.max(1,Math.floor(Number(state.page)||1));
  document.getElementById('pageSize').value=String(pageSize);
}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
// 角色名 -> 百科链接（构建期算好，塞在 CHARS 第 3 位；查不到就是空串）
var CHARW=Object.create(null);
CHARS.forEach(function(c){var u=c[2];if(u&&!(c[0] in CHARW))CHARW[c[0]]=u;});
function wikiURL(n){
  if(CHARW[n])return CHARW[n];
  // 斜杠必须写成 \/：V8 对 /[&＆、/]/ 直接报 Invalid regular expression: missing /
  var p=String(n).split(/[&＆、\/]/);
  for(var i=0;i<p.length;i++){var q=p[i].trim();if(q&&CHARW[q])return CHARW[q];}
  return '';
}
function counts(a){var m={};a.forEach(function(i){var t=CHARS[i][1]||'?';m[t]=(m[t]||0)+1;});return m;}
function render(){
  renderCategorySelectors();
  var signature=JSON.stringify(filterIds.map(function(id){var el=document.getElementById(id);return id==='onlypic'?el.checked:el.value;}));
  if(lastFilter&&lastFilter!==signature)currentPage=1;
  lastFilter=signature;
  var q=document.getElementById('q').value.trim().toLowerCase();
  var cat=catSel.value, team=document.getElementById('team').value;
  var mn=parseInt(document.getElementById('minc').value,10);
  var mx=parseInt(document.getElementById('maxc').value,10);
  var onlypic=document.getElementById('onlypic').checked;
  var sort=document.getElementById('sort').value;
  cur=SCRIPTS.filter(function(s){
    if(typeof libraryRoleMatches==='function'&&!libraryRoleMatches(s))return false;
    if(typeof workspaceMatches==='function'&&!workspaceMatches(s))return false;
    if(cat&&!categoryMatches(s[2],cat))return false;
    if(onlypic&&!shownCount(s))return false;
    if(!isNaN(mn)&&s[4]<mn)return false;
    if(!isNaN(mx)&&s[4]>mx)return false;
    if(team){var hit=false;for(var k=0;k<s[5].length;k++){if(CHARS[s[5][k]][1]===team){hit=true;break;}}
      if(!hit)return false;}
    if(q&&!q.split(/\s+/).every(function(term){
      return term[0]==='#'?s[5].some(function(ci){return CHARS[ci][0].toLowerCase()===term.slice(1);}):s._s.indexOf(term)>=0;
    }))return false;
    return true;
  });
  cur.sort(function(a,b){
    if(sort==='played'&&typeof personalFor==='function')return (personalFor(b).played||'').localeCompare(personalFor(a).played||'');
    if(sort==='size')return b[4]-a[4];
    if(sort==='author')return (a[1]||'').localeCompare(b[1]||'','zh')||(a[0]||'').localeCompare(b[0]||'','zh');
    return (a[0]||'').localeCompare(b[0]||'','zh');
  });
  document.getElementById('stats').textContent='命中 '+cur.length+' / '+SCRIPTS.length+' 个剧本';
  var pages=Math.max(1,Math.ceil(cur.length/pageSize));
  currentPage=Math.min(currentPage,pages);
  document.getElementById('pageInfo').textContent=currentPage+' / '+pages+' 页';
  document.getElementById('pagePrev').disabled=currentPage===1;
  document.getElementById('pageNext').disabled=currentPage===pages;
  saveFilters();
  var h=cur.slice((currentPage-1)*pageSize,currentPage*pageSize).map(function(s,i){
    var c=counts(s[5]),pills=TEAMORD.filter(function(t){return c[t];})
      .map(function(t){return '<span class="pill t-'+t+'">'+TEAMCN[t]+c[t]+'</span>';}).join('');
    return '<div class="row" data-i="'+scriptIndexes.get(s)+'"><span class="nm">'+esc(s[0]||'(未命名)')+
      '</span><span class="au">'+esc(s[1]||'佚名')+'</span>'+pills+
      (shownCount(s)?'<span class="pic">剧本图'+shownCount(s)+'</span>':'')+
      '<span class="cat">'+esc(s[2])+'</span><span class="cnt">'+(s[6]==='url'?'暂无 JSON':s[4]+'人')+'</span></div>';
  }).join('');

  document.getElementById('list').innerHTML=h||'<div class="hint">没有匹配的剧本</div>';
  document.getElementById('list').scrollTop=0;
}
var SCRIPTS_BY_INDEX={};SCRIPTS.forEach(function(s,i){SCRIPTS_BY_INDEX[i]=s;});
document.getElementById('list').addEventListener('click',function(e){
  var row=e.target.closest('.row');if(!row)return;
  Array.prototype.forEach.call(this.querySelectorAll('.row'),function(r){r.className='row';});
  row.className='row sel';
  show(+row.getAttribute('data-i'));
});
function show(i){
  if(typeof detailRevision!=='undefined')detailRevision++;
  var s=SCRIPTS_BY_INDEX[i];if(!s){return;}
  var by={};s[5].forEach(function(x){var t=CHARS[x][1]||'other';(by[t]=by[t]||[]).push(CHARS[x][0]);});
  // 同名可能有多张卡（有的剧本把一条规则拆成 5 张编号卡），用 ×N 表示而不合并
  function chips(arr){
    var cnt={},ord=[];
    arr.forEach(function(n){if(!(n in cnt)){cnt[n]=0;ord.push(n);}cnt[n]++;});
    return ord.map(function(n){
      var tail=(cnt[n]>1?' <b>×'+cnt[n]+'</b>':'');
      var u=wikiURL(n);
      if(!u)return '<span title="钟楼百科暂无这个词条">'+esc(n)+tail+'</span>';
      return '<a href="'+u+'" target="_blank" rel="noopener" title="钟楼百科：'+
        esc(n)+'（新标签页打开）">'+esc(n)+tail+'<span class="x">↗</span></a>';
    }).join('');
  }
  var body=TEAMORD.filter(function(t){return by[t];}).map(function(t){
    return '<div class="team-h">'+TEAMCN[t]+' · '+by[t].length+'</div><div class="chars">'+
      chips(by[t])+'</div>';
  }).join('');
  var other=by['other']?('<div class="team-h">未知阵营 · '+by['other'].length+'</div><div class="chars">'+
    chips(by['other'])+'</div>'):'';
  var uniqW={},nAllW=0,nLinkW=0;
  s[5].forEach(function(x){var nm=CHARS[x][0];
    if(!(nm in uniqW)){uniqW[nm]=1;nAllW++;if(wikiURL(nm))nLinkW++;}});
  document.getElementById('detail').innerHTML=
    '<h2 class="dt">'+esc(s[0]||'(未命名)')+'</h2>'+
    '<div class="dtmeta">作者：'+esc(s[1]||'佚名')+'　'+(s[6]==='url'?'暂无 JSON':'共 '+s[4]+' 人')+'<br>'+
    '分类：'+esc(s[2])+'<br>路径：'+esc(JSONBASE+'/'+s[3].replace(/\\/g,'/'))+
    (s[7]?'<br>说明：'+esc(s[7]):'')+
    (s[8]?'<br>外链：<a href="'+esc(s[8])+'" target="_blank">'+esc(s[8])+'</a>':'')+
    (nAllW?'<br>百科词条：<b>'+nLinkW+'</b> / '+nAllW+
      (nLinkW?'（角色名带虚线下划线，点击在新标签页打开词条）':
               '（这些角色在钟楼百科里还没有词条）'):'')+
    '</div>'+
    shots(s)+
    '<div><a class="btn" id="btn-path">复制文件路径</a>'+
    (s[6]==='json'?'<button class="btn" id="btn-local-json" type="button">下载 JSON</button>':'')+
    '<a class="btn" id="btn-chars">复制角色名单</a>'+
    '<a class="btn" id="btn-json" title="生成这个剧本的 JSON，弹出框里选中复制（也可下载）">复制 JSON</a>'+
    '<button class="btn" id="btn-edit-script" type="button">在剧本工具中编辑</button>'+
    '<a class="btn" id="btn-one">导出这个剧本</a></div>'+
    body+other+(typeof workspaceDetail==='function'?workspaceDetail(i):'');
  var jsonButton=document.getElementById('btn-local-json');
  if(jsonButton)jsonButton.onclick=function(){
    var selectedVersion=typeof chosenVersions!=='undefined'?chosenVersions[i]:null;
    jsonButton.disabled=true;
    loadFull(function(){
      jsonButton.disabled=false;
      if((typeof chosenVersions!=='undefined'?chosenVersions[i]:null)!==selectedVersion){alert('版本已改变，请重新下载。');return;}
      var original=typeof selectedOriginal==='function'?selectedOriginal(i,FULL[i]):FULL[i];
      if(original&&typeof original.t==='string')jsonSave(original.t,original.f);else alert('此剧本没有可下载的 JSON');
    },function(message){jsonButton.disabled=false;alert(message);});
  };
  if(typeof bindEditorTransfer==='function')bindEditorTransfer(i);
  if(typeof bindWorkspaceDetail==='function')bindWorkspaceDetail(i);
  document.getElementById('btn-path').onclick=function(){
    copy(JSONBASE+'/'+s[3].replace(/\\/g,'/'),this);};
  document.getElementById('btn-one').onclick=function(){
    exportDlg([i]);};
  document.getElementById('btn-json').onclick=function(){
    copyJsonDlg([i]);};
  document.getElementById('btn-chars').onclick=function(){
    var t=TEAMORD.filter(function(x){return by[x];}).map(function(x){
      var c={},o=[];by[x].forEach(function(n){if(!(n in c)){c[n]=0;o.push(n);}c[n]++;});
      return '【'+TEAMCN[x]+'】'+o.map(function(n){return n+(c[n]>1?'×'+c[n]:'');}).join('、');}).join('\n');
    copy(t,this);};
}
['includeRoles','excludeRoles','q','cat','team','minc','maxc','sort','onlypic'].forEach(function(id){
  var el=document.getElementById(id);
  el.addEventListener((['q','includeRoles','excludeRoles'].includes(id))?'input':'change',render);
});

/* ======================================================================
   导出剧本 JSON
   ----------------------------------------------------------------------
   页面是 file:// 打开的，fetch() 读不了磁盘上的原文件，所以剧本原文由
   构建期塞进 assets/scripts-full.js，点导出时才 <script> 动态加载。

   落盘优先用 File System Access API（showDirectoryPicker）：用户选一次
   目标文件夹（例如 桌面\json），页面就能把 N 个文件直接写进去；
   浏览器不支持时退化成逐个下载。
   ====================================================================== */
var FULL=null, FULL_LOADING=false, expSel=null, jsonSel=null,
    expPickKind='cur', expPickOwner='exp';

function expTip(msg,hold){
  var t=document.getElementById('expTip');
  if(!msg){t.className='exporting';return;}
  t.textContent=msg;t.className='exporting on';
  if(!hold)setTimeout(function(){t.className='exporting';},1800);
}
function curIdxs(){
  return cur.map(function(s){return scriptIndexes.get(s);});
}
function exportDlg(preset){
  if(exportBusy){document.getElementById('expMask').className='on';return;}
  requestDataDialog('export',preset);
}
function expDlgShow(){
  var selIdx=expSel&&expSel.length?expSel:null;
  var nSel=selIdx?selIdx.length:0, nCur=curIdxs().length, nAll=SCRIPTS.length;
  var opts=[
    ['sel','当前选中的剧本', nSel, nSel===0],
    ['cur','当前筛选出的剧本', nCur, false],
    ['all','全部剧本', nAll, false]
  ];
  var pick = selIdx?'sel':'cur';
  expPickKind=pick; expPickOwner='exp';
  document.getElementById('expOpts').innerHTML=opts.map(function(o){
    return '<label class="opt'+(o[0]===pick?' on':'')+(o[3]?'':'')+'" data-k="'+o[0]+'"'+
      (o[3]?' style="opacity:.45;cursor:not-allowed"':'')+'>'+
      '<input type="radio" name="expr" value="'+o[0]+'"'+(o[0]===pick?' checked':'')+
      (o[3]?' disabled':'')+'> <b>'+o[1]+'</b><em>'+o[2]+' 个</em></label>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('#expOpts .opt'),function(el){
    el.addEventListener('click',function(){
      if(exportBusy||el.getAttribute('style'))return;
      Array.prototype.forEach.call(document.querySelectorAll('#expOpts .opt'),
        function(x){x.className='opt';});
      el.className='opt on';
      el.querySelector('input').checked=true;
      expPickKind=el.getAttribute('data-k');
      expUpdateImgHint();
    });
  });
  expUpdateImgHint();
  if(exportJobs.length)exportProgress();
  else document.getElementById('expStat').textContent='';
  document.getElementById('expMask').className='on';
}
// 「连剧本图一起」要按当前范围实时算：有几个剧本有正面/背面
function expUpdateImgHint(){
  var items=expExportItems();
  var n=expImgCount(items), withImg=0;
  items.forEach(function(it){if(it.imgs.length)withImg++;});
  var box=document.getElementById('expImg');
  document.getElementById('expImgCnt').textContent=
    n?('共 '+n+' 张，覆盖 '+withImg+'/'+items.length+' 个剧本'):(exportImageMode()==='all'?'（当前范围没有图片）':'（当前范围没有识别出的正/背面图，可尝试全部图片）');
  box.disabled=!n;
  if(!n)box.checked=false;
  exportPreview();
}
function expClose(){if(exportBusy){exportCancelled=true;return;}document.getElementById('expMask').className='';}
// 两个对话框共用这一套范围选项：expPickKind 记当前范围，expPickOwner 记是谁在选
// （导出对话 / 复制 JSON 对话），'sel' 就用各自的选中剧本。
function pickedIdxs(){
  var k=expPickKind||'cur';
  if(k==='sel')return (expPickOwner==='json'?jsonSel:expSel)||[];
  if(k==='all')return SCRIPTS.map(function(_,i){return i;});
  return curIdxs();
}
function expItems(idxs,imagesOnly){
  var out=[],used=new Set();
  idxs.forEach(function(i){
    var it=typeof selectedOriginal==='function'?selectedOriginal(i,FULL[i]):FULL[i];
    if(!it&&!imagesOnly)return;
    if(imagesOnly)it={f:SCRIPTS[i][0]+'.json',t:null};
    var base=safeExportName((it.f||'script.json').replace(/\.json$/i,''));
    var dir=reserveExportName(base,used);
    var s=SCRIPTS_BY_INDEX[i]||[];
    var roles={};scriptPictures(s).primary.forEach(function(p){roles[p.role]=p.file;});
    var imgs=[];
    if(roles.front)imgs.push(['正面',roles.front]);
    if(roles.back)imgs.push(['背面',roles.back]);
    if(imagesOnly||exportImageMode()==='all')imgs=scriptPictures(s).primary.concat(scriptPictures(s).remaining).map(function(p,index){return ['图片'+String(index+1).padStart(3,'0'),p.file];});
    if(imagesOnly&&!imgs.length)return;
    if(window.WIKI_SHARE_NO_ARTWORK)imgs=[];
    out.push({name:dir+'.json',dir:dir,text:it.t,imgDir:s[9]||'',imgs:imgs,source:[s[8]].concat((s[12]||{}).sources||[]).filter(Boolean).join('\n')});
  });
  return out;
}
// 「每个剧本一个文件夹」时，把正面/背面也拷进去：
// 浏览器读不了本地文件，所以得让你再选一次剧照库文件夹（只读授权）。
async function expCopyImage(srcRoot,imgDir,fileName,destDir,destName){
  var sub=await srcRoot.getDirectoryHandle(imgDir);
  var fh=await sub.getFileHandle(fileName);
  var file=await fh.getFile();
  var out=await destDir.getFileHandle(destName,{create:true});
  var w=await out.createWritable();
  await w.write(file);
  await w.close();
  return file.size;
}
function expNeedsImages(items){
  for(var i=0;i<items.length;i++){if(items[i].imgs.length)return true;}
  return false;
}
/* ---- 记住上次选的文件夹，第二次起不再弹选择框 ----------------------------
   目录句柄可以存进 IndexedDB，下次打开页面还能用；只要权限还在就不用再选。
   浏览器只让「用户手势」里申请权限，所以最坏情况是点一下「允许」。
   file:// 下有些浏览器不给 IndexedDB，那就只做「本次会话记住」。 */
var expDirHandle=null, expImgHandle=null;
var EXP_DB='scriptlib-export', EXP_STORE='dirs';

function expIdb(){
  return new Promise(function(res){
    if(typeof indexedDB==='undefined'){res(null);return;}
    try{
      var r=indexedDB.open(EXP_DB,1);
      r.onupgradeneeded=function(){try{r.result.createObjectStore(EXP_STORE);}catch(e){}};
      r.onsuccess=function(){res(r.result);};
      r.onerror=function(){res(null);};
    }catch(e){res(null);}
  });
}
function expStore(key,handle){
  expIdb().then(function(db){
    if(!db)return;
    try{db.transaction(EXP_STORE,'readwrite').objectStore(EXP_STORE).put(handle,key);}catch(e){}
  });
}
function expRestore(){
  expIdb().then(function(db){
    if(!db)return;
    try{
      var tx=db.transaction(EXP_STORE,'readonly').objectStore(EXP_STORE);
      var g1=tx.get('out'), g2=tx.get('img');
      g1.onsuccess=function(){if(g1.result)expDirHandle=g1.result;};
      g2.onsuccess=function(){if(g2.result)expImgHandle=g2.result;};
    }catch(e){}
  });
}
// 句柄还在、权限还在就直接用；否则返回 null 让调用方去弹选择框
async function expUsable(h,mode){
  if(!h||typeof h.queryPermission!=='function')return null;
  try{
    if(await h.queryPermission({mode:mode})==='granted')return h;
    if(await h.requestPermission({mode:mode})==='granted')return h;
  }catch(e){}
  return null;
}
// 弹一次选择框，选完记住
async function expPick(mode,id,hint){
  var stat=document.getElementById('expStat');
  if(hint)stat.textContent=hint;
  var h=await window.showDirectoryPicker({mode:mode,startIn:'desktop',id:id});
  if(mode==='readwrite'){expDirHandle=h;expStore('out',h);}
  else{expImgHandle=h;expStore('img',h);}
  return h;
}
function expForget(){
  if(exportBusy)return;
  expDirHandle=null;expImgHandle=null;
  expIdb().then(function(db){
    if(!db)return;
    try{db.transaction(EXP_STORE,'readwrite').objectStore(EXP_STORE).clear();}catch(e){}
  });
  document.getElementById('expStat').textContent='已忘记上次选的文件夹，下次会重新问你。';
}
function expMemNote(){
  var n=(expDirHandle?1:0)+(expImgHandle?1:0);
  return n?('（已记住 '+n+' 个文件夹，下次不用再选）'):'';
}
function expImgCount(items){
  var n=0;items.forEach(function(it){n+=it.imgs.length;});return n;
}
function expWritableSupported(){
  return typeof window.showDirectoryPicker==='function';
}
var escapeHtml=esc;

document.getElementById('btnExport').onclick=function(){exportDlg(null);};
document.getElementById('expGo').onclick=expWriteDir;
document.getElementById('expDl').onclick=expDownloadAll;
document.getElementById('expCancel').onclick=expClose;
document.getElementById('expForget').onclick=function(e){e.preventDefault();expForget();};
expRestore();                    // 恢复上次记住的目标/剧照库文件夹

/* ======================================================================
   复制 JSON
   ----------------------------------------------------------------------
   跟「导出剧本」共用同一份原文（assets/scripts-full.js，按需加载）：
   选好范围后拼成一段文本塞进 textarea，点一下进剪贴板，也能下载成文件。
   file:// 下 navigator.clipboard 常常被浏览器禁掉，所以 textarea 一定
   预先全选好，用户 Ctrl+C 兜底。
   ====================================================================== */
function copyJsonDlg(preset){
  if(exportBusy)return;
  requestDataDialog('json',preset);
}
function jsonText(items){
  if(items.length===1)return items[0].text;      // 单份：原样，逐字节一致
  return JSON.stringify(items.map(function(it){
    var raw;try{raw=JSON.parse(it.text);}catch(e){raw=it.text;}
    return {name:it.dir,json:raw};
  }),null,2);
}
function jsonDlgShow(){
  var selIdx=jsonSel&&jsonSel.length?jsonSel:null;
  var nSel=selIdx?selIdx.length:0, nCur=curIdxs().length, nAll=SCRIPTS.length;
  var opts=[
    ['sel','当前选中的剧本', nSel, nSel===0],
    ['cur','当前筛选出的剧本', nCur, false],
    ['all','全部剧本', nAll, false]
  ];
  var pick=selIdx?'sel':'cur';
  expPickKind=pick; expPickOwner='json';
  document.getElementById('jsonOpts').innerHTML=opts.map(function(o){
    return '<label class="opt'+(o[0]===pick?' on':'')+'" data-k="'+o[0]+'"'+
      (o[3]?' style="opacity:.45;cursor:not-allowed"':'')+'>'+
      '<input type="radio" name="jsonr" value="'+o[0]+'"'+(o[0]===pick?' checked':'')+
      (o[3]?' disabled':'')+'> <b>'+o[1]+'</b><em>'+o[2]+' 个</em></label>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('#jsonOpts .opt'),function(el){
    el.addEventListener('click',function(){
      if(el.getAttribute('style'))return;
      Array.prototype.forEach.call(document.querySelectorAll('#jsonOpts .opt'),
        function(x){x.className='opt';});
      el.className='opt on';
      el.querySelector('input').checked=true;
      expPickKind=el.getAttribute('data-k');
      jsonRefresh();
    });
  });
  jsonRefresh();
  document.getElementById('jsonMask').className='on';
}
function jsonClose(){document.getElementById('jsonMask').className='';}
// 每次换范围只重建文本，不重新加载原文（FULL 已经在内存里）
function jsonRefresh(){
  var items=expItems(pickedIdxs());
  var box=document.getElementById('jsonBox'), stat=document.getElementById('jsonStat');
  if(!items.length){
    box.value='';
    stat.innerHTML='没有可复制的剧本——库里有些条目是外链／读不出原文，勾个别的范围试试。';
    return;
  }
  var text=jsonText(items);
  box.value=text;
  var n=items.length;
  stat.innerHTML='<b>'+n+'</b> 个剧本 · <b>'+text.length.toLocaleString()+
    '</b> 字符（约 '+(text.length/1024).toFixed(1)+' KiB）'+
    (n===1?' · 就是这个剧本的原文':(' · '+esc(items[0].dir)+' … '+esc(items[n-1].dir)));
}
function jsonCopyNow(){
  var box=document.getElementById('jsonBox');
  if(!box.value)return;
  copy(box.value,document.getElementById('jsonCopy'));   // 内含「已复制 ✓」提示
  try{box.focus();box.select();}catch(e){}
}
function jsonDownload(){
  var items=expItems(pickedIdxs());
  if(!items.length){document.getElementById('jsonStat').textContent='没有可下载的剧本。';return;}
  if(items.length===1){jsonSave(items[0].text,items[0].name);return;}
  if(!confirm('要下载 '+items.length+' 个 JSON 文件，浏览器可能会拦一部分。\n'+
      '只要一个文件的话，用「复制 JSON」更省事。仍然继续？'))return;
  jsonDownloadMany(items);
}
function jsonSave(text,name){
  var b=new Blob([text],{type:'application/json;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},600);
}
function jsonDownloadMany(items){
  if(exportBusy)return;
  var selected=pickedIdxs().slice();
  jsonClose();expSel=selected;expDlgShow();
  startDownloadExport(items);
}
document.getElementById('jsonCopy').onclick=jsonCopyNow;
document.getElementById('jsonPick').onclick=function(){
  var box=document.getElementById('jsonBox');box.focus();box.select();};
document.getElementById('jsonDl').onclick=jsonDownload;
document.getElementById('jsonCancel').onclick=jsonClose;
document.getElementById('jsonMask').addEventListener('click',function(e){
  if(e.target===this)jsonClose();});

/* ======================================================================
   对比我的剧本
   ----------------------------------------------------------------------
   拖一个剧本工具导出的 JSON 进来，跟库里 1046 个剧本按「角色名」比对，
   列最像的 10 个。排行用相似度（交集÷并集），也给出「一样几个」和覆盖率。
   ====================================================================== */
var cmpMine=null;                 // 解析出来的我的剧本

// 解析上传的 JSON：兼容 _meta、字符串 id、完整角色对象三种写法

function cmpMineNames(){
  return cmpMine.chars.map(function(c){return c.n;});
}
// 跟库里每个剧本算：一样几个 / 相似度 / 覆盖我 / 差集
// mine 可以是 [{n,t}]，也可以直接给 ["角色名"]（那就没有阵营信息）

function cmpChips(list,max){
  var n=list.length;
  var show=list.slice(0,max||24).map(esc).join('、');
  return show+(n>(max||24)?(' …等 '+n+' 个'):'');
}
function cmpRender(){
  if(!cmpMine)return;
  var tally={},ord=TEAMORD;
  cmpMine.chars.forEach(function(c){tally[c.t]=(tally[c.t]||0)+1;});
  var dist=ord.filter(function(t){return tally[t];})
    .map(function(t){return TEAMCN[t]+' '+tally[t];}).join(' / ');
  var withBig=document.getElementById('cmpBig').checked;
  var sortBy=document.getElementById('cmpSort').value;
  var rank=cmpRank(cmpMine.chars,{top:10,withBig:withBig,sort:sortBy});
  var unknown=cmpMine.chars.filter(function(c){return c.idOnly;}).length;

  var h='<div class="mine"><b>'+esc(cmpMine.name)+'</b>'+
    (cmpMine.author?('　作者：'+esc(cmpMine.author)):'')+
    '<br>角色 <b>'+cmpMine.chars.length+'</b> 个（'+esc(dist)+'）'+
    (unknown?('<br><span class="cmpsets miss">有 '+unknown+
      ' 条只写了 id、没有名字，没法参与比对</span>'):'')+'</div>';
  h+='<div class="team-h" style="margin:8px 0 4px">你的角色（点击查百科）</div><div class="chars">'+
    cmpMine.chars.map(function(c){
      var u=wikiURL(c.n);
      var txt=esc(c.n)+(c.idOnly?' <b>?</b>':'');
      return u?('<a href="'+u+'" target="_blank" rel="noopener" title="'+esc(TEAMCN[c.t]||c.t)+
        ' · 钟楼百科">'+txt+'</a>'):('<span title="'+esc(c.t)+'">'+txt+'</span>');
    }).join('')+'</div>';

  h+='<div class="team-h" style="margin:12px 0 4px">最像的 '+rank.length+' 个板子'+
     (withBig?'（含大合集）':'（已排除 &gt;60 人的收集类剧本）')+
     (sortBy==='common'?' · 按「一样几个」排':' · 按相似度排')+'</div>';
  if(!rank.length)h+='<div class="hint" style="padding:0">没有能对上的剧本。</div>';
  rank.forEach(function(r,k){
    h+='<div class="cmpcard" data-i="'+r.i+'">'+
      '<div class="h"><b>'+(k+1)+'. '+esc(r.name)+'</b>'+
      (r.author?(' <span class="tag">'+esc(r.author)+'</span>'):'')+
      '<span class="badge j">一样 '+r.common+' 个</span>'+
      '<span class="badge">相似度 '+(100*r.jac).toFixed(1)+'%</span>'+
      '<span class="tag">他 '+r.n+' 人 · 覆盖我 '+(100*r.covMine).toFixed(0)+
      '% · 我占他 '+(100*r.covTheirs).toFixed(0)+'%</span>'+
      (r.big?('<span class="tag warn">大合集</span>'):'')+
      (r.teamDiff.length?('<span class="tag warn">'+r.teamDiff.length+
        ' 个同名但阵营不同</span>'):'')+
      '</div><div class="cmpsets">'+
      '我有他没有（'+r.onlyMine.length+'）：<span class="miss">'+
        (r.onlyMine.length?cmpChips(r.onlyMine):'（无）')+'</span><br>'+
      '他有我没有（'+r.onlyTheirs.length+'）：<span class="extra">'+
        (r.onlyTheirs.length?cmpChips(r.onlyTheirs):'（无）')+'</span>'+
      '</div></div>';
  });
  document.getElementById('cmpMy').innerHTML=h;
  document.getElementById('cmpRes').innerHTML='';
  Array.prototype.forEach.call(document.querySelectorAll('#cmpMy .cmpcard'),function(el){
    el.addEventListener('click',function(){
      var i=+el.getAttribute('data-i');
      cmpClose(); show(i);
      var row=document.querySelector('#list .row[data-i="'+i+'"]');
      if(row){Array.prototype.forEach.call(document.querySelectorAll('#list .row'),
        function(r){r.className='row';});row.className='row sel';}
    });
  });
}
function cmpRead(file){
  if(!file)return;
  var r=new FileReader();
  r.onload=function(){
    try{
      cmpMine=cmpParse(r.result);
    }catch(e){
      document.getElementById('cmpMy').innerHTML=
        '<div class="cmpsets miss">解析失败：'+esc(e&&e.message||e)+
        '<br>需要的是剧本工具导出的「_meta + 角色对象」数组。</div>';
      cmpMine=null;return;
    }
    cmpRender();
  };
  r.onerror=function(){alert('读文件失败');};
  r.readAsText(file,'utf-8');
}
function cmpOpen(){
  document.getElementById('cmpMask').className='on';
  document.getElementById('cmpFile').click();
}
function cmpClose(){document.getElementById('cmpMask').className='';}
document.getElementById('btnCompare').onclick=cmpOpen;
document.getElementById('cmpClose').onclick=cmpClose;
document.getElementById('cmpBig').onchange=function(){cmpRender();};
document.getElementById('cmpSort').onchange=function(){cmpRender();};
document.getElementById('cmpMask').addEventListener('click',function(e){
  if(e.target===this)cmpClose();});
document.getElementById('cmpFile').addEventListener('change',function(){
  if(this.files&&this.files[0])cmpRead(this.files[0]);});
(function(){
  var dz=document.getElementById('cmpDrop');
  dz.onclick=function(){document.getElementById('cmpFile').click();};
  ['dragenter','dragover'].forEach(function(t){
    dz.addEventListener(t,function(e){e.preventDefault();dz.className='drop on';});});
  ['dragleave','drop'].forEach(function(t){
    dz.addEventListener(t,function(e){e.preventDefault();dz.className='drop';});});
  dz.addEventListener('drop',function(e){
    var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
    if(f)cmpRead(f);
  });
})();
document.getElementById('expMask').addEventListener('click',function(e){
  if(e.target===this)expClose();});

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    if(document.getElementById('jsonMask').className==='on'){jsonClose();return;}
    if(document.getElementById('expMask').className==='on'){expClose();return;}
    if(document.getElementById('cmpMask').className==='on'){cmpClose();return;}
  }
  if(e.key==='/'&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){
    e.preventDefault();document.getElementById('q').focus();}
});
document.getElementById('pagePrev').onclick=function(){currentPage=Math.max(1,currentPage-1);render();};
document.getElementById('pageNext').onclick=function(){currentPage++;render();};
document.getElementById('pageSize').onchange=function(){pageSize=Number(this.value);currentPage=1;render();};
document.getElementById('filterReset').onclick=function(){filterIds.forEach(function(id){var el=document.getElementById(id);if(id==='onlypic')el.checked=false;else el.value=id==='sort'?'name':'';});currentPage=1;render();};
restoreFilters();
if(typeof applyRoleQuery==='function')applyRoleQuery();
render();

if(window.WIKI_SHARE_NO_ARTWORK){
 ['expImg','expOnlyImages','expImageMode'].forEach(function(id){var el=document.getElementById(id);el.disabled=true;if('checked' in el)el.checked=false;});
}
