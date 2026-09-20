// 个人记录、维护面板和版本选择。个人偏好以源路径为键，支持合并后的别名。
function recordMap(value){return value&&typeof value==='object'&&!Array.isArray(value)?Object.assign(Object.create(null),value):Object.create(null);}
var personalRecords=recordMap(readPreference('scriptlib-personal',{})),versionChoices=recordMap(readPreference('scriptlib-versions',{}));
var detailRevision=0;
var baseScripts=SCRIPTS.map(function(s){return s.slice();}),chosenVersions={},historyRequest=null;
var maintenance=window.LIBRARY_MAINTENANCE||{pending:[],candidates:[]},maintenanceToken='',maintenanceJob=null;
function validPlay(p){return p&&typeof p.id==='string'&&typeof p.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(Date.parse(p.date))&&new Date(p.date).toISOString().slice(0,10)===p.date;}
function recordKey(p){return String(p).replace(/\\/g,'/').toLowerCase();}
function personalFor(s){
 var keys=[s[3]].concat((s[12]||{}).aliases||[]),result={favorite:false,want:false,recommended:false,note:'',plays:[]},notes=[];
 keys.forEach(function(key){var r=personalRecords[recordKey(key)];if(!r||typeof r!=='object')return;
  ['favorite','want','recommended'].forEach(function(k){result[k]=result[k]||r[k]===true;});
  if(typeof r.note==='string'&&r.note&&notes.indexOf(r.note)<0)notes.push(r.note);
  (Array.isArray(r.plays)?r.plays:[]).filter(validPlay).forEach(function(play){if(!result.plays.some(function(p){return p.id===play.id;}))result.plays.push(play);});
 });
 result.note=notes.join('\n');result.plays.sort(function(a,b){return b.date.localeCompare(a.date);});result.played=result.plays.length?result.plays[0].date:'';return result;
}
function workspaceMatches(s){
 var completeness=document.getElementById('completionFilter').value,personal=document.getElementById('personalFilter').value;
 if(completeness==='missing-json'&&s[6]==='json')return false;
 if(completeness==='missing-images'&&shownCount(s))return false;
 if(completeness==='incomplete'&&s[6]==='json'&&shownCount(s))return false;
 var r=personalFor(s);return !personal||(personal==='played'?r.plays.length>0:r[personal]===true);
}
function historyFor(i){return (window.LIBRARY_HISTORY||{})[recordKey(baseScripts[i][3])]||[];}
function deltaText(a,b){
 function counts(row){var m=Object.create(null);row.characters.forEach(function(c){m[c[0]]=(m[c[0]]||0)+1;});return m;}
 var left=counts(a),right=counts(b),added=[],removed=[];
 Object.keys(right).forEach(function(n){if(right[n]>(left[n]||0))added.push(n+' ×'+(right[n]-(left[n]||0)));});
 Object.keys(left).forEach(function(n){if(left[n]>(right[n]||0))removed.push(n+' ×'+(left[n]-(right[n]||0)));});
 return '角色新增：'+(added.join('、')||'无')+'；角色移除：'+(removed.join('、')||'无')+'；新增图片 '+b.images.filter(function(f){return a.images.indexOf(f)<0;}).length+' 张，移除 '+a.images.filter(function(f){return b.images.indexOf(f)<0;}).length+' 张。';
}
function versionDetail(i){var versions=historyFor(i),choice=versionChoices[recordKey(baseScripts[i][3])]||'';return '<section class="version-editor"><h3>剧本版本</h3><button class="btn" id="version-load">查看版本记录</button><select id="version-select" aria-label="使用版本"><option value="">库内最新版本</option>'+versions.map(function(v){return '<option value="'+esc(v.id)+'"'+(choice===v.id?' selected':'')+'>'+esc(new Date(v.time).toLocaleString())+' · '+esc(v.row.name)+' · '+v.id.slice(0,8)+'</option>';}).join('')+'</select><p id="version-status">'+(choice?'正在使用历史快照，预览、复制和导出均采用此版本。':'从启用版本管理后的下一次更新开始保存历史。')+'</p>'+
 (versions.length>1?'<details><summary>各版本变化</summary>'+versions.slice(1).map(function(v,n){return '<p>'+esc(new Date(v.time).toLocaleString())+'：'+esc(deltaText(versions[n].row,v.row))+'</p>';}).join('')+'</details>':'')+'</section>';}
