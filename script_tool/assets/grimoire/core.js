/* Independent single-device grimoire state. No editor or night-viewer storage is written. */
(function(root){
 'use strict';
 const kind='clocktower-grimoire',key='botc_grimoire_v1';
 const teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
 const copy=v=>JSON.parse(JSON.stringify(v));
 function utf8Size(value){let size=0;for(const c of value){const n=c.codePointAt(0);size+=n<128?1:n<2048?2:n<65536?3:4;}return size;}
 function text(v,max,label,empty=true){if(typeof v!=='string'||v.length>max||(!empty&&!v.trim()))throw Error(label+'格式无效');return v;}
 function integer(v,min,max,label){if(!Number.isInteger(v)||v<min||v>max)throw Error(label+'超出范围');return v;}
 function role(value){
  if(!value||typeof value!=='object')throw Error('角色资料无效');
  const r={id:text(value.id,160,'角色 ID',false),name:text(value.name,120,'角色名称',false),team:value.team,ability:text(value.ability||'',20000,'角色能力'),image:text(value.image||'',2200000,'图标地址'),firstNight:value.firstNight??0,otherNight:value.otherNight??0,firstNightReminder:text(value.firstNightReminder||'',20000,'首夜提示'),otherNightReminder:text(value.otherNightReminder||'',20000,'其他夜晚提示'),reminders:value.reminders||[]};
  if(!teams.includes(r.team))throw Error('未知角色类型');
  if(value.setup!==undefined){if(typeof value.setup!=='boolean')throw Error('初始设置标记无效');r.setup=value.setup;}
  for(const field of ['firstNight','otherNight'])if(typeof r[field]!=='number'||!Number.isFinite(r[field])||r[field]<0||r[field]>100000)throw Error('夜序编号无效');
  if(!Array.isArray(r.reminders)||r.reminders.length>100)throw Error('提醒资料无效');r.reminders=r.reminders.map(v=>text(v,160,'提醒内容'));
  return r;
 }
 function script(value){
  if(!value||!Array.isArray(value.roles)||!value.roles.length||value.roles.length>1000)throw Error('请选择包含角色的剧本');
  const roles=value.roles.map(role);if(new Set(roles.map(r=>r.id)).size!==roles.length)throw Error('剧本包含重复角色 ID');
  const result={name:text(value.name||'未命名剧本',200,'剧本名称'),author:text(value.author||'',200,'作者'),roles,rules:text(value.rules||'',40000,'剧本规则')};if(value.logo!==undefined)result.logo=text(value.logo,10000,'剧本图标');return result;
 }
 function reminderDetail(v,roles){
  if(v==null)return null;if(typeof v!=='object'||Array.isArray(v)||!['role','poison','drunk','good','evil','custom'].includes(v.kind))throw Error('提示标记资料无效');
  const roleId=v.kind==='role'?text(v.roleId,160,'标记来源角色',false):'';if(roleId&&!roles.has(roleId))throw Error('提示标记来源不属于本剧本');const detail={kind:v.kind,roleId};if(v.flipped!==undefined&&typeof v.flipped!=='boolean')throw Error('提示标记翻转状态无效');if(v.flipped)detail.flipped=true;return detail;
 }
 function seat(id){return {id,name:'',roleId:'',alive:true,ghostVote:true,alignment:'unknown',reminders:[],reminderDetails:[],noteDraft:'',notes:[]};}
 function reviewStage(index){return {phase:index%2?'day':'night',round:Math.floor(index/2)+1,entries:[]};}
 function reviewData(value,phase,round){
  if(value===undefined)return {nextId:1,stages:Array.from({length:Math.max(1,round*2-(phase==='night'?1:0))},(_,i)=>reviewStage(i))};
  if(!value||typeof value!=='object'||!Array.isArray(value.stages))throw Error('复盘阶段无效');integer(value.nextId,1,Number.MAX_SAFE_INTEGER,'复盘记录编号');integer(value.stages.length,1,198,'复盘阶段数量');
  const ids=new Set();let total=0;
  const participant=p=>{if(!p||typeof p!=='object'||typeof p.seatId!=='string'||!/^seat_\d+$/.test(p.seatId)||p.seatId.length>25)throw Error('复盘玩家无效');integer(p.number,1,30,'复盘座位');text(p.name,40,'复盘玩家名称');text(p.roleId,160,'复盘角色');text(p.roleName,120,'复盘角色名称');if(!['unknown',...teams].includes(p.team))throw Error('复盘角色类型无效');return {seatId:p.seatId,number:p.number,name:p.name,roleId:p.roleId,roleName:p.roleName,team:p.team};};
  const stages=value.stages.map((stage,i)=>{
   const expected=reviewStage(i);if(!stage||stage.phase!==expected.phase||stage.round!==expected.round||!Array.isArray(stage.entries)||stage.entries.length>100)throw Error('复盘阶段顺序或记录数量无效');total+=stage.entries.length;if(total>2000)throw Error('本局最多 2000 条复盘记录');
   return {...expected,entries:stage.entries.map(e=>{
    if(!e||!['text','action'].includes(e.kind)||!Number.isFinite(e.at)||e.at<0)throw Error('复盘记录无效');integer(e.id,1,value.nextId-1,'复盘记录编号');if(ids.has(e.id))throw Error('复盘记录编号重复');ids.add(e.id);
    const base={id:e.id,kind:e.kind,at:e.at};if(e.kind==='text')return {...base,text:text(e.text,2000,'复盘文字',false)};
    if(!Array.isArray(e.targets)||e.targets.length>30||new Set(e.targets.map(p=>p?.seatId)).size!==e.targets.length)throw Error('复盘目标无效');
    return {...base,actor:e.actor===null?null:participant(e.actor),action:text(e.action,100,'复盘行动',false),targets:e.targets.map(participant),result:text(e.result,2000,'复盘结果')};
   })};
  });return {nextId:value.nextId,stages};
 }
 function create(value,count=8){
  integer(count,5,30,'座位数');const now=Date.now();
  return {kind,version:1,script:script(value),seats:Array.from({length:count},(_,i)=>seat('seat_'+(i+1))),phase:'setup',round:0,bluffs:[],specials:[],notes:'',progress:[],history:[],review:reviewData(undefined,'setup',0),revision:0,updatedAt:now};
 }
 function validate(value){
  if(!value||value.kind!==kind||value.version!==1)throw Error('不是受支持的在线魔典备份');
  const v=copy(value);if(utf8Size(JSON.stringify(v))>8*1024*1024)throw Error('对局备份超过 8 MB');v.script=script(v.script);
  if(!Array.isArray(v.seats))throw Error('座位资料无效');integer(v.seats.length,5,30,'座位数');
  const ids=new Set(),roles=new Map(v.script.roles.map(r=>[r.id,r]));
  v.seats.forEach(s=>{
   if(!s||typeof s.id!=='string'||!/^seat_\d+$/.test(s.id)||s.id.length>25||ids.has(s.id))throw Error('座位标识重复或无效');ids.add(s.id);
   text(s.name,40,'玩家名称');text(s.roleId,160,'玩家角色');if(s.roleId&&(!roles.has(s.roleId)||['fabled','loric'].includes(roles.get(s.roleId).team)))throw Error('座位包含不属于本剧本的玩家角色');
   if(typeof s.alive!=='boolean'||typeof s.ghostVote!=='boolean'||!['unknown','good','evil'].includes(s.alignment))throw Error('玩家状态无效');
   if(!Array.isArray(s.reminders)||s.reminders.length>20)throw Error('每个座位最多 20 个提醒');s.reminders.forEach(t=>text(t,100,'提醒内容',false));
   if(s.reminderDetails!==undefined&&(!Array.isArray(s.reminderDetails)||s.reminderDetails.length>s.reminders.length))throw Error('提示标记与提醒数量不一致');s.reminderDetails=s.reminders.map((_,i)=>reminderDetail(s.reminderDetails?.[i],roles));
   if(s.noteDraft===undefined)s.noteDraft='';text(s.noteDraft,2000,'玩家笔记草稿');if(s.notes===undefined)s.notes=[];
   if(!Array.isArray(s.notes)||s.notes.length>100)throw Error('每位玩家最多 100 条笔记');s.notes.forEach(n=>{if(!n||!['setup','day','night'].includes(n.phase)||!Number.isFinite(n.at)||n.at<0)throw Error('玩家笔记格式无效');text(n.text,2000,'玩家笔记',false);integer(n.round,0,99,'笔记天夜数');});
  });
  if(!['setup','day','night'].includes(v.phase))throw Error('对局阶段无效');integer(v.round,0,99,'天夜数');if(v.phase!=='setup'&&!v.round)throw Error('天夜数无效');
  if(!Array.isArray(v.bluffs)||v.bluffs.length>3||new Set(v.bluffs.filter(Boolean)).size!==v.bluffs.filter(Boolean).length||v.bluffs.some(id=>typeof id!=='string'||id!==''&&!roles.has(id)))throw Error('伪装角色无效');
  if(v.specials===undefined)v.specials=[];
  if(!Array.isArray(v.specials)||v.specials.length>30)throw Error('本局最多添加 30 个传奇或奇遇角色');
  v.specials=v.specials.map(s=>{const r=role(s);if(!['fabled','loric'].includes(r.team))throw Error('请选择传奇或奇遇角色');return {...r,custom:s.custom===true};});
  if(new Set(v.specials.map(r=>r.id)).size!==v.specials.length)throw Error('本局包含重复的传奇或奇遇角色');
  text(v.notes,8000,'说书人笔记');integer(v.revision,0,Number.MAX_SAFE_INTEGER,'修订号');if(!Number.isFinite(v.updatedAt)||v.updatedAt<0)throw Error('存档时间无效');
  if(!Array.isArray(v.progress)||v.progress.length>99)throw Error('夜间记录无效');const nights=new Set();
  v.progress.forEach(n=>{integer(n.night,1,99,'夜数');if(nights.has(n.night)||!Array.isArray(n.steps)||n.steps.length>30)throw Error('夜间记录重复或无效');nights.add(n.night);const seen=new Set();n.steps.forEach(s=>{if(!ids.has(s.seatId)||seen.has(s.seatId)||!['done','skipped'].includes(s.status))throw Error('行动记录无效');seen.add(s.seatId);});});
  if(!Array.isArray(v.history)||v.history.length>200)throw Error('操作记录无效');v.history.forEach(e=>{text(e.text,300,'操作记录');text(e.type,30,'操作类型');if(!Number.isFinite(e.at)||!['setup','day','night'].includes(e.phase))throw Error('操作记录格式无效');integer(e.round,0,99,'记录天夜数');});
  v.review=reviewData(v.review,v.phase,v.round);
  if(utf8Size(JSON.stringify(v))>8*1024*1024)throw Error('对局备份超过 8 MB');return v;
 }
 function playable(r){return !['fabled','loric'].includes(r.team);}
 function shuffle(values,random=Math.random){const a=values.slice();for(let i=a.length-1;i>0;i--){const n=random();if(typeof n!=='number'||n<0||n>=1)throw Error('随机源无效');const j=Math.floor(n*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 // Base setup only; orange-flower abilities are resolved manually by the Storyteller.
 // https://wiki.bloodontheclocktower.com/Setup
 function distributionCounts(count){
  const values={5:[3,0,1,1],6:[3,1,1,1],7:[5,0,1,1],8:[5,1,1,1],9:[5,2,1,1],10:[7,0,2,1],11:[7,1,2,1],12:[7,2,2,1],13:[9,0,3,1],14:[9,1,3,1],15:[9,2,3,1]}[count];
  return values?Object.fromEntries(['townsfolk','outsider','minion','demon'].map((team,i)=>[team,values[i]])):null;
 }
 function fillBag(roles,selected,count,{duplicates=false,candidateIds}={},random=Math.random){
  integer(count,5,30,'座位数');const map=new Map(roles.filter(playable).map(r=>[r.id,r]));
  if(!Array.isArray(selected)||selected.length>count||selected.some(id=>!map.has(id))||!duplicates&&new Set(selected).size!==selected.length)throw Error('待分配角色无效');
  if(candidateIds!==undefined&&(!Array.isArray(candidateIds)||candidateIds.some(id=>!map.has(id))))throw Error('候选角色无效');const candidates=candidateIds===undefined?null:new Set(candidateIds);
  const bag=selected.slice(),travellers=bag.filter(id=>map.get(id).team==='traveller').length,targets=distributionCounts(count-travellers);
  if(!targets)throw Error('随机补齐适用于 5–15 名非旅行者玩家；请先选择旅行者，或手动选角。');
  for(const [team,target]of Object.entries(targets)){
   const chosen=bag.filter(id=>map.get(id).team===team).length,needed=target-chosen;
   if(needed<0)throw Error('已选角色超出基础类型配比，请手动选满或减少后再随机补齐。');
   const pool=[...map.values()].filter(r=>r.team===team&&(!candidates||candidates.has(r.id))&&(duplicates||!bag.includes(r.id))).map(r=>r.id);
   if(needed&&(!pool.length||!duplicates&&pool.length<needed))throw Error('候选角色不足，无法按基础配置补齐；可手动选角、使用全角色库或允许重复。');
   for(let i=0;i<needed;i++){
    const n=random();if(typeof n!=='number'||n<0||n>=1)throw Error('随机源无效');const index=Math.floor(n*pool.length);bag.push(pool[index]);if(!duplicates)pool.splice(index,1);
   }
  }
  return bag;
 }
 function reduce(current,action,random){
  const s=validate(current),map=new Map(s.script.roles.map(r=>[r.id,r]));let message='';
  const target=()=>{const found=s.seats.find(x=>x.id===action.seatId);if(!found)throw Error('找不到这个座位');return found;};
  const name=p=>p.name||((s.seats.indexOf(p)+1)+' 号');
  const clearCurrent=id=>s.progress.forEach(n=>{if(n.night===s.round)n.steps=n.steps.filter(x=>x.seatId!==id);});
  switch(action.type){
   case 'name':{const p=target();p.name=text(action.name,40,'玩家名称');message='修改玩家名称';break;}
   case 'seatNoteDraft':{const p=target();p.noteDraft=text(action.text,2000,'玩家笔记草稿');message='更新 '+name(p)+' 的笔记草稿';break;}
   case 'seatNoteAdd':{const p=target();if(p.notes.length>=100)throw Error('每位玩家最多 100 条笔记');const value=text(action.text,2000,'玩家笔记',false).trim();p.notes.push({text:value,phase:s.phase,round:s.round,at:Date.now()});p.noteDraft='';message='为 '+name(p)+' 记下笔记';break;}
   case 'seatNoteRemove':{const p=target();integer(action.index,0,p.notes.length-1,'笔记位置');p.notes.splice(action.index,1);message='移除 '+name(p)+' 的一条笔记';break;}
   case 'assign':{const p=target();if(action.extraRole!==undefined){const extra=role(action.extraRole);if(!playable(extra)||extra.id!==action.roleId||map.has(extra.id))throw Error('新增角色必须是所选的剧本外玩家角色，不能覆盖本剧本资料');s.script.roles.push(extra);map.set(extra.id,extra);}const r=map.get(action.roleId);if(action.roleId&&(!r||!playable(r)))throw Error('请选择本剧本中的玩家角色');p.roleId=action.roleId;p.reminders=[];p.reminderDetails=[];p.alignment='unknown';clearCurrent(p.id);message=name(p)+'：'+(r?r.name:'清除角色');break;}
   case 'life':{const p=target();if(typeof action.alive!=='boolean')throw Error('生死状态无效');p.alive=action.alive;message=name(p)+(p.alive?'恢复存活':'标记死亡');break;}
   case 'vote':{const p=target();if(typeof action.available!=='boolean')throw Error('投票状态无效');p.ghostVote=action.available;message=name(p)+(p.ghostVote?'恢复投票标记':'使用投票标记');break;}
   case 'cycleStatus':{const p=target();if(p.alive){p.alive=false;p.ghostVote=true;message=name(p)+'标记死亡，死亡票可用';}else if(p.ghostVote){p.ghostVote=false;message=name(p)+'使用死亡票';}else{p.alive=true;p.ghostVote=true;message=name(p)+'恢复存活';}break;}
   case 'alignment':{if(!['unknown','good','evil'].includes(action.alignment))throw Error('阵营标记无效');const p=target();p.alignment=action.alignment;message='修改 '+name(p)+' 的阵营标记';break;}
   case 'reminderAdd':{const p=target();if(p.reminders.length>=20)throw Error('每个座位最多 20 个提醒');p.reminders.push(text(action.text,100,'提醒内容',false).trim());p.reminderDetails.push(reminderDetail(action.detail,map));message='为 '+name(p)+' 添加提醒';break;}
   case 'reminderRemove':{const p=target();integer(action.index,0,p.reminders.length-1,'提醒位置');p.reminders.splice(action.index,1);p.reminderDetails.splice(action.index,1);message='移除 '+name(p)+' 的提醒';break;}
   case 'reminderFlip':{const p=target();integer(action.index,0,p.reminders.length-1,'提醒位置');const i=action.index,d=p.reminderDetails[i]||{kind:new Map([['中毒','poison'],['醉酒','drunk'],['善良','good'],['邪恶','evil']]).get(p.reminders[i])||'custom',roleId:''};if(d.flipped)delete d.flipped;else d.flipped=true;p.reminderDetails[i]=d;message='翻转 '+name(p)+' 的提醒';break;}
   case 'move':{const p=target(),i=s.seats.indexOf(p);if(![-1,1].includes(action.delta))throw Error('移动方向无效');const j=(i+action.delta+s.seats.length)%s.seats.length;[s.seats[i],s.seats[j]]=[s.seats[j],s.seats[i]];message='调整座位顺序';break;}
   case 'swap':{const p=target(),i=s.seats.indexOf(p),j=s.seats.findIndex(x=>x.id===action.otherSeatId);if(j<0)throw Error('交换座位无效');[s.seats[i],s.seats[j]]=[s.seats[j],s.seats[i]];message='交换玩家座位';break;}
   case 'shuffleSeats':s.seats=shuffle(s.seats,random);message='打乱座位顺序（保留玩家资料）';break;
   case 'seatRemove':{const p=target();if(s.seats.length<=5)throw Error('至少保留 5 个座位');if(!action.force&&(p.name||p.roleId||p.reminders.length||p.notes.length||p.noteDraft))throw Error('此座位含玩家资料，请先确认');message='移除 '+name(p)+' 的座位';s.seats=s.seats.filter(x=>x.id!==p.id);s.progress.forEach(n=>{n.steps=n.steps.filter(x=>x.seatId!==p.id);});break;}
   case 'resize':{
    integer(action.count,5,30,'座位数');if(action.count<s.seats.length&&!action.force&&s.seats.slice(action.count).some(x=>x.name||x.roleId||x.reminders.length||x.notes.length||x.noteDraft))throw Error('移除的座位含玩家资料，请先确认并备份');
    let serial=Math.max(...s.seats.map(x=>Number(x.id.slice(5))));while(s.seats.length<action.count)s.seats.push(seat('seat_'+(++serial)));s.seats=s.seats.slice(0,action.count);
    const kept=new Set(s.seats.map(x=>x.id));s.progress.forEach(n=>{n.steps=n.steps.filter(x=>kept.has(x.seatId));});message='调整为 '+action.count+' 个座位';break;
   }
   case 'distribute':{
    if(action.extraRoles!==undefined){
     if(!Array.isArray(action.extraRoles)||action.extraRoles.length>1000)throw Error('新增角色资料无效');
     for(const value of action.extraRoles){const r=role(value);if(!playable(r)||map.has(r.id)||!action.roleIds?.includes(r.id))throw Error('新增角色必须是已选的剧本外玩家角色，不能覆盖本剧本资料');map.set(r.id,r);s.script.roles.push(r);}
    }
    if(!Array.isArray(action.roleIds)||!action.roleIds.length||action.roleIds.length>s.seats.length||action.partial!==true&&action.roleIds.length!==s.seats.length||action.roleIds.some(id=>!map.has(id)||!playable(map.get(id))))throw Error('所选角色数量无效，且必须属于本局剧本');
    const bag=shuffle(action.roleIds.concat(Array(s.seats.length-action.roleIds.length).fill('')),random);s.seats.forEach((p,i)=>{p.roleId=bag[i];p.reminders=[];p.reminderDetails=[];p.alignment='unknown';clearCurrent(p.id);});message='已随机分配 '+action.roleIds.length+' 个角色'+(action.roleIds.length<s.seats.length?'（其余座位留空）':'');break;
   }
   case 'advance':if(s.phase==='setup'){s.phase='night';s.round=1;}else if(s.phase==='night')s.phase='day';else{if(s.round>=99)throw Error('最多记录 99 夜');s.phase='night';s.round++;}while(s.review.stages.length<s.round*2-(s.phase==='night'?1:0))s.review.stages.push(reviewStage(s.review.stages.length));message=s.phase==='night'?'进入第 '+s.round+' 夜':'进入第 '+s.round+' 天';break;
   case 'reviewStageAdd':if(s.review.stages.length>=198)throw Error('最多记录 99 天夜');s.review.stages.push(reviewStage(s.review.stages.length));message='添加复盘阶段';break;
   case 'reviewStageRemove':if(s.review.stages.length<=1)throw Error('至少保留第 1 夜');if(s.review.stages.at(-1).entries.length&&!action.force)throw Error('阶段含复盘记录，请先确认删除');s.review.stages.pop();message='删除末尾复盘阶段';break;
   case 'reviewSave':{
    integer(action.stageIndex,0,s.review.stages.length-1,'复盘阶段');const stage=s.review.stages[action.stageIndex],index=action.entryId===undefined?-1:stage.entries.findIndex(e=>e.id===action.entryId),old=index<0?null:stage.entries[index];
    if(action.entryId!==undefined&&!old)throw Error('复盘记录已不存在');if(!old&&(stage.entries.length>=100||s.review.stages.reduce((n,x)=>n+x.entries.length,0)>=2000))throw Error('每阶段最多 100 条，本局最多 2000 条复盘记录');
    if(!old&&s.review.nextId>=Number.MAX_SAFE_INTEGER)throw Error('复盘记录编号超出范围');const entry={id:old?.id??s.review.nextId++,kind:action.kind,at:old?.at??Date.now()};
    const snapshot=(id,previous)=>{if(previous?.seatId===id)return previous;const p=s.seats.find(x=>x.id===id);if(!p)throw Error('复盘玩家已不存在，请重新选择');const r=map.get(p.roleId);return {seatId:p.id,number:s.seats.indexOf(p)+1,name:p.name,roleId:p.roleId,roleName:r?.name||'',team:r?.team||'unknown'};};
    if(entry.kind==='text')entry.text=text(action.text,2000,'复盘文字',false).trim();else if(entry.kind==='action'){
     entry.actor=action.actorSeatId?snapshot(action.actorSeatId,old?.actor):null;entry.action=text(action.action,100,'复盘行动',false).trim();entry.result=text(action.result??'',2000,'复盘结果').trim();
     if(!Array.isArray(action.targetSeatIds)||action.targetSeatIds.length>30||new Set(action.targetSeatIds).size!==action.targetSeatIds.length)throw Error('复盘目标无效');entry.targets=action.targetSeatIds.map(id=>snapshot(id,old?.targets?.find(p=>p.seatId===id)));
    }else throw Error('复盘记录类型无效');if(index<0)stage.entries.push(entry);else stage.entries[index]=entry;message=old?'编辑复盘记录':'添加复盘记录';break;
   }
   case 'reviewRemove':{integer(action.stageIndex,0,s.review.stages.length-1,'复盘阶段');const entries=s.review.stages[action.stageIndex].entries,index=entries.findIndex(e=>e.id===action.entryId);if(index<0)throw Error('复盘记录已不存在');entries.splice(index,1);message='删除复盘记录';break;}
   case 'nightMark':{
    if(s.phase!=='night'||!['done','skipped','pending'].includes(action.status))throw Error('请在夜间记录行动');const p=target();if(!nightQueue(s).some(x=>x.seat.id===p.id))throw Error('这个座位没有当前夜的行动');
    let n=s.progress.find(x=>x.night===s.round);if(!n){n={night:s.round,steps:[]};s.progress.push(n);}n.steps=n.steps.filter(x=>x.seatId!==p.id);if(action.status!=='pending')n.steps.push({seatId:p.id,status:action.status});message=name(p)+' 的行动：'+({done:'完成',skipped:'跳过',pending:'撤回'})[action.status];break;
   }
   case 'notes':s.notes=text(action.text,8000,'说书人笔记');message='更新说书人笔记';break;
   case 'bluffs':if(!Array.isArray(action.roleIds))throw Error('伪装资料无效');s.bluffs=action.roleIds.slice();message='更新恶魔伪装';break;
   case 'bluffSet':{
    integer(action.slot,0,2,'伪装位置');const id=text(action.roleId,160,'伪装角色'),r=map.get(id);if(id&&(!r||!['townsfolk','outsider'].includes(r.team)))throw Error('伪装只能选择本剧本中的镇民或外来者');
    const slots=Array.from({length:3},(_,i)=>s.bluffs[i]||'');if(id&&slots.some((v,i)=>i!==action.slot&&v===id))throw Error('这个角色已在其他伪装格中');slots[action.slot]=id;while(slots.length&&!slots.at(-1))slots.pop();s.bluffs=slots;message='第 '+(action.slot+1)+' 个恶魔伪装：'+(r?r.name:'清除');break;
   }
   case 'specialAdd':{
    const r=role(action.role);if(!['fabled','loric'].includes(r.team))throw Error('请选择传奇或奇遇角色');if(s.specials.some(x=>x.id===r.id))throw Error('本局已经添加这个角色');s.specials.push({...r,custom:action.custom===true});message='添加本局'+(r.team==='fabled'?'传奇':'奇遇')+'：'+r.name;break;
   }
   case 'specialUpdate':{
    const i=s.specials.findIndex(r=>r.id===action.roleId);if(i<0)throw Error('找不到这个本局特殊角色');const r=role({...s.specials[i],...action.patch,id:action.roleId});if(!['fabled','loric'].includes(r.team))throw Error('请选择传奇或奇遇角色');s.specials[i]={...r,custom:true};message='修改本局特殊角色：'+r.name;break;
   }
   case 'specialRemove':{const i=s.specials.findIndex(r=>r.id===action.roleId);if(i<0)throw Error('找不到这个本局特殊角色');message='移除本局特殊角色：'+s.specials[i].name;s.specials.splice(i,1);break;}
   default:throw Error('未知对局操作');
  }
  s.revision++;s.updatedAt=Date.now();const last=s.history.at(-1);
  if(last&&['notes','name','seatNoteDraft'].includes(action.type)&&last.type===action.type&&last.text===message&&last.phase===s.phase&&last.round===s.round)last.at=s.updatedAt;
  else s.history.push({type:action.type,text:message,at:s.updatedAt,phase:s.phase,round:s.round});s.history=s.history.slice(-200);
  return validate(s);
 }
 function nightOrder(s,{first=s.round<=1,all=false}={}){
  const field=first?'firstNight':'otherNight',current=s.phase==='night'&&(s.round===1)===first,records=current?s.progress.find(x=>x.night===s.round)?.steps||[]:[];
  const entries=all?s.script.roles.map((role,index)=>({role,index,seat:null,seats:s.seats.filter(p=>p.roleId===role.id)})):s.seats.map((seat,index)=>({seat,index,seats:[seat],role:s.script.roles.find(r=>r.id===seat.roleId)}));
  return entries.filter(x=>x.role&&!['fabled','loric'].includes(x.role.team)&&x.role[field]>0).sort((a,b)=>a.role[field]-b.role[field]||a.index-b.index).map(x=>({...x,order:x.role[field],reminder:x.role[first?'firstNightReminder':'otherNightReminder'],status:x.seat?records.find(y=>y.seatId===x.seat.id)?.status||'pending':'pending'}));
 }
 function nightQueue(s){return s.phase==='night'?nightOrder(s,{first:s.round===1}):[];}
 function nightActions(s,options){
  const groups=new Map();for(const entry of nightOrder(s,options)){let group=groups.get(entry.role.id);if(!group){group={...entry,seats:[],steps:[]};groups.set(entry.role.id,group);}group.seats.push(...entry.seats);for(const seat of entry.seats)group.steps.push({seat,status:entry.seat?entry.status:'pending'});}
  return [...groups.values()].map(group=>({...group,seat:group.seats.length===1?group.seats[0]:null,status:group.steps.length?(group.steps.every(x=>x.status===group.steps[0].status)?group.steps[0].status:'mixed'):'pending'}));
 }
 function counts(s){const by={townsfolk:0,outsider:0,minion:0,demon:0,traveller:0};s.seats.forEach(p=>{const r=s.script.roles.find(r=>r.id===p.roleId);if(r&&r.team in by)by[r.team]++;});return {alive:s.seats.filter(p=>p.alive).length,eligible:s.seats.filter(p=>p.alive||p.ghostVote).length,assigned:s.seats.filter(p=>p.roleId).length,by};}
 function publicView(s){return {script:{name:s.script.name,author:s.script.author,...(s.script.logo!==undefined?{logo:s.script.logo}:{})},phase:s.phase,round:s.round,seats:s.seats.map(({id,name,alive,ghostVote})=>({id,name,alive,ghostVote})),specials:(s.specials||[]).map(({id,name,team,ability,image})=>({id,name,team,ability,image})),alive:counts(s).alive,eligible:counts(s).eligible};}
 function openStore(storage){let previous=storage.getItem(key);return {read:()=>previous?validate(JSON.parse(previous)):null,save(value){if(storage.getItem(key)!==previous)throw Error('另一页面已更新此魔典，请先备份当前对局，再刷新');const next=JSON.stringify(validate(value));storage.setItem(key,next);previous=next;}};}
 const api={kind,key,create,validate,reduce,nightOrder,nightQueue,nightActions,counts,publicView,openStore,shuffle,distributionCounts,fillBag};root.ClocktowerGrimoire=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
