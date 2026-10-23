/* Independent single-device grimoire state. No editor or night-viewer storage is written. */
(function(root){
 'use strict';
 const kind='clocktower-grimoire',key='botc_grimoire_v1';
 const teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
 const reviewSourceActions=['中毒（因某个玩家的能力中毒了）','醉酒（因某个玩家的能力醉酒了）','因某个玩家而不会死亡','被处决，但不会死亡（因玩家的能力）','因某个玩家的能力而复活'];
 const reviewReferenceActions=['声称自己的角色','获得了能力','以为自己获得了能力'];
 const reviewActorGroups=['all','townsfolk','minions','good','evil'];
 const copy=v=>JSON.parse(JSON.stringify(v));
 // Keep full images in memory for renderers, but store each embedded image only once.
 function packImages(value){if(value?.imageAssets)value=unpackImages(value);const assets={},seen=new Map();const packed=JSON.parse(JSON.stringify(value,(key,v)=>{if(key==='imageAssets')return undefined;if(key==='image'&&typeof v==='string'&&/^data:image\//i.test(v)){let id=seen.get(v);if(!id){id='image_'+(seen.size+1);seen.set(v,id);assets[id]=v;}return {imageAsset:id};}return v;}));if(seen.size)packed.imageAssets=assets;return packed;}
 function unpackImages(value){const assets=value?.imageAssets;const result=JSON.parse(JSON.stringify(value),(key,v)=>{if(key==='image'&&v&&typeof v==='object'){const id=v.imageAsset;if(typeof id!=='string'||!/^image_\d+$/.test(id)||!Object.hasOwn(assets||{},id)||typeof assets[id]!=='string'||!/^data:image\//i.test(assets[id])||assets[id].length>2200000)throw Error('存档图标引用无效');return assets[id];}return v;});delete result.imageAssets;return result;}
 const serialize=value=>JSON.stringify(packImages(value));
 const newGameId=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
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
  if(v==null)return null;if(typeof v!=='object'||Array.isArray(v)||!['role','poison','drunk','protected','good','evil','custom'].includes(v.kind))throw Error('提示标记资料无效');
  const roleId=v.kind==='role'?text(v.roleId,160,'标记来源角色',false):'';if(roleId&&roles&&!roles.has(roleId))throw Error('提示标记来源不属于本剧本');const detail={kind:v.kind,roleId};if(v.flipped!==undefined&&typeof v.flipped!=='boolean')throw Error('提示标记翻转状态无效');if(v.flipped)detail.flipped=true;
  if(v.expiry!==undefined){const e=v.expiry;if(!e||!['dawn','dusk','action'].includes(e.when))throw Error('标记到期条件无效');detail.expiry={when:e.when,stage:integer(e.stage,0,199,'标记到期阶段')};if(e.when==='action'){if(typeof e.seatId!=='string'||!/^seat_\d+$/.test(e.seatId)||e.seatId.length>25)throw Error('标记到期玩家无效');detail.expiry.seatId=e.seatId;if(e.due!==undefined&&typeof e.due!=='boolean')throw Error('标记到期状态无效');if(e.due)detail.expiry.due=true;}}return detail;
 }
 function phaseIndex(s){return s.phase==='setup'?-1:s.round*2-(s.phase==='night'?2:1);}
 function expiryFor(s,when,seatId){if(when==='none'||when===undefined)return undefined;if(!['dawn','dusk','action'].includes(when))throw Error('标记到期条件无效');const current=phaseIndex(s);if(when==='action'){if(!s.seats.some(p=>p.id===seatId))throw Error('请选择下次行动的玩家');return {when,stage:Math.max(0,current),seatId};}let stage=current+1;while(stage%2!==(when==='dawn'?1:0))stage++;return {when,stage};}
 function reminderIsDue(s,detail){const e=detail?.expiry;return !!e&&(e.when==='action'?e.due===true:phaseIndex(s)>=e.stage);}
 function timedReminders(s){return s.seats.flatMap((p,i)=>p.reminders.flatMap((text,index)=>{const detail=p.reminderDetails[index];return detail?.expiry?[{seatId:p.id,number:i+1,name:p.name,index,text,detail:copy(detail),due:reminderIsDue(s,detail),signature:JSON.stringify([p.id,index,text,detail])}]:[];}));}
 function markExpiryAction(s,id){for(const p of s.seats)for(const d of p.reminderDetails)if(d?.expiry?.when==='action'&&d.expiry.seatId===id)d.expiry.due=true;}
 // Replay frames contain only board facts, never notes or an entire copy of the game.
 function boardFrame(s){return {at:Date.now(),players:s.seats.map(p=>({...participantSnapshot(s,p),alive:p.alive,ghostVote:p.ghostVote,alignment:p.alignment,reminders:copy(p.reminders),reminderDetails:copy(p.reminderDetails)}))};}
 function validateFrame(frame){
  if(!frame||!Number.isFinite(frame.at)||frame.at<0||!Array.isArray(frame.players)||frame.players.length<5||frame.players.length>30)throw Error('回放快照无效');
  const players=frame.players.map(p=>{const result=reviewParticipant(p);if(typeof p.alive!=='boolean'||typeof p.ghostVote!=='boolean'||!['unknown','good','evil'].includes(p.alignment)||!Array.isArray(p.reminders)||p.reminders.length>20||!Array.isArray(p.reminderDetails)||p.reminderDetails.length!==p.reminders.length)throw Error('回放玩家状态无效');return {...result,alive:p.alive,ghostVote:p.ghostVote,alignment:p.alignment,reminders:p.reminders.map(t=>text(t,100,'回放提醒',false)),reminderDetails:p.reminderDetails.map(d=>reminderDetail(d,null))};});if(new Set(players.map(p=>p.seatId)).size!==players.length||new Set(players.map(p=>p.number)).size!==players.length)throw Error('回放玩家重复');return {at:frame.at,players};
 }
 function captureReplay(s,opening=false){const index=phaseIndex(s);if(index<0)return;s.replay||={stages:[]};while(s.replay.stages.length<=index)s.replay.stages.push(null);const frame=boardFrame(s);if(!s.replay.stages[index])s.replay.stages[index]={start:frame,end:copy(frame),partial:!opening};else s.replay.stages[index].end=frame;}
 function replayFrame(s,index,point='end'){
  integer(index,0,197,'回放阶段');if(!['start','end'].includes(point))throw Error('回放视点无效');const stage=s.replay?.stages[index],live=phaseIndex(s)===index;
  if(point==='end'&&live)return {...boardFrame(s),complete:true,live:true};if(stage)return {...copy(stage[point]),complete:true,partial:stage.partial&&point==='start',live:false};
  const players=(s.review.stages[index]?.players||s.review.initialRoster?.players||[]).map(p=>({...copy(p),alive:null,ghostVote:null,alignment:'unknown',reminders:null,reminderDetails:null}));return {players,complete:false,live:false};
 }
 function seat(id){return {id,name:'',roleId:'',alive:true,ghostVote:true,alignment:'unknown',reminders:[],reminderDetails:[],noteDraft:'',notes:[]};}
 // A summary compares the two recorded endpoints; it never infers an event from role rules.
 function stageChanges(s,index){
  const start=replayFrame(s,index,'start'),end=replayFrame(s,index,'end');
  if(!start.complete||!end.complete||start.partial)return {complete:false,changes:[],notice:start.partial?'阶段开始为中途快照，无法完整比较本阶段变化。':'缺少完整阶段快照，无法可靠比较变化。'};
  const identity=p=>JSON.stringify([p.roleId,p.roleName,p.team]);
  const changes=[],prior=new Map(start.players.map(p=>[p.seatId,p])),label=p=>p.number+'号'+(p.name?' '+p.name:'');
  const add=(p,kind,text)=>changes.push({seatId:p.seatId,number:p.number,kind,text:label(p)+text});
  const marks=p=>{const m=new Map();p.reminders.forEach((t,i)=>{const d=p.reminderDetails[i],key=JSON.stringify([t,d?.kind||'',d?.roleId||'']);const v=m.get(key)||{text:t,count:0};v.count++;m.set(key,v);});return m;};
  for(const p of end.players){const before=prior.get(p.seatId);if(!before){add(p,'joined','加入魔典');continue;}prior.delete(p.seatId);
   if(before.alive!==p.alive)add(p,p.alive?'revived':'died',p.alive?'恢复存活':'死亡');
   if(identity(before)!==identity(p)||before.role&&p.role&&before.role.ability!==p.role.ability)add(p,'role','由'+(before.roleName||'空白')+'变为'+(p.roleName||'空白')+(before.roleId===p.roleId&&before.roleName===p.roleName?'（能力版本变化）':''));
   if(before.alignment!==p.alignment)add(p,'alignment','阵营标记变为'+({good:'善良',evil:'邪恶',unknown:'未标记'})[p.alignment]);
   if(before.number!==p.number)add(p,'seat','从'+before.number+'号移至'+p.number+'号');
   if(before.ghostVote!==p.ghostVote)add(p,'vote',p.ghostVote?'恢复死亡票':'使用死亡票');
   const a=marks(before),b=marks(p);for(const [key,v]of a){const n=v.count-(b.get(key)?.count||0);if(n>0)add(p,'markerRemoved','移除标记“'+v.text+'”'+(n>1?' ×'+n:''));}for(const [key,v]of b){const n=v.count-(a.get(key)?.count||0);if(n>0)add(p,'markerAdded','添加标记“'+v.text+'”'+(n>1?' ×'+n:''));}
   if(JSON.stringify(before.reminders)===JSON.stringify(p.reminders)&&JSON.stringify(before.reminderDetails)!==JSON.stringify(p.reminderDetails))add(p,'markerSettings','调整标记来源、翻转或到期设置');
  }
  for(const p of prior.values())add(p,'left','离开魔典');return {complete:true,changes,notice:changes.length?'阶段开始与结束的净变化；中途发生后又恢复的变化请查看记录。':'阶段开始与结束没有状态差异；中途变化请查看记录。'};
 }
 function boardLink(value){
  if(!value||!['review','board'].includes(value.source)||!Number.isFinite(value.at)||value.at<0||!Array.isArray(value.seatIds)||!value.seatIds.length||value.seatIds.length>30||new Set(value.seatIds).size!==value.seatIds.length||value.seatIds.some(id=>typeof id!=='string'||!/^seat_\d+$/.test(id)||id.length>25))throw Error('复盘联动资料无效');
  return {source:value.source,at:value.at,revision:integer(value.revision,1,Number.MAX_SAFE_INTEGER,'联动修订号'),seatIds:value.seatIds.slice()};
 }
 const roleDefinition=role;
 const boardActions=['死亡了','复活了','因某个玩家的能力而复活','中毒（简单记录）','中毒（因某个玩家的能力中毒了）','醉酒（简单记录）','醉酒（因某个玩家的能力醉酒了）','恢复健康了','恢复清醒了','角色变化','阵营变化','角色和阵营变化'];
 function canLinkReview(entry){return entry.kind==='action'&&!!entry.actor&&!entry.actorGroup&&boardActions.includes(entry.action);}
 function linkReview(s,entry,action){
  if(action.stageIndex!==phaseIndex(s))throw Error('过去或未来阶段只能记录，不能更新当前魔典');
  if(!canLinkReview(entry))throw Error('这项行动不能联动魔典，请仅记录');
  const p=s.seats.find(p=>p.id===entry.actor.seatId),r=p&&s.script.roles.find(r=>r.id===p.roleId);
  if(!p||p.roleId!==entry.actor.roleId||r&&entry.actor.role&&JSON.stringify(reviewRole(r))!==JSON.stringify(entry.actor.role))throw Error('当前玩家身份与记录不一致，请仅记录或重新选择');
  const name=entry.action;
  if(name==='死亡了')p.alive=false;
  else if(['复活了','因某个玩家的能力而复活'].includes(name))p.alive=true;
  else if(name.startsWith('中毒')||name.startsWith('醉酒')){
   const poison=name.startsWith('中毒'),kind=poison?'poison':'drunk',text=poison?'中毒':'醉酒';let i=p.reminders.findIndex((t,i)=>p.reminderDetails[i]?.kind===kind||!p.reminderDetails[i]&&t===text);
   if(i<0){if(p.reminders.length>=20)throw Error('每个座位最多 20 个提醒');i=p.reminders.length;p.reminders.push(text);p.reminderDetails.push({kind,roleId:''});}
   if(action.expiryWhen==='none'&&p.reminderDetails[i]?.expiry)delete p.reminderDetails[i].expiry;
   if(action.expiryWhen&&action.expiryWhen!=='none')p.reminderDetails[i]={...(p.reminderDetails[i]||{kind,roleId:''}),expiry:expiryFor(s,action.expiryWhen,action.expirySeatId||p.id)};
  }else if(['恢复健康了','恢复清醒了'].includes(name)){
   const kind=name==='恢复健康了'?'poison':'drunk',label=kind==='poison'?'中毒':'醉酒';for(let i=p.reminders.length-1;i>=0;i--)if(p.reminderDetails[i]?.kind===kind||!p.reminderDetails[i]&&p.reminders[i]===label){p.reminders.splice(i,1);p.reminderDetails.splice(i,1);}
  }else{
   if(entry.changedRole!==undefined){const role=entry.changedRole,existing=role&&s.script.roles.find(r=>r.id===role.id);if(existing&&JSON.stringify(reviewRole(existing))!==JSON.stringify(role))throw Error('同 ID 角色能力版本不同，不能覆盖本局角色');if(role&&!existing){if(!action.extraRole)throw Error('缺少完整角色定义，请先将此角色加入魔典后再记录');const extra=roleDefinition(action.extraRole);if(JSON.stringify(reviewRole(extra))!==JSON.stringify(role))throw Error('新增角色定义与记录不一致');s.script.roles.push(extra);}p.roleId=role?.id||'';p.reminders=[];p.reminderDetails=[];p.alignment='unknown';for(const n of s.progress)if(n.night===s.round)n.steps=n.steps.filter(x=>x.seatId!==p.id);}
   if(entry.changedAlignment!==undefined)p.alignment=entry.changedAlignment;
  }
  entry.boardLink={source:'review',at:Date.now(),revision:s.revision+1,seatIds:[p.id]};
 }
 function reviewRole(value){const r=role(value);if(!playable(r))throw Error('请选择玩家角色');return {id:r.id,name:r.name,team:r.team,ability:r.ability,image:r.image};}
 function reviewInformedRoles(value){if(!Array.isArray(value)||value.length!==3)throw Error('请选择三个不在场角色');return Array.from(value,r=>r===null?null:reviewRole(r));}
 function reviewAbility(value,entry){
  if(!value||typeof value!=='object'||Array.isArray(value)||!root.GrimoireReviewActions)throw Error('角色能力行动资料无效');
  const result={key:text(value.key,100,'能力行动类型',false),role:reviewRole(value.role)};
  if(value.selectedRole!==undefined)result.selectedRole=reviewRole(value.selectedRole);
  if(value.selectedRoles!==undefined){if(!Array.isArray(value.selectedRoles)||value.selectedRoles.length>30)throw Error('能力角色列表无效');result.selectedRoles=Array.from(value.selectedRoles,reviewRole);}
  if(value.texts!==undefined){if(!Array.isArray(value.texts)||value.texts.length>4)throw Error('能力信息格式无效');result.texts=Array.from(value.texts,t=>text(t,2000,'能力信息',false));}
  if(value.number!==undefined)result.number=integer(value.number,0,999,'能力信息数字');
  if(value.choice!==undefined)result.choice=text(value.choice,100,'能力结果',false);
  root.GrimoireReviewActions.validate({...entry,abilityAction:result});return result;
 }
 function reviewStage(index){return {phase:index%2?'day':'night',round:Math.floor(index/2)+1,entries:[]};}
 function reviewParticipant(p){if(!p||typeof p!=='object'||typeof p.seatId!=='string'||!/^seat_\d+$/.test(p.seatId)||p.seatId.length>25)throw Error('复盘玩家无效');integer(p.number,1,30,'复盘座位');text(p.name,40,'复盘玩家名称');text(p.roleId,160,'复盘角色');text(p.roleName,120,'复盘角色名称');if(!['unknown',...teams].includes(p.team))throw Error('复盘角色类型无效');const result={seatId:p.seatId,number:p.number,name:p.name,roleId:p.roleId,roleName:p.roleName,team:p.team};if(p.role!==undefined){result.role=reviewRole(p.role);if(result.role.id!==p.roleId||result.role.name!==p.roleName||result.role.team!==p.team)throw Error('复盘角色快照与玩家身份不符');}return result;
 }
 function participantSnapshot(s,p){const r=s.script.roles.find(r=>r.id===p.roleId);return {seatId:p.id,number:s.seats.indexOf(p)+1,name:p.name,roleId:p.roleId,roleName:r?.name||'',team:r?.team||'unknown',...(r?{role:reviewRole(r)}:{})};}
 function withRole(p,r){const result={...p,roleId:r?.id||'',roleName:r?.name||'',team:r?.team||'unknown'};if(r)result.role=reviewRole(r);else delete result.role;return result;}
 function reviewRoster(s,stageIndex){
  const liveIndex=s.phase==='setup'?0:s.round*2-(s.phase==='night'?2:1);
  if(stageIndex>=liveIndex)return s.seats.map(p=>participantSnapshot(s,p));
  const roster=new Map((s.review.initialRoster?.players||[]).map(p=>[p.seatId,copy(p)]));
  for(let i=0;i<=stageIndex;i++){const stage=s.review.stages[i];if(!stage)break;if(stage.players){roster.clear();stage.players.forEach(p=>roster.set(p.seatId,copy(p)));}for(const e of stage.entries){for(const p of [e.actor,...(e.targets||[]),e.source].filter(Boolean))if(!stage.players||!roster.has(p.seatId))roster.set(p.seatId,copy(p));if(e.actor&&Object.hasOwn(e,'changedRole'))roster.set(e.actor.seatId,withRole(e.actor,e.changedRole));}}
  return roster.size?[...roster.values()]:s.seats.map(p=>participantSnapshot(s,p));
 }
 function reviewData(value,phase,round){
  if(value===undefined)return {nextId:1,stages:Array.from({length:Math.max(1,round*2-(phase==='night'?1:0))},(_,i)=>reviewStage(i))};
  if(!value||typeof value!=='object'||!Array.isArray(value.stages))throw Error('复盘阶段无效');integer(value.nextId,1,Number.MAX_SAFE_INTEGER,'复盘记录编号');integer(value.stages.length,1,198,'复盘阶段数量');
  const ids=new Set();let total=0;
  const participant=reviewParticipant;
  const stages=value.stages.map((stage,i)=>{
   const expected=reviewStage(i);if(!stage||stage.phase!==expected.phase||stage.round!==expected.round||!Array.isArray(stage.entries)||stage.entries.length>100)throw Error('复盘阶段顺序或记录数量无效');total+=stage.entries.length;if(total>2000)throw Error('本局最多 2000 条复盘记录');
   const players=stage.players?.map(participant);if(players&&(players.length<5||players.length>30||new Set(players.map(p=>p.seatId)).size!==players.length))throw Error('阶段玩家身份无效');
   return {...expected,...(players?{players}:{}),entries:stage.entries.map(e=>{
    if(!e||!['text','action'].includes(e.kind)||!Number.isFinite(e.at)||e.at<0)throw Error('复盘记录无效');integer(e.id,1,value.nextId-1,'复盘记录编号');if(ids.has(e.id))throw Error('复盘记录编号重复');ids.add(e.id);
    const base={id:e.id,kind:e.kind,at:e.at};if(e.kind==='text')return {...base,text:text(e.text,2000,'复盘文字',false)};
    if(!Array.isArray(e.targets)||e.targets.length>30||new Set(e.targets.map(p=>p?.seatId)).size!==e.targets.length&&!root.GrimoireReviewActions?.get(e.abilityAction?.key)?.allowRepeatedTargets)throw Error('复盘目标无效');
    const entry={...base,actor:e.actor===null?null:participant(e.actor),action:text(e.action,100,'复盘行动',false),targets:e.targets.map(participant),result:text(e.result,2000,'复盘结果')};if(e.votes!==undefined){if(entry.action!=='提名玩家（记录票数）'||entry.targets.length!==1)throw Error('票数只适用于单个玩家的提名记录');entry.votes=integer(e.votes,0,999,'提名票数');}if(e.source!==undefined){if(!reviewSourceActions.includes(entry.action))throw Error('这项复盘行动不使用来源玩家');entry.source=participant(e.source);}
    if(e.actorGroup!==undefined){if(entry.actor!==null||!reviewActorGroups.includes(e.actorGroup))throw Error('复盘群体对象无效');entry.actorGroup=e.actorGroup;if(e.actorGroup==='minions'&&entry.action==='一起决定由谁照顾小怪宝'&&entry.targets.length!==1)throw Error('请选择 1 名照顾小怪宝的玩家');}
    if(e.changedRole!==undefined){if(!['角色变化','角色和阵营变化'].includes(entry.action))throw Error('这项行动不记录角色变化');entry.changedRole=e.changedRole===null?null:reviewRole(e.changedRole);}
    if(e.selectedRole!==undefined){if(!reviewReferenceActions.includes(entry.action))throw Error('这项行动不记录声称角色或能力角色');entry.selectedRole=e.selectedRole===null?null:reviewRole(e.selectedRole);}
    if(e.informedRoles!==undefined){if(entry.action!=='告知玩家：3个不在场角色'||entry.actor!==null||entry.actorGroup!==undefined||entry.targets.length!==1)throw Error('三个不在场角色需要由说书人告知一名玩家');entry.informedRoles=reviewInformedRoles(e.informedRoles);}
    if(e.abilityAction!==undefined)entry.abilityAction=reviewAbility(e.abilityAction,entry);
    if(e.changedAlignment!==undefined){if(!['阵营变化','角色和阵营变化'].includes(entry.action)||!['good','evil'].includes(e.changedAlignment))throw Error('复盘阵营变化无效');entry.changedAlignment=e.changedAlignment;}
    if(e.boardLink!==undefined)entry.boardLink=boardLink(e.boardLink);if(e.followupOf!==undefined){entry.followupOf=integer(e.followupOf,1,value.nextId-1,'补记来源');if(entry.followupOf===entry.id)throw Error('补记来源不能是记录本身');}return entry;
   })};
  });const result={nextId:value.nextId,stages};if(value.initialRoster!==undefined){const roster=value.initialRoster;if(!roster||!['start','firstRecord'].includes(roster.source)||!Array.isArray(roster.players)||roster.players.length>30||roster.players.length<5)throw Error('复盘起始身份无效');const players=roster.players.map(participant);if(new Set(players.map(p=>p.seatId)).size!==players.length||new Set(players.map(p=>p.number)).size!==players.length)throw Error('复盘起始玩家重复');result.initialRoster={source:roster.source,players};}return result;
 }
 function create(value,count=8){
  integer(count,5,30,'座位数');const now=Date.now();
  return {kind,version:1,gameId:newGameId(),nextSeatId:count+1,script:script(value),seats:Array.from({length:count},(_,i)=>seat('seat_'+(i+1))),phase:'setup',round:0,bluffs:[],specials:[],notes:'',progress:[],history:[],review:reviewData(undefined,'setup',0),revision:0,updatedAt:now};
 }
 function validate(value){
  if(!value||value.kind!==kind||value.version!==1)throw Error('不是受支持的在线魔典备份');
  if(utf8Size(value.imageAssets?JSON.stringify(value):serialize(value))>8*1024*1024)throw Error('对局备份超过 8 MB');const v=unpackImages(value);v.script=script(v.script);v.gameId=v.gameId===undefined?newGameId():text(v.gameId,100,'对局标识',false);
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
  if(v.replay!==undefined){if(!v.replay||!Array.isArray(v.replay.stages)||v.replay.stages.length>198)throw Error('回放阶段无效');v.replay={stages:v.replay.stages.map(stage=>{if(stage===null)return null;if(typeof stage?.partial!=='boolean')throw Error('回放快照来源无效');return {start:validateFrame(stage.start),end:validateFrame(stage.end),partial:stage.partial};})};}
  let highest=Math.max(...v.seats.map(p=>integer(Number(p.id.slice(5)),1,Number.MAX_SAFE_INTEGER-1,'玩家永久编号')));const scan=x=>{if(!x||typeof x!=='object')return;for(const [k,item]of Object.entries(x)){if(k==='seatId'&&typeof item==='string'&&/^seat_\d+$/.test(item))highest=Math.max(highest,integer(Number(item.slice(5)),1,Number.MAX_SAFE_INTEGER-1,'玩家永久编号'));else if(item&&typeof item==='object')scan(item);}};scan(v.review);scan(v.replay);scan(v.seats.map(p=>p.reminderDetails));v.nextSeatId=Math.max(v.nextSeatId===undefined?1:integer(v.nextSeatId,1,Number.MAX_SAFE_INTEGER,'下一玩家编号'),highest+1);
  if(utf8Size(serialize(v))>8*1024*1024)throw Error('对局备份超过 8 MB');return v;
 }
 function playable(r){return !['fabled','loric'].includes(r.team);}
 const reviewEffects={death:{action:'死亡了',effect:'死亡了',aliases:['死亡了','死亡']},poison:{action:'中毒（简单记录）',effect:'中毒了',aliases:['中毒了','中毒（简单记录）',reviewSourceActions[0]]},drunk:{action:'醉酒（简单记录）',effect:'醉酒了',aliases:['醉酒了','醉酒（简单记录）',reviewSourceActions[1]]},revive:{action:'复活了',effect:'复活了',aliases:['复活了','因某个玩家的能力而复活']},healthy:{action:'恢复健康了',effect:'恢复健康了',aliases:['恢复健康了']},victory:{action:'获胜🎉',effect:'获胜🎉',aliases:['获胜🎉','获胜']},goodPoison:{action:'非旅行者玩家中毒了',effect:'非旅行者玩家中毒了',aliases:['非旅行者玩家中毒了']}};
 function reviewCandidates(s,stageIndex,entryId){
  const entry=s.review?.stages[stageIndex]?.entries.find(e=>e.id===entryId);if(entry?.kind!=='action'||!entry.actor||entry.actorGroup!==undefined||!root.GrimoireReviewActions)return [];
  const role=entry.abilityAction?.role||s.script.roles.find(r=>r.id===entry.actor.roleId&&r.name===entry.actor.roleName&&r.team===entry.actor.team),specs=root.GrimoireReviewActions.forRole(role),legacy=new Set(['tb/poisoner/0','experimental/widow/0','tb/imp/0']),spec=entry.abilityAction?specs.find(a=>a.key===entry.abilityAction.key&&a.action===entry.action):entry.action==='选择了'&&entry.targets.length===1?specs.find(a=>legacy.has(a.key)):null,candidates=[];
  for(const [index,plan]of (spec?.followups||[]).entries()){if(plan.choice&&entry.abilityAction?.choice!==plan.choice)continue;const effect=reviewEffects[plan.effect];if(!effect)continue;const subjects=plan.actorGroup?[null]:plan.targetIndices?plan.targetIndices.map(i=>entry.targets[i]).filter(Boolean):plan.subjects==='actor'?[entry.actor]:plan.subjects==='actorAndTargets'?[entry.actor,...entry.targets]:entry.targets;
   for(const actor of subjects){const key=plan.effect+':'+(plan.actorGroup?'group:'+plan.actorGroup:actor.seatId);if(candidates.some(c=>c.key===key))continue;candidates.push({actor:copy(actor),...(plan.actorGroup?{actorGroup:plan.actorGroup}:{}),action:effect.action,effect:effect.effect,key,group:plan.exclusive?String(index):'',signature:JSON.stringify(entry)});}
  }return candidates;
 }
 const reviewEffectAliases=new Map(Object.values(reviewEffects).map(effect=>[effect.action,effect.aliases]));
 function reviewStageSuggestions(s,stageIndex){
  const entries=s.review?.stages[stageIndex]?.entries||[],byId=new Map(entries.map(e=>[e.id,e])),candidates=new Map(entries.map(e=>[e.id,reviewCandidates(s,stageIndex,e.id)])),resolved=new Map(entries.map(e=>[e.id,new Set()]));
  const matches=(candidate,result,id)=>result.kind==='action'&&(candidate.actorGroup?result.actorGroup===candidate.actorGroup:result.actor?.seatId===candidate.actor?.seatId&&result.actorGroup===undefined)&&reviewEffectAliases.get(candidate.action).includes(result.action)&&(!result.source||result.source.seatId===byId.get(id).actor?.seatId);
  const done=(id,c)=>resolved.get(id).has(c.key)||c.group&&candidates.get(id).some(other=>other.group===c.group&&resolved.get(id).has(other.key));
  // Explicit links take priority even if the user moved a result before its action.
  for(const result of entries)if(result.followupOf!==undefined)for(const candidate of candidates.get(result.followupOf)||[])if(matches(candidate,result,result.followupOf))resolved.get(result.followupOf).add(candidate.key);
  // A standalone result belongs to at most one preceding action, nearest first.
  for(let i=0;i<entries.length;i++){const result=entries[i];if(result.kind!=='action'||result.followupOf!==undefined)continue;for(let j=i-1;j>=0;j--){const id=entries[j].id,candidate=candidates.get(id).find(c=>!done(id,c)&&matches(c,result,id));if(candidate){resolved.get(id).add(candidate.key);break;}}}
  return new Map(entries.map(e=>[e.id,candidates.get(e.id).filter(c=>!done(e.id,c))]));
 }
 function reviewSuggestions(s,stageIndex,entryId){return reviewStageSuggestions(s,stageIndex).get(entryId)||[];}
 function reviewSuggestion(s,stageIndex,entryId){return reviewSuggestions(s,stageIndex,entryId)[0]||null;}
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
  captureReplay(s);
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
   case 'reminderAdd':{const p=target();if(p.reminders.length>=20)throw Error('每个座位最多 20 个提醒');p.reminders.push(text(action.text,100,'提醒内容',false).trim());let detail=reminderDetail(action.detail,map);if(action.expiryWhen&&action.expiryWhen!=='none'){detail||={kind:'custom',roleId:''};detail.expiry=expiryFor(s,action.expiryWhen,action.expirySeatId||p.id);}p.reminderDetails.push(detail);message='为 '+name(p)+' 添加提醒';break;}
   case 'reminderExpiry':{const p=target();integer(action.index,0,p.reminders.length-1,'提醒位置');if(action.signature!==JSON.stringify([p.id,action.index,p.reminders[action.index],p.reminderDetails[action.index]]))throw Error('标记已变化，请重新打开设置');const detail=p.reminderDetails[action.index]||{kind:({中毒:'poison',醉酒:'drunk',保护:'protected'})[p.reminders[action.index]]||'custom',roleId:''},expiry=expiryFor(s,action.when,action.expirySeatId||p.id);if(expiry)detail.expiry=expiry;else delete detail.expiry;p.reminderDetails[action.index]=detail;message='设置 '+name(p)+' 的标记到期时间';break;}
   case 'reminderExpireConfirm':{const p=target(),match=timedReminders(s).find(r=>r.seatId===p.id&&r.index===action.index&&r.signature===action.signature);if(!match?.due)throw Error('标记尚未到期或已变化，请重新检查');p.reminders.splice(action.index,1);p.reminderDetails.splice(action.index,1);message='确认清除 '+name(p)+' 已到期的'+match.text;break;}
   case 'reminderActionDone':{const p=target();markExpiryAction(s,p.id);message='确认 '+name(p)+' 已行动，检查状态时限';break;}
   case 'reminderRemove':{const p=target();integer(action.index,0,p.reminders.length-1,'提醒位置');p.reminders.splice(action.index,1);p.reminderDetails.splice(action.index,1);message='移除 '+name(p)+' 的提醒';break;}
   case 'reminderFlip':{const p=target();integer(action.index,0,p.reminders.length-1,'提醒位置');const i=action.index,d=p.reminderDetails[i]||{kind:new Map([['中毒','poison'],['醉酒','drunk'],['善良','good'],['邪恶','evil']]).get(p.reminders[i])||'custom',roleId:''};if(d.flipped)delete d.flipped;else d.flipped=true;p.reminderDetails[i]=d;message='翻转 '+name(p)+' 的提醒';break;}
   case 'move':{const p=target(),i=s.seats.indexOf(p);if(![-1,1].includes(action.delta))throw Error('移动方向无效');const j=(i+action.delta+s.seats.length)%s.seats.length;[s.seats[i],s.seats[j]]=[s.seats[j],s.seats[i]];message='调整座位顺序';break;}
   case 'swap':{const p=target(),i=s.seats.indexOf(p),j=s.seats.findIndex(x=>x.id===action.otherSeatId);if(j<0)throw Error('交换座位无效');[s.seats[i],s.seats[j]]=[s.seats[j],s.seats[i]];message='交换玩家座位';break;}
   case 'shuffleSeats':s.seats=shuffle(s.seats,random);message='打乱座位顺序（保留玩家资料）';break;
   case 'seatRemove':{const p=target();if(s.seats.length<=5)throw Error('至少保留 5 个座位');if(!action.force&&(p.name||p.roleId||p.reminders.length||p.notes.length||p.noteDraft))throw Error('此座位含玩家资料，请先确认');message='移除 '+name(p)+' 的座位';s.seats=s.seats.filter(x=>x.id!==p.id);s.progress.forEach(n=>{n.steps=n.steps.filter(x=>x.seatId!==p.id);});break;}
   case 'resize':{
    integer(action.count,5,30,'座位数');if(action.count<s.seats.length&&!action.force&&s.seats.slice(action.count).some(x=>x.name||x.roleId||x.reminders.length||x.notes.length||x.noteDraft))throw Error('移除的座位含玩家资料，请先确认并备份');
    while(s.seats.length<action.count){if(s.nextSeatId>=Number.MAX_SAFE_INTEGER)throw Error('玩家永久编号已达上限');s.seats.push(seat('seat_'+s.nextSeatId++));}s.seats=s.seats.slice(0,action.count);
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
   case 'advance':{if(s.phase!=='setup'){const prior=s.round*2-(s.phase==='night'?2:1);if(s.review.stages[prior])s.review.stages[prior].players=s.seats.map(p=>participantSnapshot(s,p));}if(s.phase==='setup'){s.review.initialRoster={source:'start',players:s.seats.map(p=>participantSnapshot(s,p))};s.phase='night';s.round=1;}else if(s.phase==='night')s.phase='day';else{if(s.round>=99)throw Error('最多记录 99 夜');s.phase='night';s.round++;}while(s.review.stages.length<s.round*2-(s.phase==='night'?1:0))s.review.stages.push(reviewStage(s.review.stages.length));const active=s.round*2-(s.phase==='night'?2:1);s.review.stages[active].players=s.seats.map(p=>participantSnapshot(s,p));message=s.phase==='night'?'进入第 '+s.round+' 夜':'进入第 '+s.round+' 天';break;}
   case 'reviewStageAdd':if(s.review.stages.length>=198)throw Error('最多记录 99 天夜');s.review.stages.push(reviewStage(s.review.stages.length));message='添加复盘阶段';break;
   case 'reviewStageRemove':if(s.review.stages.length<=1)throw Error('至少保留第 1 夜');if(s.review.stages.at(-1).entries.length&&!action.force)throw Error('阶段含复盘记录，请先确认删除');s.review.stages.pop();message='删除末尾复盘阶段';break;
   case 'reviewSave':{
    integer(action.stageIndex,0,s.review.stages.length-1,'复盘阶段');const stage=s.review.stages[action.stageIndex],index=action.entryId===undefined?-1:stage.entries.findIndex(e=>e.id===action.entryId),old=index<0?null:stage.entries[index];
    if(action.entryId!==undefined&&!old)throw Error('复盘记录已不存在');if(!old&&(stage.entries.length>=100||s.review.stages.reduce((n,x)=>n+x.entries.length,0)>=2000))throw Error('每阶段最多 100 条，本局最多 2000 条复盘记录');
    if(!old&&s.review.nextId>=Number.MAX_SAFE_INTEGER)throw Error('复盘记录编号超出范围');const entry={id:old?.id??s.review.nextId++,kind:action.kind,at:old?.at??Date.now()};if(!s.review.initialRoster&&!old&&!s.review.stages.some(stage=>stage.entries.length))s.review.initialRoster={source:'firstRecord',players:s.seats.map(p=>participantSnapshot(s,p))};
    const roster=reviewRoster(s,action.stageIndex),snapshot=(id,previous)=>{let p=previous?.seatId===id?previous:roster.find(x=>x.seatId===id);if(!p)throw Error('复盘玩家已不存在，请重新选择');if(Object.hasOwn(action.roleOverrides||{},id))p=withRole(p,action.roleOverrides[id]===null?null:reviewRole(action.roleOverrides[id]));return copy(p);};
    if(entry.kind==='text')entry.text=text(action.text,2000,'复盘文字',false).trim();else if(entry.kind==='action'){
     entry.actor=action.actorSeatId?snapshot(action.actorSeatId,old?.actor):null;entry.action=text(action.action,100,'复盘行动',false).trim();entry.result=text(action.result??'',2000,'复盘结果').trim();
     if(action.actorGroup!==undefined){if(entry.actor!==null||!reviewActorGroups.includes(action.actorGroup))throw Error('复盘群体对象无效');entry.actorGroup=action.actorGroup;}
     if(!Array.isArray(action.targetSeatIds)||action.targetSeatIds.length>30||new Set(action.targetSeatIds).size!==action.targetSeatIds.length&&!root.GrimoireReviewActions?.get(action.abilityAction?.key)?.allowRepeatedTargets)throw Error('复盘目标无效');entry.targets=action.targetSeatIds.map(id=>snapshot(id,old?.targets?.find(p=>p.seatId===id)));
     if(['提名玩家（记录票数）','提名玩家（不记录票数）'].includes(entry.action)&&entry.targets.length!==1)throw Error('提名记录需要选择 1 名玩家');
     if(entry.actorGroup==='minions'&&entry.action==='一起决定由谁照顾小怪宝'&&entry.targets.length!==1)throw Error('请选择 1 名照顾小怪宝的玩家');
     if(entry.action==='提名说书人（仅用于无神论者在场）'&&entry.targets.length)throw Error('提名说书人不需要玩家目标');
     if(entry.action==='提名玩家（记录票数）')entry.votes=integer(action.votes,0,999,'提名票数');else if(action.votes!==undefined)throw Error('这项行动不记录提名票数');
     if(reviewSourceActions.includes(entry.action)){if(!action.sourceSeatId)throw Error('请选择来源玩家');entry.source=snapshot(action.sourceSeatId,old?.source);}else if(action.sourceSeatId)throw Error('这项行动不记录来源玩家');
     if(['角色变化','角色和阵营变化'].includes(entry.action)){if(action.changedRole===undefined)throw Error('请选择变化后的角色，或明确选择空白');entry.changedRole=action.changedRole===null?null:reviewRole(action.changedRole);}else if(action.changedRole!==undefined)throw Error('这项行动不记录角色变化');
     if(reviewReferenceActions.includes(entry.action)){if(action.selectedRole===undefined)throw Error('请选择记录的角色，或明确选择空白');entry.selectedRole=action.selectedRole===null?null:reviewRole(action.selectedRole);}else if(action.selectedRole!==undefined)throw Error('这项行动不记录声称角色或能力角色');
     if(entry.action==='告知玩家：3个不在场角色'&&entry.actor===null&&entry.actorGroup===undefined){if(entry.targets.length!==1)throw Error('请选择一名接收信息的玩家');entry.informedRoles=reviewInformedRoles(action.informedRoles);}else if(action.informedRoles!==undefined)throw Error('这项行动不记录三个不在场角色');
     if(action.abilityAction!==undefined){entry.abilityAction=reviewAbility(action.abilityAction,entry);const source=entry.actor?.role||(old?.actor?.seatId===entry.actor?.seatId&&old?.abilityAction&&!Object.hasOwn(action.roleOverrides||{},entry.actor?.seatId)?old.abilityAction.role:map.get(entry.actor?.roleId));if(!root.GrimoireReviewActions.forRole(source).some(s=>s.key===entry.abilityAction.key))throw Error('当前角色能力与所选行动不匹配');}
     if(['阵营变化','角色和阵营变化'].includes(entry.action)){if(!['good','evil'].includes(action.changedAlignment))throw Error('请选择变化后的阵营');entry.changedAlignment=action.changedAlignment;}else if(action.changedAlignment!==undefined)throw Error('这项行动不记录阵营变化');
    }else throw Error('复盘记录类型无效');if(old?.boardLink)entry.boardLink=copy(old.boardLink);if(action.updateBoard!==undefined&&typeof action.updateBoard!=='boolean')throw Error('联动选项无效');if(action.updateBoard){if(old)throw Error('编辑历史记录仅修改记录，不重复执行状态变化');linkReview(s,entry,action);}if(entry.kind==='action'&&old?.followupOf!==undefined)entry.followupOf=old.followupOf;if(index<0)stage.entries.push(entry);else stage.entries[index]=entry;message=old?'编辑复盘记录':'添加复盘记录';break;
   }
   case 'reviewConfirmEffect':{
    integer(action.stageIndex,0,s.review.stages.length-1,'复盘阶段');const stage=s.review.stages[action.stageIndex],suggestions=reviewSuggestions(s,action.stageIndex,action.entryId),suggestion=action.suggestionKey===undefined?suggestions[0]:suggestions.find(c=>c.key===action.suggestionKey);
    if(!suggestion||suggestion.signature!==action.signature)throw Error('行动已变化或结果已记录，请重新检查');
    if(stage.entries.length>=100||s.review.stages.reduce((n,x)=>n+x.entries.length,0)>=2000)throw Error('每阶段最多 100 条，本局最多 2000 条复盘记录');
    if(s.review.nextId>=Number.MAX_SAFE_INTEGER)throw Error('复盘记录编号超出范围');
    const candidates=reviewCandidates(s,action.stageIndex,action.entryId),rank=c=>candidates.findIndex(x=>x.actor?.seatId===c.actor?.seatId&&x.actorGroup===c.actorGroup&&x.action===c.action);let position=stage.entries.findIndex(e=>e.id===action.entryId)+1;while(stage.entries[position]?.followupOf===action.entryId&&rank(stage.entries[position])>=0&&rank(stage.entries[position])<rank(suggestion))position++;
    const entry={id:s.review.nextId++,kind:'action',at:Date.now(),actor:suggestion.actor,...(suggestion.actorGroup?{actorGroup:suggestion.actorGroup}:{}),action:suggestion.action,targets:[],result:'',followupOf:action.entryId};if(action.updateBoard)linkReview(s,entry,action);stage.entries.splice(position,0,entry);message='确认补记：'+suggestion.effect;break;
   }
   case 'reviewBoardChange':{
    if(action.gameId!==s.gameId||action.revision!==s.revision||action.stageIndex!==phaseIndex(s))throw Error('魔典已经变化，请重新检查后记录');
    const p=target();if(action.signature!==JSON.stringify(p))throw Error('玩家状态已经变化');
    const before=reviewParticipant(action.before),after=participantSnapshot(s,p);if(before.seatId!==p.id)throw Error('联动玩家无效');
    const stage=s.review.stages[action.stageIndex];if(!stage||stage.entries.length>=100||s.review.stages.reduce((n,x)=>n+x.entries.length,0)>=2000)throw Error('复盘记录数量已达上限');
    const entry={id:s.review.nextId++,kind:'action',at:Date.now(),actor:before,action:action.action,targets:[],result:'',boardLink:{source:'board',at:Date.now(),revision:s.revision,seatIds:[p.id]}};
    if(entry.action==='角色变化')entry.changedRole=after.role||null;else if(!['死亡了','复活了'].includes(entry.action))throw Error('不支持这项魔典变化');stage.entries.push(entry);message='记录魔典变化';break;
   }
   case 'reviewReorder':{
    integer(action.stageIndex,0,s.review.stages.length-1,'复盘阶段');const stage=s.review.stages[action.stageIndex],entries=new Map(stage.entries.map(e=>[e.id,e])),ids=action.entryIds;
    if(!Array.isArray(ids)||ids.length!==entries.size||new Set(ids).size!==ids.length||ids.some(id=>!entries.has(id)))throw Error('复盘记录已变化，请重新排序');
    stage.entries=ids.map(id=>entries.get(id));message='调整复盘记录顺序';break;
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
  if(action.type==='nightMark'&&action.status==='done'&&!current.progress.some(n=>n.night===current.round&&n.steps.some(p=>p.seatId===action.seatId&&p.status==='done')))markExpiryAction(s,action.seatId);
  captureReplay(s,action.type==='advance');
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
 function openStore(storage){let previous=storage.getItem(key);return {read:()=>previous?validate(JSON.parse(previous)):null,save(value){if(storage.getItem(key)!==previous)throw Error('另一页面已更新此魔典，请先备份当前对局，再刷新');const next=serialize(validate(value));storage.setItem(key,next);previous=next;}};}
 const api={kind,key,serialize,packImages,unpackImages,reviewRoster,replayFrame,stageChanges,canLinkReview,timedReminders,reminderIsDue,create,validate,reduce,reviewSuggestion,reviewSuggestions,reviewStageSuggestions,nightOrder,nightQueue,nightActions,counts,publicView,openStore,shuffle,distributionCounts,fillBag};root.ClocktowerGrimoire=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