function workspaceDetail(i){
 var s=SCRIPTS[i],r=personalFor(s),versions=historyFor(i),choice=versionChoices[recordKey(baseScripts[i][3])]||'';
 var sources=[s[8]].concat((s[12]||{}).sources||[]).filter(function(u){return /^https?:\/\//i.test(u);});
 return '<section class="personal-editor"><h3>我的记录</h3>'+['favorite','want','recommended'].map(function(k,n){return '<label><input type="checkbox" id="personal-'+k+'"'+(r[k]?' checked':'')+'> '+['收藏','想玩','推荐'][n]+'</label>';}).join(' ')+
 '<label class="note-label">私人备注<textarea id="personal-note" maxlength="20000">'+esc(r.note)+'</textarea></label><button class="btn" id="personal-save">保存记录</button><label>游玩日期 <input type="date" id="personal-date"></label><button class="btn" id="personal-play">记一次游玩</button><ul>'+r.plays.map(function(p,n){return '<li>'+esc(p.date)+' <button data-remove-play="'+n+'">移除</button></li>';}).join('')+'</ul><p id="personal-status" role="status"></p></section>'+
 versionDetail(i)+
 (sources.length?'<p>来源：'+[...new Set(sources)].map(function(u){return '<a target="_blank" rel="noopener" href="'+esc(u)+'">'+esc(u)+'</a>';}).join('<br>')+'</p>':'');
}
function persistPersonal(i,r){
 var s=baseScripts[i];personalRecords[recordKey(s[3])]=r;
 ((s[12]||{}).aliases||[]).forEach(function(alias){delete personalRecords[recordKey(alias)];});
 return writePreference('scriptlib-personal',personalRecords);
}
function bindWorkspaceDetail(i){
 var local=document.getElementById('btn-local-json');if(local&&chosenVersions[i]){local.removeAttribute('href');local.textContent='下载此版本 JSON';local.onclick=function(){var original=chosenVersions[i].row.original;if(original)jsonSave(original.t,original.f);};}
 function save(play,remove){
  var r=personalFor(baseScripts[i]);['favorite','want','recommended'].forEach(function(k){r[k]=document.getElementById('personal-'+k).checked;});r.note=document.getElementById('personal-note').value;
  if(play){var date=document.getElementById('personal-date').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){document.getElementById('personal-status').textContent='请先选择游玩日期';return;}r.plays.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2),date:date});r.want=false;}
  if(remove!=null)r.plays.splice(remove,1);
  var saved=persistPersonal(i,r);render();show(i);document.getElementById('personal-status').textContent=saved?'已保存到此浏览器；可备份个人记录。':'浏览器未允许持久保存，请立即备份个人记录。';
 }
 document.getElementById('personal-save').onclick=function(){save();};
 document.getElementById('personal-play').onclick=function(){save(true);};
 var now=new Date();document.getElementById('personal-date').value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 document.querySelectorAll('[data-remove-play]').forEach(function(button){button.onclick=function(){save(false,Number(button.getAttribute('data-remove-play')));};});
 bindVersionDetail(i);
}
function bindVersionDetail(i){
 document.getElementById('version-load').onclick=async function(){var revision=detailRevision;try{await loadHistory();if(revision!==detailRevision)return;document.querySelector('.version-editor').outerHTML=versionDetail(i);bindVersionDetail(i);document.getElementById('version-status').textContent=historyFor(i).length?'请选择要使用的版本；仅影响此浏览器的预览、复制与导出。':'该剧本尚无历史更新。';}catch(error){if(revision!==detailRevision)return;document.getElementById('version-status').textContent=error.message;}};
 document.getElementById('version-select').onchange=function(){var id=this.value;useVersion(i,id);writePreference('scriptlib-versions',versionChoices);render();show(i);};
}
function loadHistory(){
 if(window.LIBRARY_HISTORY)return Promise.resolve();
 if(!historyRequest)historyRequest=new Promise(function(resolve,reject){
  var script=document.createElement('script'),timer,done=false;
  function finish(error){if(done)return;done=true;clearTimeout(timer);script.onload=null;script.onerror=null;if(error){historyRequest=null;script.remove();reject(Error(error));}else resolve();}
  script.src='assets/data/history.js';
  script.onload=function(){finish(window.LIBRARY_HISTORY&&typeof window.LIBRARY_HISTORY==='object'&&!Array.isArray(window.LIBRARY_HISTORY)?'':'版本记录格式无效，请重新入库后重试。');};
  script.onerror=function(){finish('版本记录加载失败，请运行一次入库后重试。');};
  timer=setTimeout(function(){finish('版本记录加载超时，请重试。');},15000);document.head.appendChild(script);
 });return historyRequest;
}

