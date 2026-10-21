(function(root){
 'use strict';
 const G=root.ClocktowerGrimoire,C=root.GrimoireCatalog,$=id=>document.getElementById(id),app=$('grimoireApp'),dialog=$('gDialog'),body=$('gDialogBody');
 const teamNames={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
 let state,store,dirty=false,blocked=false,playerView=false,listMode=false,modalRevision=0,returnFocus,toastTimer,library,undo=[],lastEdit='',lastEditAt=0;
 let sheetRefresh=null,sheetFloating=false,ignoredDialogCloses=0;
 let seatNameTimer,seatNameTap,suppressSeatClickUntil=0;
 let tableShape='circle',listColumns=0,showNightOrder=false;
 const sheetOptions={dim:false,hide:false};
 let aux,markers,roleArcSerial=0;
 const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 const button=(text,click,className='')=>{const b=node('button',text,'g-button '+className);b.type='button';b.onclick=click;return b;};
 function hint(text){return node('p',text,'g-hint');}
 function field(label,input){const l=node('label',label);l.appendChild(input);return l;}
 function error(message){let p=$('gDialogError');if(!p){p=node('p','','g-error');p.id='gDialogError';p.setAttribute('role','alert');body.prepend(p);}p.textContent=message;}
 function toast(text){$('gToast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('gToast').textContent='',4500);}
 function safeImage(url){
  if(typeof url!=='string'||!url.trim())return '';
  try{if(/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(url))return url;const u=new URL(url,document.baseURI);return ['http:','https:','file:'].includes(u.protocol)?u.href:'';}catch{return '';}
 }
 function image(role){const wrap=node('span','?','g-question'),src=role&&safeImage(role.image);if(src){const img=node('img');img.src=src;img.alt='';img.decoding='async';img.draggable=false;img.onerror=()=>{img.replaceWith(wrap);};return img;}return wrap;}
 function svgNode(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs||{}))n.setAttribute(key,value);return n;}
 function roleLabel(name,unassigned=false){
  // Short names need a tighter radius so their letters still follow a visible arc.
  const chars=Array.from(name),display=chars.length>8?chars.slice(0,7).join('')+'…':name,length=Math.max(1,Array.from(display).length),radius=Math.max(24,Math.min(48,length*11)),angle=65*Math.PI/180,x=radius*Math.sin(angle),y=88-radius+radius*Math.cos(angle);
  const svg=svgNode('svg',{viewBox:'0 0 100 100','aria-hidden':'true',class:'g-seat-role g-seat-role-arc'+(unassigned?' unassigned':'')}),id='gRoleArc_'+(++roleArcSerial),defs=svgNode('defs'),path=svgNode('path',{id,d:'M '+(50-x)+' '+y+' A '+radius+' '+radius+' 0 0 0 '+(50+x)+' '+y}),text=svgNode('text',{'font-size':Math.min(18,80/length),'text-anchor':'middle'}),label=svgNode('textPath',{href:'#'+id,startOffset:'50%'});label.textContent=display;defs.append(path);text.append(label);svg.append(defs,text);return svg;
 }
 function voteIcon(){
  const svg=svgNode('svg',{viewBox:'0 0 28 28','aria-hidden':'true'});svg.append(svgNode('path',{d:'M7 3h14v16H7z M3 17h3v4h17v-4h3v7H3z',fill:'currentColor'}),svgNode('path',{d:'m10 10 3 3 5-6',fill:'none',stroke:'#18222a','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round'}));return svg;
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
 function remember(type){const now=Date.now();if(!(['name','notes'].includes(type)&&lastEdit===type&&now-lastEditAt<900))undo.push(JSON.stringify(state));lastEdit=type;lastEditAt=now;let bytes=undo.reduce((n,x)=>n+x.length*2,0);while(undo.length>10||undo.length>1&&bytes>16*1024*1024)bytes-=undo.shift().length*2;}
 function apply(action){
  if(playerView)return false;
  try{const next=G.reduce(state,action,random);remember(action.type);state=next;dirty=true;save();render();return true;}catch(e){if(dialog.open)error(e.message);else toast(e.message);return false;}
 }
 function open(title,build){
  cancelNameClick();
  if(!dialog.open)returnFocus=document.activeElement;
  if(sheetFloating&&dialog.open){ignoredDialogCloses++;dialog.close();}
  clearSheetMode();modalRevision++;$('gDialogTitle').textContent=title;body.replaceChildren();build(body);if(!dialog.open)dialog.showModal();body.scrollTop=0;
 }
 function close(){dialog.close();}
 $('gDialogClose').onclick=close;dialog.addEventListener('close',()=>{if(ignoredDialogCloses){ignoredDialogCloses--;return;}if(dialog.open)return;modalRevision++;clearSheetMode();const id=returnFocus?.id,seatId=returnFocus?.dataset.seatId;const next=id&&$(id)||seatId&&document.querySelector('[data-seat-id="'+seatId+'"]');next?.focus({preventScroll:true});});
 function download(name,text){const a=node('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));a.href=url;a.download=name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,150);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function backup(suffix='对局备份'){if(playerView)return;download((state.script.name||'在线魔典')+'-'+suffix+'.json',JSON.stringify(state));toast('对局备份已开始下载，文件包含私密信息。');}
 function occupied(){return state.seats.some(s=>s.roleId||s.name||s.reminders.length)||state.specials.length||state.bluffs.some(Boolean)||state.notes||state.phase!=='setup';}
 function replace(next){
  if(playerView)return false;
  if(occupied()&&!confirm('这会建立或恢复另一份对局，替换当前座位和进度。确认后先下载当前对局备份，是否继续？'))return false;
  const valid=G.validate(next);if(occupied())backup('替换前备份');
  if(blocked){if(!confirm('原浏览器存档无法读取。继续会覆盖原存档；将先下载原始存档供恢复。'))return false;const raw=root.localStorage.getItem(G.key);if(raw)download('在线魔典-原始存档.json',raw);store=G.openStore(root.localStorage);blocked=false;}
  remember('replace');state=valid;if(compactSeats())listMode=true;dirty=true;save();render();close();return true;
 }
 function roleOf(s){return state.script.roles.find(r=>r.id===s.roleId);}
 function compactSeats(){return state.seats.length>20||innerWidth<700&&state.seats.length>10||innerHeight<600&&state.seats.length>8;}
 function position(){
  const board=$('gBoard'),width=board.clientWidth,height=board.clientHeight,count=state.seats.length;
  board.classList.toggle('list-mode',listMode);board.classList.toggle('dense',count>12);board.dataset.layout=listMode?(listColumns===1?'single':listColumns===2?'double':'auto'):tableShape;
  const mobile=width<=700,short=!mobile&&height<600;
  const size=Math.round(mobile?Math.max(48,Math.min(76,width*.175)):(short?Math.max(56,Math.min(78,height*.18)):Math.max(78,Math.min(128,height*.135)))*(count>14?.8:1));
  board.style.setProperty('--token-size',size+'px');
  const top=mobile?124:short?18:12,bottom=mobile?Math.max(70,$('gDock').hidden?70:$('gDock').offsetHeight+24):short?18:22;
  const centerY=(top+height-bottom)/2;
  const radiusY=Math.max(44,(height-top-bottom-size-42)/2),radiusX=mobile?Math.max(52,(width-88-size-20)/2):short?Math.min(Math.max(60,width/2-$('gDock').offsetWidth-72),radiusY*.9):Math.min((width-400-size)/2,radiusY*(tableShape==='ellipse'?1.32:1));
  const two=count>14&&width>700,outer=two?Math.ceil(count*.66):count;
  const boardRect=board.getBoundingClientRect();
  $('gSeats').querySelectorAll('.g-seat').forEach((n,i)=>{const inner=two&&i>=outer,total=inner?count-outer:outer,index=inner?i-outer:i,a=-Math.PI/2+index/total*Math.PI*2,f=inner?.56:1,x=width/2+Math.cos(a)*radiusX*f,y=centerY+Math.sin(a)*radiusY*f;n.style.setProperty('--x',x+'px');n.style.setProperty('--y',y+'px');n.dataset.markerSide='radial';if(listMode)return;
   const tokens=[...n.querySelectorAll('.g-reminder-token,.g-reminder-add')];if(!tokens.length)return;const seatRect=n.getBoundingClientRect(),roleRect=n.querySelector('.g-seat-token').getBoundingClientRect(),ox=roleRect.left-seatRect.left+roleRect.width/2,oy=roleRect.top-seatRect.top+roleRect.height/2,dx=boardRect.left+width/2-roleRect.left-roleRect.width/2,dy=boardRect.top+centerY-roleRect.top-roleRect.height/2,distance=Math.hypot(dx,dy)||1,size=tokens[0].offsetWidth,gap=dy>distance*.4?n.querySelector('.g-seat-name').offsetHeight+8:8,start=roleRect.width/2+size/2+gap,available=Math.max(0,distance-start-size/2-8),step=tokens.length>1?Math.min(size+8,available/(tokens.length-1)):0;
   tokens.forEach((t,j)=>{const d=start+j*step;t.style.setProperty('--marker-x',(ox+dx/distance*d)+'px');t.style.setProperty('--marker-y',(oy+dy/distance*d)+'px');});
  });
 }
 function render(){
  cancelNameClick();
  const shown=playerView?G.publicView(state):state,counts=G.counts(state);app.dataset.ready='true';app.dataset.playerView=String(playerView);
  $('gTitle').textContent=state.script.name;$('gPhase').textContent=phaseLabel();$('gCounts').textContent='存活 '+counts.alive+' / '+state.seats.length+' · 可投票 '+counts.eligible;
  $('gComposition').replaceChildren();if(!playerView)for(const [t,n]of Object.entries(counts.by))if(n)$('gComposition').append(node('span',teamNames[t]+' '+n,t));
  $('gSeatTotal').textContent=state.seats.length+' 人';$('gSeatMinus').disabled=state.seats.length<=5;$('gSeatPlus').disabled=state.seats.length>=30;
  $('gStartHint').textContent=playerView?'玩家视角 · 角色分配已隐藏':'点圆牌选角色 · 点名字管理 · 双击名字改名 · 拖动圆牌换座';
  const holder=$('gSeats'),nightRanks={first:new Map(),other:new Map()};holder.replaceChildren();if(showNightOrder&&!playerView)for(const key of ['first','other'])G.nightOrder(state,{first:key==='first'}).forEach((x,i)=>nightRanks[key].set(x.seat.id,i+1));
  shown.seats.forEach((s,i)=>{
   const r=playerView?null:roleOf(s),b=node('div',undefined,'g-seat'+(!s.alive?' dead':'')),label=(i+1)+' 号 '+(s.name||'未命名');b.dataset.seatId=s.id;b.setAttribute('role','group');b.setAttribute('aria-label',label+(r?'，'+r.name:'')+'，'+(s.alive?'存活':'死亡'));
   const token=node('span',undefined,'g-token'+(r?' '+r.team:'')),roleButton=node('button',undefined,'g-seat-token'),name=node('button',(i+1)+'号'+(s.name?' · '+s.name:''),'g-seat-name');roleButton.type=name.type='button';roleButton.id='gSeatToken_'+s.id;name.id='gSeatLabel_'+s.id;token.append(image(r),roleLabel(r?r.name:playerView?(s.alive?'存活':'已死亡'):'未分配',!r));decorateToken(token,r);roleButton.append(token);b.append(roleButton,name);
   if(!playerView){const life=button('',()=>{if(apply({type:'life',seatId:s.id,alive:!s.alive}))$('gLife_'+s.id)?.focus({preventScroll:true});},'g-life-toggle');life.id='gLife_'+s.id;life.title=s.alive?'点击圆牌上方，标记死亡':'点击帷幕，恢复存活';life.setAttribute('aria-label',(s.alive?'标记死亡：':'恢复存活：')+label);life.setAttribute('aria-pressed',String(!s.alive));b.append(life);}else if(!s.alive){const shroud=node('span',undefined,'g-life-shroud');shroud.setAttribute('aria-hidden','true');b.append(shroud);}
   if(!s.alive){const description=(s.ghostVote?'死亡票可用':'死亡票已使用')+'：'+label,vote=playerView?node('span',undefined,'g-vote'+(s.ghostVote?'':' used')):button('',()=>{if(apply({type:'vote',seatId:s.id,available:!s.ghostVote}))$('gVote_'+s.id)?.focus({preventScroll:true});},'g-vote g-vote-toggle'+(s.ghostVote?'':' used'));vote.id='gVote_'+s.id;vote.append(voteIcon());vote.setAttribute('aria-label',description);if(!playerView){vote.title=s.ghostVote?'点击使用死亡票':'点击恢复死亡票';vote.setAttribute('aria-pressed',String(s.ghostVote));}else vote.setAttribute('role','img');b.append(vote);}
   if(!playerView&&s.alignment!=='unknown')b.append(node('span',s.alignment==='good'?'善良':'邪恶','g-alignment '+s.alignment));
   for(const key of ['first','other'])if(nightRanks[key].has(s.id)){const value=nightRanks[key].get(s.id),rank=node('span',String(value),'g-token-order '+key),description=(key==='first'?'首个夜晚':'其他夜晚')+'行动第 '+value+' 项';rank.dataset.night=key;rank.setAttribute('aria-label',description);rank.title=description;roleButton.append(rank);b.classList.add('has-night-order');}
   if(!playerView)b.append(markers.seatControls(s.id));
   if(playerView){roleButton.setAttribute('aria-label',label+'，'+(s.alive?'存活':'已死亡'));name.setAttribute('aria-label',label);roleButton.onclick=name.onclick=()=>toast(label+' · '+(s.alive?'存活':'已死亡'));}else{
    roleButton.setAttribute('aria-label',label+'，'+(r?'修改角色：'+r.name:'选择角色'));roleButton.title='点击选择或修改角色，拖动交换座位';name.setAttribute('aria-label','管理 '+label+'，双击快速改名');name.title='单击管理玩家，双击快速改名（键盘 F2）';
    roleButton.onclick=e=>{if(e.detail===0||Date.now()>=suppressSeatClickUntil){roleButton.focus({preventScroll:true});aux.seatRole(s.id);}};name.onclick=e=>{name.focus({preventScroll:true});nameClick(e,s.id);};name.ondblclick=e=>{e.preventDefault();cancelNameClick();if(!$('gQuickSeatName'))quickName(s.id);};name.onkeydown=e=>{if(e.key==='F2'){e.preventDefault();cancelNameClick();quickName(s.id);}};setupSeatPointer(b,roleButton,s.id);
   }
   holder.append(b);
  });
  for(const id of ['gScript','gAssign','gNight','gNotes','gMenu','gAdvance','gHistory','gBluffs','gSeatMinus','gSeatPlus'])$(id).hidden=playerView;$('gSheet').textContent=playerView?'角色表':'角色';
  $('gDock').hidden=playerView;
  $('gAdvance').textContent=state.phase==='setup'?'进入第 1 夜':state.phase==='night'?'进入第 '+state.round+' 天':'进入第 '+(state.round+1)+' 夜';
  $('gPlayerView').textContent=playerView?'回到说书人':'玩家视角';$('gPlayerView').setAttribute('aria-pressed',String(playerView));$('gLayout').setAttribute('aria-pressed',String(listMode));$('gLayout').textContent=listMode?'圆桌':'列表';
  $('gPrivacy').textContent=playerView?'仅隐藏当前屏幕的私密信息':'单机说书人 · 私密资料保存在此设备';
  if(dirty){$('gRetry').hidden=playerView||$('gWarningText').textContent.includes('另一页面');$('gBackupWarning').hidden=playerView;}
  position();
  aux?.render();
  if(sheetRefresh&&dialog.open)sheetRefresh();
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
  control.onpointerdown=e=>{if(e.button!==0||e.isPrimary===false)return;cancelNameClick();start={x:e.clientX,y:e.clientY};drag=false;over=null;control.setPointerCapture?.(e.pointerId);};
  control.onpointermove=e=>{if(!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>9)drag=true;if(!drag)return;b.classList.add('dragging');over=[...$('gSeats').querySelectorAll('.g-seat')].filter(n=>n!==b).find(n=>{const r=n.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));over?.classList.add('drop-target');};
  control.onpointerup=()=>{if(!start)return;start=null;clear();if(drag){suppressSeatClickUntil=Date.now()+250;if(over)apply({type:'swap',seatId:id,otherSeatId:over.dataset.seatId});}drag=false;};
  control.onpointercancel=control.onlostpointercapture=()=>{start=null;drag=false;over=null;clear();};
 }
 function seatPanel(id){
  if(playerView)return;const p=state.seats.find(x=>x.id===id);if(!p)return;
  open((state.seats.indexOf(p)+1)+' 号座位',host=>{
   const name=node('input');name.id='gSeatName';name.maxLength=40;name.value=p.name;name.placeholder='玩家名字，可留空';name.oninput=()=>apply({type:'name',seatId:id,name:name.value});host.append(field('玩家名字',name));
   const select=node('select');select.id='gSeatRole';select.append(new Option('未分配角色',''));
   state.script.roles.filter(r=>!['fabled','loric'].includes(r.team)).forEach(r=>select.append(new Option(r.name+' · '+teamNames[r.team],r.id)));select.value=p.roleId;
   const ability=node('p','','g-hint');const refresh=()=>{const r=roleOf(state.seats.find(x=>x.id===id));ability.textContent=r?r.ability:'选择角色后显示能力。';};
   select.onchange=()=>{if(apply({type:'assign',seatId:id,roleId:select.value})){refresh();reminders();}};host.append(field('分配角色',select),ability);refresh();
   const row=node('div',undefined,'g-row');const life=button(p.alive?'标记死亡':'恢复存活',()=>{const old=state.seats.find(x=>x.id===id);if(apply({type:'life',seatId:id,alive:!old.alive})){life.textContent=old.alive?'恢复存活':'标记死亡';vote.disabled=state.seats.find(x=>x.id===id).alive;}});
   const vote=button(p.ghostVote?'使用投票标记':'恢复投票标记',()=>{const old=state.seats.find(x=>x.id===id);if(apply({type:'vote',seatId:id,available:!old.ghostVote}))vote.textContent=old.ghostVote?'恢复投票标记':'使用投票标记';});vote.disabled=p.alive;row.append(life,vote);host.append(row,hint('生死与投票标记由说书人手动记录；特殊角色请结合实际规则判断。'));
   const alignment=node('select');alignment.id='gSeatAlignment';for(const [v,t]of [['unknown','不标记'],['good','善良'],['evil','邪恶']])alignment.append(new Option(t,v));alignment.value=p.alignment;alignment.onchange=()=>apply({type:'alignment',seatId:id,alignment:alignment.value});host.append(field('私密阵营标记',alignment));
   host.append(node('h3','提醒标记'));const reminderList=node('div',undefined,'g-reminder-list');reminderList.id='gSeatReminders';host.append(reminderList);
   function reminders(){reminderList.replaceChildren();state.seats.find(x=>x.id===id).reminders.forEach((t,index)=>reminderList.append(button(t+' ×',()=>{if(apply({type:'reminderRemove',seatId:id,index}))reminders();})));}
   reminders();const form=node('form',undefined,'g-row'),input=node('input');input.placeholder='例如：中毒、醉酒、已使用能力';input.maxLength=100;input.setAttribute('aria-label','提醒内容');input.id='gReminderText';const add=button('添加提醒');add.type='submit';form.append(input,add);form.onsubmit=e=>{e.preventDefault();if(apply({type:'reminderAdd',seatId:id,text:input.value})){input.value='';reminders();}};host.append(form);
   const suggestions=node('div',undefined,'g-row');[...new Set(['醉酒','中毒','已使用能力',...(roleOf(p)?.reminders||[])])].slice(0,8).forEach(t=>suggestions.append(button(t,()=>{if(apply({type:'reminderAdd',seatId:id,text:t}))reminders();},'subtle')));host.append(suggestions,node('h3','调整座位'));
   const moves=node('div',undefined,'g-row');moves.append(button('与上一座交换',()=>{if(apply({type:'move',seatId:id,delta:-1}))$('gDialogTitle').textContent=(state.seats.findIndex(x=>x.id===id)+1)+' 号座位';}),button('与下一座交换',()=>{if(apply({type:'move',seatId:id,delta:1}))$('gDialogTitle').textContent=(state.seats.findIndex(x=>x.id===id)+1)+' 号座位';}));host.append(moves);
  });
 }
 function newScript(script){return replace(G.create(script,state.seats.length));}
 function scriptPanel(){
  if(playerView)return;
  open('选择本次剧本',host=>{
   const tabs=node('div',undefined,'g-script-tabs'),content=node('div');host.append(tabs,content);let localTab=0;
   const presets=()=>{content.replaceChildren();const select=node('select');select.id='gPreset';root.PRESETS.forEach((p,i)=>select.append(new Option(p.name,String(i))));select.value='1';content.append(field('官方预设',select),button('使用这个预设',()=>{try{newScript(C.preset(Number(select.value)));}catch(e){error(e.message);}},'primary'),hint('建立新对局会清空本次座位分配和进度；现有对局可先备份。'),button('读取编辑器当前草稿',()=>{try{newScript(C.draft());}catch(e){error(e.message);}}));};
   const json=()=>{content.replaceChildren();const file=node('input');file.type='file';file.accept='.json,application/json';file.id='gScriptFile';const text=node('textarea');text.id='gScriptJSON';text.maxLength=8*1024*1024;text.placeholder='粘贴标准剧本 JSON；保留完整自定义角色对象。';
    const load=()=>{try{const parsed=C.parse(root.ScriptCore.parseJSON(text.value));newScript(parsed);}catch(e){error('导入失败：'+e.message);}};
    file.onchange=async()=>{const revision=modalRevision;try{const f=file.files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('请选择不超过 8 MB 的 JSON');const value=await f.text();if(revision!==modalRevision)return;text.value=value;error('文件已读取，请确认后点“载入剧本”。');}catch(e){error(e.message);}};
    content.append(field('选择剧本 JSON',file),field('或粘贴 JSON',text),button('载入剧本',load,'primary'),hint('仅在本机解析文件。角色 ID、能力与明确填写的夜序会保留；不会自动推断作者特殊规则。'));
   };
   const fromLibrary=async()=>{
    const tab=++localTab,revision=modalRevision;content.replaceChildren(hint('正在读取本站剧本目录…'));
    try{if(!library)library=(await fetchJSON('../api/v1/scripts.json')).items;if(revision!==modalRevision||tab!==localTab)return;
     const input=node('input');input.type='search';input.placeholder='搜索剧本名称或作者';input.id='gLibrarySearch';const results=node('div',undefined,'g-list'),count=node('p','','g-hint');content.replaceChildren(field('搜索已有剧本',input),count,results);
     const draw=()=>{const terms=input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),matches=library.filter(s=>terms.every(q=>(s.name+' '+s.author).toLocaleLowerCase().includes(q)));results.replaceChildren();count.textContent='找到 '+matches.length+' 份资料，显示前 30 份。';matches.slice(0,30).forEach(s=>{
      const b=node('button',undefined,'g-library-item');b.type='button';const title=node('span',s.name),small=node('small',(s.author||'佚名')+' · '+s.category);title.append(small);b.append(title,node('span',s.json?'载入':'暂无 JSON'));b.disabled=!s.json;
      b.onclick=async()=>{b.disabled=true;const rev=modalRevision;try{const value=await fetchJSON('../api/v1/'+s.json);if(rev!==modalRevision)return;newScript(C.parse(value));}catch(e){if(rev===modalRevision)error('载入失败：'+e.message);}finally{b.disabled=!s.json;}};results.append(b);
     });};input.oninput=draw;draw();
    }catch(e){if(revision===modalRevision)content.replaceChildren(hint('目录读取失败：'+e.message),button('重试读取',fromLibrary));}
   };
   const activate=which=>{localTab++;if(which===0)presets();else if(which===1)fromLibrary();else json();};
   ['官方预设','本站剧本库','导入 JSON'].forEach((t,i)=>tabs.append(button(t,()=>activate(i))));presets();
  });
 }
 async function fetchJSON(path){const url=new URL(path,document.baseURI);if(url.origin!==location.origin)throw Error('不支持站外数据地址');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(root.WikiCache?root.WikiCache.asset(url.href):url.href,{signal:controller.signal});if(!r.ok)throw Error('请求失败（'+r.status+'）');const text=await r.text();if(text.length>8*1024*1024)throw Error('资料超过 8 MB');return JSON.parse(text);}finally{clearTimeout(timer);}}
 function distribution(){
  if(playerView)return;open('选择并分配角色',host=>{
   const selected=new Set(),search=node('input'),counter=node('p','','g-inline-progress'),list=node('div',undefined,'g-picker');search.type='search';search.placeholder='搜索本剧本角色';search.id='gBagSearch';
   const commit=button('随机分配到座位',()=>{if(state.seats.some(p=>p.roleId)&&!confirm('重新分配将替换当前角色并清除其提醒，继续？'))return;if(apply({type:'distribute',roleIds:[...selected]}))close();},'primary');commit.id='gDistribute';
   const refresh=()=>{counter.textContent='已选 '+selected.size+' / '+state.seats.length+' 个角色';commit.disabled=selected.size!==state.seats.length;};
   const draw=()=>{list.replaceChildren();state.script.roles.filter(r=>!['fabled','loric'].includes(r.team)&&r.name.includes(search.value.trim())).forEach(r=>{const b=node('button',undefined,'g-role-option');b.type='button';const img=image(r),text=node('span',r.name);text.append(node('small',teamNames[r.team]));b.append(img,text);b.setAttribute('aria-pressed',String(selected.has(r.id)));b.dataset.roleId=r.id;b.onclick=()=>{if(selected.has(r.id))selected.delete(r.id);else selected.add(r.id);b.setAttribute('aria-pressed',String(selected.has(r.id)));refresh();};list.append(b);});};
   search.oninput=draw;host.append(counter,hint('按实际设定选满座位数量，再随机分配。酒鬼、男爵等角色可能改变配置，系统不会自动替你决定；重复角色可逐个点座位手动设置。'),field('搜索角色',search),list,node('p',''),commit);refresh();draw();
  });
 }
 function clearSheetMode(){
  sheetRefresh=null;sheetFloating=false;dialog.classList.remove('g-sheet-dialog','g-sheet-floating','g-night-dialog','g-menu-dialog','g-signal-dialog','g-reminder-dialog','g-token-picker','g-bluff-reveal');dialog.style.removeProperty('--sheet-left');dialog.style.removeProperty('--sheet-top');$('gSheetFloat')?.remove();$('gNightFloat')?.remove();$('gDialogClose').textContent='关闭';
  const head=dialog.querySelector('.g-modal-head');head.onpointerdown=head.onpointermove=head.onpointerup=head.onpointercancel=head.onkeydown=null;head.removeAttribute('tabindex');head.removeAttribute('aria-label');
 }
 function clampSheet(x,y){
  const r=dialog.getBoundingClientRect();dialog.style.setProperty('--sheet-left',Math.max(6,Math.min(x,Math.max(6,innerWidth-r.width-6)))+'px');dialog.style.setProperty('--sheet-top',Math.max(6,Math.min(y,Math.max(6,innerHeight-r.height-6)))+'px');
 }
 function sidePanel(kind){
  const night=kind==='night';dialog.classList.add('g-sheet-dialog');if(night)dialog.classList.add('g-night-dialog');$('gDialogClose').textContent='×';
  const head=dialog.querySelector('.g-modal-head'),float=button('▱ 浮动',()=>{
   const r=dialog.getBoundingClientRect(),focus=document.activeElement;ignoredDialogCloses++;dialog.close();sheetFloating=!sheetFloating;dialog.classList.toggle('g-sheet-floating',sheetFloating);
   if(sheetFloating){dialog.show();clampSheet(r.left,r.top);head.tabIndex=0;head.setAttribute('aria-label','移动'+(night?'行动顺序':'角色')+'面板，方向键调整位置');}else{dialog.style.removeProperty('--sheet-left');dialog.style.removeProperty('--sheet-top');head.removeAttribute('tabindex');head.removeAttribute('aria-label');dialog.showModal();}
   float.textContent=sheetFloating?'▱ 固定':'▱ 浮动';float.setAttribute('aria-pressed',String(sheetFloating));float.setAttribute('aria-label',sheetFloating?'固定为模态面板':'切换为可拖动的浮动面板');focus?.focus({preventScroll:true});
  },'subtle');float.id=night?'gNightFloat':'gSheetFloat';float.setAttribute('aria-pressed','false');float.setAttribute('aria-label','切换为可拖动的浮动面板');head.insertBefore(float,$('gDialogClose'));
  let drag;
  head.onpointerdown=e=>{if(!sheetFloating||e.button!==0||e.target.closest('button,a,input'))return;const r=dialog.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};head.setPointerCapture?.(e.pointerId);e.preventDefault();};
  head.onpointermove=e=>{if(drag)clampSheet(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);};head.onpointerup=head.onpointercancel=()=>{drag=null;};
  head.onkeydown=e=>{if(!sheetFloating||e.target!==head)return;const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(delta){e.preventDefault();const r=dialog.getBoundingClientRect();clampSheet(r.left+delta[0],r.top+delta[1]);}};
 }
 function sheet(){
  if(dialog.open&&dialog.classList.contains('g-sheet-dialog')&&!dialog.classList.contains('g-night-dialog')&&!dialog.classList.contains('g-menu-dialog')){close();return;}
  open(playerView?'公开角色表':'剧本角色',()=>{});sidePanel('roles');
  sheetRefresh=()=>{
   const top=body.scrollTop,present=new Map();if(!playerView)state.seats.forEach(s=>{if(s.roleId)present.set(s.roleId,(present.get(s.roleId)||0)+1);});body.replaceChildren();
   const tools=node('div',undefined,'g-sheet-toolbar');if(!playerView){
    for(const [key,label]of [['dim','淡化不在场角色'],['hide','隐藏不在场角色']]){const input=node('input');input.type='checkbox';input.id=key==='dim'?'gSheetDim':'gSheetHide';input.checked=sheetOptions[key];input.onchange=()=>{sheetOptions[key]=input.checked;sheetRefresh();$(input.id)?.focus({preventScroll:true});};const l=field(label,input);l.className='g-sheet-check';tools.append(l);}
    const count=node('span','在场 '+state.seats.filter(s=>s.roleId).length,'g-sheet-count');count.title='已分配角色的座位数，包含已死亡玩家；重复角色按多个座位计数。';tools.append(count);
   }else tools.append(node('span',state.script.name+' · 完整公开角色表','g-sheet-count'));
   body.append(tools);
   if(state.script.rules){const rules=state.script.rules.split(/\n\s*\n/).filter(t=>t.trim()),box=node('section',undefined,'g-sheet-rules');box.append(node('h3','剧本额外规则 · '+rules.length));rules.forEach(t=>box.append(node('p',t)));body.append(box);}
   let shown=0;
   for(const [team,title]of Object.entries(teamNames)){
    const all=state.script.roles.filter(r=>r.team===team),roles=!playerView&&sheetOptions.hide?all.filter(r=>present.has(r.id)):all;if(!roles.length)continue;shown+=roles.length;
    const group=node('section',undefined,'g-sheet-group '+team),number=roles.length===all.length?String(all.length):roles.length+' / '+all.length;group.append(node('h3',title+' · '+number));const grid=node('div',undefined,'g-sheet-grid');
    roles.forEach(r=>{const inPlay=!playerView&&present.has(r.id),card=node('article',undefined,'g-sheet-role'+(!playerView&&sheetOptions.dim&&!inPlay?' is-absent':'')),icon=node('span',undefined,'g-sheet-icon'),copy=node('div',undefined,'g-sheet-copy'),heading=node('div',undefined,'g-sheet-role-heading');card.dataset.roleId=r.id;icon.append(image(r));heading.append(node('strong',r.name));if(inPlay)heading.append(node('span',present.get(r.id)>1?'在场 ×'+present.get(r.id):'在场','g-sheet-inplay'));copy.append(heading,node('p',r.ability||'能力文本尚未收录。'));card.append(icon,copy);grid.append(card);});group.append(grid);body.append(group);
   }
   if(!shown)body.append(hint('还没有分配角色，取消“隐藏不在场角色”可查看完整剧本。'));body.scrollTop=top;
  };sheetRefresh();
 }
 function fabled(){aux.toggleLegend();}
 function resizeSeats(n){if(playerView||n<5||n>30)return;const removed=state.seats.slice(n),force=n<state.seats.length&&removed.some(x=>x.name||x.roleId||x.reminders.length);if(force&&!confirm('将移除末尾 '+removed.length+' 个座位及其资料，建议先备份。继续？'))return;if(apply({type:'resize',count:n,force})&&compactSeats()){listMode=true;render();}}
 function nightPanel(){
  if(playerView)return;if(dialog.open&&dialog.classList.contains('g-night-dialog')){close();return;}
  let first=state.round<=1,all=false,lastRound=state.round,follow=true;open('行动顺序',()=>{});sidePanel('night');
  sheetRefresh=()=>{
   if(playerView)return;const top=body.scrollTop;if(follow&&lastRound!==state.round)first=state.round<=1;lastRound=state.round;body.replaceChildren();
   const tools=node('div',undefined,'g-night-toolbar');for(const [value,text,id]of [[true,'首个夜晚','gNightFirst'],[false,'其他夜晚','gNightOther']]){const b=button(text,()=>{first=value;follow=false;sheetRefresh();body.scrollTop=0;$(id)?.focus({preventScroll:true});},'subtle');b.id=id;b.setAttribute('aria-pressed',String(first===value));tools.append(b);}const scope=button(all?'只看在场':'看全剧本',()=>{all=!all;sheetRefresh();body.scrollTop=0;$('gNightAll')?.focus({preventScroll:true});},'subtle');scope.id='gNightAll';scope.setAttribute('aria-pressed',String(all));tools.append(scope);body.append(tools);
   const queue=G.nightOrder(state,{first,all}),recording=!all&&state.phase==='night'&&(state.round===1)===first,summary=node('p',(first?'首夜':'其他夜晚')+' · '+(all?'全剧本':'在场')+' '+queue.length+' 项'+(recording?' · '+phaseLabel()+'可记录':' · 仅预览顺序'),'g-night-summary');body.append(summary);
   if(!queue.length)body.append(hint(all?'本剧本在这个夜晚没有已收录的角色行动。':'这个夜晚还没有已分配的角色行动，可点“看全剧本”预览，或先给玩家分配角色。'));
   const list=node('ol',undefined,'g-night-list');queue.forEach(({seat,seats,role,reminder,status,order},i)=>{
    const card=node('li',undefined,'g-night-item g-night-step '+role.team+' '+status),number=node('span',String(i+1),'g-night-number'),icon=node('span',undefined,'g-night-icon'),copy=node('div',undefined,'g-night-copy'),heading=node('div',undefined,'g-night-heading');card.dataset.roleId=role.id;card.dataset.order=String(order);if(seat)card.dataset.seatId=seat.id;number.setAttribute('aria-label','第 '+(i+1)+' 项');number.title='夜序值 '+order;icon.append(image(role));heading.append(node('strong',role.name),node('span',seats.length?seats.map(p=>(state.seats.findIndex(s=>s.id===p.id)+1)+'号'+(!p.alive?'（已死亡）':'')).join('、'):'不在场','g-night-seats'));copy.append(heading,node('p',reminder||'唤醒提示尚未收录。能力参考：'+role.ability,'g-night-reminder'));
    if(recording){const actions=node('div',undefined,'g-night-actions');for(const [value,text]of [['done','完成'],['skipped','跳过'],['pending','撤回']]){const b=button(text,()=>{if(apply({type:'nightMark',seatId:seat.id,status:value}))$(b.id)?.focus({preventScroll:true});},'subtle');b.id='gNightMark_'+seat.id+'_'+value;b.setAttribute('aria-pressed',String(status===value));actions.append(b);}copy.append(actions);}card.append(number,icon,copy);list.append(card);
   });body.append(list);const note=node('details',undefined,'g-night-note');note.append(node('summary','夜序使用说明'),hint('按剧本已收录的夜序排列；死亡、醉酒或中毒不会自动排除行动，由说书人判断是否执行。不含爪牙互认等完整阶段步骤。预览不修改对局，只有当前夜晚的在场列表可以记录完成或跳过。'));body.append(note);body.scrollTop=top;
  };sheetRefresh();
 }
 function notes(){if(playerView)return;open('说书人私密笔记',host=>{const text=node('textarea');text.id='gNotesText';text.value=state.notes;text.maxLength=8000;text.placeholder='记录本局信息。玩家视角不显示这些内容。';text.oninput=()=>apply({type:'notes',text:text.value});host.append(field('本局笔记',text),hint('笔记随本局存档与备份保存，不上传。'));});}
 function bluffs(){aux.toggleBluffs();}
 function history(){if(playerView)return;open('本局操作记录',host=>{const list=node('ol',undefined,'g-history');if(!state.history.length)host.append(hint('开始操作后会记录最近 200 项变化。'));state.history.slice().reverse().forEach(e=>{const item=node('li',e.text);item.append(node('small',new Date(e.at).toLocaleTimeString('zh-CN')+' · '+(e.phase==='setup'?'准备中':'第 '+e.round+(e.phase==='night'?' 夜':' 天'))));list.append(item);});host.append(list);});}
 function menuIcon(kind){
  const paths={users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0',shuffle:'M3 5h3l12 14h3 M17 15l4 4-4 4 M3 19h3l4-5 M14 9l4-4h3 M17 1l4 4-4 4',book:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z M12 6v16',moon:'M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5',note:'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',save:'M3 3h15l3 3v15H3z M7 3v6h9V3 M7 21v-8h10v8',upload:'M4 16v5h16v-5 M12 17V3 M6 9l6-6 6 6',undo:'M3 10h11a6 6 0 0 1 0 12 M3 10l6-6 M3 10l6 6',clock:'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0 M12 6v6l4 2',home:'M3 11l9-8 9 8 M5 9v12h14V9 M9 21v-7h6v7',help:'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0 M9 9a3 3 0 1 1 5 2l-2 2 M12 17h.01',expand:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5',crown:'M3 6l4 4 5-7 5 7 4-4-2 13H5z',flag:'M5 22V3 M5 3h14l-3 5 3 5H5',trash:'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7'};
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');path.setAttribute('d',paths[kind]||paths.book);svg.append(path);return svg;
 }
 function menuItem(text,click,icon='book',id){const b=button('',click,'g-menu-item');b.append(menuIcon(icon),node('span',text,'g-menu-label'));b.setAttribute('aria-label',text);if(id)b.id=id;return b;}
 function setLayout(value){if(playerView)return;listMode=['single','double'].includes(value);if(listMode)listColumns=value==='single'?1:2;else tableShape=value;render();$('gMenuLayout_'+value)?.focus({preventScroll:true});}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(app.requestFullscreen)await app.requestFullscreen();else toast('此浏览器不支持全屏，可使用当前独立界面。');}catch{toast('全屏未开启，可继续正常使用。');}}
 function signal(text,team='neutral'){
  if(playerView)return;open('游戏指示',host=>{const display=node('div',undefined,'g-signal-display '+team);display.append(menuIcon(team==='neutral'?'eye':'flag'),node('strong',text),node('p','展示结束后，将设备交回说书人。'));host.append(display);});dialog.classList.add('g-signal-dialog');
 }
 function signalPanel(){if(playerView)return;open('游戏指示',host=>{const grid=node('div',undefined,'g-menu-grid');for(const text of ['请闭上眼睛','请睁开眼睛','请保持安静','现在可以提名'])grid.append(menuItem(text,()=>signal(text),'eye'));host.append(grid,hint('选择后全屏展示提示，关闭后返回当前对局。'));});}
 function menu(){
  if(playerView)return;if(dialog.open&&dialog.classList.contains('g-menu-dialog')){close();return;}open('菜单',()=>{});dialog.classList.add('g-sheet-dialog','g-menu-dialog');$('gDialogClose').textContent='×';
  sheetRefresh=()=>{
   const top=body.scrollTop;body.replaceChildren();const section=(title)=>{const box=node('section',undefined,'g-menu-section'),grid=node('div',undefined,'g-menu-grid');box.append(node('h3',title),grid);body.append(box);return grid;};
   const seats=section('座位'),step=node('div',undefined,'g-menu-stepper'),count=node('select');count.id='gSeatCount';count.setAttribute('aria-label','座位数量（5–30）');for(let n=5;n<=30;n++)count.append(new Option(n+' 人',String(n)));count.value=String(state.seats.length);const resize=n=>{resizeSeats(n);count.value=String(state.seats.length);$('gSeatCount')?.focus({preventScroll:true});};count.onchange=()=>resize(Number(count.value));const minus=button('−',()=>resize(state.seats.length-1),'g-menu-step'),plus=button('＋',()=>resize(state.seats.length+1),'g-menu-step');minus.id='gMenuSeatMinus';plus.id='gMenuSeatPlus';minus.setAttribute('aria-label','减少一个座位');plus.setAttribute('aria-label','增加一个座位');minus.disabled=state.seats.length<=5;plus.disabled=state.seats.length>=30;step.append(minus,count,plus);seats.append(step,menuItem('打乱顺序',()=>{if(state.phase!=='setup'&&!confirm('将打乱座位顺序，保留每位玩家的角色、提醒和行动记录。继续？'))return;if(apply({type:'shuffleSeats'}))$('gMenuShuffle')?.focus({preventScroll:true});},'shuffle','gMenuShuffle'),menuItem('分配角色',distribution,'users'),menuItem('角色与规则',sheet,'book'));
   const script=section('剧本'),card=menuItem(state.script.name,scriptPanel,'book','gMenuScript');card.classList.add('g-menu-script');const copy=card.querySelector('.g-menu-label');copy.replaceChildren(node('strong',state.script.name),node('small',(state.script.author||'未填写作者')+' · '+state.script.roles.length+' 个角色 · 点击更换或导入'));card.setAttribute('aria-label','选择或导入剧本');script.append(card);
   const tools=section('说书人工具');tools.append(menuItem('善良获胜',()=>signal('善良阵营获胜','good'),'flag'),menuItem('邪恶获胜',()=>signal('邪恶阵营获胜','evil'),'flag'),menuItem('游戏指示',signalPanel,'eye'),menuItem('夜晚行动顺序',nightPanel,'moon'),menuItem('私密笔记',notes,'note'),menuItem(document.fullscreenElement?'退出全屏':'进入全屏',fullscreen,'expand'));
   const layouts=section('布局'),active=listMode?(listColumns===1?'single':listColumns===2?'double':'auto'):tableShape;for(const [value,text]of [['circle','标准圆形'],['ellipse','椭圆布局'],['single','单列垂直'],['double','双列垂直']]){const b=menuItem(text,()=>setLayout(value),'grid','gMenuLayout_'+value);b.setAttribute('aria-pressed',String(active===value));layouts.append(b);}
   const backupGrid=section('对局与备份');backupGrid.append(menuItem('下载对局备份',()=>{backup();if($('gMenuBackupHint'))$('gMenuBackupHint').textContent='已发起下载，请确认文件保存成功。备份请仅交给说书人。';},'save','gMenuBackup'),menuItem('导入对局备份',restorePanel,'upload'));const back=menuItem('撤销上一步',()=>{if(!undo.length)return;state=G.validate(JSON.parse(undo.pop()));dirty=true;save();render();close();},'undo');back.disabled=!undo.length;backupGrid.append(back,menuItem('操作记录',history,'clock'));const backupHint=hint('备份包含秘密身份和笔记，请仅交给说书人。');backupHint.classList.add('g-menu-footnote');backupHint.id='gMenuBackupHint';backupHint.setAttribute('aria-live','polite');backupGrid.parentElement.append(backupHint);
   const more=section('更多'),order=menuItem('在圆牌旁显示夜晚顺序',()=>{showNightOrder=!showNightOrder;render();$('gMenuNightOrder')?.focus({preventScroll:true});},'clock','gMenuNightOrder');order.classList.add('g-menu-wide');order.setAttribute('aria-pressed',String(showNightOrder));const check=node('span',showNightOrder?'✓':'','g-menu-check');check.setAttribute('aria-hidden','true');order.append(check);more.append(order);const special=menuItem('设置传奇 / 奇遇角色',()=>{close();aux.toggleLegend();},'crown'),bluff=menuItem('设置恶魔伪装',bluffs,'eye');for(const [b,n]of [[special,state.specials.length],[bluff,state.bluffs.filter(Boolean).length]]){const badge=node('small',String(n),'g-menu-count');badge.setAttribute('aria-hidden','true');b.append(badge);b.classList.add('g-menu-wide');}more.append(special,bluff);
   const nav=section('资料导航');for(const [text,url,icon]of [['首页','../index.html','home'],['入门教程','../index.html#site-guide','help'],['角色库','../role_index/角色索引.html','users'],['剧本库','../script_lib/剧本库.html','book'],['规则速查','../pages/规则概要.html','note'],['关于本站','../about.html','help']]){const a=node('a',undefined,'g-button g-menu-item');a.href=url;a.target='_blank';a.rel='noopener';a.append(menuIcon(icon),node('span',text,'g-menu-label'));a.title='在新标签页打开';nav.append(a);}
   const reset=section('重新开局'),restart=menuItem('重新开始本剧本',()=>replace(G.create(state.script,state.seats.length)),'trash');restart.classList.add('danger','g-menu-wide');reset.append(restart);body.append(node('p',phaseLabel()+' · '+state.seats.length+' 人 · 保存在此设备','g-menu-footer'));body.scrollTop=top;
  };sheetRefresh();
 }
 function restorePanel(){if(playerView)return;open('恢复魔典对局',host=>{const file=node('input');file.type='file';file.accept='.json,application/json';file.id='gRestoreFile';let candidate;const preview=node('p','','g-hint'),go=button('恢复这个对局',()=>{try{if(candidate)replace(candidate);}catch(e){error(e.message);}},'primary');go.id='gRestoreCommit';go.disabled=true;
  file.onchange=async()=>{const rev=modalRevision;go.disabled=true;candidate=null;try{const f=file.files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('对局备份不能超过 8 MB');const text=await f.text(),s=G.validate(JSON.parse(text));if(rev!==modalRevision)return;candidate=s;preview.textContent=s.script.name+' · '+s.seats.length+' 个座位 · '+phaseLabel(s)+'。确认后恢复；当前对局将先下载备份。';go.disabled=false;}catch(e){if(rev===modalRevision)error('备份无法恢复：'+e.message+'。当前对局未改变。');}};host.append(field('选择魔典对局备份',file),preview,go,hint('普通剧本 JSON 请从“选择剧本 → 导入 JSON”载入。'));
 });}
 try{
  if(!G||!C||!root.GrimoireAux||!root.GrimoireReminders||!root.CHARS||!root.PRESETS)throw Error('角色组件未加载，请检查网络后刷新。');
  state=G.create(C.preset(1),8);
  try{store=G.openStore(root.localStorage);const saved=store.read();if(saved)state=saved;}catch(e){blocked=true;dirty=true;$('gWarning').hidden=false;$('gWarningText').textContent='原魔典存档无法读取，已保留原始资料：'+e.message+'。当前操作不会自动覆盖它。';$('gSaveStatus').textContent='原存档已保护';}
  if(!blocked)save();
  aux=root.GrimoireAux.create({C,$,node,button,hint,field,error,open,close,apply,image,roleLabel,decorateToken,safeImage,random,dialog,getState:()=>state,isPlayer:()=>playerView,getRevision:()=>modalRevision});
  markers=root.GrimoireReminders.create({C,node,button,hint,open,close,apply,image,dialog,getState:()=>state,isPlayer:()=>playerView});
  $('gSeats').addEventListener('pointerdown',()=>{suppressSeatClickUntil=0;},true);
  $('gSeats').addEventListener('click',e=>{if(e.detail>0&&Date.now()<suppressSeatClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  $('gScript').onclick=scriptPanel;$('gAssign').onclick=distribution;$('gNight').onclick=nightPanel;$('gNotes').onclick=notes;$('gMenu').onclick=menu;$('gSheet').onclick=sheet;
  $('gHistory').onclick=history;$('gBluffs').onclick=bluffs;$('gFabled').onclick=fabled;$('gSeatMinus').onclick=()=>resizeSeats(state.seats.length-1);$('gSeatPlus').onclick=()=>resizeSeats(state.seats.length+1);
  $('gControlsToggle').onclick=()=>{const hidden=!$('gControlBody').hidden;$('gControlBody').hidden=hidden;$('gControlsToggle').textContent=hidden?'⌃':'⌄';$('gControlsToggle').setAttribute('aria-expanded',String(!hidden));$('gControlsToggle').setAttribute('aria-label',hidden?'展开对局控制':'收起对局控制');position();};
  $('gAdvance').onclick=()=>{if(state.phase==='setup'&&state.seats.some(s=>!s.roleId)&&!confirm('还有座位没有分配角色，仍进入第 1 夜？'))return;apply({type:'advance'});};
  $('gPlayerView').onclick=()=>{if(dialog.open)close();body.replaceChildren();playerView=!playerView;$('gToast').textContent='';render();if(dirty)save();};
  $('gLayout').onclick=()=>{listMode=!listMode;render();};$('gRetry').onclick=save;$('gBackupWarning').onclick=()=>backup();
  listMode=compactSeats();let previousWidth=innerWidth,previousHeight=innerHeight;
  root.addEventListener('resize',()=>{if((previousWidth>=700&&innerWidth<700||previousHeight>=600&&innerHeight<600)&&compactSeats()){listMode=true;render();}else position();previousWidth=innerWidth;previousHeight=innerHeight;});if(root.ResizeObserver)new ResizeObserver(position).observe($('gBoard'));render();
  root.WikiBeforeUpdate=()=>!dirty||save();
  root.addEventListener('resize',()=>{if(sheetFloating&&dialog.open){const r=dialog.getBoundingClientRect();clampSheet(r.left,r.top);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetFloating&&dialog.open){e.preventDefault();close();return;}if(e.key==='Escape'&&!dialog.open&&playerView){playerView=false;render();}});
 }catch(e){$('gWarning').hidden=false;$('gWarningText').textContent='魔典暂时无法启动：'+e.message;$('gSaveStatus').textContent='未启动';for(const b of app.querySelectorAll('button'))b.disabled=true;}
})(globalThis);
