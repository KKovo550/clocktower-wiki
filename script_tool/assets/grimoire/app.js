(function(root){
 'use strict';
 const G=root.ClocktowerGrimoire,C=root.GrimoireCatalog,$=id=>document.getElementById(id),app=$('grimoireApp'),dialog=$('gDialog'),body=$('gDialogBody');
 const teamNames={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
 let reviewControl=null,boardSuggestion=null;
 let state,store,dirty=false,blocked=false,playerView=false,listMode=false,modalRevision=0,returnFocus,toastTimer,scriptPicker,undo=[],lastEdit='',lastEditAt=0;
 const playerViewKey='botc_grimoire_player_view_v1';try{const saved=root.sessionStorage.getItem(playerViewKey);playerView=saved==='true';if(saved===null)root.sessionStorage.setItem(playerViewKey,'false');}catch{playerView=true;}
 let sheetRefresh=null,panelFront=null,panelLayer=20;const sideViews={};
 let layoutFrame=0;
 let roleTooltip,roleTooltipAnchor;
 const motionQuery=root.matchMedia?.('(prefers-reduced-motion: reduce)'),motions=new Map();let motionFrame=0,backgroundLayer=null,motionSuspended=false;
 function motionAllowed(){return !motionQuery?.matches&&!document.hidden&&!motionSuspended;}
 function cancelMotion(scope){for(const [element,animation]of motions)if(!scope||element===scope||scope.contains(element)){animation.cancel();motions.delete(element);}}
 function playMotion(element,frames,options={}){
  if(!element?.isConnected||!element.animate||!motionAllowed())return null;
  cancelMotion(element);try{const animation=element.animate(frames,{duration:180,easing:'cubic-bezier(.22,.7,.32,1)',...options});motions.set(element,animation);const done=()=>{if(motions.get(element)===animation)motions.delete(element);};animation.finished.then(done,done);return animation;}catch{return null;}
 }
 function contentArrive(element=body){return playMotion(element,[{opacity:.7},{opacity:1}],{duration:160});}
 function settleBoard(){playMotion($('gBoard'),[{opacity:.84},{opacity:1}],{duration:180});}
 function stopMotion(){if(motionFrame){root.cancelAnimationFrame(motionFrame);motionFrame=0;}cancelMotion();backgroundLayer?.remove();backgroundLayer=null;}
 motionQuery?.addEventListener?.('change',()=>{if(motionQuery.matches)stopMotion();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion();});
 root.addEventListener('pagehide',()=>{motionSuspended=true;stopMotion();});root.addEventListener('pageshow',()=>{motionSuspended=false;});
 let fullscreenBusy=false;
 let pageZoom=100;
 const scale=()=>pageZoom/100,uiWidth=()=>root.innerWidth/scale(),uiHeight=()=>root.innerHeight/scale(),pointerX=e=>e.clientX/scale(),pointerY=e=>e.clientY/scale();
 function measure(element){const r=element.getBoundingClientRect(),z=scale();return {left:r.left/z,top:r.top/z,right:r.right/z,bottom:r.bottom/z,width:r.width/z,height:r.height/z};}
 function zoomViewport(){const style=document.documentElement.style;style.setProperty('--g-viewport-width',uiWidth()+'px');style.setProperty('--g-viewport-height',uiHeight()+'px');}
 function applyPageZoom(){document.documentElement.style.zoom=String(scale());app.dataset.pageZoom=String(pageZoom);zoomViewport();}
 function syncZoomControls(){const value=$('gZoomReset');if(value){value.textContent=pageZoom+'%';value.setAttribute('aria-label','当前缩放 '+pageZoom+'%，点击恢复 100%');$('gZoomOut').disabled=pageZoom<=75;$('gZoomIn').disabled=pageZoom>=150;}}
 function setPageZoom(value){
  if(!Number.isFinite(value))return;const previous=pageZoom;pageZoom=Math.max(75,Math.min(150,Math.round(value/5)*5));if(previous===pageZoom)return;hideRoleTooltip();applyPageZoom();if(!layoutExplicit)listMode=compactSeats();updateVisibleViewport();position();syncZoomControls();settleBoard();const counter=$('gZoomReset');if(counter)playMotion(counter,[{color:'#eddbac'},{color:getComputedStyle(counter).color}],{duration:220});if(!saveDisplayPreferences())toast('缩放已调整，但浏览器暂时无法保存设置。');
 }
 const offlineDrawKey='botc_grimoire_draw_v1';let offlineDraw=null,offlineRevealed=false,offlineMotionCursor=0;
 let seatNameTimer,seatNameTap,suppressSeatClickUntil=0;
 let tableShape='circle',listColumns=0,showNightOrder=true,layoutExplicit=false,freePositions=[];
 const displayKey='botc_grimoire_display_v1';let showScriptLogo=true,summaryCollapsed=false;
 const backgroundKey='botc_grimoire_background_v1';let customBackground=null;
 const sheetOptions={dim:false,hide:false};
 let aux,markers,timer,roleArcSerial=0,notesRefresh=null,notesFloating=false,signalReturn=null;
 const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 const button=(text,click,className='')=>{const b=node('button',text,'g-button '+className);b.type='button';b.onclick=click;return b;};
 function hint(text){return node('p',text,'g-hint');}
 function field(label,input){const l=node('label',label);l.appendChild(input);return l;}
 function error(message){let p=$('gDialogError');if(!p){p=node('p','','g-error');p.id='gDialogError';p.setAttribute('role','alert');body.prepend(p);}p.textContent=message;}
 function toast(text){$('gToast').textContent=text;contentArrive($('gToast'));clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('gToast').textContent='',4500);}
 function safeImage(url){
  if(typeof url!=='string'||!url.trim())return '';
  try{if(/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(url))return url;const u=new URL(url,document.baseURI);return ['http:','https:','file:'].includes(u.protocol)?u.href:'';}catch{return '';}
 }
 function image(role){const wrap=node('span','?','g-question'),src=role&&safeImage(role.image);if(src){wrap.dataset.imageSource=src;const img=node('img');img.src=src;img.alt='';img.decoding='async';img.draggable=false;img.onerror=()=>{img.replaceWith(wrap);};return img;}return wrap;}
 function roleWikiIcon(role,className){
  const page=C.wikiPage(role),icon=node(page?'a':'span',undefined,className+(page?' g-role-wiki-link':''));icon.append(image(role));if(page){icon.href=page;icon.target='_blank';icon.rel='noopener noreferrer';icon.title='在新窗口打开'+role.name+'的百科页面';icon.setAttribute('aria-label',icon.title);}return icon;
 }
 function svgNode(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs||{}))n.setAttribute(key,value);return n;}
 function roleLabel(name,unassigned=false){
  // A broader arc keeps two-character titles upright; longer titles still follow the rim.
  const chars=Array.from(name),display=chars.length>8?chars.slice(0,7).join('')+'…':name,length=Math.max(1,Array.from(display).length),radius=Math.max(44,Math.min(54,length*13)),angle=65*Math.PI/180,x=radius*Math.sin(angle),y=90-radius+radius*Math.cos(angle);
  const svg=svgNode('svg',{viewBox:'0 0 100 100','aria-hidden':'true',class:'g-seat-role g-seat-role-arc'+(unassigned?' unassigned':'')}),id='gRoleArc_'+(++roleArcSerial),defs=svgNode('defs'),path=svgNode('path',{id,d:'M '+(50-x)+' '+y+' A '+radius+' '+radius+' 0 0 0 '+(50+x)+' '+y}),text=svgNode('text',{'font-size':Math.min(18,82/length)+2,'text-anchor':'middle'}),label=svgNode('textPath',{href:'#'+id,startOffset:'50%'});label.textContent=display;defs.append(path);text.append(label);svg.append(defs,text);return svg;
 }
 function hideRoleTooltip(){
  if(roleTooltipAnchor){roleTooltipAnchor.classList.remove('is-role-hovered');roleTooltipAnchor.removeAttribute('aria-describedby');roleTooltipAnchor=null;}
  if(roleTooltip){roleTooltip.hidden=true;roleTooltip.replaceChildren();}
 }
 function showRoleTooltip(anchor){
  if(playerView||dialog.open||!anchor){hideRoleTooltip();return;}
  const seat=state.seats.find(s=>s.id===anchor.closest('.g-seat')?.dataset.seatId),role=seat&&roleOf(seat);
  if(!role){hideRoleTooltip();return;}if(roleTooltipAnchor===anchor)return;hideRoleTooltip();
  if(!roleTooltip){roleTooltip=node('div',undefined,'g-role-tooltip');roleTooltip.id='gRoleTooltip';roleTooltip.setAttribute('role','tooltip');app.append(roleTooltip);}
  const heading=node('div',undefined,'g-role-tooltip-heading');heading.append(node('strong',role.name,role.team),node('span',teamNames[role.team]||''));
  roleTooltip.append(heading,node('p',role.ability||'能力文本尚未收录。'));roleTooltipAnchor=anchor;anchor.classList.add('is-role-hovered');anchor.setAttribute('aria-describedby',roleTooltip.id);
  const v=panelViewport();roleTooltip.style.maxHeight=Math.max(60,Math.min(280,v.height-16))+'px';roleTooltip.hidden=false;
  const r=measure(anchor),t=measure(roleTooltip),x=Math.max(8,Math.min(r.left+r.width/2-t.width/2,uiWidth()-t.width-8)),above=r.top-t.height-10,y=Math.max(v.top+8,Math.min(above>=v.top+8?above:r.bottom+10,v.bottom-t.height-8));
  roleTooltip.style.left=x+'px';roleTooltip.style.top=y+'px';
 }
 function setupRoleTooltips(){
  const seats=$('gSeats'),anchor=target=>target?.closest?.('.g-seat-token,.g-life-toggle')?.closest('.g-seat')?.querySelector('.g-seat-token');
  seats.addEventListener('pointerover',e=>{if(!e.pointerType||e.pointerType==='mouse')showRoleTooltip(anchor(e.target));});
  seats.addEventListener('pointerout',e=>{if(anchor(e.relatedTarget)!==roleTooltipAnchor)hideRoleTooltip();});
  seats.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible'))showRoleTooltip(anchor(e.target));});
  seats.addEventListener('focusout',e=>{if(anchor(e.relatedTarget)!==roleTooltipAnchor)hideRoleTooltip();});
  seats.addEventListener('pointerdown',hideRoleTooltip);seats.addEventListener('dragstart',hideRoleTooltip);
  root.addEventListener('resize',hideRoleTooltip);root.addEventListener('blur',hideRoleTooltip);document.addEventListener('scroll',hideRoleTooltip,true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideRoleTooltip();});
 }
 function voteIcon(){
  const svg=svgNode('svg',{viewBox:'0 0 28 28','aria-hidden':'true'});svg.append(svgNode('path',{d:'M7 3h14v16H7z M3 17h3v4h17v-4h3v7H3z',fill:'currentColor'}),svgNode('path',{d:'m10 10 3 3 5-6',fill:'none',stroke:'#18222a','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round'}));return svg;
 }
 function flipSeats(){
  if(!root.matchMedia||root.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  for(const token of $('gSeats').querySelectorAll('.g-seat-token > .g-token')){
   const turn=node('span',undefined,'g-token-turn'),back=node('span',undefined,'g-token-turn-back');back.setAttribute('aria-hidden','true');back.dataset.publicState=token.parentElement.dataset.publicState;
   // Only public artwork is used on the outgoing face; no private role is retained.
   token.replaceWith(turn);turn.append(token,back);
   let timer;const finish=()=>{clearTimeout(timer);if(turn.isConnected)turn.replaceWith(token);};
   turn.addEventListener('animationend',e=>{if(e.target===turn)finish();});turn.addEventListener('animationcancel',e=>{if(e.target===turn)finish();});timer=setTimeout(finish,650);
  }
 }
 function setPlayerView(value){
  if(offlineDraw&&!value)return;
  if(playerView===value)return;
  try{root.sessionStorage.setItem(playerViewKey,String(value));}catch{if(value)toast('身份已遮盖，但浏览器无法记住遮盖状态；刷新前请交还说书人。');}
  if(dialog.open)close();closeNotes(true);for(const view of Object.values(sideViews))closeSidePanel(view,true);body.replaceChildren();playerView=value;$('gToast').textContent='';render();flipSeats();if(dirty)save();
 }
 function decorateToken(token,role){
  const marks=C.tokenMarks(role);token.dataset.reminderCount=String(marks.count);const leaf=(name,angle)=>{const img=node('img',undefined,'g-token-leaf');img.src='theme/leaf-'+name+'.png';img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;img.decoding='async';if(angle!==undefined)img.style.transform='rotate('+angle+'deg)';token.append(img);};
  if(marks.count<=5){if(marks.count)leaf('top'+marks.count);}else for(let i=0;i<marks.count;i++)leaf('top1',(i-(marks.count-1)/2)*Math.min(12,80/(marks.count-1)));
  if(marks.first)leaf('left');if(marks.other)leaf('right');if(marks.setup)leaf('orange');
 }
 function phaseLabel(s=state){return s.phase==='setup'?'准备中':'第 '+s.round+(s.phase==='night'?' 夜':' 天');}
 function random(){if(root.crypto?.getRandomValues){const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}return Math.random();}
 function guard(e){if(dirty){e.preventDefault();e.returnValue='';}}
 function save(){
  try{if(blocked||!store)throw Error('浏览器存储暂不可用，原存档已保留');store.save(state);dirty=false;$('gWarning').hidden=true;$('gSaveStatus').textContent='已保存在此设备 · '+new Date(state.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});root.removeEventListener('beforeunload',guard);return true;}
  catch(e){dirty=true;$('gWarning').hidden=false;$('gWarningText').textContent=playerView?'此页有尚未保存的修改，请交还说书人处理。':'保存未成功：'+e.message+'。请先备份当前对局。';$('gSaveStatus').textContent='当前修改尚未保存';$('gRetry').hidden=playerView||/另一页面/.test(e.message);$('gBackupWarning').hidden=playerView;root.addEventListener('beforeunload',guard);return false;}
 }
 function remember(type){const now=Date.now();if(!((['name','notes'].includes(type)||type.startsWith('seatNoteDraft:'))&&lastEdit===type&&now-lastEditAt<900))undo.push(G.serialize(state));lastEdit=type;lastEditAt=now;let bytes=undo.reduce((n,x)=>n+x.length*2,0);while(undo.length>10||undo.length>1&&bytes>16*1024*1024)bytes-=undo.shift().length*2;}
 function apply(action){
  if(playerView&&action.type!=='cycleStatus')return false;
  try{const previous=state,next=G.reduce(state,action,random),cover=!playerView&&action.type==='life'&&action.alive===false&&state.seats.some(s=>s.id===action.seatId&&s.alive);if(action.type!=='reviewBoardChange')remember(action.type==='seatNoteDraft'?'seatNoteDraft:'+action.seatId:action.type);state=next;dirty=true;save();offerBoardRecord(previous,next,action);renderBoardSuggestion();if(action.type==='notes'||action.type==='seatNoteDraft'){if(notesRefresh)notesRefresh();}else if(action.type==='name')refreshSeatName(action.seatId);else if(action.type==='reminderFlip')markers.refreshFlip(action.seatId,action.index);else{render();if(cover)coverShroud(action.seatId);}return true;}catch(e){if(dialog.open)error(e.message);else toast(e.message);return false;}
 }
 function offerBoardRecord(previous,next,action){
  boardSuggestion=null;if(playerView||previous.phase==='setup'||!['life','assign','cycleStatus'].includes(action.type))return;
  const before=previous.seats.find(p=>p.id===action.seatId),after=next.seats.find(p=>p.id===action.seatId);if(!before||!after)return;
  const label=before.roleId!==after.roleId?'角色变化':before.alive!==after.alive?after.alive?'复活了':'死亡了':null;if(!label)return;
  const stageIndex=previous.round*2-(previous.phase==='night'?2:1);boardSuggestion={type:'reviewBoardChange',gameId:next.gameId,revision:next.revision,seatId:after.id,stageIndex,signature:JSON.stringify(after),before:G.reviewRoster(previous,stageIndex).find(p=>p.seatId===before.id),action:label};
 }
 function renderBoardSuggestion(){
  let bar=$('gBoardReviewSuggestion');if(!bar){bar=node('section',undefined,'g-board-review-suggestion g-glass-surface');bar.id='gBoardReviewSuggestion';bar.setAttribute('aria-label','魔典变化记录建议');app.append(bar);}bar.replaceChildren();
  const pending=boardSuggestion;bar.hidden=playerView||!pending||pending.gameId!==state.gameId||pending.revision!==state.revision;if(bar.hidden)return;
  const save=button('记录并编辑',()=>{if(playerView||boardSuggestion!==pending)return;if(apply(pending)){reviewControl?.editEntry(pending.stageIndex,state.review.nextId-1);}},'subtle');save.id='gBoardReviewRecord';const dismiss=button('仅更新魔典',()=>{boardSuggestion=null;renderBoardSuggestion();},'subtle');dismiss.id='gBoardReviewDismiss';bar.append(node('span',pending.before.number+'号'+(pending.before.name?' '+pending.before.name:'')+'：'+pending.action),save,dismiss);
 }
 function coverShroud(id){
  if(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const control=$('gLife_'+id);if(!control)return;
  // Animate only the artwork so the clickable area stays in place.
  control.classList.add('is-covering');let timer;
  const finish=()=>{clearTimeout(timer);control.classList.remove('is-covering');control.removeEventListener('animationend',finish);control.removeEventListener('animationcancel',finish);};
  control.addEventListener('animationend',finish);control.addEventListener('animationcancel',finish);timer=setTimeout(finish,650);
 }
 function open(title,build){
  hideRoleTooltip();
  renderBoardSuggestion();
  cancelNameClick();
  if(!dialog.open)returnFocus=document.activeElement;
  if(motionFrame)root.cancelAnimationFrame(motionFrame);cancelMotion(body);
  clearSheetMode();modalRevision++;$('gDialogTitle').textContent=title;body.replaceChildren();build(body);if(!dialog.open)dialog.showModal();body.scrollTop=0;
  const revision=modalRevision;if(root.requestAnimationFrame)motionFrame=root.requestAnimationFrame(()=>{motionFrame=0;if(revision===modalRevision&&dialog.open&&!dialog.matches('.g-signal-player,.g-signal-dialog,.g-bluff-reveal'))contentArrive();});
 }
 function close(){if(offlineDraw){showOfflineDraw();return;}cancelMotion(body);dialog.close();}
 $('gDialogClose').onclick=close;dialog.addEventListener('close',()=>{if(dialog.open)return;cancelMotion(body);if(motionFrame){root.cancelAnimationFrame(motionFrame);motionFrame=0;}if(offlineDraw){showOfflineDraw();return;}modalRevision++;clearSheetMode();const id=returnFocus?.id,seatId=returnFocus?.dataset.seatId;const next=id&&$(id)||seatId&&document.querySelector('[data-seat-id="'+seatId+'"]');next?.focus({preventScroll:true});});
 dialog.addEventListener('cancel',e=>{if(offlineDraw){e.preventDefault();showOfflineDraw();}else if(signalReturn){e.preventDefault();signalReturn();}});
 function download(name,text){const a=node('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));a.href=url;a.download=name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,150);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function backup(suffix='对局备份'){if(playerView)return;download((state.script.name||'在线魔典')+'-'+suffix+'.json',G.serialize(state));noteBackup(state);if($('gGameBackupStatus'))$('gGameBackupStatus').textContent=backupStatus(state);toast('对局备份已开始下载，文件包含私密信息。');}
 function occupied(){return state.seats.some(s=>s.roleId||s.name||s.reminders.length||s.notes.length||s.noteDraft)||state.specials.length||state.bluffs.some(Boolean)||state.notes||state.review.stages.some(x=>x.entries.length)||state.phase!=='setup';}
 function replace(next,{preserveCurrent=true}={}){
  if(playerView)return false;
  if(occupied()&&!confirm('这会建立或恢复另一份对局，替换当前座位和进度，是否继续？'))return false;
  const valid=G.validate(next);
  if(blocked){if(!confirm('原浏览器存档无法读取。继续会覆盖原存档；将先下载原始存档供恢复。'))return false;const raw=root.localStorage.getItem(G.key);if(raw)download('在线魔典-原始存档.json',raw);store=G.openStore(root.localStorage);blocked=false;}
  if(preserveCurrent&&occupied()){const library=root.GrimoireArchive.open(root.localStorage),kept=G.validate(state);if(kept.gameId===valid.gameId)kept.gameId=G.create(kept.script,5).gameId;const status=library.list().find(g=>g.id===kept.gameId)?.status||'ongoing';library.save(kept,status);store.save(valid);}
  boardSuggestion=null;remember('replace');sideViews.review?.onClear?.();if(valid.gameId===state.gameId)valid.nextSeatId=Math.max(valid.nextSeatId,state.nextSeatId);state=valid;if(compactSeats())listMode=true;dirty=true;save();render();close();return true;
 }
 function roleOf(s){return state.script.roles.find(r=>r.id===s.roleId);}
 function publicTokenState(s){return s.alive?'alive':s.ghostVote?'dead-vote':'dead-spent';}
 function renderScriptLogo(){
  const center=$('gCenter'),fallback=new URL('theme/custom.png',document.baseURI).href,src=safeImage(C.scriptLogo(state.script))||fallback;center.hidden=!showScriptLogo;
  for(const host of [center,$('gSummaryLogo')]){let img=host.querySelector('img');if(!img){img=node('img');img.alt='';img.decoding='async';host.append(img);img.onerror=()=>{if(img.src!==fallback){host.dataset.fallback='true';img.src=fallback;}else img.hidden=true;};}if(host.dataset.source!==src){host.dataset.source=src;host.dataset.fallback=String(src===fallback);img.hidden=false;img.src=src;}}
  $('gSummaryLogo').disabled=playerView;$('gSummaryLogo').setAttribute('aria-label',(playerView?'当前剧本：':'切换剧本：')+state.script.name);$('gSummaryLogo').title=playerView?'当前剧本：'+state.script.name:'点击切换剧本：'+state.script.name;
 }
 function saveDisplayPreferences(){try{root.localStorage.setItem(displayKey,JSON.stringify({showScriptLogo,summaryCollapsed,pageZoom,freeLayout:{enabled:isFreeLayout(),positions:freePositions}}));return true;}catch{return false;}}
 function validBackground(value){return value?.version===1&&typeof value.image==='string'&&value.image.length<=2*1024*1024&&/^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(value.image)&&Number.isFinite(value.dim)&&value.dim>=0&&value.dim<=75;}
 function applyBackground(animate=false){
  if(backgroundLayer){cancelMotion(backgroundLayer);backgroundLayer.remove();backgroundLayer=null;}
  const outgoing=animate&&motionAllowed()?getComputedStyle(app):null,oldImage=outgoing&&(app.dataset.customBackground!=='true'&&state?.phase==='night'?getComputedStyle(app,'::before').backgroundImage:outgoing.backgroundImage),oldColor=outgoing?.backgroundColor;
  app.dataset.customBackground=String(!!customBackground);
  if(customBackground){app.style.setProperty('--g-custom-background','url("'+customBackground.image+'")');app.style.setProperty('--g-background-dim',String(customBackground.dim/100));}
  else{app.style.removeProperty('--g-custom-background');app.style.removeProperty('--g-background-dim');}
  if(outgoing){const layer=node('div',undefined,'g-background-transition');layer.setAttribute('aria-hidden','true');layer.style.backgroundImage=oldImage;layer.style.backgroundColor=oldColor;app.prepend(layer);backgroundLayer=layer;const animation=playMotion(layer,[{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}),done=()=>{layer.remove();if(backgroundLayer===layer)backgroundLayer=null;};if(animation)animation.finished.then(done,done);else done();}
 }
 async function prepareBackground(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片。');
  if(!file.size||file.size>15*1024*1024)throw Error('图片大小需在 15 MB 以内。');
  const url=URL.createObjectURL(file),img=new Image();
  try{
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('图片无法读取，请换一张图片。'));img.src=url;});
   if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>64*1024*1024)throw Error('图片尺寸过大，请缩小后重试。');
   const scale=Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器无法处理图片。');ctx.fillStyle='#1e2934';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   let image=canvas.toDataURL('image/jpeg',.84);if(image.length>2*1024*1024)image=canvas.toDataURL('image/jpeg',.6);
   if(!validBackground({version:1,image,dim:0}))throw Error('图片内容过大，请换一张较小的图片。');return image;
  }finally{img.onload=img.onerror=null;img.src='';URL.revokeObjectURL(url);}
 }
 function backgroundPanel(){
  if(playerView)return;
  open('自定义魔典背景',host=>{
   let draft=customBackground?{...customBackground}:null,busy=false,request=0;const revision=modalRevision;
   const preview=node('div',undefined,'g-background-preview'),picture=node('img'),empty=node('p','当前使用默认昼夜背景','g-hint'),file=node('input'),status=node('p','','g-hint'),range=node('input'),value=node('span'),actions=node('div',undefined,'g-background-actions');
   preview.append(picture);picture.alt='自定义背景预览';file.type='file';file.accept='image/jpeg,image/png,image/webp';file.id='gBackgroundFile';range.type='range';range.min='0';range.max='75';range.step='1';range.id='gBackgroundDim';status.id='gBackgroundStatus';status.setAttribute('role','status');
   const dimLabel=field('背景暗度 ',range);dimLabel.append(value);
   const refresh=()=>{status.classList.toggle('is-busy',busy);preview.hidden=!draft;empty.hidden=!!draft;range.disabled=!draft||busy;range.value=String(draft?.dim??20);value.textContent=range.value+'%';if(draft){picture.src=draft.image;preview.style.setProperty('--g-background-dim',String(draft.dim/100));}else picture.removeAttribute('src');applyButton.disabled=!draft||busy;reset.disabled=!customBackground||busy;};
   const applyButton=button('应用背景',()=>{
    if(!draft||busy||!validBackground(draft))return;
    try{root.localStorage.setItem(backgroundKey,JSON.stringify(draft));customBackground={...draft};applyBackground(true);close();toast('自定义背景已保存到此设备。');}catch{status.textContent='背景保存失败，当前背景未改变。请尝试更小的图片或释放浏览器存储后重试。';}
   },'primary');applyButton.id='gBackgroundApply';
   const reset=button('恢复默认背景',()=>{
    try{root.localStorage.removeItem(backgroundKey);customBackground=null;applyBackground(true);close();toast('已恢复默认昼夜背景。');}catch{status.textContent='恢复失败，请检查浏览器存储权限后重试。';}
   },'subtle');reset.id='gBackgroundReset';
   file.onchange=async()=>{
    const selected=file.files?.[0],serial=++request;let updated=false;if(!selected){busy=false;status.textContent='';refresh();return;}
    busy=true;status.textContent='正在准备图片…';refresh();
    try{const image=await prepareBackground(selected);if(revision!==modalRevision||serial!==request)return;draft={version:1,image,dim:draft?.dim??20};updated=true;status.textContent='图片已就绪，点击“应用背景”保存。';}
    catch(e){if(revision===modalRevision&&serial===request)status.textContent=e.message;}
    finally{if(revision===modalRevision&&serial===request){busy=false;file.value='';refresh();if(updated)playMotion(picture,[{opacity:.75,transform:'scale(1.015)'},{opacity:1,transform:'scale(1)'}],{duration:200});}}
   };
   range.oninput=()=>{if(draft){draft.dim=Number(range.value);value.textContent=range.value+'%';preview.style.setProperty('--g-background-dim',String(draft.dim/100));}};
   actions.append(applyButton,reset);host.append(hint('白天和夜晚共用这张背景，自动铺满。图片和设置仅保存在当前设备。'),preview,empty,field('选择图片',file),hint('支持 JPG、PNG、WebP，最大 15 MB。'),dimLabel,status,actions);refresh();
  });dialog.classList.add('g-background-dialog');
 }
 function toggleScriptLogo(){showScriptLogo=!showScriptLogo;saveDisplayPreferences();render();$('gMenuScriptLogo')?.focus({preventScroll:true});}
 function renderSummaryState(){$('gSummary').hidden=summaryCollapsed;$('gSummaryOpen').hidden=!summaryCollapsed;for(const id of ['gSummaryToggle','gSummaryOpen'])$(id).setAttribute('aria-expanded',String(!summaryCollapsed));}
 function setSummaryCollapsed(value){summaryCollapsed=value;saveDisplayPreferences();renderSummaryState();position();$(value?'gSummaryOpen':'gSummaryToggle').focus({preventScroll:true});}
 function phoneViewport(){return root.matchMedia?.('(pointer:coarse)').matches&&(uiWidth()<=700||uiWidth()<=1000&&uiHeight()<500);}
 function isFreeLayout(){return tableShape==='free'&&!listMode;}
 function compactSeats(){if(phoneViewport()||isFreeLayout())return false;return root.matchMedia?.('(pointer:coarse)').matches&&(uiWidth()<=700||uiHeight()<500)||state.seats.length>20||uiWidth()<700&&state.seats.length>10||uiHeight()<600&&state.seats.length>8;}
 function freeCanvas(){const board=$('gBoard'),phone=board.classList.contains('phone-table');return {board,width:Math.max(1,phone?parseFloat(board.style.getPropertyValue('--g-phone-width'))||board.clientWidth:board.clientWidth),height:Math.max(1,phone?parseFloat(board.style.getPropertyValue('--g-phone-height'))||board.clientHeight:board.clientHeight)};}
 function placeSeats(seats,points,width,height,phone=false){
  if(isFreeLayout()){
   const w=Math.max(1,width),h=Math.max(1,height),token=parseFloat($('gBoard').style.getPropertyValue('--token-size'))||48,sizes=seats.map(n=>({width:n.offsetWidth,height:n.offsetHeight}));
   points=points.map((point,i)=>{const size=sizes[i],top=phone?token/2:size.height/2,minX=Math.min(w/2,size.width/2+8),maxX=Math.max(minX,w-size.width/2-8),minY=Math.min(h/2,top+8),maxY=Math.max(minY,h-(size.height-top)-8);
    const p=freePositions[i]||(freePositions[i]={x:Math.max(0,Math.min(1,point.x/w)),y:Math.max(0,Math.min(1,point.y/h))});return {x:Math.max(minX,Math.min(maxX,p.x*w)),y:Math.max(minY,Math.min(maxY,p.y*h))};});
  }
  seats.forEach((n,i)=>{n.style.setProperty('--x',points[i].x+'px');n.style.setProperty('--y',points[i].y+'px');n.dataset.markerSide='radial';});
 }
 function moveFreeSeat(index,x,y){freePositions[index]={x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))};}
 function commitFreePosition(control,index){position();const v=freeCanvas(),seat=control.closest('.g-seat');moveFreeSeat(index,parseFloat(seat.style.getPropertyValue('--x'))/v.width,parseFloat(seat.style.getPropertyValue('--y'))/v.height);const token=control.querySelector('.g-token');if(token)playMotion(token,[{boxShadow:'0 0 0 2px #ddc58b99,0 3px 8px #0006'},{boxShadow:getComputedStyle(token).boxShadow}],{duration:240});if(!saveDisplayPreferences())toast('座位已移动，但浏览器暂时无法保存布局。');}
 function positionLeftTools(){
  const summary=app.querySelector('.g-summary');app.style.setProperty('--g-summary-bottom',(summary.hidden?-8:summary.offsetTop+summary.offsetHeight)+'px');
  const actions=app.querySelector('.g-view-actions'),bottom=actions.offsetTop+actions.offsetHeight;app.style.setProperty('--g-side-top',((uiWidth()<=700?Math.max(summary.offsetTop+summary.offsetHeight,bottom):bottom)+(uiWidth()<=700?16:12))+'px');
  const leftTools=app.querySelector('.g-left-tools'),bluffs=$('gBluffs');leftTools.style.maxHeight=Math.max(0,(bluffs.hidden?uiHeight():measure(bluffs).top)-measure(leftTools).top-8)+'px';
  const legend=$('gFabled');app.style.setProperty('--g-legend-top',(measure(legend).top-measure(app).top)+'px');
  timer?.position();
 }
 function reminderPlacement(roleRect,dx,dy,markerSize,count,gap=32){
  if(isFreeLayout()&&!dx&&!dy)dy=-1;
  const length=Math.hypot(dx,dy)||1,r=markerSize/2,start=roleRect.width/2+r+gap,available=Math.max(0,length-start-r-8);
  // Every row follows the exact role-to-table-center ray, independent of nearby controls or markers.
  return {x:dx/length,y:dy/length,start,step:count>1?(isFreeLayout()?markerSize+8:Math.min(markerSize+8,available/(count-1))):0};
 }
 function schedulePosition(){
  if(!root.requestAnimationFrame){position();return;}
  if(!layoutFrame)layoutFrame=root.requestAnimationFrame(()=>{layoutFrame=0;position();});
 }
 function positionPhoneTable(board,count,phone=true){
  const viewportWidth=board.clientWidth,rect=measure(board),summary=$('gSummary');
  const size=phone?Math.round(Math.max(count>14?40:46,Math.min(count>14?52:count>10?64:72,viewportWidth*scale()*(count>14?.125:count>10?.15:.18)))):Math.round(Math.max(78,Math.min(128,uiHeight()*scale()*.135))*(count>14?.8:1));
  const markers=playerView||isFreeLayout()?0:Math.max(0,...state.seats.map(s=>s.reminders.length)),crowded=markers&&state.seats.filter(s=>s.reminders.length===markers).length>1,coreSpace=crowded?Math.max(28,24/(2*Math.sin(Math.PI/count))):28,minRay=size/2+20+24+markers*48+coreSpace,width=Math.max(viewportWidth,count>20?620:0,minRay*2+size+20);
  const top=Math.max(116,summary.hidden?116:summary.offsetTop+summary.offsetHeight+44),bottom=24;
  const minRadius=Math.max(width*(count>14?.65:.38),minRay)*(tableShape==='ellipse'?1.2:1),height=Math.max(board.clientHeight,top+bottom+size+26+minRadius*2),radiusY=(height-top-bottom-size-26)/2,radiusX=(width-size-20)/2,centerY=top+size/2+radiusY;
  const oldWidth=board.style.getPropertyValue('--g-phone-width'),oldCenter=board.scrollLeft+viewportWidth/2;board.style.setProperty('--token-size',size+'px');board.style.setProperty('--g-phone-width',width+'px');board.style.setProperty('--g-phone-height',height+'px');board.style.setProperty('--g-phone-caption-width',(count>14?size:size+10)+'px');board.dataset.scrollable=String(height>board.clientHeight+1);board.dataset.wide=String(width>board.clientWidth+1);if(oldWidth!==width+'px')board.scrollLeft=Math.max(0,(oldWidth?oldCenter/parseFloat(oldWidth):.5)*width-viewportWidth/2);
  const logoWidth=Math.max(64,Math.min(150,radiusX*.75));$('gCenter').style.left=width/2+'px';$('gCenter').style.setProperty('--g-logo-y',centerY+'px');$('gCenter').style.setProperty('--g-logo-width',logoWidth+'px');$('gCenter').style.setProperty('--g-logo-height',logoWidth*.8+'px');
  timer?.positionCenter({x:width/2,y:centerY,logoHeight:showScriptLogo?logoWidth*.8:0});
  const seats=[...$('gSeats').querySelectorAll('.g-seat')],points=seats.map((n,i)=>{const a=-Math.PI/2+i/count*Math.PI*2;return {x:width/2+Math.cos(a)*radiusX,y:centerY+Math.sin(a)*radiusY};});placeSeats(seats,points,width,height,true);
  const roles=seats.map(n=>measure(n.querySelector('.g-seat-token')));seats.forEach((n,i)=>{const tokens=[...n.querySelectorAll('.g-reminder-item,.g-reminder-add')];if(!tokens.length)return;const seat=measure(n),role=roles[i],ox=role.left-seat.left+role.width/2,oy=role.top-seat.top+role.height/2,dx=rect.left+width/2-board.scrollLeft-role.left-role.width/2,dy=rect.top+centerY-board.scrollTop-role.top-role.height/2,ray=reminderPlacement(role,dx,dy,tokens[0].offsetWidth,tokens.length,24);tokens.forEach((t,j)=>{const d=ray.start+j*ray.step;t.style.setProperty('--marker-x',(ox+ray.x*d)+'px');t.style.setProperty('--marker-y',(oy+ray.y*d)+'px');});});
 }
 function position(){
  if(layoutFrame){root.cancelAnimationFrame(layoutFrame);layoutFrame=0;}
  const phone=phoneViewport(),touch=root.matchMedia?.('(pointer:coarse)').matches,zoomCanvas=!phone&&pageZoom>100&&(uiWidth()<1100||uiHeight()<700),virtual=phone||zoomCanvas,phoneBoard=$('gBoard');app.classList.toggle('g-phone-ui',phone);app.classList.toggle('g-tablet-ui',touch&&!phone);app.classList.toggle('g-zoom-table-ui',zoomCanvas);if(virtual&&!listMode&&!phoneBoard.classList.contains('phone-table'))phoneBoard.style.removeProperty('--g-phone-width');phoneBoard.classList.toggle('phone-table',virtual&&!listMode);
  renderStartHint(zoomCanvas&&!listMode);
  positionLeftTools();positionSidePanels();
  const dockHeight=$('gDock').hidden?0:$('gDock').offsetHeight,bluffHeight=$('gBluffPanel').hidden?0:$('gBluffPanel').offsetHeight;app.style.setProperty('--g-dock-height',dockHeight+'px');app.style.setProperty('--g-bottom-height',Math.max(dockHeight,bluffHeight)+'px');
  const board=$('gBoard'),width=board.clientWidth,height=board.clientHeight,count=state.seats.length;
  board.classList.toggle('list-mode',listMode);board.classList.toggle('free-layout',isFreeLayout());board.classList.toggle('dense',count>12);board.dataset.layout=listMode?(listColumns===1?'single':listColumns===2?'double':'auto'):tableShape;
  if(virtual&&!listMode){positionPhoneTable(board,count,phone);return;}
  const mobile=width<=700,short=!mobile&&height<600,tablet=!mobile&&!short&&width<(touch?1000:1100);
  const size=Math.round(mobile?Math.max(48,Math.min(76,width*scale()*.175)):tablet?Math.max(88,Math.min(120,width*scale()*.145,height*scale()*.12)):(short?Math.max(56,Math.min(78,height*scale()*.18)):Math.max(78,Math.min(128,height*scale()*.135)))*(count>14?.8:1));
  board.style.setProperty('--token-size',size+'px');
  const top=mobile?124:tablet||touch&&width<1100&&!short?104:short?18:12,bottom=tablet?($('gDock').hidden?30:$('gDock').offsetHeight+32):mobile?Math.max(70,$('gDock').hidden?70:$('gDock').offsetHeight+24):short?18:22;
  const centerY=(top+height-bottom)/2;
  const radiusY=Math.max(44,(height-top-bottom-size-42)/2);let radiusX=tablet?Math.min((width-112-size)/2,radiusY*(tableShape==='ellipse'?1.5:1.3)):mobile?Math.max(52,(width-88-size-20)/2):short?Math.min(Math.max(60,width/2-$('gDock').offsetWidth-72),radiusY*.9):Math.min((width-400-size)/2,radiusY*(tableShape==='ellipse'?1.32:1));
  const two=count>14&&width>700,outer=two?Math.ceil(count*.66):count;
  if(touch&&!mobile&&!short)radiusX=Math.min((width-112-size)/2,Math.max(radiusX,(size+8)/(2*Math.sin(Math.PI/outer))));
  const logoWidth=Math.max(64,Math.min(340,radiusX*(two?.56:1)*.85));$('gCenter').style.setProperty('--g-logo-y',centerY+'px');$('gCenter').style.setProperty('--g-logo-width',logoWidth+'px');$('gCenter').style.setProperty('--g-logo-height',Math.min(250,logoWidth*.8)+'px');
  let centerX=width/2;$('gCenter').style.left=centerX+'px';
  const boardRect=measure(board),seats=[...$('gSeats').querySelectorAll('.g-seat')];
  const points=seats.map((n,i)=>{const inner=two&&i>=outer,total=inner?count-outer:outer,index=inner?i-outer:i,a=-Math.PI/2+index/total*Math.PI*2,f=inner?.56:1;return {x:width/2+Math.cos(a)*radiusX*f,y:centerY+Math.sin(a)*radiusY*f};});placeSeats(seats,points,width,height);if(listMode){timer?.positionCenter({x:centerX,y:centerY,logoHeight:0});return;}
  // A tablet's corner dock must not cover the lower-right tokens or their captions.
  if(touch&&!tablet&&!short&&!$('gDock').hidden&&!isFreeLayout()){
   const dock=measure($('gDock')),bounds=seats.map(measure),overlap=bounds.filter(r=>r.bottom>dock.top-12&&r.top<dock.bottom&&r.right>dock.left-12&&r.left<dock.right),shift=Math.min(Math.max(0,Math.min(...bounds.map(r=>r.left))-boardRect.left-48),Math.max(0,...overlap.map(r=>r.right-dock.left+12)));
   if(shift){centerX-=shift;points.forEach(p=>p.x-=shift);placeSeats(seats,points,width,height);$('gCenter').style.left=centerX+'px';}
  }
  timer?.positionCenter({x:centerX,y:centerY,logoHeight:showScriptLogo?Math.min(250,logoWidth*.8):0});
  const roleRects=seats.map(n=>measure(n.querySelector('.g-seat-token')));
  seats.forEach((n,i)=>{
   const tokens=[...n.querySelectorAll('.g-reminder-item,.g-reminder-add')];if(!tokens.length)return;const seatRect=measure(n),roleRect=roleRects[i],ox=roleRect.left-seatRect.left+roleRect.width/2,oy=roleRect.top-seatRect.top+roleRect.height/2,dx=boardRect.left+centerX-roleRect.left-roleRect.width/2,dy=boardRect.top+centerY-roleRect.top-roleRect.height/2,size=tokens[0].offsetWidth,ray=reminderPlacement(roleRect,dx,dy,size,tokens.length);
   tokens.forEach((t,j)=>{const d=ray.start+j*ray.step;t.style.setProperty('--marker-x',(ox+ray.x*d)+'px');t.style.setProperty('--marker-y',(oy+ray.y*d)+'px');});
  });
 }
 function refreshSeatName(id){
  cancelNameClick();const s=state.seats.find(s=>s.id===id),group=$('gSeatToken_'+id)?.closest('.g-seat');if(!s||!group)return;const index=state.seats.indexOf(s),label=(index+1)+' 号 '+(s.name||'未命名'),role=roleOf(s),name=$('gSeatLabel_'+id);
  group.setAttribute('aria-label',label+(role?'，'+role.name:'')+'，'+(s.alive?'存活':'死亡'));name.textContent=(index+1)+'号'+(s.name?' · '+s.name:'');name.setAttribute('aria-label','管理 '+label+'，双击快速改名');$('gSeatToken_'+id).setAttribute('aria-label',label+'，'+(role?'修改角色：'+role.name:'选择角色')+(isFreeLayout()?'；拖动或方向键调整位置':''));$('gLife_'+id)?.setAttribute('aria-label',(s.alive?'标记死亡：':'恢复存活：')+label);$('gVote_'+id)?.setAttribute('aria-label',(s.ghostVote?'死亡票可用':'死亡票已使用')+'：'+label);$('gReminderAdd_'+id)?.setAttribute('aria-label','为 '+(index+1)+' 号'+(s.name?' '+s.name:'')+' 添加提示标记');
 }
 function renderStartHint(scrollable=false){const value=(playerView?'角色已隐藏 · 点击圆牌：存活 → 死亡有票 → 死亡无票 → 存活':isFreeLayout()?'自由摆放 · 拖动圆牌移动位置 · 菜单可重置':'点圆牌选角色 · 点名字管理 · 双击名字改名 · 拖动圆牌换座')+(scrollable?' · 滚动查看圆桌':'');if($('gStartHint').textContent!==value)$('gStartHint').textContent=value;}
 function render(){
  hideRoleTooltip();
  renderBoardSuggestion();
  cancelNameClick();
  const shown=playerView?G.publicView(state):state,counts=G.counts(state);app.dataset.sceneTransition=String(app.dataset.ready==='true');app.dataset.ready='true';app.dataset.playerView=String(playerView);app.dataset.phase=state.phase;
  $('gTitle').textContent=state.script.name;$('gTitle').title=state.script.name;$('gPhase').textContent=phaseLabel();$('gCounts').textContent='存活'+counts.alive+'/'+state.seats.length+' 可投票'+counts.eligible;
  $('gComposition').replaceChildren();if(!playerView){const targets=G.distributionCounts(state.seats.length-counts.by.traveller);for(const [t,label]of [['townsfolk','民'],['outsider','外'],['minion','爪'],['demon','恶']]){const item=node('span',label+' '+counts.by[t],'g-summary-team '+t);if(targets)item.append(node('span','/'+targets[t],'g-summary-target'));item.title=teamNames[t]+'：已分配 '+counts.by[t]+(targets?' / 基础配置 '+targets[t]+'（设置变化需说书人判断）':'');item.setAttribute('aria-label',item.title);$('gComposition').append(item);}if(counts.by.traveller)$('gComposition').append(node('span','旅 '+counts.by.traveller,'traveller'));}
  $('gSeatTotal').textContent=state.seats.length+' 人';$('gSeatMinus').disabled=state.seats.length<=5;$('gSeatPlus').disabled=state.seats.length>=30;
  renderStartHint();
  renderScriptLogo();
  renderSummaryState();
  const holder=$('gSeats'),nightRanks={first:new Map(),other:new Map()};holder.replaceChildren();if(showNightOrder&&!playerView)for(const key of ['first','other'])G.nightActions(state,{first:key==='first'}).forEach((x,i)=>x.seats.forEach(s=>nightRanks[key].set(s.id,i+1)));
  shown.seats.forEach((s,i)=>{
   const r=playerView?null:roleOf(s),b=node('div',undefined,'g-seat'+(!s.alive?' dead':'')),label=(i+1)+' 号 '+(s.name||'未命名');b.dataset.seatId=s.id;b.setAttribute('role','group');b.setAttribute('aria-label',label+(r?'，'+r.name:'')+'，'+(s.alive?'存活':'死亡'));
   const token=node('span',undefined,'g-token'+(playerView?' g-token-hidden':r?' '+r.team:'')),roleButton=node('button',undefined,'g-seat-token'),name=node('button',(i+1)+'号'+(s.name?' · '+s.name:''),'g-seat-name'),caption=node('div',undefined,'g-seat-caption');roleButton.type=name.type='button';roleButton.id='gSeatToken_'+s.id;roleButton.dataset.publicState=publicTokenState(s);name.id='gSeatLabel_'+s.id;if(playerView)token.dataset.publicState=publicTokenState(s);else{token.append(image(r),roleLabel(r?r.name:'未分配',!r));decorateToken(token,r);}roleButton.append(token);caption.append(name);b.append(roleButton,caption);
   if(!playerView){const life=button('',()=>{if(apply({type:'life',seatId:s.id,alive:!s.alive}))$('gLife_'+s.id)?.focus({preventScroll:true});},'g-life-toggle');life.id='gLife_'+s.id;life.title=s.alive?'点击圆牌上方，标记死亡':'点击帷幕，恢复存活';life.setAttribute('aria-label',(s.alive?'标记死亡：':'恢复存活：')+label);life.setAttribute('aria-pressed',String(!s.alive));b.append(life);}
   if(!s.alive&&!playerView){const description=(s.ghostVote?'死亡票可用':'死亡票已使用')+'：'+label,vote=button('',()=>{if(apply({type:'vote',seatId:s.id,available:!s.ghostVote}))$('gVote_'+s.id)?.focus({preventScroll:true});},'g-vote g-vote-toggle'+(s.ghostVote?'':' used'));vote.id='gVote_'+s.id;vote.append(voteIcon());vote.setAttribute('aria-label',description);vote.title=s.ghostVote?'点击使用死亡票':'点击恢复死亡票';vote.setAttribute('aria-pressed',String(s.ghostVote));caption.append(vote);}
   if(!playerView&&s.alignment!=='unknown')b.append(node('span',s.alignment==='good'?'善良':'邪恶','g-alignment '+s.alignment));
   for(const key of ['first','other'])if(nightRanks[key].has(s.id)){const value=nightRanks[key].get(s.id),rank=node('span',String(value),'g-token-order '+key),description=(key==='first'?'首个夜晚':'其他夜晚')+'行动第 '+value+' 项';rank.dataset.night=key;rank.setAttribute('aria-label',description);rank.title=description;roleButton.append(rank);b.classList.add('has-night-order');}
   if(!playerView)b.append(markers.seatControls(s.id));
   if(playerView){const status=s.alive?'存活':'已死亡，'+(s.ghostVote?'死亡票可用':'死亡票已使用'),next=s.alive?'标记死亡，保留死亡票':s.ghostVote?'使用死亡票':'恢复存活';roleButton.setAttribute('aria-label',label+'，'+status+'；点击'+next);roleButton.title='点击'+next;name.setAttribute('aria-label',label);roleButton.onclick=()=>{if(apply({type:'cycleStatus',seatId:s.id}))$('gSeatToken_'+s.id)?.focus({preventScroll:true});};name.onclick=()=>toast(label+' · '+status);}else{
    roleButton.setAttribute('aria-label',label+'，'+(r?'修改角色：'+r.name:'选择角色')+(isFreeLayout()?'；拖动或方向键调整位置':''));roleButton.title=r?'':'点击选择或修改角色，拖动交换座位';name.setAttribute('aria-label','管理 '+label+'，双击快速改名');name.title='单击管理玩家，双击快速改名（键盘 F2）';
    roleButton.onclick=e=>{if(e.detail===0||Date.now()>=suppressSeatClickUntil){roleButton.focus({preventScroll:true});aux.seatRole(s.id);}};name.onclick=e=>{name.focus({preventScroll:true});nameClick(e,s.id);};name.ondblclick=e=>{e.preventDefault();cancelNameClick();if(!$('gQuickSeatName'))quickName(s.id);};name.onkeydown=e=>{if(e.key==='F2'){e.preventDefault();cancelNameClick();quickName(s.id);}};setupSeatPointer(b,roleButton,s.id);
   }
   holder.append(b);
  });
  for(const id of ['gScript','gAssign','gNight','gNotes','gMenu','gAdvance','gHistory','gBluffs','gSeatMinus','gSeatPlus'])$(id).hidden=playerView;$('gSheet').textContent=playerView?'角色表':'角色';
  $('gDock').hidden=playerView;
  $('gAdvance').textContent=state.phase==='setup'?'进入第 1 夜':state.phase==='night'?'进入第 '+state.round+' 天':'进入第 '+(state.round+1)+' 夜';
  $('gPlayerView').setAttribute('aria-pressed',String(playerView));$('gPlayerView').setAttribute('aria-label',playerView?'回到说书人视角':'切换玩家视角');$('gPlayerView').title=(playerView?'回到说书人视角':'切换玩家视角')+'（T）';$('gAdvance').title=$('gAdvance').textContent+'（N）';
  $('gPrivacy').textContent=playerView?'仅隐藏当前屏幕的私密信息':'单机说书人 · 私密资料保存在此设备';
  if(dirty){$('gRetry').hidden=playerView||$('gWarningText').textContent.includes('另一页面');$('gBackupWarning').hidden=playerView;}
  position();
  aux?.render();
  markers?.renderDeadlines();
  if(playerView)closeNotes(true);else if(notesRefresh)notesRefresh();
  if(sheetRefresh&&dialog.open)sheetRefresh();for(const view of Object.values(sideViews))if(!view.panel.hidden&&view.refresh)view.refresh();
 }
 function cancelNameClick(){clearTimeout(seatNameTimer);seatNameTimer=undefined;seatNameTap=null;}
 function nameClick(e,id){
  const double=e.detail>=2||seatNameTap?.id===id&&Date.now()-seatNameTap.at<450;cancelNameClick();
  if(double){quickName(id);return;}if(e.detail===0){seatPanel(id);return;}
  seatNameTap={id,at:Date.now()};seatNameTimer=setTimeout(()=>{cancelNameClick();seatPanel(id);},450);
 }
 function quickName(id){
  if(playerView)return;const p=state.seats.find(s=>s.id===id);if(!p)return;let input;
  open((state.seats.indexOf(p)+1)+' 号 · 快速改名',host=>{const form=node('form');input=node('input');input.id='gQuickSeatName';input.maxLength=40;input.value=p.name;input.placeholder='玩家名字，可留空';const row=node('div',undefined,'g-row'),save=button('保存名称',undefined,'primary'),cancel=button('取消',close);save.type='submit';save.id='gQuickNameSave';row.append(save,cancel);form.append(field('玩家名称',input),row);form.onsubmit=e=>{e.preventDefault();if(input.value===p.name||apply({type:'name',seatId:id,name:input.value}))close();};host.append(form);});input.focus();input.select();
 }
 function setupSeatPointer(b,control,id){
  let start,drag=false,over;const clear=()=>{b.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));};
  control.onpointerdown=e=>{if(e.button!==0||e.isPrimary===false)return;cancelNameClick();const v=freeCanvas(),index=state.seats.findIndex(s=>s.id===id);start={x:pointerX(e),y:pointerY(e),free:isFreeLayout(),index,position:freePositions[index]&&{...freePositions[index]},left:parseFloat(b.style.getPropertyValue('--x')),top:parseFloat(b.style.getPropertyValue('--y')),scrollX:v.board.scrollLeft,scrollY:v.board.scrollTop};drag=false;over=null;control.setPointerCapture?.(e.pointerId);};
  control.onpointermove=e=>{if(!start)return;if(Math.hypot(pointerX(e)-start.x,pointerY(e)-start.y)>9)drag=true;if(!drag)return;hideRoleTooltip();b.classList.add('dragging');if(start.free){const v=freeCanvas();moveFreeSeat(start.index,(start.left+pointerX(e)-start.x+v.board.scrollLeft-start.scrollX)/v.width,(start.top+pointerY(e)-start.y+v.board.scrollTop-start.scrollY)/v.height);schedulePosition();return;}over=[...$('gSeats').querySelectorAll('.g-seat')].filter(n=>n!==b).find(n=>{const r=measure(n);return pointerX(e)>=r.left&&pointerX(e)<=r.right&&pointerY(e)>=r.top&&pointerY(e)<=r.bottom;});document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));over?.classList.add('drop-target');};
  control.onpointerup=()=>{if(!start)return;const finished=start;start=null;clear();if(drag){suppressSeatClickUntil=Date.now()+250;if(finished.free)commitFreePosition(control,finished.index);else if(over)apply({type:'swap',seatId:id,otherSeatId:over.dataset.seatId});}drag=false;};
  control.onpointercancel=control.onlostpointercapture=()=>{if(start?.free&&drag){freePositions[start.index]=start.position;schedulePosition();}start=null;drag=false;over=null;clear();};
  control.onkeydown=e=>{if(!isFreeLayout()||e.target!==control||e.ctrlKey||e.altKey||e.metaKey)return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();hideRoleTooltip();const v=freeCanvas(),index=state.seats.findIndex(s=>s.id===id),step=e.shiftKey?24:6;moveFreeSeat(index,(parseFloat(b.style.getPropertyValue('--x'))+delta[0]*step)/v.width,(parseFloat(b.style.getPropertyValue('--y'))+delta[1]*step)/v.height);commitFreePosition(control,index);};
 }
 function seatPanel(id){
  if(playerView)return;const p=state.seats.find(x=>x.id===id);if(!p)return;
  const current=()=>state.seats.find(x=>x.id===id);
  open((state.seats.indexOf(p)+1)+' 号座位',host=>{
   const title=$('gDialogTitle'),name=node('input'),pencil=node('span','✎','g-seat-pencil');name.id='gSeatName';name.maxLength=40;name.value=p.name;name.placeholder='未命名';const nameWidth=()=>{name.style.width=Math.max(3,Array.from(name.value||'未命名').length)*1.05+'em';};nameWidth();name.setAttribute('aria-label','玩家名字');name.oninput=()=>{nameWidth();apply({type:'name',seatId:id,name:name.value});};pencil.setAttribute('aria-hidden','true');title.replaceChildren(node('span',(state.seats.indexOf(p)+1)+'号','g-seat-number'),name,pencil);
   const profile=node('section',undefined,'g-seat-profile'),portrait=node('div',undefined,'g-seat-portrait'),copy=node('div',undefined,'g-seat-profile-copy'),heading=node('div',undefined,'g-seat-profile-heading'),edit=node('label',undefined,'g-seat-role-edit'),roleName=node('span'),team=node('span',undefined,'g-seat-team'),select=node('select'),advice=node('a','↗ 游戏建议','g-seat-advice'),ability=node('p',undefined,'g-seat-ability');select.id='gSeatRole';select.setAttribute('aria-label','分配角色');select.append(new Option('未分配角色',''));state.script.roles.filter(r=>!['fabled','loric'].includes(r.team)).forEach(r=>select.append(new Option(r.name+' · '+teamNames[r.team],r.id)));const library=new Option('全部角色…','');library.dataset.roleLibrary='true';select.append(library);edit.append(roleName,team,node('span','✎','g-seat-pencil'),select);heading.append(edit,advice);copy.append(heading,ability);profile.append(portrait,copy);host.append(profile);
   const status=node('details',undefined,'g-seat-status'),statusTitle=node('summary'),statusRow=node('div',undefined,'g-seat-status-tools'),life=button('',()=>{if(apply({type:'life',seatId:id,alive:!current().alive}))refresh();},'subtle'),vote=button('',()=>{if(apply({type:'vote',seatId:id,available:!current().ghostVote}))refresh();},'subtle'),alignment=node('select');life.id='gSeatLife';vote.id='gSeatVote';status.id='gSeatStatus';for(const [v,t]of [['unknown','不标记'],['good','善良'],['evil','邪恶']])alignment.append(new Option(t,v));alignment.id='gSeatAlignment';alignment.onchange=()=>{if(apply({type:'alignment',seatId:id,alignment:alignment.value}))refresh();};statusRow.append(life,vote,field('私密阵营',alignment));status.append(statusTitle,statusRow);host.append(status);
   const reminderSection=node('section',undefined,'g-seat-reminder-section'),reminderList=node('div',undefined,'g-seat-reminder-list'),add=button('+ 添加标记',()=>markers.picker(id,()=>{seatPanel(id);$('gSeatReminderAdd')?.focus({preventScroll:true});}),'g-seat-add-marker');reminderList.id='gSeatReminders';add.id='gSeatReminderAdd';reminderSection.append(node('h3','提示标记'),reminderList,add);host.append(reminderSection);
   function reminders(){const p=current();reminderList.replaceChildren();p.reminders.forEach((t,index)=>reminderList.append(markers.control(id,index,{prefix:'gSeatReminder',refresh:reminders})));add.disabled=p.reminders.length>=20;}
   const noteSection=node('section',undefined,'g-seat-note-section'),noteHeading=node('h3'),form=node('form',undefined,'g-seat-note-form'),text=node('textarea'),tools=node('div',undefined,'g-seat-note-tools'),saveStatus=node('span',undefined,'g-seat-note-status'),entries=node('ol',undefined,'g-seat-note-list');text.id='gSeatNoteText';text.maxLength=2000;text.value=p.noteDraft;text.rows=2;text.placeholder='记一条（'+phaseLabel()+'）…只点标签不打字也能存';text.setAttribute('aria-label','此玩家的私密笔记');saveStatus.id='gSeatNoteStatus';saveStatus.setAttribute('role','status');text.setAttribute('aria-describedby',saveStatus.id);
   const record=button('✓ 记下',undefined,'g-seat-note-record');record.id='gSeatNoteSave';record.type='submit';
   const updateDraft=()=>{if(apply({type:'seatNoteDraft',seatId:id,text:text.value})){record.disabled=!text.value.trim()||current().notes.length>=100;saveStatus.textContent=dirty?'未保存，请备份':'草稿已保存';}};text.oninput=updateDraft;
   const insert=(value,selection)=>{const start=text.selectionStart,end=text.selectionEnd;if(text.value.length-(end-start)+value.length>text.maxLength){toast('每条笔记最多 2000 字。');return;}text.setRangeText(value,start,end,'end');text.focus({preventScroll:true});if(selection!==undefined)text.setSelectionRange(start+selection,start+value.length);updateDraft();};
   const phase=button(state.phase==='setup'?'准备':phaseLabel().replace(/ /g,''),()=>insert('【'+phaseLabel()+'】'),'g-seat-note-chip'),tag=button('+ 标签',()=>insert('#标签 ',1),'g-seat-note-chip'),goal=button('+ 目标',()=>insert('☐ 目标',2),'g-seat-note-chip');phase.id='gSeatNotePhase';tag.id='gSeatNoteTag';goal.id='gSeatNoteGoal';tools.append(phase,tag,goal,saveStatus,record);form.append(text,tools);form.onsubmit=e=>{e.preventDefault();if(!text.value.trim())return;if(apply({type:'seatNoteAdd',seatId:id,text:text.value})){text.value='';drawNotes();saveStatus.textContent=dirty?'未保存，请备份':'已记下';text.focus({preventScroll:true});}};noteSection.append(noteHeading,form,entries);host.append(noteSection);
   function drawNotes(){const p=current();noteHeading.textContent='笔记与行动 · '+p.notes.length;record.disabled=!text.value.trim()||p.notes.length>=100;entries.replaceChildren();p.notes.forEach((n,index)=>{const item=node('li'),remove=button('×',()=>{if(apply({type:'seatNoteRemove',seatId:id,index}))drawNotes();},'g-seat-note-remove');remove.setAttribute('aria-label','删除第 '+(index+1)+' 条笔记');item.append(node('small',phaseLabel(n)),node('p',n.text),remove);entries.append(item);});}
   const swapForm=node('div',undefined,'g-seat-swap-form'),target=node('select');swapForm.hidden=true;target.id='gSeatSwapTarget';state.seats.forEach((p,index)=>{if(p.id!==id)target.append(new Option((index+1)+'号 · '+(p.name||'未命名'),p.id));});const exchange=button('确认换座',()=>{if(apply({type:'swap',seatId:id,otherSeatId:target.value}))seatPanel(id);},'subtle');exchange.id='gSeatSwapConfirm';swapForm.append(field('与此玩家交换座位',target),exchange);host.append(swapForm);
   const actions=node('div',undefined,'g-seat-actions'),clear=button('移除角色',()=>{if(apply({type:'assign',seatId:id,roleId:''})){refresh();reminders();}},'g-seat-clear-role'),swap=button('⇆ 换座',()=>{swapForm.hidden=!swapForm.hidden;swap.setAttribute('aria-expanded',String(!swapForm.hidden));if(!swapForm.hidden)target.focus();}),remove=button('移除座位',()=>{const p=current(),index=state.seats.indexOf(p);if(!confirm('移除 '+(index+1)+'号'+(p.name?' '+p.name:'')+' 的座位及其身份、标记和笔记？可在菜单撤销。'))return;if(apply({type:'seatRemove',seatId:id,force:true})){close();$('gSeatLabel_'+state.seats[Math.min(index,state.seats.length-1)].id)?.focus({preventScroll:true});}},'danger');clear.id='gSeatClearRole';swap.id='gSeatSwap';swap.setAttribute('aria-expanded','false');remove.id='gSeatRemove';remove.disabled=state.seats.length<=5;if(remove.disabled)remove.title='至少保留 5 个座位';actions.append(clear,swap,remove);host.append(actions);
   function refresh(){const p=current(),r=roleOf(p);select.value=p.roleId;roleName.textContent=r?.name||'未分配角色';team.textContent=r?teamNames[r.team]:'';edit.className='g-seat-role-edit '+(r?.team||'');ability.textContent=r?.ability||'点击角色名称，为此玩家分配角色。';portrait.replaceChildren();const token=node('span',undefined,'g-token'+(r?' '+r.team:''));if(r){token.append(image(r),roleLabel(r.name));decorateToken(token,r);}portrait.append(token);portrait.classList.toggle('dead',!p.alive);const wiki=C.wikiPage(r);advice.hidden=!wiki;if(!advice.hidden){advice.href=wiki;advice.target='_blank';advice.rel='noopener';}else advice.removeAttribute('href');life.textContent=p.alive?'标记死亡':'恢复存活';vote.textContent=p.ghostVote?'使用投票标记':'恢复投票标记';vote.disabled=p.alive;alignment.value=p.alignment;statusTitle.textContent='状态设置 · '+(p.alive?'存活':p.ghostVote?'死亡 · 有票':'死亡 · 无票')+(p.alignment!=='unknown'?' · '+(p.alignment==='good'?'善良':'邪恶'):'');clear.disabled=!p.roleId;}
   select.onchange=()=>{if(select.selectedOptions[0]?.dataset.roleLibrary){select.value=current().roleId;aux.seatRole(id,()=>seatPanel(id),true);return;}if(select.value===current().roleId)return;if(apply({type:'assign',seatId:id,roleId:select.value})){refresh();reminders();}};refresh();reminders();drawNotes();
  });dialog.classList.add('g-seat-dialog');$('gDialogClose').textContent='×';$('gSeatName').focus({preventScroll:true});
 }
 function newScript(script){return replace(G.create(script,state.seats.length));}
 function scriptPanel(event){
  if(playerView)return;
  if(!scriptPicker)scriptPicker=root.GrimoireScripts.create({C,G,$,node,button,open,dialog,fetchJSON,newScript,getState:()=>state,getRevision:()=>modalRevision,toast,onViewChange:element=>{cancelMotion(body);contentArrive(element);}});
  scriptPicker.open(event?.currentTarget?.id==='gSummaryLogo'?$('gSummaryLogo'):$('gScript'));
 }
 async function fetchJSON(path){const url=new URL(path,document.baseURI);if(url.origin!==location.origin)throw Error('不支持站外数据地址');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(root.WikiCache?root.WikiCache.asset(url.href):url.href,{signal:controller.signal});if(!r.ok)throw Error('请求失败（'+r.status+'）');const text=await r.text();if(text.length>8*1024*1024)throw Error('资料超过 8 MB');return JSON.parse(text);}finally{clearTimeout(timer);}}
 function offlineFingerprint(s=state){return JSON.stringify([s.revision,s.updatedAt,s.seats.map(p=>[p.id,p.roleId])]);}
 function writeOfflineDraw(value){root.sessionStorage.setItem(offlineDrawKey,JSON.stringify(value));}
 function beginOfflineDraw(action){
  if(playerView||offlineDraw)return;
  try{
   if(!save())throw Error('请先处理对局保存问题，再开始抽取。');
   const next=G.reduce(state,action,random),session={version:1,fingerprint:offlineFingerprint(next),cursor:0};
   // Save progress first; a failed game write leaves a mismatched session that cannot reveal roles.
   writeOfflineDraw(session);try{store.save(next);}catch(e){try{root.sessionStorage.removeItem(offlineDrawKey);}catch{}throw e;}remember('distribute');state=next;dirty=false;
   setPlayerView(true);offlineDraw=session;showOfflineDraw();
  }catch(e){error('无法开始线下抽取：'+e.message);}
 }
 function finishOfflineDraw(){
  if(!offlineDraw)return;
  showOfflineDraw();
  if(!confirm('请确认设备已交回说书人。结束本次抽取并返回魔典？已分配的角色会保留。'))return;
  try{root.sessionStorage.removeItem(offlineDrawKey);}catch(e){error('进度清理失败，请重试：'+e.message);return;}
  offlineDraw=null;offlineRevealed=false;body.replaceChildren();dialog.close();setPlayerView(false);
 }
 function showOfflineDraw(reveal=false){
  if(!offlineDraw)return;offlineRevealed=reveal;const cursor=offlineDraw.cursor,previous=Math.min(cursor,offlineMotionCursor),seat=state.seats[cursor],role=seat&&roleOf(seat);offlineMotionCursor=cursor;
  open('线下抽取角色',host=>{
   const screen=node('section',undefined,'g-offline-screen'),progress=node('p',cursor<state.seats.length?'已完成 '+cursor+' / '+state.seats.length+' 人':'全部玩家已查看身份','g-offline-progress');progress.setAttribute('role','status');
   const track=node('div',undefined,'g-offline-track'),bar=node('span');track.setAttribute('role','progressbar');track.setAttribute('aria-label','身份抽取进度');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(state.seats.length));track.setAttribute('aria-valuenow',String(cursor));bar.style.transform='scaleX('+(cursor/state.seats.length)+')';track.append(bar);
   screen.append(progress,track,node('h2',seat?(reveal?'':'请交给 ')+(cursor+1)+'号'+(seat.name?' · '+seat.name:'')+(reveal?'的身份':''):'抽取完成'));
   if(seat&&reveal&&role){
    const token=node('span',undefined,'g-token '+role.team);token.append(image(role),roleLabel(role.name));decorateToken(token,role);
    const card=node('div',undefined,'g-offline-role');card.id='gOfflineRole';card.append(token,node('h3',role.name),node('p',teamNames[role.team],'g-offline-team'),node('p',role.ability||'能力文本尚未收录。','g-offline-ability'));screen.append(card);
    const cover=button('记住了，盖回',()=>{
     if(!offlineDraw||offlineDraw.cursor!==cursor||!offlineRevealed)return;
     const next={...offlineDraw,cursor:cursor+1};showOfflineDraw();
     try{writeOfflineDraw(next);offlineDraw=next;showOfflineDraw();}catch(e){error('抽取进度未保存，请重试查看并盖回：'+e.message);}
    },'primary');cover.id='gOfflineCover';screen.append(cover);
   }else if(seat){
    const back=node('span',undefined,'g-token g-offline-back');back.setAttribute('aria-hidden','true');back.append(node('span','?','g-question'));screen.append(back,hint('确认其他玩家看不到屏幕后，再查看自己的角色。'));
    const view=button('查看我的角色',()=>{if(offlineDraw?.cursor===cursor&&!offlineRevealed)showOfflineDraw(true);},'primary');view.id='gOfflineReveal';screen.append(view);
   }else screen.append(hint('请将设备交回说书人，由说书人返回魔典继续游戏。'));
   if(!reveal){const exit=button(seat?'交还说书人 · 结束抽取':'交还说书人 · 返回魔典',finishOfflineDraw,'subtle');exit.id='gOfflineExit';screen.append(exit);}
   host.append(screen);
  });dialog.classList.add('g-signal-dialog','g-signal-player','g-offline-draw');
  const token=body.querySelector(reveal?'#gOfflineRole .g-token':'.g-offline-back');if(token)playMotion(token,reveal?[{transform:'perspective(500px) rotateY(-70deg)'},{transform:'perspective(500px) rotateY(0deg)'}]:[{transform:'scale(.95)'},{transform:'scale(1)'}],{duration:reveal?240:180});
  if(cursor!==previous)playMotion(body.querySelector('.g-offline-track span'),[{transform:'scaleX('+(previous/state.seats.length)+')'},{transform:'scaleX('+(cursor/state.seats.length)+')'}],{duration:220});
  (reveal?$('gOfflineCover'):$('gOfflineReveal')||$('gOfflineExit'))?.focus({preventScroll:true});
 }
 function resumeOfflineDraw(){
  try{
   const raw=root.sessionStorage.getItem(offlineDrawKey);if(!raw)return;
   setPlayerView(true);const saved=JSON.parse(raw);
   if(saved?.version!==1||saved.fingerprint!==offlineFingerprint()||!Number.isInteger(saved.cursor)||saved.cursor<0||saved.cursor>state.seats.length||state.seats.some(p=>!roleOf(p))){root.sessionStorage.removeItem(offlineDrawKey);toast('抽取进度与当前对局不一致，已停止抽取并盖住身份。');return;}
   offlineDraw=saved;showOfflineDraw();
  }catch{toast('无法读取线下抽取进度，请交还说书人检查。');}
 }
 root.addEventListener('pagehide',()=>{if(offlineDraw)showOfflineDraw();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&offlineDraw)showOfflineDraw();});
 function distribution(offline=false){
  if(playerView)return;if(!dialog.open)$('gAssign').focus({preventScroll:true});open('为当前 '+state.seats.length+' 个玩家选择角色',host=>{
   let selected=[],all=false,feedback='';const teams=['townsfolk','outsider','minion','demon','traveller'],scriptMap=new Map(state.script.roles.map(r=>[r.id,r])),catalog=new Map(C.players().map(r=>[r.id,r]));for(const r of state.script.roles)catalog.set(r.id,r);
   const selectedSources=new Set(),players=[...catalog.values()].filter(r=>teams.includes(r.team)),info=new Map(players.map(r=>[r.id,C.roleInfo(r)]));
   const roles=()=>players.filter(r=>all?(!selectedSources.size||info.get(r.id).groups.some(key=>selectedSources.has(key))):scriptMap.has(r.id)||selected.includes(r.id));
   const tools=node('div',undefined,'g-bag-tools'),source=button('全角色库',()=>{all=!all;source.setAttribute('aria-pressed',String(all));source.textContent=all?'只用本剧本':'全角色库';sourceHint.textContent=all?'选中后加入本局；随机补齐使用当前来源范围。':'默认只用本剧本角色；已选的剧本外角色会保留。';feedback='';draw();},'subtle'),sourceHint=node('span','默认只用本剧本的角色。','g-bag-source-hint'),search=node('input');
   source.id='gBagSource';source.setAttribute('aria-pressed','false');search.type='search';search.id='gBagSearch';search.placeholder='搜索角色名或能力…';search.setAttribute('aria-label','搜索待分配角色');tools.append(source,sourceHint,search);
   const sources=node('div',undefined,'g-bag-sources g-role-source-filters'),sourceButtons=node('div',undefined,'g-role-source-buttons'),sourceAll=button('全部来源',()=>{selectedSources.clear();feedback='';draw();},'subtle');sourceAll.id='gBagSourceAll';sources.append(node('span','来源','g-role-filter-label'),sourceButtons);sourceButtons.append(sourceAll);for(const [key,label]of C.roleGroups()){const count=players.filter(r=>info.get(r.id).groups.includes(key)).length;if(!count)continue;const b=button(label+' '+count,()=>{if(selectedSources.has(key))selectedSources.delete(key);else selectedSources.add(key);feedback='';draw();},'subtle');b.dataset.roleSource=key;sourceButtons.append(b);}
   const preview=node('section',undefined,'g-bag-selected'),previewTitle=node('h3'),previewGrid=node('div',undefined,'g-bag-selected-grid');preview.id='gBagSelected';preview.setAttribute('aria-label','本轮选中角色');preview.append(previewTitle,previewGrid);
   const list=node('div',undefined,'g-bag-scroll'),empty=node('p','没有匹配的角色，请调整搜索或切换全角色库。','g-bag-empty'),footer=node('div',undefined,'g-bag-footer'),settings=node('div',undefined,'g-bag-settings'),duplicates=node('input'),duplicateLabel=node('label','允许重复角色','g-bag-duplicates');duplicates.type='checkbox';duplicates.id='gBagDuplicates';duplicateLabel.prepend(duplicates);
   const counter=node('span','','g-bag-total'),message=node('p','','g-bag-message'),clear=button('清空所有角色',()=>{selected=[];feedback='';refresh();},'subtle'),actions=node('div',undefined,'g-bag-actions');counter.id='gBagCount';counter.setAttribute('aria-live','polite');message.id='gBagMessage';message.setAttribute('role','status');clear.id='gBagClear';clear.title='仅清空本次待分配角色';
   const randomize=button('随机角色',()=>{try{const keep=selected.length===state.seats.length?selected.filter(id=>catalog.get(id).team==='traveller'):selected;selected=G.fillBag(players,keep,state.seats.length,{duplicates:duplicates.checked,candidateIds:roles().map(r=>r.id)},random);feedback='已按基础配置补齐，可继续手动调整。';refresh();}catch(e){feedback=e.message;refresh();}},'subtle');randomize.id='gBagRandom';
   const distributeSelected=drawOffline=>{if(!selected.length||drawOffline&&selected.length!==state.seats.length)return;const partial=selected.length<state.seats.length;if(state.seats.some(p=>p.roleId||p.reminders.length)&&!confirm('重新分配将替换所有座位的角色并清除提醒。'+(partial?'未选满的 '+(state.seats.length-selected.length)+' 个座位将留空。':'')+'继续？'))return;const extraRoles=[...new Set(selected)].filter(id=>!scriptMap.has(id)).map(id=>catalog.get(id)),action={type:'distribute',roleIds:selected,partial,extraRoles};if(drawOffline)beginOfflineDraw(action);else if(apply(action))close();};
   const commit=button('',()=>distributeSelected(false),'primary');commit.id='gDistribute';
   const offlineButton=button('线下抽取',()=>distributeSelected(true),offline===true?'primary':'subtle');offlineButton.id='gOfflineStart';offlineButton.title='选满人数后，同一设备依次查看身份；角色将随机分配到对应座位。';
   settings.append(duplicateLabel,counter,clear);actions.append(randomize,commit,offlineButton);footer.append(settings,actions,message);host.append(tools,sources,list,footer);
   const refresh=()=>{
    const focused=previewGrid.contains(document.activeElement)?document.activeElement.dataset.roleId:null;preview.hidden=!all||!selected.length;previewTitle.textContent='本轮选中 · '+selected.length+' 个';previewGrid.replaceChildren();for(const id of new Set(selected)){const r=catalog.get(id),n=selected.filter(value=>value===id).length,b=button('',()=>{selected.splice(selected.lastIndexOf(id),1);feedback='';refresh();},'g-bag-selected-role'),token=node('span',undefined,'g-token '+r.team),img=image(r);if(img.tagName==='IMG')img.loading='lazy';token.append(img,roleLabel(r.name));decorateToken(token,r);b.dataset.roleId=id;b.setAttribute('aria-label','移除一张'+r.name+'，已选 '+n+' 个');b.title='点击移除一张'+r.name; b.append(token,node('span','×'+n,'g-bag-quantity'));previewGrid.append(b);}if(focused){const next=[...previewGrid.children].find(b=>b.dataset.roleId===focused)||previewGrid.firstElementChild||source;next.focus({preventScroll:true});}
    const by=Object.fromEntries(teams.map(t=>[t,0]));for(const id of selected)by[catalog.get(id).team]++;const targets=G.distributionCounts(state.seats.length-by.traveller);
    for(const team of teams){const count=$('gBagCount_'+team);if(count){count.textContent=by[team]+(targets&&team!=='traveller'?'/'+targets[team]:'');count.setAttribute('aria-label',teamNames[team]+'已选 '+by[team]+(targets&&team!=='traveller'?'，基础配置 '+targets[team]:''));count.classList.toggle('is-over',!!targets&&team!=='traveller'&&by[team]>targets[team]);}}
    list.dataset.duplicates=String(duplicates.checked);
    for(const choice of list.querySelectorAll('.g-bag-choice')){const id=choice.dataset.roleId,n=selected.filter(value=>value===id).length,b=choice.querySelector('.g-role-option'),plus=choice.querySelector('.g-bag-plus');b.setAttribute('aria-pressed',String(n>0));b.setAttribute('aria-label',catalog.get(id).name+(n?'，已选 '+n+' 个':''));b.disabled=selected.length>=state.seats.length&&(duplicates.checked||!n);choice.classList.toggle('is-selected',n>0);choice.querySelector('.g-bag-quantity').textContent=n?'×'+n:'';choice.querySelector('.g-bag-minus').hidden=plus.hidden=!duplicates.checked||!n;plus.disabled=selected.length>=state.seats.length;}
    counter.textContent='已选 '+selected.length+' / '+state.seats.length;clear.disabled=!selected.length;commit.disabled=!selected.length;offlineButton.disabled=selected.length!==state.seats.length;commit.replaceChildren(menuIcon('shuffle'),node('span','随机分配 '+selected.length+' 个角色'));randomize.replaceChildren(menuIcon('dice'),node('span',selected.length===state.seats.length?'重新随机':selected.length?'随机补齐':'随机角色'));
    const setup=[...new Set(selected)].map(id=>catalog.get(id)).filter(r=>C.tokenMarks(r).setup);message.textContent=feedback||(setup.length?'含特殊初始设置：'+setup.map(r=>r.name).slice(0,4).join('、')+'，请核对配置。':'基础配比仅供参考，可按角色设置手动调整。')+(selected.length&&selected.length<state.seats.length?' 未选满的座位将留空。':'');
   };
   const draw=()=>{
    const top=list.scrollTop,q=search.value.trim().toLocaleLowerCase(),available=roles();sources.hidden=!all;sourceAll.setAttribute('aria-pressed',String(!selectedSources.size));for(const b of sourceButtons.querySelectorAll('[data-role-source]'))b.setAttribute('aria-pressed',String(selectedSources.has(b.dataset.roleSource)));list.replaceChildren(preview);let total=0;
    for(const team of teams){const matches=available.filter(r=>r.team===team&&(!q||(r.name+' '+r.ability).toLocaleLowerCase().includes(q)));if(!matches.length&&!(['townsfolk','outsider','minion','demon'].includes(team)&&!q))continue;total+=matches.length;
     const group=node('section',undefined,'g-bag-group '+team),heading=node('h3'),count=node('span','','g-bag-type-count'),grid=node('div',undefined,'g-bag-grid');count.id='gBagCount_'+team;heading.append(count,node('span',teamNames[team]));group.setAttribute('aria-label',teamNames[team]);
     for(const r of matches){const choice=node('div',undefined,'g-bag-choice'),b=button('',()=>{feedback='';const index=selected.indexOf(r.id);if(!duplicates.checked&&index>=0)selected.splice(index,1);else if(selected.length<state.seats.length)selected.push(r.id);refresh();},'g-role-option'),token=node('span',undefined,'g-token '+r.team),img=image(r);choice.dataset.roleId=r.id;b.dataset.roleId=r.id;if(img.tagName==='IMG')img.loading='lazy';token.append(img,roleLabel(r.name));decorateToken(token,r);b.title=r.name+'：'+r.ability;const quantity=node('span','','g-bag-quantity'),minus=button('−',()=>{const index=selected.lastIndexOf(r.id);if(index<0)return;selected.splice(index,1);feedback='';refresh();if(minus.hidden)b.focus({preventScroll:true});},'g-bag-minus'),plus=button('+',()=>{if(!duplicates.checked||selected.length>=state.seats.length)return;selected.push(r.id);feedback='';refresh();},'g-bag-plus');minus.setAttribute('aria-label','减少'+r.name+'的数量');plus.setAttribute('aria-label','增加'+r.name+'的数量');b.append(token,quantity);choice.append(b,minus,plus);grid.append(choice);}
     if(!matches.length)grid.append(node('p',all?'当前来源暂无此类角色':'本剧本暂无此类角色','g-bag-empty'));group.append(heading,grid);list.append(group);
    }
    empty.hidden=total>0;list.append(empty);refresh();list.scrollTop=top;
   };
   duplicates.onchange=()=>{if(!duplicates.checked)selected=[...new Set(selected)];feedback=duplicates.checked?'点击圆牌或 + 增加数量，点击 − 减少。':'';refresh();};search.oninput=()=>{draw();list.scrollTop=0;};draw();
  });dialog.classList.add('g-distribution-dialog');$('gDialogClose').textContent='×';if(offline===true)$('gDialogTitle').textContent='线下抽取 · 先选满 '+state.seats.length+' 个角色';
 }
 function clearSheetMode(){
  dialog.classList.remove('g-replay-dialog');
  dialog.classList.remove('g-background-dialog');
  dialog.classList.remove('g-offline-draw');
  signalReturn=null;
  if(dialog.classList.contains('g-seat-dialog'))$('gDialogTitle').textContent='座位';
  sheetRefresh=null;dialog.classList.remove('g-sheet-dialog','g-sheet-floating','g-night-dialog','g-menu-dialog','g-signal-dialog','g-signal-compose','g-signal-player','g-reminder-dialog','g-token-picker','g-seat-role-picker','g-bluff-reveal','g-distribution-dialog','g-script-dialog','g-seat-dialog','g-history-dialog');dialog.style.removeProperty('--sheet-left');dialog.style.removeProperty('--sheet-top');$('gDialogClose').textContent='关闭';
  const head=dialog.querySelector('.g-modal-head');head.onpointerdown=head.onpointermove=head.onpointerup=head.onpointercancel=head.onkeydown=null;head.removeAttribute('tabindex');head.removeAttribute('aria-label');
 }
 function activatePanel(panel){panelFront=panel;panel.style.zIndex=String(++panelLayer);}
 const panelResizers=new WeakMap();
 function panelViewport(){const v=root.visualViewport;if(root.matchMedia?.('(pointer:coarse)').matches&&v&&Math.abs(v.scale-1)<.01)return {top:v.offsetTop/scale(),bottom:(v.offsetTop+v.height)/scale(),height:v.height/scale()};return {top:0,bottom:uiHeight(),height:uiHeight()};}
 function updateVisibleViewport(){zoomViewport();const v=panelViewport();app.style.setProperty('--g-visible-height',v.height+'px');app.style.setProperty('--g-visible-top',v.top+'px');app.style.setProperty('--g-visible-bottom',Math.max(0,uiHeight()-v.bottom)+'px');fitFloatingPanel($('gNotesPanel'));for(const view of Object.values(sideViews))fitFloatingPanel(view.panel);schedulePosition();}
 function panelResize(panel,title,isFloating,clampPosition){
  const grip=button('',()=>{},'g-panel-resize');grip.id=panel.id+'Resize';grip.setAttribute('aria-label','调整'+title+'窗口大小，方向键调整宽高，Shift 加速');grip.title='拖动调整大小；方向键调整宽高，Shift 加速';panel.append(grip);
  let drag;
  const size=(width,height,left,top)=>{const maxWidth=Math.max(1,uiWidth()-left-6),maxHeight=Math.max(1,panelViewport().bottom-top-6);panel.style.setProperty('--float-width',Math.max(Math.min(260,maxWidth),Math.min(width,maxWidth))+'px');panel.style.setProperty('--float-height',Math.max(Math.min(220,maxHeight),Math.min(height,maxHeight))+'px');};
  const fit=()=>{if(!isFloating()||panel.hidden)return;const r=measure(panel);size(r.width,r.height,6,panelViewport().top+6);clampPosition(r.left,r.top);};panelResizers.set(panel,fit);
  grip.onpointerdown=e=>{if(!isFloating()||e.button!==0||e.isPrimary===false)return;const r=measure(panel);drag={id:e.pointerId,x:pointerX(e),y:pointerY(e),width:r.width,height:r.height,left:r.left,top:r.top};grip.setPointerCapture?.(e.pointerId);grip.focus({preventScroll:true});panel.classList.add('is-resizing');e.preventDefault();};
  grip.onpointermove=e=>{if(drag&&drag.id===e.pointerId&&isFloating())size(drag.width+pointerX(e)-drag.x,drag.height+pointerY(e)-drag.y,drag.left,drag.top);};
  const stop=()=>{drag=null;panel.classList.remove('is-resizing');};grip.onpointerup=grip.onpointercancel=grip.onlostpointercapture=stop;
  grip.onkeydown=e=>{if(!isFloating())return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();const r=measure(panel),step=e.shiftKey?40:10;size(r.width+delta[0]*step,r.height+delta[1]*step,r.left,r.top);};
 }
 function fitFloatingPanel(panel){panelResizers.get(panel)?.();}
 function closeSidePanel(view,clear=false){cancelMotion(view.body);view.panel.hidden=true;$(view.opener).setAttribute('aria-expanded','false');if(panelFront===view.panel)panelFront=null;if(clear){view.onClear?.();view.body.replaceChildren();view.refresh=null;view.floating=false;view.panel.classList.remove('g-sheet-floating');view.float.textContent='▱ 浮动';view.float.setAttribute('aria-pressed','false');view.head.removeAttribute('tabindex');}else $(view.opener).focus({preventScroll:true});positionSidePanels();}
 function clampSidePanel(view,x,y){const r=measure(view.panel),v=panelViewport();view.panel.style.setProperty('--sheet-left',Math.max(6,Math.min(x,Math.max(6,uiWidth()-r.width-6)))+'px');view.panel.style.setProperty('--sheet-top',Math.max(v.top+6,Math.min(y,v.bottom-r.height-6))+'px');}
 function positionSidePanels(){const roles=sideViews.roles,night=sideViews.night;if(roles)roles.panel.style.removeProperty('--side-width');if(night)night.panel.style.removeProperty('--side-right');if(roles&&!roles.panel.hidden&&!roles.floating&&night&&!night.panel.hidden&&!night.floating&&uiWidth()>=1100){const width=Math.min(660,Math.max(360,uiWidth()-(!$('gNotesPanel').hidden?380:6)-360-12-46));roles.panel.style.setProperty('--side-width',width+'px');night.panel.style.setProperty('--side-right',(46+width+12)+'px');}const dock=measure($('gDock'));for(const view of Object.values(sideViews)){view.panel.style.removeProperty('--side-bottom');if(view.panel.hidden||view.floating||$('gDock').hidden)continue;const r=measure(view.panel);if(r.left<dock.right&&r.right>dock.left)view.panel.style.setProperty('--side-bottom',Math.max(16,uiHeight()-dock.top+12)+'px');}} 
 function sidePanel(kind,title){
  if(dialog.open)close();let view=sideViews[kind];if(view&&!view.panel.hidden){if(panelFront!==view.panel){activatePanel(view.panel);return null;}closeSidePanel(view);return null;}
  if(!view){const night=kind==='night',review=kind==='review',prefix=review?'gReview':night?'gNight':'gSheet',panel=node('section',undefined,'g-dialog g-sheet-dialog g-side-panel g-glass-surface'+(night?' g-night-dialog':review?' g-review-panel':'')),head=node('div',undefined,'g-modal-head'),heading=node('h2'),content=node('div',undefined,'g-modal-body');view={panel,head,heading,body:content,opener:review?'gHistory':night?'gNight':'gSheet',floating:false,refresh:null};sideViews[kind]=view;panel.id=prefix+'Panel';heading.id=panel.id+'Title';panel.setAttribute('aria-labelledby',heading.id);panel.hidden=true;
   const float=button('▱ 浮动',()=>{const r=measure(panel);view.floating=!view.floating;panel.classList.toggle('g-sheet-floating',view.floating);if(view.floating){fitFloatingPanel(panel);clampSidePanel(view,r.left,r.top);head.tabIndex=0;head.setAttribute('aria-label','移动'+title+'面板，方向键调整位置');}else{head.removeAttribute('tabindex');head.removeAttribute('aria-label');}float.textContent=view.floating?'▱ 固定':'▱ 浮动';float.setAttribute('aria-pressed',String(view.floating));positionSidePanels();},'subtle');float.id=prefix+'Float';float.setAttribute('aria-pressed','false');view.float=float;
   const dismiss=button('×',()=>closeSidePanel(view),'subtle g-side-close');dismiss.id=prefix+'Close';dismiss.setAttribute('aria-label','关闭'+title+'面板');head.append(heading,float,dismiss);panel.append(head,content);panel.addEventListener('pointerdown',()=>activatePanel(panel));panelResize(panel,title,()=>view.floating,(x,y)=>clampSidePanel(view,x,y));app.append(panel);$(view.opener).setAttribute('aria-controls',panel.id);
   let drag;head.onpointerdown=e=>{if(!view.floating||e.button!==0||e.target.closest('button,a,input'))return;const r=measure(panel);drag={x:pointerX(e),y:pointerY(e),left:r.left,top:r.top};head.setPointerCapture?.(e.pointerId);e.preventDefault();};head.onpointermove=e=>{if(drag)clampSidePanel(view,drag.left+pointerX(e)-drag.x,drag.top+pointerY(e)-drag.y);};head.onpointerup=head.onpointercancel=()=>{drag=null;};head.onkeydown=e=>{if(!view.floating||e.target!==head)return;const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(delta){e.preventDefault();const r=measure(panel);clampSidePanel(view,r.left+delta[0],r.top+delta[1]);}};
  }
  view.panel.hidden=false;fitFloatingPanel(view.panel);view.heading.textContent=title;activatePanel(view.panel);$(view.opener).setAttribute('aria-expanded','true');positionSidePanels();if(view.refresh){view.refresh();return null;}return view;
 }
 function sheet(){
  const view=sidePanel('roles',playerView?'公开角色表':'剧本角色');if(!view)return;const {body}=view;
  view.refresh=()=>{
   const top=body.scrollTop,present=new Map();if(!playerView)state.seats.forEach(s=>{if(s.roleId)present.set(s.roleId,(present.get(s.roleId)||0)+1);});body.replaceChildren();
   const tools=node('div',undefined,'g-sheet-toolbar');if(!playerView){
    for(const [key,label]of [['dim','淡化不在场角色'],['hide','隐藏不在场角色']]){const input=node('input');input.type='checkbox';input.id=key==='dim'?'gSheetDim':'gSheetHide';input.checked=sheetOptions[key];input.onchange=()=>{sheetOptions[key]=input.checked;view.refresh();$(input.id)?.focus({preventScroll:true});};const l=field(label,input);l.className='g-sheet-check';tools.append(l);}
    const count=node('span','在场 '+state.seats.filter(s=>s.roleId).length,'g-sheet-count');count.title='已分配角色的座位数，包含已死亡玩家；重复角色按多个座位计数。';tools.append(count);
   }else tools.append(node('span',state.script.name+' · 完整公开角色表','g-sheet-count'));
   body.append(tools);
   if(state.script.rules){const rules=state.script.rules.split(/\n\s*\n/).filter(t=>t.trim()),box=node('section',undefined,'g-sheet-rules');box.append(node('h3','剧本额外规则 · '+rules.length));rules.forEach(t=>box.append(node('p',t)));body.append(box);}
   let shown=0;
   for(const [team,title]of Object.entries(teamNames)){
    const all=state.script.roles.filter(r=>r.team===team),roles=!playerView&&sheetOptions.hide?all.filter(r=>present.has(r.id)):all;if(!roles.length)continue;shown+=roles.length;
    const group=node('section',undefined,'g-sheet-group '+team),number=roles.length===all.length?String(all.length):roles.length+' / '+all.length;group.append(node('h3',title+' · '+number));const grid=node('div',undefined,'g-sheet-grid');
    roles.forEach(r=>{const inPlay=!playerView&&present.has(r.id),card=node('article',undefined,'g-sheet-role'+(!playerView&&sheetOptions.dim&&!inPlay?' is-absent':'')),icon=roleWikiIcon(r,'g-sheet-icon'),copy=node('div',undefined,'g-sheet-copy'),heading=node('div',undefined,'g-sheet-role-heading');card.dataset.roleId=r.id;heading.append(node('strong',r.name));if(inPlay)heading.append(node('span',present.get(r.id)>1?'在场 ×'+present.get(r.id):'在场','g-sheet-inplay'));copy.append(heading,node('p',r.ability||'能力文本尚未收录。'));card.append(icon,copy);grid.append(card);});group.append(grid);body.append(group);
   }
   if(!shown)body.append(hint('还没有分配角色，取消“隐藏不在场角色”可查看完整剧本。'));body.scrollTop=top;
  };view.refresh();
 }
 function fabled(){aux.toggleLegend();}
 function resizeSeats(n){if(playerView||n<5||n>30)return;const removed=state.seats.slice(n),force=n<state.seats.length&&removed.some(x=>x.name||x.roleId||x.reminders.length||x.notes.length||x.noteDraft);if(force&&!confirm('将移除末尾 '+removed.length+' 个座位及其资料，建议先备份。继续？'))return;if(apply({type:'resize',count:n,force})&&compactSeats()){listMode=true;render();}}
 function nightPanel(){
  if(playerView)return;const view=sidePanel('night','行动顺序');if(!view)return;const {body}=view;
  let first=state.round<=1,all=false,lastRound=state.round,follow=true;
  view.refresh=()=>{
   if(playerView)return;const top=body.scrollTop,hasRoles=state.seats.some(s=>s.roleId);if(!hasRoles)all=true;if(follow&&lastRound!==state.round)first=state.round<=1;lastRound=state.round;body.replaceChildren();
   const tools=node('div',undefined,'g-night-toolbar');for(const [value,text,id]of [[true,'首个夜晚','gNightFirst'],[false,'其他夜晚','gNightOther']]){const b=button(text,()=>{first=value;follow=false;view.refresh();body.scrollTop=0;$(id)?.focus({preventScroll:true});},'subtle');b.id=id;b.setAttribute('aria-pressed',String(first===value));tools.append(b);}const scope=button(all?'只看在场':'看全剧本',()=>{all=!all;view.refresh();body.scrollTop=0;$('gNightAll')?.focus({preventScroll:true});},'subtle');scope.id='gNightAll';scope.disabled=!hasRoles;if(!hasRoles)scope.title='尚未分配角色，已自动显示全剧本';scope.setAttribute('aria-pressed',String(all));tools.append(scope);body.append(tools);
   const queue=G.nightActions(state,{first,all}),summary=node('p',(first?'首夜':'其他夜晚')+' · '+(all?'全剧本':'在场')+' '+queue.length+' 项'+(!hasRoles?' · 尚未分配角色':''),'g-night-summary');body.append(summary);
   if(!queue.length)body.append(hint(all?'本剧本在这个夜晚没有已收录的角色行动。':'这个夜晚还没有已分配的角色行动，可点“看全剧本”预览，或先给玩家分配角色。'));
   const list=node('ol',undefined,'g-night-list');queue.forEach(({seat,seats,role,reminder,order},i)=>{
    const dead=seats.length>0&&seats.every(s=>!s.alive),card=node('li',undefined,'g-night-item g-night-step '+role.team+(dead?' dead':'')),number=node('span',String(i+1),'g-night-number'),icon=roleWikiIcon(role,'g-night-icon'),copy=node('div',undefined,'g-night-copy'),heading=node('div',undefined,'g-night-heading'),players=node('span',undefined,'g-night-seats');card.dataset.roleId=role.id;card.dataset.order=String(order);if(seat)card.dataset.seatId=seat.id;number.setAttribute('aria-label','第 '+(i+1)+' 项');number.title='夜序值 '+order;if(!seats.length)players.textContent='不在场';seats.forEach((p,index)=>{if(index)players.append(document.createTextNode('、'));const name=node('span',(state.seats.findIndex(s=>s.id===p.id)+1)+'号'+(!p.alive?'（已死亡）':''),'g-night-player'+(!p.alive?' dead':''));name.dataset.seatId=p.id;players.append(name);});heading.append(node('strong',role.name),players);copy.append(heading,node('p',reminder||'唤醒提示尚未收录。能力参考：'+role.ability,'g-night-reminder'));card.append(number,icon,copy);list.append(card);
   });body.append(list);const note=node('details',undefined,'g-night-note');note.append(node('summary','夜序使用说明'),hint('按剧本已收录的夜序排列；死亡、醉酒或中毒不会自动排除行动，由说书人判断是否执行。不含爪牙互认等完整阶段步骤。列表仅供查看，不修改对局；尚未分配角色时自动显示全剧本。'));body.append(note);body.scrollTop=top;
  };view.refresh();
 }
 function closeNotes(clear=false){
  const panel=$('gNotesPanel');panel.hidden=true;if(panelFront===panel)panelFront=null;positionSidePanels();$('gNotes').setAttribute('aria-expanded','false');
  if(clear){panel.replaceChildren();panel.classList.remove('is-floating');panel.style.removeProperty('--notes-left');panel.style.removeProperty('--notes-top');notesRefresh=null;notesFloating=false;}else $('gNotes').focus({preventScroll:true});
 }
 function clampNotes(x,y){
  const panel=$('gNotesPanel'),r=measure(panel),v=panelViewport();panel.style.setProperty('--notes-left',Math.max(6,Math.min(x,Math.max(6,uiWidth()-r.width-6)))+'px');panel.style.setProperty('--notes-top',Math.max(v.top+6,Math.min(y,v.bottom-r.height-6))+'px');
 }
 function notes(){
  if(playerView)return;if(dialog.open)close();const panel=$('gNotesPanel');if(!panel.hidden){if(panelFront!==panel){activatePanel(panel);return;}closeNotes();return;}panel.hidden=false;activatePanel(panel);positionSidePanels();fitFloatingPanel(panel);$('gNotes').setAttribute('aria-expanded','true');if(notesRefresh){notesRefresh();return;}
  const head=node('div',undefined,'g-notes-head'),title=node('h2','全局笔记');title.id='gNotesTitle';
  const float=button('▱ 浮动',()=>{const r=measure(panel);notesFloating=!notesFloating;panel.classList.toggle('is-floating',notesFloating);if(notesFloating){fitFloatingPanel(panel);clampNotes(r.left,r.top);head.tabIndex=0;head.setAttribute('aria-label','移动笔记面板，方向键调整位置');}else{head.removeAttribute('tabindex');head.removeAttribute('aria-label');}float.textContent=notesFloating?'▱ 固定':'▱ 浮动';float.setAttribute('aria-pressed',String(notesFloating));},'g-notes-float');float.id='gNotesFloat';float.setAttribute('aria-pressed','false');float.setAttribute('aria-label','切换笔记面板拖动模式');
  const dismiss=button('×',()=>closeNotes(),'g-notes-close');dismiss.id='gNotesClose';dismiss.setAttribute('aria-label','关闭笔记');head.append(title,float,dismiss);
  let drag;head.onpointerdown=e=>{if(!notesFloating||e.button!==0||e.target.closest('button'))return;const r=measure(panel);drag={x:pointerX(e),y:pointerY(e),left:r.left,top:r.top};head.setPointerCapture?.(e.pointerId);e.preventDefault();};head.onpointermove=e=>{if(drag)clampNotes(drag.left+pointerX(e)-drag.x,drag.top+pointerY(e)-drag.y);};head.onpointerup=head.onpointercancel=()=>{drag=null;};head.onkeydown=e=>{if(!notesFloating||e.target!==head)return;const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(delta){e.preventDefault();const r=measure(panel);clampNotes(r.left+delta[0],r.top+delta[1]);}};
  const text=node('textarea',undefined,'g-notes-editor'),footer=node('div',undefined,'g-notes-footer'),tools=node('div',undefined,'g-notes-tools'),status=node('span',undefined,'g-notes-status'),count=node('span',undefined,'g-notes-count');let cleared='';
  text.id='gNotesText';text.value=state.notes;text.maxLength=8000;text.setAttribute('aria-label','说书人私密笔记');text.setAttribute('aria-describedby','gNotesStatus gNotesCount');text.placeholder='随手记录本局线索、计划和待办。\n\n例如：\n· 第 2 夜，3 号保护了 7 号\n· 5 号的报数和 4 号对不上\n· 今晚投票需要提醒谁\n\n笔记仅供说书人查看，随对局自动保存。';
  status.id='gNotesStatus';status.setAttribute('role','status');count.id='gNotesCount';
  const persist=()=>{apply({type:'notes',text:text.value});};text.oninput=persist;
  function insert(value,line=false,selectFrom){
   const start=text.selectionStart,end=text.selectionEnd,prefix=line&&start>0&&text.value[start-1]!=='\n'?'\n':!line&&value.startsWith('#')&&start>0&&!/\s/.test(text.value[start-1])?' ':'',snippet=prefix+value+(line?'\n':'');
   if(text.value.length-(end-start)+snippet.length>text.maxLength){toast('笔记最多 8000 字，请先删减内容。');return;}
   text.setRangeText(snippet,start,end,'end');text.focus({preventScroll:true});if(selectFrom!==undefined)text.setSelectionRange(start+prefix.length+selectFrom,start+prefix.length+value.trimEnd().length);persist();
  }
  const phase=button('',()=>insert('【'+phaseLabel()+'】',true),'g-notes-chip');phase.id='gNotesPhase';phase.title='在光标处插入当前昼夜';
  const tag=button('+ 标签',()=>insert('#标签 ',false,1),'g-notes-chip');tag.id='gNotesTag';
  const goal=button('+ 目标',()=>insert('☐ 目标',true,2),'g-notes-chip');goal.id='gNotesGoal';
  const restore=button('撤销清空',()=>{const value=cleared;cleared='';lastEdit='';text.value=value;persist();text.focus({preventScroll:true});},'g-notes-chip');restore.id='gNotesUndoClear';restore.hidden=true;
  const clear=button('',()=>{if(!text.value||!confirm('清空本局全部笔记？清空后可在此面板撤销。'))return;cleared=text.value;lastEdit='';text.value='';persist();text.focus({preventScroll:true});},'g-notes-clear');clear.id='gNotesClear';clear.title='清空全部笔记';clear.setAttribute('aria-label','清空全部笔记');clear.append(menuIcon('trash'));
  tools.append(phase,tag,goal,restore,clear);footer.append(tools,status,count);panel.append(head,text,footer);panelResize(panel,'笔记',()=>notesFloating,clampNotes);panel.onpointerdown=()=>activatePanel(panel);
  notesRefresh=()=>{if(text.value!==state.notes){const scroll=text.scrollTop,start=text.selectionStart,end=text.selectionEnd;text.value=state.notes;text.setSelectionRange(Math.min(start,text.value.length),Math.min(end,text.value.length));text.scrollTop=scroll;}phase.textContent=phaseLabel().replace(/ /g,'');const message=dirty?'未保存，请备份当前对局':'已自动保存在此设备';if(status.textContent!==message)status.textContent=message;status.classList.toggle('is-unsaved',dirty);count.textContent=text.value.length+' / 8000';clear.disabled=!text.value;restore.hidden=!cleared||!!text.value;};notesRefresh();
 }

 function bluffs(){aux.toggleBluffs();}
 function history(){if(playerView)return;open('本局操作记录',host=>{const list=node('ol',undefined,'g-history');if(!state.history.length)host.append(hint('开始操作后会记录最近 200 项变化。'));state.history.slice().reverse().forEach(e=>{const item=node('li',e.text);item.append(node('small',new Date(e.at).toLocaleTimeString('zh-CN')+' · '+(e.phase==='setup'?'准备中':'第 '+e.round+(e.phase==='night'?' 夜':' 天'))));list.append(item);});host.append(list);});dialog.classList.add('g-history-dialog');}
 function menuIcon(kind){
  const paths={userMinus:'M12 7a3 3 0 1 1-6 0a3 3 0 0 1 6 0 M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2 M16 11h6',userPlus:'M12 7a3 3 0 1 1-6 0a3 3 0 0 1 6 0 M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2 M16 11h6 M19 8v6',trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0',shuffle:'M3 5h3l12 14h3 M17 15l4 4-4 4 M3 19h3l4-5 M14 9l4-4h3 M17 1l4 4-4 4',book:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z M12 6v16',moon:'M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5',note:'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',save:'M3 3h15l3 3v15H3z M7 3v6h9V3 M7 21v-8h10v8',upload:'M4 16v5h16v-5 M12 17V3 M6 9l6-6 6 6',undo:'M3 10h11a6 6 0 0 1 0 12 M3 10l6-6 M3 10l6 6',clock:'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0 M12 6v6l4 2',home:'M3 11l9-8 9 8 M5 9v12h14V9 M9 21v-7h6v7',help:'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0 M9 9a3 3 0 1 1 5 2l-2 2 M12 17h.01',expand:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5',crown:'M3 6l4 4 5-7 5 7 4-4-2 13H5z',flag:'M5 22V3 M5 3h14l-3 5 3 5H5',trash:'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7'};
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');path.setAttribute('d',kind==='dice'?'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M7 7h.01 M17 7h.01 M12 12h.01 M7 17h.01 M17 17h.01':paths[kind]||paths.book);svg.append(path);return svg;
 }
 function menuItem(text,click,icon='book',id){const b=button('',click,'g-menu-item');b.append(menuIcon(icon),node('span',text,'g-menu-label'));b.setAttribute('aria-label',text);if(id)b.id=id;return b;}
 function setLayout(value){if(playerView)return;layoutExplicit=true;listMode=['single','double'].includes(value);if(listMode)listColumns=value==='single'?1:2;else tableShape=value;render();settleBoard();saveDisplayPreferences();$('gMenuLayout_'+value)?.focus({preventScroll:true});}
 function resetFreePositions(){if(playerView||!isFreeLayout())return;freePositions=[];render();settleBoard();saveDisplayPreferences();$('gMenuFreeReset')?.focus({preventScroll:true});toast('座位位置已重置，可继续自由拖动。');}
 function shortcut(e){
  if(e.defaultPrevented||e.repeat||e.isComposing||e.keyCode===229||e.ctrlKey||e.altKey||e.metaKey||dialog.open)return;
  const editing='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]';if(e.target?.closest?.(editing)||document.activeElement?.closest?.(editing))return;
  const id={t:'gPlayerView',n:'gAdvance',c:'gSheet',o:'gNight'}[e.key?.toLowerCase()],control=id&&$(id);if(!control||control.hidden||control.disabled)return;
  e.preventDefault();hideRoleTooltip();cancelNameClick();control.click();
 }
 function isFullscreen(){return !!(document.fullscreenElement||document.webkitFullscreenElement||document.webkitIsFullScreen);}
 function syncFullscreenControl(){
  const control=$('gMenuFullscreen');if(control){const active=isFullscreen(),label=active?'退出全屏':'进入全屏';control.querySelector('.g-menu-label').textContent=label;control.setAttribute('aria-label',label);control.setAttribute('aria-pressed',String(active));control.disabled=fullscreenBusy;}
 }
 let fullscreenWasActive=false;
 function fullscreenChanged(){const active=isFullscreen();syncFullscreenControl();zoomViewport();schedulePosition();if(active!==fullscreenWasActive){fullscreenWasActive=active;settleBoard();}}
 function fullscreenFailed(exiting=false){toast(exiting?'退出全屏未成功，可按 Esc 后重试。':document.fullscreenEnabled===false?'当前页面未获准全屏，请在独立浏览器标签页打开魔典，或尝试按 F11。':'全屏请求未成功，请重试，或尝试按 F11。');}
 for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,fullscreenChanged);
 for(const event of ['fullscreenerror','webkitfullscreenerror'])document.addEventListener(event,()=>{fullscreenBusy=false;syncFullscreenControl();fullscreenFailed();});
 async function fullscreen(){
  if(fullscreenBusy)return;
  const exiting=isFullscreen(),target=exiting?document:app,legacyExit=document.webkitExitFullscreen||document.webkitCancelFullScreen,method=exiting?(document.fullscreenElement?(document.exitFullscreen||legacyExit):(legacyExit||document.exitFullscreen)):(app.requestFullscreen||app.webkitRequestFullscreen||app.webkitRequestFullScreen);
  if(!method){toast('此浏览器不支持网页全屏，电脑可尝试按 F11。');return;}
  fullscreenBusy=true;syncFullscreenControl();
  // Dismiss the modal synchronously and request fullscreen in the same user gesture.
  if(dialog.open&&dialog.classList.contains('g-menu-dialog'))close();
  try{await method.call(target);}
  catch{fullscreenFailed(exiting);}
  finally{fullscreenBusy=false;fullscreenChanged();}
 }
 function signal(text,team='neutral'){
  if(playerView)return;open('游戏指示',host=>{const display=node('div',undefined,'g-signal-display '+team);display.append(menuIcon(team==='neutral'?'eye':'flag'),node('strong',text),node('p','展示结束后，将设备交回说书人。'));host.append(display);});dialog.classList.add('g-signal-dialog');
 }
 const signalLabels=['你是','这名玩家是','展示角色','你需要对这个角色疯狂','这些角色不在场','这些角色在场','他是恶魔','他们是你的爪牙','他是爪牙','你的阵营是善良','你的阵营是邪恶','镇民','外来者','爪牙','该角色的能力对你生效','这名玩家选择了你','你今天提名了吗？','你今天投票了吗？','是','否','错误','无'];
 function signalToken(role){const token=node('span',undefined,'g-token'+(role?' '+role.team:' g-signal-empty'));if(role){token.append(image(role),roleLabel(role.name));decorateToken(token,role);}else token.append(node('span','+'));return token;}
 function signalPanel(draft={label:'你是',custom:'',roles:['','','']}){
  if(playerView)return;open('游戏指示',host=>{
   host.append(node('p','选一张信息标记，点「展示给玩家」后整屏会被卡面盖住，玩家看不到魔典。再点一下屏幕就退回来。','g-signal-help'));
   const grid=node('div',undefined,'g-signal-options');signalLabels.forEach(text=>{const b=button(text,()=>{draft.label=text;for(const other of grid.children)other.setAttribute('aria-pressed',String(other===b));},'g-signal-option');b.dataset.signalLabel=text;b.setAttribute('aria-pressed',String(draft.label===text));grid.append(b);});host.append(grid);
   const attached=node('section',undefined,'g-signal-attachments'),heading=node('h3'),slots=node('div',undefined,'g-signal-slots');attached.append(heading,slots);host.append(attached);
   const draw=()=>{heading.textContent='附带角色 · '+draft.roles.filter(Boolean).length+'/3';slots.replaceChildren();for(let slot=0;slot<3;slot++){const r=state.script.roles.find(r=>r.id===draft.roles[slot]),wrap=node('div',undefined,'g-signal-slot'),pick=button('',()=>signalRolePicker(draft,slot),'g-signal-role');pick.id='gSignalRole'+slot;pick.setAttribute('aria-label','第 '+(slot+1)+' 个附带角色'+(r?'：'+r.name:'：添加角色'));pick.append(signalToken(r));wrap.append(pick);if(r){const remove=button('×',()=>{draft.roles[slot]='';draw();$('gSignalRole'+slot)?.focus({preventScroll:true});},'g-signal-role-remove');remove.setAttribute('aria-label','移除第 '+(slot+1)+' 个附带角色');wrap.append(remove);}slots.append(wrap);}};draw();
   const custom=node('input');custom.id='gSignalCustom';custom.maxLength=200;custom.value=draft.custom;custom.placeholder='留空则用上面选的标记';custom.oninput=()=>{draft.custom=custom.value;};host.append(field('或者自己写一句',custom));
   const show=button('展示给玩家',()=>showSignal(draft),'g-signal-show');show.id='gSignalShow';host.append(show);
  });dialog.classList.add('g-signal-compose');$('gDialogClose').textContent='×';
 }
 function signalRolePicker(draft,slot){
  if(playerView)return;aux.picker('附带角色 · 第 '+(slot+1)+' 格',state.script.roles,Object.keys(teamNames),r=>{draft.roles[slot]=r.id;signalPanel(draft);$('gSignalRole'+slot)?.focus({preventScroll:true});},{selected:r=>draft.roles[slot]===r.id,tools:()=>{const row=node('div',undefined,'g-row'),back=button('‹ 返回游戏指示',()=>{signalPanel(draft);$('gSignalRole'+slot)?.focus({preventScroll:true});},'subtle');back.id='gSignalBack';row.append(back);return row;}});
 }
 function showSignal(draft){
  if(playerView)return;const text=draft.custom.trim()||draft.label,roles=draft.roles.map(id=>state.script.roles.find(r=>r.id===id)).filter(Boolean),back=()=>{signalPanel(draft);$('gSignalShow')?.focus({preventScroll:true});};let screen;
  open('游戏指示',host=>{screen=button('',back,'g-signal-screen');screen.id='gSignalScreen';screen.setAttribute('aria-label','展示信息：'+text+(roles.length?'；附带角色：'+roles.map(r=>r.name).join('、'):'')+'。点击返回游戏指示');screen.append(node('strong',text));if(roles.length){const list=node('span',undefined,'g-signal-player-roles');for(const role of roles)list.append(signalToken(role));screen.append(list);}screen.append(node('small','点击屏幕返回'));host.append(screen);});dialog.classList.add('g-signal-dialog','g-signal-player');signalReturn=back;screen.focus({preventScroll:true});
 }
 function menu(){
  if(playerView)return;if(dialog.open&&dialog.classList.contains('g-menu-dialog')){close();return;}open('菜单',()=>{});dialog.classList.add('g-sheet-dialog','g-menu-dialog');$('gDialogClose').textContent='×';
  sheetRefresh=()=>{
   const top=body.scrollTop;body.replaceChildren();const section=(title)=>{const box=node('section',undefined,'g-menu-section'),grid=node('div',undefined,'g-menu-grid');box.append(node('h3',title),grid);body.append(box);return grid;};
   const seats=section('座位'),step=node('div',undefined,'g-menu-stepper'),count=node('select');count.id='gSeatCount';count.setAttribute('aria-label','座位数量（5–30）');for(let n=5;n<=30;n++)count.append(new Option(n+' 人',String(n)));count.value=String(state.seats.length);const resize=n=>{resizeSeats(n);count.value=String(state.seats.length);$('gSeatCount')?.focus({preventScroll:true});};count.onchange=()=>resize(Number(count.value));const minus=button('',()=>resize(state.seats.length-1),'g-menu-step'),plus=button('',()=>resize(state.seats.length+1),'g-menu-step');minus.append(menuIcon('userMinus'));plus.append(menuIcon('userPlus'));minus.id='gMenuSeatMinus';plus.id='gMenuSeatPlus';minus.setAttribute('aria-label','减少一个座位');plus.setAttribute('aria-label','增加一个座位');minus.disabled=state.seats.length<=5;plus.disabled=state.seats.length>=30;step.append(minus,count,plus);seats.append(step,menuItem('打乱顺序',()=>{if(state.phase!=='setup'&&!confirm('将打乱座位顺序，保留每位玩家的角色、提醒和行动记录。继续？'))return;if(apply({type:'shuffleSeats'}))$('gMenuShuffle')?.focus({preventScroll:true});},'shuffle','gMenuShuffle'),menuItem('分配角色',distribution,'users'),menuItem('角色与规则',sheet,'book'));
   const offline=menuItem('线下抽取角色',()=>distribution(true),'users','gMenuOfflineDraw');offline.classList.add('g-menu-wide');seats.append(offline);
   const script=section('剧本'),card=menuItem(state.script.name,scriptPanel,'book','gMenuScript');card.classList.add('g-menu-script');const copy=card.querySelector('.g-menu-label');copy.replaceChildren(node('strong',state.script.name),node('small',(state.script.author||'未填写作者')+' · '+state.script.roles.length+' 个角色 · 点击更换或导入'));card.setAttribute('aria-label','选择或导入剧本');script.append(card);
   const tools=section('说书人工具');tools.append(menuItem('善良获胜',()=>signal('善良阵营获胜','good'),'flag'),menuItem('邪恶获胜',()=>signal('邪恶阵营获胜','evil'),'flag'),menuItem('游戏指示',()=>signalPanel(),'eye'),menuItem('夜晚行动顺序',nightPanel,'moon'),menuItem('私密笔记',notes,'note'),menuItem(isFullscreen()?'退出全屏':'进入全屏',fullscreen,'expand','gMenuFullscreen'));syncFullscreenControl();
   const layouts=section('布局'),active=listMode?(listColumns===1?'single':listColumns===2?'double':'auto'):tableShape;for(const [value,text]of [['circle','标准圆形'],['ellipse','椭圆布局'],['single','单列垂直'],['double','双列垂直'],['free','自由摆放']]){const b=menuItem(text,()=>setLayout(value),'grid','gMenuLayout_'+value);b.setAttribute('aria-pressed',String(active===value));if(value==='free')b.classList.add('g-menu-wide');layouts.append(b);}if(isFreeLayout()){const reset=menuItem('重置座位位置',resetFreePositions,'undo','gMenuFreeReset');reset.classList.add('g-menu-wide');layouts.append(reset);layouts.parentElement.append(node('p','拖动圆牌自由摆放，不交换玩家；方向键微调，Shift 加速。','g-menu-footnote'));}
   const backupGrid=section('对局与备份');backupGrid.append(menuItem('下载对局备份',()=>{backup();if($('gMenuBackupHint'))$('gMenuBackupHint').textContent='已发起下载，请确认文件保存成功。备份请仅交给说书人。';},'save','gMenuBackup'),menuItem('导入对局备份',restorePanel,'upload'),menuItem('对局列表与归档',gameLibraryPanel,'clock','gGameLibrary'));const back=menuItem('撤销上一步',()=>{if(!undo.length)return;const next=G.validate(JSON.parse(undo.pop()));if(next.gameId===state.gameId)next.nextSeatId=Math.max(next.nextSeatId,state.nextSeatId);state=next;dirty=true;save();render();close();},'undo');back.disabled=!undo.length;backupGrid.append(back,menuItem('操作记录',history,'clock'));const backupHint=hint('备份包含秘密身份和笔记，请仅交给说书人。');backupHint.classList.add('g-menu-footnote');backupHint.id='gMenuBackupHint';backupHint.setAttribute('aria-live','polite');backupGrid.parentElement.append(backupHint);
   const more=section('更多'),logo=menuItem('显示剧本图标',toggleScriptLogo,'book','gMenuScriptLogo');logo.classList.add('g-menu-wide');logo.setAttribute('aria-pressed',String(showScriptLogo));const logoCheck=node('span',showScriptLogo?'✓':'','g-menu-check');logoCheck.setAttribute('aria-hidden','true');logo.append(logoCheck);more.append(logo);const order=menuItem('在圆牌旁显示夜晚顺序',()=>{showNightOrder=!showNightOrder;render();$('gMenuNightOrder')?.focus({preventScroll:true});},'clock','gMenuNightOrder');order.classList.add('g-menu-wide');order.setAttribute('aria-pressed',String(showNightOrder));const check=node('span',showNightOrder?'✓':'','g-menu-check');check.setAttribute('aria-hidden','true');order.append(check);more.append(order);const special=menuItem('设置传奇 / 奇遇角色',()=>{close();aux.toggleLegend();},'crown'),bluff=menuItem('设置恶魔伪装',bluffs,'eye');for(const [b,n]of [[special,state.specials.length],[bluff,state.bluffs.filter(Boolean).length]]){const badge=node('small',String(n),'g-menu-count');badge.setAttribute('aria-hidden','true');b.append(badge);b.classList.add('g-menu-wide');}more.append(special,bluff);
   const zoom=node('div',undefined,'g-menu-zoom g-menu-wide'),zoomButtons=node('div',undefined,'g-menu-zoom-buttons'),zoomOut=button('−',()=>setPageZoom(pageZoom-5),'subtle'),zoomReset=button(pageZoom+'%',()=>setPageZoom(100),'subtle'),zoomIn=button('+',()=>setPageZoom(pageZoom+5),'subtle');zoomOut.id='gZoomOut';zoomReset.id='gZoomReset';zoomIn.id='gZoomIn';zoomOut.setAttribute('aria-label','缩小网页');zoomIn.setAttribute('aria-label','放大网页');zoomReset.title='恢复默认缩放 100%';zoomReset.setAttribute('aria-live','polite');zoomButtons.append(zoomOut,zoomReset,zoomIn);zoom.append(node('span','网页缩放'),zoomButtons);more.append(zoom);syncZoomControls();
   const background=menuItem('自定义背景',backgroundPanel,'eye','gMenuBackground');background.classList.add('g-menu-wide');more.append(background);
   const nav=section('资料导航');for(const [text,url,icon]of [['首页','../index.html','home'],['入门教程','../index.html#site-guide','help'],['角色库','../role_index/角色索引.html','users'],['剧本库','../script_lib/剧本库.html','book'],['规则速查','../pages/规则概要.html','note'],['关于本站','../about.html','help']]){const a=node('a',undefined,'g-button g-menu-item');a.href=url;a.target='_blank';a.rel='noopener';a.append(menuIcon(icon),node('span',text,'g-menu-label'));a.title='在新标签页打开';nav.append(a);}
   const reset=section('重新开局'),restart=menuItem('重新开始本剧本',()=>replace(G.create(state.script,state.seats.length)),'trash');restart.classList.add('danger','g-menu-wide');reset.append(restart);body.append(node('p',phaseLabel()+' · '+state.seats.length+' 人 · 保存在此设备','g-menu-footer'));body.scrollTop=top;
  };sheetRefresh();
 }
 function gameLibraryPanel(){
  if(playerView)return;open('对局列表与归档',host=>{
   let library;try{library=root.GrimoireArchive.open(root.localStorage);}catch(e){host.append(hint('对局库无法读取：'+e.message+'。当前对局仍可单独下载备份。'),button('下载当前对局备份',()=>backup(),'primary'),button('下载原始对局库',()=>{if(playerView)return;try{const raw=root.localStorage.getItem(root.GrimoireArchive.key);if(raw)download('在线魔典-原始对局库.json',raw);}catch(err){error(err.message);}},'subtle'));return;}
   const feedback=hint(''),tools=node('div',undefined,'g-game-library-tools'),list=node('div',undefined,'g-game-library');list.id='gGameList';feedback.id='gGameLibraryStatus';feedback.setAttribute('role','status');
   function run(task){if(playerView)return;try{task();feedback.textContent='已保存在此设备。浏览器清理数据会影响保留，请另行下载备份。';draw();}catch(e){feedback.textContent=e.message+'。原有对局未删除，请先下载备份。';}}
   const keep=button('保存当前对局到列表',()=>run(()=>library.save(state,'ongoing')),'primary'),archive=button('结束并归档当前对局',()=>{if(!confirm('将当前对局归档到本设备？魔典仍可继续查看，建议同时下载备份。'))return;run(()=>library.save(state,'archived'));},'subtle');keep.id='gGameKeep';archive.id='gGameArchive';tools.append(keep,archive,button('下载当前对局备份',()=>backup(),'subtle'));
   const meta=hint(backupStatus(state));meta.id='gGameBackupStatus';host.append(hint('对局列表仅保存在本设备。归档保留角色、阶段、复盘与笔记；对局备份文件也包含私密资料。'),meta,tools,feedback,list);
   function draw(){list.replaceChildren();const games=library.list();if(!games.length)list.append(hint('还没有保留的对局。先保存当前对局，或结束后归档。'));
    for(const item of games){const row=node('article',undefined,'g-game-library-row');row.dataset.gameId=item.id;row.append(node('h3',item.name),hint((item.status==='archived'?'已归档':'未结束')+' · '+item.count+' 人 · '+phaseLabel(item)+' · '+new Date(item.updatedAt).toLocaleString('zh-CN')));
     const preview=button('预览并恢复',()=>{if(playerView)return;try{const candidate=library.get(item.id);open('恢复已保留的对局',previewHost=>{previewHost.append(node('h3',candidate.script.name),hint(new Date(candidate.updatedAt).toLocaleString('zh-CN')+' · '+candidate.seats.length+' 人 · '+phaseLabel(candidate)+' · '+candidate.review.stages.reduce((n,x)=>n+x.entries.length,0)+' 条记录'),hint('当前魔典会先保留在本设备的对局列表。确认后恢复所选对局。'),button('确认恢复这个对局',()=>{try{replace(candidate,{preserveCurrent:true});}catch(e){error(e.message);}},'primary'));});}catch(e){feedback.textContent=e.message;}},'subtle');preview.dataset.gameRestore=item.id;
     const exportGame=button('下载备份',()=>{if(playerView)return;try{const value=library.get(item.id);download(value.script.name+'-对局备份.json',G.serialize(value));noteBackup(value);feedback.textContent='已发起备份下载，请确认文件已保存。';}catch(e){feedback.textContent=e.message;}},'subtle');exportGame.dataset.gameBackup=item.id;
     const remove=button('移出列表',()=>{if(!confirm('从本设备列表移除此对局？请先确认已经下载备份；当前魔典不受影响。'))return;run(()=>library.remove(item.id));},'subtle');remove.dataset.gameRemove=item.id;row.append(preview,exportGame,remove);list.append(row);
    }
   }draw();
  });
 }
 const backupReceiptKey='botc_grimoire_backup_receipt_v1';
 function noteBackup(value){try{root.localStorage.setItem(backupReceiptKey,JSON.stringify({gameId:value.gameId,revision:value.revision,at:Date.now()}));}catch{}}
 function backupStatus(value){let receipt;try{receipt=JSON.parse(root.localStorage.getItem(backupReceiptKey));}catch{}return receipt?.gameId===value.gameId&&receipt.revision===value.revision?'本版本已发起备份下载，请确认文件已保存。':'本版本尚无备份下载记录；自动保存仅在本设备。';}
 function restorePanel(){if(playerView)return;open('恢复魔典对局',host=>{const file=node('input');file.type='file';file.accept='.json,application/json';file.id='gRestoreFile';let candidate;const preview=node('p','','g-hint'),go=button('恢复这个对局',()=>{try{if(candidate)replace(candidate,{preserveCurrent:true});}catch(e){error(e.message);}},'primary');go.id='gRestoreCommit';go.disabled=true;
  file.onchange=async()=>{const rev=modalRevision;go.disabled=true;candidate=null;try{const f=file.files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('对局备份不能超过 8 MB');const text=await f.text(),s=G.validate(JSON.parse(text));if(rev!==modalRevision)return;candidate=s;preview.textContent=s.script.name+' · '+s.seats.length+' 个座位 · '+phaseLabel(s)+' · '+new Date(s.updatedAt).toLocaleString('zh-CN')+' · '+s.review.stages.reduce((n,x)=>n+x.entries.length,0)+' 条记录。恢复前会将当前对局保留在本设备的对局列表。';go.disabled=false;}catch(e){if(rev===modalRevision)error('备份无法恢复：'+e.message+'。当前对局未改变。');}};host.append(field('选择魔典对局备份',file),preview,go,hint('普通剧本 JSON 请从“选择剧本 → 导入 JSON”载入。'));
 });}
 try{
  if(!G||!C||!root.GrimoireAux||!root.GrimoireReminders||!root.GrimoireTimer||!root.GrimoireReview||!root.CHARS||!root.PRESETS)throw Error('角色组件未加载，请检查网络后刷新。');
  try{const saved=JSON.parse(root.localStorage.getItem(backgroundKey));if(validBackground(saved))customBackground=saved;}catch{}applyBackground();
  try{const preferences=JSON.parse(root.localStorage.getItem(displayKey));if(typeof preferences?.showScriptLogo==='boolean')showScriptLogo=preferences.showScriptLogo;if(typeof preferences?.summaryCollapsed==='boolean')summaryCollapsed=preferences.summaryCollapsed;const free=preferences?.freeLayout;if(Array.isArray(free?.positions))freePositions=free.positions.slice(0,30).map(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1?{x:p.x,y:p.y}:null);if(free?.enabled===true){tableShape='free';layoutExplicit=true;}}catch{}
  state=G.create(C.preset(1),8);
  try{const saved=JSON.parse(root.localStorage.getItem(displayKey))?.pageZoom;if(Number.isFinite(saved)&&saved>=75&&saved<=150)pageZoom=Math.round(saved/5)*5;}catch{}applyPageZoom();
  try{store=G.openStore(root.localStorage);const saved=store.read();if(saved)state=saved;}catch(e){blocked=true;dirty=true;$('gWarning').hidden=false;$('gWarningText').textContent='原魔典存档无法读取，已保留原始资料：'+e.message+'。当前操作不会自动覆盖它。';$('gSaveStatus').textContent='原存档已保护';}
  if(!blocked)save();
  aux=root.GrimoireAux.create({C,$,node,button,hint,field,error,open,close,apply,image,roleLabel,decorateToken,safeImage,random,dialog,getState:()=>state,isPlayer:()=>playerView,getRevision:()=>modalRevision,initialBluffsOpen:phoneViewport()&&uiHeight()>=500,onLayout:schedulePosition});
  markers=root.GrimoireReminders.create({C,node,button,hint,open,close,apply,image,dialog,getState:()=>state,isPlayer:()=>playerView});
  timer=root.GrimoireTimer.create({app,node,button,viewport:panelViewport,measure});
  $('gSeats').addEventListener('pointerdown',()=>{suppressSeatClickUntil=0;},true);
  $('gSeats').addEventListener('click',e=>{if(e.detail>0&&Date.now()<suppressSeatClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  $('gScript').onclick=scriptPanel;$('gAssign').onclick=distribution;$('gNight').onclick=nightPanel;$('gNotes').onclick=notes;$('gMenu').onclick=menu;$('gSheet').onclick=sheet;
  $('gSummaryLogo').onclick=scriptPanel;$('gSummaryToggle').onclick=()=>setSummaryCollapsed(true);$('gSummaryOpen').onclick=()=>setSummaryCollapsed(false);
  $('gSeatMinus').replaceChildren(menuIcon('userMinus'));$('gSeatPlus').replaceChildren(menuIcon('userPlus'));
  const review=reviewControl=root.GrimoireReview.create({getState:()=>state,getBoard:()=>root.GrimoireReviewExport.captureBoard(state,$('gBoard'),{measure,background:customBackground?.image,dim:customBackground?customBackground.dim/100:0,showLogo:showScriptLogo}),isPublic:()=>playerView,isDirty:()=>dirty,getRoles:()=>C.players(),apply,sidePanel,history,node,button,field,hint,image,roleLabel,decorateToken,reminderToken:markers.token,scriptLogo:script=>safeImage(C.scriptLogo(script))||'theme/custom.png',contentArrive,measure,pointerX,pointerY,open});$('gHistory').onclick=review.toggle;$('gBluffs').onclick=bluffs;$('gFabled').onclick=fabled;$('gSeatMinus').onclick=()=>resizeSeats(state.seats.length-1);$('gSeatPlus').onclick=()=>resizeSeats(state.seats.length+1);
  $('gControlsToggle').onclick=()=>{const hidden=!$('gControlBody').hidden;$('gControlBody').hidden=hidden;$('gControlsToggle').textContent=hidden?'⌃':'⌄';$('gControlsToggle').setAttribute('aria-expanded',String(!hidden));$('gControlsToggle').setAttribute('aria-label',hidden?'展开对局控制':'收起对局控制');position();};
  $('gAdvance').onclick=()=>{if(state.phase==='setup'&&state.seats.some(s=>!s.roleId)&&!confirm('还有座位没有分配角色，仍进入第 1 夜？'))return;apply({type:'advance'});};
  $('gPlayerView').onclick=()=>setPlayerView(!playerView);
  $('gRetry').onclick=()=>{if(save()){if(sheetRefresh&&dialog.open)sheetRefresh();if(notesRefresh)notesRefresh();for(const view of Object.values(sideViews))if(!view.panel.hidden)view.refresh?.();}};$('gBackupWarning').onclick=()=>backup();
  listMode=compactSeats();let previousWidth=uiWidth(),previousHeight=uiHeight();
  root.addEventListener('resize',()=>{const compact=compactSeats();if(!layoutExplicit)listMode=compact;else if((previousWidth>=700&&uiWidth()<700||previousHeight>=600&&uiHeight()<600)&&compact)listMode=true;schedulePosition();previousWidth=uiWidth();previousHeight=uiHeight();});if(root.ResizeObserver){const layoutObserver=new ResizeObserver(schedulePosition);for(const id of ['gBoard','gDock','gBluffPanel'])layoutObserver.observe($(id));new ResizeObserver(positionLeftTools).observe(app.querySelector('.g-summary'));}render();
  root.WikiBeforeUpdate=()=>!dirty||save();
  root.addEventListener('resize',updateVisibleViewport);root.visualViewport?.addEventListener('resize',updateVisibleViewport);root.visualViewport?.addEventListener('scroll',updateVisibleViewport);updateVisibleViewport();
  resumeOfflineDraw();setupRoleTooltips();document.addEventListener('keydown',shortcut);
  document.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Escape'&&!dialog.open&&panelFront&&!panelFront.hidden){e.preventDefault();if(panelFront===$('gNotesPanel'))closeNotes();else{const view=Object.values(sideViews).find(v=>v.panel===panelFront);if(view)closeSidePanel(view);}return;}if(e.key==='Escape'&&!dialog.open&&playerView)setPlayerView(false);});
 }catch(e){$('gWarning').hidden=false;$('gWarningText').textContent='魔典暂时无法启动：'+e.message;$('gSaveStatus').textContent='未启动';for(const b of app.querySelectorAll('button'))b.disabled=true;}
})(globalThis);
