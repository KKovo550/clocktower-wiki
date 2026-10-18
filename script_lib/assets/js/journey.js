// Browsing state uses stable source paths, never catalog indexes or title guesses.
var LibraryJourney=(function(){
 'use strict';
 var list=document.getElementById('list'),detail=document.getElementById('detail');
 var status=document.getElementById('libraryJourneyStatus'),ready=false,restoring=false,generation=0,timer=0,lastScope='',activePath='',startupPending=false,pendingScroll=0,pendingNavigation=0,pendingResume=0;
 var raw=readPreference('scriptlib-recent',[]),recent=Array.isArray(raw)?raw.filter(validRecord).slice(0,12):[];
 var reading=readPreference('scriptlib-reading',null);
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 var labels={any:'全部记录',favorite:'已收藏',want:'想玩',played:'玩过',recommended:'推荐'};
 var detailSections=['.library-source-info','.library-version-records','.library-detail-tools','.role-editor'];
 function validRecord(value){return value&&typeof value==='object'&&typeof value.path==='string'&&value.path.length<2048&&(!value.version||typeof value.version==='string');}
 function normalize(path){return String(path||'').replace(/\\/g,'/').toLowerCase();}
 function say(message){status.textContent=message;status.hidden=!message;}
 function consumeNavigationQuery(){
  try{var url=new URL(location.href),changed=false;['script','content','version','include','exclude'].forEach(function(key){if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true;}});if(changed)history.replaceState(history.state,'',url.href);}catch(error){}
 }
 function base(i){return baseScripts[i]||SCRIPTS[i];}
 function record(i){
  var s=base(i);return {path:s[3],family:scriptFamilyKey(s),content:(s[12]||{}).content||'',version:chosenVersions[i]?chosenVersions[i].id:'',time:Date.now()};
 }
 function find(value){
  if(!validRecord(value))return -1;
  var path=normalize(value.path),exact=baseScripts.findIndex(function(s){return normalize(s[3])===path;});
  if(exact>=0)return exact;
  var aliases=baseScripts.map(function(s,i){return ((s[12]||{}).aliases||[]).some(function(alias){return normalize(alias)===path;})?i:-1;}).filter(function(i){return i>=0;});
  if(aliases.length===1)return aliases[0];
  if(aliases.length>1){var identified=aliases.filter(function(i){return value.content&&(baseScripts[i][12]||{}).content===value.content;});return identified.length===1?identified[0]:-1;}
  if(value.content){var matches=baseScripts.map(function(s,i){return (s[12]||{}).content===value.content?i:-1;}).filter(function(i){return i>=0;});if(matches.length===1)return matches[0];}
  return -1;
 }
 function scope(){return JSON.stringify(filterIds.map(function(id){var field=document.getElementById(id);return id==='onlypic'?field.checked:field.value;}).concat([currentPage,pageSize]));}
 function nonnegative(value){return Number.isFinite(value)?Math.max(0,Math.min(1e7,value)):0;}
 function restoreWindow(value){window.scrollTo({left:0,top:nonnegative(value),behavior:'instant'});}
 function snapshot(){
  if(!ready||restoring||pendingResume||(startupPending&&selectedScriptIndex<0))return;
  reading={selected:selectedScriptIndex>=0?record(selectedScriptIndex):null,scope:scope(),list:nonnegative(list.scrollTop),detail:nonnegative(detail.scrollTop),window:nonnegative(window.scrollY),advanced:document.getElementById('libraryAdvanced').open,recent:document.getElementById('libraryRecent').open,openDetails:detailSections.filter(function(selector){var node=detail.querySelector(selector);return node&&node.open;})};
  writePreference('scriptlib-reading',reading);
 }
 function schedule(){if(!ready||restoring)return;clearTimeout(timer);timer=setTimeout(snapshot,200);}
 function renderRecent(){
  var panel=document.getElementById('libraryRecent'),box=document.getElementById('libraryRecentList');
  box.replaceChildren();var available=recent.map(function(value){return {value:value,i:find(value)};}).filter(function(entry){return entry.i>=0;});
  panel.hidden=!available.length;document.getElementById('libraryRecentTitle').textContent='最近浏览 · '+available.length;
  available.forEach(function(entry){
   var s=base(entry.i),button=document.createElement('button');button.type='button';button.className='library-recent-item';
   var name=document.createElement('strong');name.textContent=s[0]||'(未命名)';
   var author=document.createElement('small');author.textContent=(s[1]||'佚名')+(entry.value.version?' · 历史版本':'');
   button.append(name,author);button.addEventListener('click',function(){openRecord(entry.value,{reveal:true});});box.appendChild(button);
  });
 }
 function myPanel(){
  var groups=new Map();
  baseScripts.forEach(function(s){var key=scriptFamilyKey(s),r=personalFor(s),flags=groups.get(key)||{};Object.keys(labels).forEach(function(k){flags[k]=flags[k]||(k==='any'?(r.favorite||r.want||r.recommended||r.plays.length>0||!!r.note):(k==='played'?r.plays.length>0:r[k]));});groups.set(key,flags);});
  var personal=document.getElementById('personalFilter').value,box=document.getElementById('libraryMyFilters');
  Object.keys(labels).forEach(function(key){
   var button=box.querySelector('[data-personal="'+key+'"]');
   if(!button){button=document.createElement('button');button.type='button';button.dataset.personal=key;box.appendChild(button);}
   var count=Array.from(groups.values()).filter(function(r){return r[key];}).length;
   button.textContent=labels[key]+' '+count;button.setAttribute('aria-pressed',String(personal===key));
  });
  document.getElementById('libraryMyPanel').hidden=!personal;
  document.querySelectorAll('#libraryBrowseModes [data-personal]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.personal?!!personal:!personal));});
 }
 function rendered(signature,previousScroll){
  var next=scope();if(lastScope===next)list.scrollTop=previousScroll||0;
  else if(ready&&!restoring){generation++;pendingResume=0;schedule();}
  lastScope=next;myPanel();
 }
 function viewed(i){
  var next=normalize(base(i)[3]),share=document.getElementById('btn-share-script');
  if(share)share.onclick=function(){if(typeof LibraryShare!=='undefined')LibraryShare.open(i,this);else copy(shareURL(i),this);};
  if(activePath!==next)detail.scrollTop=0;activePath=next;
  if(!ready||restoring)return;
  pendingResume=0;consumeNavigationQuery();say('');generation++;var value=record(i);
  recent=recent.filter(function(old){var index=find(old);return index<0?normalize(old.path)!==next:scriptFamilyKey(base(index))!==scriptFamilyKey(base(i));});
  recent.unshift(value);recent=recent.slice(0,12);writePreference('scriptlib-recent',recent);renderRecent();snapshot();
 }
 function shareURL(i,options){
  var value=record(i),url=new URL('https://kkovo550.github.io/clocktower-wiki/script_lib/'+encodeURIComponent('剧本库.html'));
  if(options&&options.latest)value.version='';
  url.searchParams.set('script',value.path);if(value.content)url.searchParams.set('content',value.content);if(value.version)url.searchParams.set('version',value.version);
  return url.href;
 }
 function resetFilters(){filterIds.forEach(function(id){var field=document.getElementById(id);if(id==='onlypic')field.checked=false;else field.value=id==='sort'?'name':'';});currentPage=1;}
 async function openRecord(value,options){
  options=options||{};pendingResume=0;var ticket=++generation,i=find(value);
  if(i<0){say('这份剧本已不在当前目录中，可按名称重新查找。');return false;}
  if(value.version){
   pendingNavigation=ticket;
   try{await loadHistory();}catch(error){if(ticket===generation)say('暂时无法打开这个历史版本：'+error.message);return false;}
   finally{if(pendingNavigation===ticket)pendingNavigation=0;}
   if(ticket!==generation)return false;
   if(!historyFor(i).some(function(v){return v.id===value.version;})){say('这个历史版本暂不可用，未替换成其他版本。你可以在列表中查看当前收录的剧本。');return false;}
  }
  if(ticket!==generation)return false;
  var message=value.content&&value.content!==(base(i)[12]||{}).content&&!value.version?'这份剧本已更新，当前显示库内最新版本。':'';
  restoring=true;
  try{
   useVersion(i,value.version||'');
   // Choose the linked source even when another edition of this family was preferred locally.
   librarySourceChoices.set(scriptFamilyKey(base(i)),base(i)[3]);writePreference('scriptlib-sources',Object.fromEntries(librarySourceChoices));
   writePreference('scriptlib-versions',versionChoices);
   if(options.reveal)resetFilters();
   render();
   var at=cur.findIndex(function(s){return scriptFamilyKey(s)===scriptFamilyKey(SCRIPTS[i]);});
   if(at<0){say('上次查看的剧本不在当前筛选结果中，可从“最近浏览”重新打开。');return false;}
   if(options.reveal){currentPage=Math.floor(at/pageSize)+1;render();}
   if(options.scroll)pendingResume=ticket;
   show(i);
   if(options.scroll&&Array.isArray(options.scroll.openDetails))detailSections.forEach(function(selector){var node=detail.querySelector(selector);if(node)node.open=options.scroll.openDetails.includes(selector);});
  }finally{restoring=false;}
  // A real open records a visit, while restoring does not reshuffle the recent list.
  if(options.reveal)viewed(i);
  if(message)say(message);
  else say(options.reveal?'已定位到剧本：'+SCRIPTS[i][0]:'已恢复上次查看的剧本：'+SCRIPTS[i][0]);
  var restoreTicket=generation;pendingScroll=restoreTicket;
  requestAnimationFrame(function(){requestAnimationFrame(function(){
   if(pendingScroll===restoreTicket)pendingScroll=0;if(restoreTicket!==generation)return;
   if(pendingResume===restoreTicket)pendingResume=0;
   if(options.scroll){list.scrollTop=nonnegative(options.scroll.list);detail.scrollTop=nonnegative(options.scroll.detail);restoreWindow(options.scroll.window);}
   else if(options.reveal){
    var row=list.querySelector('.row.sel');if(row)list.scrollTop=Math.max(0,row.offsetTop-list.offsetTop);
    var panel=document.querySelector('.library-detail-panel'),title=detail.querySelector('.dt');
    if(panel)panel.scrollIntoView({block:'start',behavior:'instant'});if(title)title.focus({preventScroll:true});
   }
   snapshot();
  });});
  return true;
 }
 function selectPersonal(event){
  var button=event.target.closest('[data-personal]');if(!button)return;
  document.getElementById('personalFilter').value=button.dataset.personal;
  // Keep explicit search conditions visible; a personal view never silently removes them.
  currentPage=1;render();
 }
 document.getElementById('libraryBrowseModes').addEventListener('click',selectPersonal);
 document.getElementById('libraryMyFilters').addEventListener('click',selectPersonal);
 document.getElementById('libraryRecentClear').addEventListener('click',function(){recent=[];writePreference('scriptlib-recent',recent);renderRecent();say('最近浏览记录已清空；收藏和游玩记录保留。');});
 list.addEventListener('scroll',schedule,{passive:true});detail.addEventListener('scroll',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});
 // A person who has started interacting takes priority over a delayed restore.
 ['pointerdown','keydown','wheel'].forEach(function(name){document.addEventListener(name,function(){if(startupPending||pendingNavigation||pendingScroll){generation++;pendingResume=0;}},{capture:true,passive:true});});
 window.addEventListener('pagehide',snapshot);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')snapshot();});
 async function init(workspaceReady){
  ready=true;startupPending=true;myPanel();renderRecent();var ticket=generation,saved=reading,params=new URLSearchParams(location.search);
  try{await workspaceReady;}catch(error){say('个人版本资料暂未加载完成。');}
  startupPending=false;
  if(ticket!==generation)return;
  if(params.has('script')){
   await openRecord({path:params.get('script')||'',content:params.get('content')||'',version:params.get('version')||''},{reveal:true});return;
  }
  if(params.has('include')||params.has('exclude')){consumeNavigationQuery();return;}
  if(saved&&typeof saved==='object'&&saved.scope===scope()){
   if(typeof saved.advanced==='boolean')document.getElementById('libraryAdvanced').open=saved.advanced;
   if(typeof saved.recent==='boolean')document.getElementById('libraryRecent').open=saved.recent;
   if(validRecord(saved.selected))await openRecord(saved.selected,{scroll:saved});
   else {var blankTicket=++generation;pendingResume=blankTicket;pendingScroll=blankTicket;requestAnimationFrame(function(){if(pendingScroll===blankTicket)pendingScroll=0;if(pendingResume===blankTicket)pendingResume=0;if(blankTicket!==generation)return;list.scrollTop=nonnegative(saved.list);restoreWindow(saved.window);snapshot();});}
  }
 }
 return {init:init,rendered:rendered,viewed:viewed,shareURL:shareURL,snapshot:snapshot,open:openRecord};
})();