function useVersion(i,id){
 var version=historyFor(i).find(function(v){return v.id===id;}),s=SCRIPTS[i],base=baseScripts[i];
 s.splice(0,s.length,...base);delete chosenVersions[i];delete versionChoices[recordKey(base[3])];
 if(version){
  var r=version.row,indices=r.characters.map(function(c){var at=CHARS.findIndex(function(x){return JSON.stringify(x)===JSON.stringify(c);});if(at<0){at=CHARS.length;CHARS.push(c);}return at;});
  s.splice(0,s.length,r.name,r.author,r.category,base[3],r.count,indices,r.kind,r.description,r.url,r.imageDir,r.images,r.roles,base[12]);
  chosenVersions[i]=version;versionChoices[recordKey(base[3])]=id;
 }
 if(typeof buildCategoryTree==='function'){categoryTree=buildCategoryTree(SCRIPTS);categoryRendered=null;}
 s._cn=s[5].map(function(ci){return CHARS[ci][0];}).join(' ');s._s=(s[0]+' '+s[1]+' '+s[2]+' '+s._cn).toLowerCase();
}
function selectedOriginal(i,fallback){return chosenVersions[i]?chosenVersions[i].row.original:fallback;}
function showMaintenance(){
 var sync=maintenance.sync,imp=maintenance.import,missingJson=baseScripts.filter(function(s){return s[6]!=='json';}),missingImages=baseScripts.filter(function(s){return !s[10].length;}),disabled=maintenanceToken&&!maintenanceJob?.running?'':' disabled';
 var h='<p>缺 JSON '+missingJson.length+' 个 · 缺图片 '+missingImages.length+' 个 · 下载待处理 '+(maintenance.pending||[]).length+' 篇</p>'+
 '<button class="btn" data-completion="missing-json">查看缺 JSON</button><button class="btn" data-completion="missing-images">查看缺图片</button><button class="btn" data-maintenance="sync"'+disabled+'>检查更新 / 重试下载</button><button class="btn" data-maintenance="import"'+disabled+'>重新扫描入库</button><button class="btn" id="maintenanceReload">刷新网页目录</button>'+
 (!maintenanceToken?'<p>直接打开 HTML 时仅查看记录。请双击“启动剧本库.cmd”，打开终端显示的本机网址，即可在此执行维护。</p>':'')+
 '<h3>最近更新</h3>'+(sync?'<p>'+esc(new Date(sync.time).toLocaleString())+' · '+esc(sync.status)+' · 新图片 '+sync.downloaded+' 张 · 完成 '+sync.completed.length+' 篇 · 待处理 '+sync.pending.length+' 篇</p>':'<p>暂无同步记录</p>')+
 (sync?.completed?.length?'<ul>'+sync.completed.map(function(a){return '<li>'+esc(a.title)+' · '+a.files+' 张</li>';}).join('')+'</ul>':'')+
 (imp?'<p>最近入库：'+esc(new Date(imp.time).toLocaleString())+' · '+esc(imp.status)+' · 新增 '+imp.added+' · 更新 '+imp.updated+'</p>':'')+
 '<h3>下载失败与待处理</h3><ul>'+(maintenance.pending||[]).map(function(a){return '<li><a href="'+esc(a.url)+'" target="_blank" rel="noopener">'+esc(a.title)+'</a>：'+esc(a.error)+'</li>';}).join('')+'</ul>'+
 ((imp?.errors||[]).length?'<h3>入库错误</h3><ul>'+imp.errors.map(function(e){return '<li>'+esc(e.path)+'：'+esc(e.message)+'</li>';}).join('')+'</ul>':'')+
 '<h3>图片与 JSON 配对</h3><p>只列出名称完全相同的候选；确认后保留 JSON、图片、来源与个人记录，图文旧条目不再重复显示。</p>'+
 ((maintenance.candidates||[]).map(function(c,i){return '<div class="merge-candidate"><b>'+esc(c.name)+'</b>'+ (c.ambiguous?'（多个候选，请核对路径）':'')+'<p>图文：'+esc(c.from)+'<br>JSON：'+esc(c.to)+'</p><button class="btn" data-merge="'+i+'"'+disabled+'>确认合并到此 JSON</button></div>';}).join('')||'<p>暂无同名待配对条目。将对应 JSON 放入 library/json 后重新入库。</p>');
 document.getElementById('maintenanceBody').innerHTML=h;
 document.querySelectorAll('[data-completion]').forEach(function(b){b.onclick=function(){document.getElementById('completionFilter').value=b.getAttribute('data-completion');render();};});
 document.querySelectorAll('[data-maintenance]').forEach(function(b){b.onclick=function(){runMaintenance(b.getAttribute('data-maintenance'));};});
 document.querySelectorAll('[data-merge]').forEach(function(b){b.onclick=function(){var c=maintenance.candidates[Number(b.getAttribute('data-merge'))];if(confirm('将“'+c.name+'”的图文合并到 '+c.to+'？原件会保留，目录更新前会备份。'))runMaintenance('merge',c);};});
 document.getElementById('maintenanceReload').onclick=function(){location.reload();};
}
async function refreshMaintenanceStatus(){
 document.getElementById("maintenanceStatus").textContent="百科内支持查看待补全项目；更新与入库请使用原剧本库工具。";
 return;
 if(location.protocol!=='http:'||location.hostname!=='127.0.0.1')return;
 try{
  var response=await fetch('/api/status',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('本机服务不可用');var value=await response.json();
  maintenance=value.data;maintenanceToken=value.token;maintenanceJob=value.job;showMaintenance();
  if(value.job){document.getElementById('maintenanceStatus').textContent=value.job.running?'处理中…\n'+value.job.lines.join('\n'):(value.job.ok?'维护完成，请刷新网页目录。':'未全部完成：'+(value.job.error||value.job.result?.errors?.map(function(e){return e.message;}).join('；')||'请查看报告'));
   if(value.job.running)setTimeout(refreshMaintenanceStatus,2000);
  }
 }catch(error){maintenanceToken='';showMaintenance();document.getElementById('maintenanceStatus').textContent='连接本机服务失败：'+error.message;}
}
async function runMaintenance(action,body){
 document.getElementById("maintenanceStatus").textContent="请使用原剧本库的更新与入库工具。";
 return;
 try{var response=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Library-Token':maintenanceToken},body:JSON.stringify(body||{})});var result=await response.json();if(!response.ok)throw Error(result.error);await refreshMaintenanceStatus();}
 catch(error){document.getElementById('maintenanceStatus').textContent=error.message;}
}
function validatePersonal(value){
 if(!value||value.version!==1||!value.records||typeof value.records!=='object'||Array.isArray(value.records))throw Error('不是有效的个人记录备份');
 var result=Object.create(null);for(var [key,r] of Object.entries(value.records)){
  if(!key||['__proto__','constructor','prototype'].includes(recordKey(key))||!r||typeof r.note!=='string'||r.note.length>20000||!Array.isArray(r.plays)||r.plays.length>10000)throw Error('个人记录格式无效');
  if(r.plays.some(function(p){return !validPlay(p);}))throw Error('游玩记录格式无效');
  result[recordKey(key)]={favorite:r.favorite===true,want:r.want===true,recommended:r.recommended===true,note:r.note,plays:r.plays.map(function(p){return {id:p.id,date:p.date};})};
 }return result;
}
function initWorkspace(){
 document.getElementById('maintenanceOpen').onclick=function(){document.getElementById('maintenancePanel').open=true;showMaintenance();refreshMaintenanceStatus();};
 document.getElementById('personalBackup').onclick=function(){jsonSave(JSON.stringify({version:1,records:personalRecords},null,2),'剧本个人记录.json');};
 document.getElementById('personalRestore').onchange=async function(){try{var file=this.files[0];if(!file)return;if(file.size>5*1024*1024)throw Error('备份文件超过 5 MiB');var records=validatePersonal(JSON.parse(await file.text()));if(!confirm('恢复记录会替换同路径的个人记录，其他记录保留。继续？'))return;Object.assign(personalRecords,records);var saved=writePreference('scriptlib-personal',personalRecords);render();alert(saved?'个人记录已恢复，重新打开剧本可查看。':'仅本次会话恢复，请备份记录。');}catch(error){alert(error.message);}finally{this.value='';}};
 showMaintenance();refreshMaintenanceStatus();
 if(Object.keys(versionChoices).length)loadHistory().then(function(){baseScripts.forEach(function(s,i){var id=versionChoices[recordKey(s[3])];if(id)useVersion(i,id);});render();}).catch(function(error){document.getElementById('maintenanceStatus').textContent=error.message;});
}
