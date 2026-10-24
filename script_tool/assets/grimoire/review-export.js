/* Local PNG composition. Only recap copy and the explicitly selected roster are exported. */
(function(root){
 'use strict';
 const colors={townsfolk:'#3865ac',outsider:'#3865ac',minion:'#b53f3a',demon:'#b53f3a',traveller:'#79559d',good:'#3865ac',evil:'#b53f3a'},font='"Microsoft YaHei","PingFang SC",system-ui,sans-serif',W=640;
 const layouts={comfortable:{size:23,lineHeight:39,margin:30,entryGap:20,headingHeight:96,stageGap:28},compact:{size:19,lineHeight:32,margin:26,entryGap:12,headingHeight:80,stageGap:20}};
 const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'grapheme'}):null,characters=text=>graphemes?[...graphemes.segment(text)].map(p=>p.segment):Array.from(text);
 function filename(name){const suffix='-复盘.png';let stem='';for(const part of characters(String(name||'未命名剧本').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_'))){if(stem.length+part.length+suffix.length>180)break;stem+=part;}return stem+suffix;}
 let roleCatalog=null,roleImages=new Map(),definitionImages=new Map();
 function roleKey(role){const normalize=value=>String(value||'').normalize('NFKC').replace(/[\s，。！？；：、,.!?;:（）()「」『』“”‘’]/g,'');return JSON.stringify([String(role.id||'').replace(/_gstone$/,''),normalize(role.name??role.n),String(role.team??role.t).replace('traveler','traveller'),normalize(role.ability??role.ab)]);}
 function canonicalRoleImage(role){if(!role)return '';if(roleCatalog!==root.CHARS){roleCatalog=root.CHARS;roleImages=new Map();definitionImages=new Map();for(const r of roleCatalog||[]){const key=roleKey(r),image=r.im||r.iu||'',definition=JSON.stringify(JSON.parse(key).slice(1));roleImages.set(key,image);if(!definitionImages.has(definition))definitionImages.set(definition,new Set());definitionImages.get(definition).add(image);}}const key=roleKey(role),exact=roleImages.get(key),candidates=definitionImages.get(JSON.stringify(JSON.parse(key).slice(1)));if(exact)return exact;if(candidates?.size===1)return [...candidates][0];const iconId=root.GrimoireReviewActions?.iconRoleId(role),known=iconId&&(roleCatalog||[]).find(r=>String(r.id).replace(/_gstone$/,'')===iconId&&r.n===role.name&&String(r.t).replace('traveler','traveller')===role.team);return known?.im||known?.iu||'';}
 function fragments(element){
  const out=[];
  function walk(n,color='#202020'){
   if(n.nodeType===3){if(n.textContent){const owner=n.parentElement,keepTogether=owner?.matches('.g-review-status-effect,.g-review-player-role,.g-review-role-label')||owner?.matches('.g-review-player-name')&&characters(n.textContent).length<=12;out.push({text:n.textContent,color,...(keepTogether?{keepTogether:true}:{})});}return;}
   if(n.nodeType!==1)return;
   if(n.matches('.g-review-player,.g-review-group,.g-review-changed-alignment'))for(const team of Object.keys(colors))if(n.classList.contains(team)){color=colors[team];break;}
   if(n.matches('.g-review-storyteller'))color=colors.good;
   if(n.matches('.g-review-status-effect'))color='#a56517';
   if(n.matches('.g-review-role-icon')&&n.reviewRole){const source=n.querySelector('img')?.src||n.querySelector('[data-image-source]')?.dataset.imageSource||n.reviewRole.image||'',fallbackImage=canonicalRoleImage(n.reviewRole);if(source||fallbackImage){out.push({image:source||fallbackImage,...(fallbackImage?{fallbackImage}:{})});return;}}
   if(n.tagName==='IMG'||n.matches('.g-question[data-image-source]')){out.push({image:n.tagName==='IMG'?n.src:n.dataset.imageSource});return;}
   if(n.tagName==='BR'){out.push({text:'\n',color});return;}
   for(const child of n.childNodes)walk(child,color);
  }walk(element);return out;
 }
 function captureBoard(state,element,{measure=n=>n.getBoundingClientRect(),background,dim=0,showLogo=true}={}){
  if(element?.closest('[data-player-view="true"]'))return null;
  const seats=state.seats.map((seat,i)=>{const role=state.script.roles.find(r=>r.id===seat.roleId)||null,host=element?.querySelector('[data-seat-id="'+seat.id+'"]'),token=host?.querySelector('.g-token'),bounds=token&&measure(token),marks=root.GrimoireCatalog?.tokenMarks(role),leaves=[];
   if(marks){if(marks.count<=5){if(marks.count)leaves.push({image:'theme/leaf-top'+marks.count+'.png',angle:0});}else for(let j=0;j<marks.count;j++)leaves.push({image:'theme/leaf-top1.png',angle:(j-(marks.count-1)/2)*Math.min(12,80/(marks.count-1))});for(const [flag,name]of [['first','left'],['other','right'],['setup','orange']])if(marks[flag])leaves.push({image:'theme/leaf-'+name+'.png',angle:0});}
   const ranks=[...host?.querySelectorAll('.g-token-order')||[]].map(n=>({value:n.textContent,kind:n.classList.contains('first')?'first':'other'}));
   const reminders=seat.reminders.map((text,j)=>{const detail=seat.reminderDetails?.[j],kind=detail?.kind||({'中毒':'poison','醉酒':'drunk','善良':'good','邪恶':'evil'}[text])||'custom',r=kind==='role'?state.script.roles.find(r=>r.id===detail.roleId):root.GrimoireCatalog?.reminderIcon(kind),marker=host?.querySelectorAll('.g-reminder-token')[j],rect=marker&&measure(marker);return {text,kind,flipped:!!detail?.flipped,image:r?.image||'',...(r?{role:r}:{}),...(rect?.width>0?{x:rect.left+rect.width/2,y:rect.top+rect.height/2,size:rect.width}:{})};});
   return {number:i+1,name:seat.name,alive:seat.alive,ghostVote:seat.ghostVote,role,leaves,ranks,reminders,...(bounds?.width>0?{x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2,size:bounds.width}:{} )};});
  const live=element&&!element.classList.contains('list-mode')&&seats.every(s=>s.size>0),points=live?seats.flatMap(s=>[{left:s.x-s.size*.7,right:s.x+s.size*.7,top:s.y-s.size*.58,bottom:s.y+s.size*.92},...s.reminders.filter(m=>m.size).map(m=>({left:m.x-m.size/2,right:m.x+m.size/2,top:m.y-m.size/2,bottom:m.y+m.size/2}))]):[];
  let width=640,height=660,left=0,top=0;if(live){left=Math.min(...points.map(p=>p.left))-10;top=Math.min(...points.map(p=>p.top))-10;width=Math.max(...points.map(p=>p.right))-left+10;height=Math.max(...points.map(p=>p.bottom))-top+10;}
  else{const n=seats.length,outer=n>18?Math.ceil(n*.65):n;seats.forEach((s,i)=>{const inner=i>=outer,total=inner?n-outer:outer,a=(inner?i-outer:i)/Math.max(1,total)*Math.PI*2-Math.PI/2,r=inner?145:242;s.size=n>18?54:n>14?66:82;s.x=320+Math.cos(a)*r;s.y=310+Math.sin(a)*r;s.reminders.forEach((m,j)=>{const dist=s.size/2+24+j*35;m.size=34;m.x=s.x-Math.cos(a)*dist;m.y=s.y-Math.sin(a)*dist;});});}
  const boardHeight=Math.max(500,Math.min(960,height/width*W)),scale=Math.min((W-16)/width,(boardHeight-16)/height),ox=(W-width*scale)/2,oy=(boardHeight-height*scale)/2;for(const s of seats){s.x=(s.x-left)*scale+ox;s.y=(s.y-top)*scale+oy;s.size*=scale;for(const m of s.reminders){m.x=(m.x-left)*scale+ox;m.y=(m.y-top)*scale+oy;m.size*=scale;}}
  const center=element?.querySelector('.g-center'),centerRect=center&&measure(center),logo=showLogo?(center?.querySelector('img')?.src||root.GrimoireCatalog?.scriptLogo(state.script)||'theme/custom.png'):'';
  return {height:boardHeight,background:background||'theme/bg_'+(state.phase==='night'?'night':'day')+'.png',dim:Math.max(0,Math.min(.75,dim)),logo,logoBox:live&&centerRect?.width>0?{x:(centerRect.left-left)*scale+ox,y:(centerRect.top-top)*scale+oy,w:centerRect.width*scale,h:centerRect.height*scale,fallback:center?.dataset.fallback==='true'}:{x:W*.36,y:boardHeight*.37,w:W*.28,h:boardHeight*.24,fallback:true},seats};
 }
 function identityHistory(state){
  const tracks=new Map(),roster=state.review.initialRoster,firstLabel=roster?.source==='start'?'开局':roster?'首次记录':'最早记录';
  const roleOf=(p,known)=>p?.role||((known?.id===p?.roleId&&known.name===p.roleName&&known.team===p.team)?known:state.script.roles.find(r=>r.id===p?.roleId&&r.name===p.roleName&&r.team===p.team))||(p?.roleName?{id:p.roleId,name:p.roleName,team:p.team,ability:'',image:''}:null);
  const signature=role=>role?roleKey(role):'blank';
  const remember=(p,label,known)=>{if(!p?.seatId)return;const role=roleOf(p,known);let t=tracks.get(p.seatId);if(!t){t={first:p,firstLabel,steps:[{label:firstLabel,role}]};tracks.set(p.seatId,t);}else if(signature(t.steps.at(-1).role)!==signature(role))t.steps.push({label,role});};
  for(const p of roster?.players||[])remember(p,firstLabel);
  for(const stage of state.review.stages){const label='第 '+stage.round+(stage.phase==='night'?' 夜':' 天');for(const e of stage.entries){if(e.kind!=='action')continue;remember(e.actor,label,e.abilityAction?.role);for(const p of e.targets||[])remember(p,label);remember(e.source,label);if(e.actor&&Object.hasOwn(e,'changedRole')){const t=tracks.get(e.actor.seatId);if(signature(t.steps.at(-1).role)!==signature(e.changedRole))t.steps.push({label,role:e.changedRole});}}}
  const current=new Map(state.seats.map((p,i)=>[p.id,{seatId:p.id,number:i+1,name:p.name,roleId:p.roleId,roleName:state.script.roles.find(r=>r.id===p.roleId)?.name||'',team:state.script.roles.find(r=>r.id===p.roleId)?.team||'unknown',role:state.script.roles.find(r=>r.id===p.roleId)||null}])),rows=[];
  for(const [id,t]of tracks){const now=current.get(id),last=t.steps.at(-1);if(now){if(signature(last.role)!==signature(now.role))t.steps.push({label:'最终魔典',role:now.role});else last.final=true;}if(!now||t.steps.length>1||now.number!==t.first.number||now.name!==t.first.name)rows.push({...t,current:now||null});}return rows;
 }
 function identityRuns(row,showNames=true){
  const label=p=>p.number+'号'+(showNames&&p.name?' '+p.name:''),runs=[{text:label(row.first)+(row.current?(row.current.number!==row.first.number||showNames&&row.current.name!==row.first.name?'（现 '+label(row.current)+'）':''):'（已离场）')+'：',color:'#202b36'}];
  row.steps.forEach((step,i)=>{if(i)runs.push({text:' → ',color:'#7c858e'});runs.push({text:step.label+' ',color:'#737d87'});const r=step.role,color=colors[r?.team]||'#737d87';if(r){const image=r.image||canonicalRoleImage(r),fallbackImage=canonicalRoleImage(r);if(image)runs.push({image,fallbackImage});}runs.push({text:(r?.name||'空白')+(step.final?'（最终）':''),color,keepTogether:true});});return runs;
 }
 function snapshot(state,host,logo,board){
  return {name:state.script.name,logo,metadata:{players:state.seats.length},identities:identityHistory(state),...(board?{board}:{}),seats:state.seats.map((s,i)=>({name:s.name,number:i+1,role:state.script.roles.find(r=>r.id===s.roleId)||null})),stages:state.review.stages.map((s,i)=>({phase:s.phase,round:s.round,...(root.ClocktowerGrimoire?.stageChanges?{summary:root.ClocktowerGrimoire.stageChanges(state,i)}:{}),entries:[...host.querySelectorAll('[data-stage-index="'+i+'"] > .g-review-entries > .g-review-entry > .g-review-copy')].map(fragments)}))};
 }
 function lines(ctx,runs,width,size=16){
  ctx.font=size+'px '+font;const result=[[]],units=[];let x=0;
  for(const run of runs){if(run.image){units.push({...run,width:size+4});continue;}if(run.keepTogether&&!/[\r\n]/.test(run.text)&&ctx.measureText(run.text).width<=width){units.push({text:run.text,color:run.color,width:ctx.measureText(run.text).width});continue;}const tokens=(run.text||'').replace(/\r\n?/g,'\n').match(/[A-Za-z0-9]+(?:[._’'-][A-Za-z0-9]+)*|[^A-Za-z0-9]+/gu)||[];for(const token of tokens){const parts=/^[A-Za-z0-9]/.test(token)&&ctx.measureText(token).width<=width?[token]:characters(token);for(const text of parts)units.push({text,color:run.color,width:ctx.measureText(text).width});}}
  const closes=/^[，。！？；：、）》】」』”’％%.,!?;:\)\]\}…]/u,opens=/[（《【「『“‘\(\[\{]$/u,append=part=>{result.at(-1).push({...part,x});x+=part.width;};
  for(const part of units){
   if(part.text==='\n'){result.push([]);x=0;continue;}
   if(x&&x+part.width>width){const line=result.at(-1),carry=[];
    // Keep a closing mark with its preceding character and an icon with its label.
    if(closes.test(part.text||'')&&x+part.width<=width+size*.8){append(part);continue;}
    while(line.length&&(line.at(-1).image||opens.test(line.at(-1).text||'')||/^\s+$/.test(line.at(-1).text||'')))carry.unshift(line.pop());
    if(closes.test(part.text||'')&&line.length){carry.unshift(line.pop());if(line.at(-1)?.image)carry.unshift(line.pop());}
    result.push([]);x=0;for(const moved of carry)if(x||!/^\s+$/.test(moved.text||''))append(moved);
   }
   if(!x&&part.text===' ')continue;append(part);
  }return result;
 }
 function selectedStages(data,indices){
  if(indices===undefined)return data.stages.map((_,i)=>i);
  if(!Array.isArray(indices)||!indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=data.stages.length)||new Set(indices).size!==indices.length)throw Error('请选择至少一个有效阶段');
  return indices.slice().sort((a,b)=>a-b);
 }
 const phaseLabel=s=>'第 '+s.round+(s.phase==='night'?' 夜':' 天');
 function rangeLabel(data,indices){
  const selected=selectedStages(data,indices);if(!selected.length)return '暂无阶段';
  const names=selected.map(i=>phaseLabel(data.stages[i]));if(names.length===1)return names[0];
  return selected.every((n,i)=>!i||n===selected[i-1]+1)?names[0]+'至'+names.at(-1):names.slice(0,3).join('、')+(names.length>3?'等 '+names.length+' 个阶段':'');
 }
 function information(data,indices){
  const selected=selectedStages(data,indices),count=selected.reduce((n,i)=>n+data.stages[i].entries.length,0),players=data.metadata?.players??data.seats?.length??0;
  const historical=selected.some(i=>data.stages[i].frames),counts=selected.map(i=>data.stages[i].frames?.end?.players?.length),known=counts.length&&counts.every(n=>Number.isInteger(n)&&n>0),people=historical?(known?(Math.min(...counts)===Math.max(...counts)?counts[0]+' 人':Math.min(...counts)+'–'+Math.max(...counts)+' 人（所选阶段）'):'所选阶段人数未完整记录'):'当前 '+players+' 人';
  return [{text:data.name+'\n',color:'#252b32'},{text:people+' · '+rangeLabel(data,indices)+' · '+selected.length+' 个阶段 · '+count+' 条记录',color:'#606d78'}];
 }
 function summaryRuns(summary){const message=summary.complete?(summary.changes.map(c=>c.text).join('；')||'阶段开始与结束没有状态差异'):(summary.notice||'缺少完整快照，无法比较变化');return [{text:'阶段变化摘要：'+message+(/[。！？!?]$/.test(message)?'':'。')+(summary.complete?'\n以上为阶段开始至结束的净变化；中途变化请查看记录。':''),color:'#78602c'}];}
 function plan(snapshot,ctx,{includeTable=true,showNames=true,includeHistory=true,includeSummary=true,includeInfo=true,density='comfortable',stageIndices}={}){
  const style=layouts[density]||layouts.comfortable,{size,lineHeight,margin,entryGap,headingHeight,stageGap}=style,indices=selectedStages(snapshot,stageIndices),stages=indices.map(i=>snapshot.stages[i]);
  const page={height:0,ops:[]};let y=0;
  function entry(runs,phase,section){const wrapped=lines(ctx,runs,W-margin*2,size),height=wrapped.length*lineHeight+entryGap;page.ops.push({kind:'entry',section,y,height,phase,lines:wrapped,size,lineHeight,margin});y+=height;}
  if(includeTable){const board=snapshot.board||captureBoard({script:{name:snapshot.name,roles:snapshot.seats.flatMap(s=>s.role?[s.role]:[])},phase:'day',seats:snapshot.seats.map((s,i)=>({id:'seat_'+(i+1),name:s.name,roleId:s.role?.id,alive:true,ghostVote:true,reminders:[]}))},null);page.ops.push({kind:'table',y:0,height:board.height+38,board,seats:snapshot.seats,name:snapshot.name,logo:snapshot.logo,showNames});y=board.height+38;}
  if(includeInfo&&snapshot.metadata)entry(information(snapshot,stageIndices),stages[0]?.phase,'info');
  // A global identity timeline can include events outside the selected phases.
  if(includeHistory&&indices.length===snapshot.stages.length&&snapshot.identities?.length){page.ops.push({kind:'identityHeading',y,height:96,margin});y+=96;for(const row of snapshot.identities)entry(identityRuns(row,showNames),'identity','identity');page.ops.push({kind:'space',y,height:stageGap});y+=stageGap;}
  let hasContent=false;
  for(const stage of stages){if(!stage.entries.length&&!(includeSummary&&stage.summary))continue;hasContent=true;
   page.ops.push({kind:'heading',y,height:headingHeight,margin,phase:stage.phase,round:stage.round});y+=headingHeight;
   if(includeSummary&&stage.summary)entry(summaryRuns(stage.summary),stage.phase,'summary');
   for(const runs of stage.entries)entry(runs,stage.phase,'record');
   page.ops.push({kind:'space',y,height:stageGap,phase:stage.phase});y+=stageGap;
  }
  if(!hasContent){page.ops.push({kind:'empty',y,height:90});y+=90;}
  page.height=Math.ceil(y);return {pages:[page],name:snapshot.name};
 }
 function imageMetrics(page){
  if(!Number.isFinite(page.height)||page.height<=0)throw Error('图片高度无效');
  const scale=Math.min(2,32760/page.height,Math.sqrt(16000000/(W*page.height))),width=Math.ceil(W*scale),height=Math.ceil(page.height*scale);
  return {scale,width,height,reduced:scale<2-1e-6,smallText:scale<1};
 }
 function qualityText(metrics){return metrics.smallText?'文字可能偏小：长图已降低分辨率，建议减少阶段后重新生成。':metrics.reduced?'长图已降低分辨率，可减少阶段以提高清晰度。':'标准清晰度。';}
 function safeImage(value){try{if(typeof value!=='string'||!value)return '';if(/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(value))return value;const u=new URL(value,document.baseURI);return ['http:','https:','file:'].includes(u.protocol)?u.href:'';}catch{return '';}}
 function assetKey(value){const url=safeImage(value);if(!url||url.startsWith('data:'))return url;const u=new URL(url);u.search=u.hash='';const local=new URL('icons/',document.baseURI);if(u.origin===local.origin&&u.pathname.startsWith(local.pathname))u.pathname=u.pathname.replace(/\/\d+_([^/]+\.png)$/,'/$1');return u.href;}
 let hostedCatalog=null,hostedImages=new Map();
 function githubRoleImage(src){if(hostedCatalog!==root.CHARS){hostedCatalog=root.CHARS;hostedImages=new Map();for(const role of hostedCatalog||[]){const path=role.im;if(['farmer_gstone','tixingguan_gstone'].includes(role.id)&&/^icons\/[a-z\d_-]+\.png$/i.test(path||''))hostedImages.set(assetKey(path),'https://raw.githubusercontent.com/KKovo550/clocktower-wiki/main/script_tool/'+path);}}return hostedImages.get(assetKey(src))||'';}
 let assetPromise=null;
 function assetScript(file,key){if(root[key])return Promise.resolve();return new Promise((resolve,reject)=>{
  const script=document.createElement('script');let done=false;const finish=error=>{if(done)return;done=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else resolve();},timer=setTimeout(()=>finish(Error('内嵌图标加载超时')),15000);script.onload=()=>finish(root[key]?null:Error('内嵌图标资源无效'));script.onerror=()=>finish(Error('内嵌图标加载失败'));script.src=new URL(file,document.baseURI).href;document.head.append(script);
 });}
 function bundledAssets(){if(!assetPromise)assetPromise=Promise.allSettled([assetScript('assets/script-tool/art-icons.js','SCRIPT_ART_ICONS'),assetScript('assets/grimoire/review-export-assets.js','GRIMOIRE_REVIEW_EXPORT_ASSETS')]).then(results=>{
  const map=new Map(),icons=root.SCRIPT_ART_ICONS||{};for(const [key,data]of Object.entries({...icons,...root.GRIMOIRE_REVIEW_EXPORT_ASSETS}))map.set(assetKey(key),data);
  for(const role of root.CHARS||[]){const data=icons[role.im]||icons[role.id];if(data)for(const alias of [role.iu,root.HOSTED_ROLE_ICONS?.[role.id],...(role.images||[])])if(alias){map.set(assetKey(alias),data);const u=new URL(alias,document.baseURI);if(u.hostname==='oss.gstonegames.com'&&/^\/data_file\/clocktower\/(?:web\/icons|role_icon)\/[^/]+\.png$/.test(u.pathname)){for(const directory of ['web/icons','role_icon']){const alternate=new URL(u.href);alternate.pathname='/data_file/clocktower/'+directory+'/'+u.pathname.split('/').at(-1);map.set(assetKey(alternate.href),data);}}}}
  if(results.some(r=>r.status==='rejected'))assetPromise=null;return map;
 });return assetPromise;}
 function decodeImage(url,cancelled){return new Promise(resolve=>{
  if(!url||cancelled())return resolve(null);const image=new Image();image.crossOrigin='anonymous';let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;resolve(value);};const timer=setTimeout(()=>{image.src='';finish(null);},6000);image.onload=()=>finish(cancelled()?null:image);image.onerror=()=>finish(null);image.src=url;
 });}
 async function loadImage(src,cancelled,fallback=''){
  const url=safeImage(src);if(cancelled())return null;let image=null;
  // Local-file images display normally in the journal but cannot be read by canvas.
  // Load the exact catalog asset from the user's public GitHub image host instead.
  if(url.startsWith('file:')){const hosted=githubRoleImage(url);if(hosted)image=await decodeImage(hosted,cancelled);if(image||cancelled())return image;}
  if(url&&!url.startsWith('file:'))image=await decodeImage(url,cancelled);if(image||cancelled())return image;
  if(url){const embedded=(await bundledAssets()).get(assetKey(url));if(embedded)image=await decodeImage(embedded,cancelled);}if(image||cancelled())return image;
  return fallback&&safeImage(fallback)!==url?loadImage(fallback,cancelled):null;
 }
 function fit(ctx,text,max,size=16,weight=''){ctx.font=(weight?weight+' ':'')+size+'px '+font;let s=text;if(ctx.measureText(s).width<=max)return s;while(s&&ctx.measureText(s+'…').width>max)s=characters(s).slice(0,-1).join('');return s+'…';}
 function contain(ctx,img,x,y,w,h){if(!img)return;const scale=Math.min(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
 function cover(ctx,img,x,y,w,h){if(!img)return;const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);}
 function roundBox(ctx,x,y,w,h,r=5){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
 function arcName(ctx,text,x,y,size,{reminder=false}={}){
  const chars=characters(text),label=chars.length>8?chars.slice(0,7).concat('…'):chars,n=label.length;if(!n)return;const fontSize=reminder?Math.min(size*.24,size*.9/n):Math.min(size*.20,size*.95/n),radius=size*(reminder?1:.5),cy=y+size*.4-radius;ctx.font='600 '+fontSize+'px '+font;const widths=label.map(c=>ctx.measureText(c).width+size*.004),total=widths.reduce((a,b)=>a+b,0);let offset=-total/2;ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=reminder?size*.018:size*.012;ctx.strokeStyle=reminder?'#211329':'#fff';ctx.fillStyle=reminder?'#eee0b6':'#171411';for(let i=0;i<n;i++){const angle=(offset+widths[i]/2)/radius;ctx.save();ctx.translate(x+Math.sin(angle)*radius,cy+Math.cos(angle)*radius);ctx.rotate(-angle);ctx.strokeText(label[i],0,0);ctx.fillText(label[i],0,0);ctx.restore();offset+=widths[i];}ctx.restore();
 }
 function drawBoard(ctx,op,get){const board=op.board,h=board.height;ctx.save();ctx.translate(0,op.y);ctx.fillStyle='#344353';ctx.fillRect(0,0,W,h);cover(ctx,get(board.background),0,0,W,h);if(board.dim){ctx.fillStyle='rgba(0,0,0,'+board.dim+')';ctx.fillRect(0,0,W,h);}if(op.blendTo){const fade=ctx.createLinearGradient(0,h-64,0,h);fade.addColorStop(0,op.blendTo+'00');fade.addColorStop(1,op.blendTo);ctx.fillStyle=fade;ctx.fillRect(0,h-64,W,64);}const box=board.logoBox,logo=get(board.logo);if(logo&&box){const extra=box.fallback?1.5:1;ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();contain(ctx,logo,box.x-box.w*(extra-1)/2,box.y-box.h*(extra-1)/2,box.w*extra,box.h*extra);ctx.restore();}
  for(const seat of board.seats){const {x,y,size,role}=seat,token=get('theme/token1.png'),art=get(role?.image,canonicalRoleImage(role));ctx.save();ctx.shadowColor='#06121b88';ctx.shadowBlur=5;ctx.shadowOffsetY=2;contain(ctx,token,x-size/2,y-size/2,size,size);if(!token){ctx.fillStyle='#ebe1c5';ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.save();ctx.beginPath();ctx.arc(x,y,size*.495,0,Math.PI*2);ctx.clip();if(art){ctx.filter=seat.alive?'none':'brightness(.48) saturate(.65)';contain(ctx,art,x-size*.39,y-size*.46,size*.78,size*.78);ctx.filter='none';}else if(role){ctx.fillStyle=colors[role.team]||'#333';ctx.font='20px '+font;ctx.textAlign='center';ctx.fillText('?',x,y);}for(const leaf of seat.leaves){ctx.save();ctx.translate(x,y);ctx.rotate(leaf.angle*Math.PI/180);contain(ctx,get(leaf.image),-size/2,-size/2,size,size);ctx.restore();}ctx.restore();if(role)arcName(ctx,role.name,x,y,size);
   if(!seat.alive)contain(ctx,get('theme/shroud1.png'),x-size*.17,y-size*.5,size*.34,size*.48);
   seat.ranks.forEach(rank=>{const bx=x+(rank.kind==='first'?-1:1)*size*.45,by=y-size*.03,r=Math.max(10,size*.165);ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fillStyle=!seat.alive?'#3d4143':rank.kind==='first'?'#214c89':'#8a2b29';ctx.fill();ctx.lineWidth=1.7;ctx.strokeStyle='#111a1a';ctx.stroke();ctx.font='700 '+r*1.2+'px '+font;ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(rank.value,bx,by+r*.43);});
   const name=seat.number+'号'+(op.showNames&&seat.name?' · '+seat.name:''),text=fit(ctx,name,size*1.25,Math.max(11,size*.14),'500'),tw=ctx.measureText(text).width+12,ny=y+size/2+5;ctx.fillStyle='#172620e6';roundBox(ctx,x-tw/2,ny,tw,21,3);ctx.fill();ctx.strokeStyle='#b6c2b080';ctx.lineWidth=.7;ctx.stroke();ctx.fillStyle='#fff';ctx.font='500 '+Math.max(11,size*.14)+'px '+font;ctx.textAlign='center';ctx.fillText(text,x,ny+15);
   if(!seat.alive){ctx.fillStyle=seat.ghostVote?'#fff':'#9ba5aa';ctx.font='700 17px '+font;ctx.fillText(seat.ghostVote?'☑':'☒',x+tw/2+11,ny+16);}
  }
  for(const seat of board.seats)for(const marker of seat.reminders){const {x,y,size}=marker;ctx.save();ctx.translate(x,y);if(marker.flipped)ctx.rotate(Math.PI);contain(ctx,get('theme/reminder1.png'),-size/2,-size/2,size,size);const art=get(marker.image,canonicalRoleImage(marker.role));if(art)contain(ctx,art,-size*.34,-size*.43,size*.68,size*.68);if(marker.kind==='custom'){const chars=characters(marker.text),label=chars.length>12?chars.slice(0,11).concat('…'):chars,rows=[];for(let i=0;i<label.length;i+=4)rows.push(label.slice(i,i+4).join(''));ctx.font='600 '+size*.2+'px '+font;ctx.textAlign='center';ctx.lineWidth=1;ctx.strokeStyle='#241429';ctx.fillStyle='#eee0b6';rows.forEach((text,i)=>{const y=(i-(rows.length-1)/2)*size*.23+size*.07;ctx.strokeText(text,0,y);ctx.fillText(text,0,y);});}else arcName(ctx,marker.text,0,0,size,{reminder:true});ctx.restore();}
  if(!op.blendTo){ctx.fillStyle='#17242c';ctx.fillRect(0,h,W,38);ctx.font='12px '+font;ctx.textAlign='left';ctx.fillStyle='#edf2f4';ctx.fillText(board.caption||('导出时身份 · 存活 '+board.seats.filter(s=>s.alive).length+'/'+board.seats.length),16,h+24);ctx.textAlign='right';ctx.fillStyle='#c5d3db';ctx.fillText('蓝：首夜顺序  红：其他夜顺序  帷幕：死亡  ☑：有死亡票',W-16,h+24);}ctx.restore();
 }
 async function render(page,{cancelled=()=>false}={}){
  // Keep the complete long image within canvas limits, reducing resolution only for very long reviews.
  const {scale,width,height}=imageMetrics(page),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('此浏览器暂不支持生成图片');
  const sources=new Map(),key=(src,fallback='')=>JSON.stringify([src||'',fallback]),add=(src,fallback='')=>{if(src||fallback)sources.set(key(src,fallback),{src,fallback});},loaded=new Map(),get=(src,fallback='')=>loaded.get(key(src,fallback));
  for(const op of page.ops)if(op.kind==='table'){add('theme/token1.png');add(op.board?.background);add(op.board?.logo);if(op.board?.seats.some(s=>!s.alive))add('theme/shroud1.png');if(op.board?.seats.some(s=>s.reminders.length))add('theme/reminder1.png');for(const seat of op.board?.seats||[]){add(seat.role?.image,canonicalRoleImage(seat.role));for(const leaf of seat.leaves)add(leaf.image);for(const marker of seat.reminders)add(marker.image,canonicalRoleImage(marker.role));}}else if(op.kind==='entry')for(const line of op.lines)for(const run of line)if(run.image)add(run.image,run.fallbackImage);
  const queue=[...sources.entries()];let failed=0;await Promise.all(Array.from({length:Math.min(6,queue.length)},async()=>{while(queue.length&&!cancelled()){const [id,{src,fallback}]=queue.shift(),im=await loadImage(src,cancelled,fallback);loaded.set(id,im);if(!im)failed++;}}));
  if(cancelled()){canvas.width=canvas.height=0;return null;}ctx.scale(scale,scale);ctx.textBaseline='alphabetic';ctx.fillStyle='#fff';ctx.fillRect(0,0,W,page.height);
  for(const op of page.ops){
   if(op.kind==='table'&&op.board){drawBoard(ctx,op,get);}
   else{
    ctx.fillStyle=op.phase==='night'?'#f0f2f4':'#fff';ctx.fillRect(0,op.y,W,op.height);
    if(op.kind==='stageBridge'){ctx.textAlign='left';ctx.fillStyle='#606d78';ctx.font='13px '+font;ctx.fillText(op.caption||'阶段结束／最新快照',30,op.y+22);ctx.font='12px '+font;ctx.fillStyle='#7c858e';ctx.fillText('蓝 / 红数字：首夜 / 其他夜顺序 · 帷幕：死亡 · ☑：有死亡票',30,op.y+43);ctx.fillStyle='#a68b50';roundBox(ctx,30,op.y+65,4,21,2);ctx.fill();ctx.fillStyle='#303a44';ctx.font='600 21px '+font;ctx.fillText('本阶段行动',45,op.y+82);ctx.textAlign='right';ctx.fillStyle='#7c858e';ctx.font='14px '+font;ctx.fillText(op.count+' 条记录',W-30,op.y+81);ctx.textAlign='left';ctx.fillStyle=op.phase==='night'?'#dce1e5':'#e7eaed';ctx.fillRect(30,op.y+99,W-60,1);}
    else if(op.kind==='identityHeading'){ctx.fillStyle='#252b32';ctx.font='600 25px '+font;ctx.fillText('身份变化对照',op.margin,op.y+38);ctx.fillStyle='#737d87';ctx.font='14px '+font;ctx.fillText('上方为导出时魔典；下方行动保留记录当时的身份。',op.margin,op.y+68);}
    else if(op.kind==='heading'){const margin=op.margin??28,baseline=op.y+op.height-34;ctx.fillStyle='#252b32';ctx.font='600 25px '+font;const title='第 '+op.round+(op.phase==='night'?' 夜':' 天');ctx.fillText(title,margin,baseline);const x=margin+ctx.measureText(title).width+15;ctx.fillStyle='#7c858e';ctx.font='14px '+font;ctx.fillText((op.phase==='night'?'Night ':'Day ')+op.round,x,baseline-1);ctx.fillStyle=op.phase==='night'?'#dce1e5':'#e7eaed';ctx.fillRect(margin,op.y+op.height-17,W-margin*2,1);}
    else if(op.kind==='entry')for(let i=0;i<op.lines.length;i++)for(const run of op.lines[i]){const size=op.size??16,x=(op.margin??20)+run.x,y=op.y+size+2+i*(op.lineHeight??28);if(run.image){const im=get(run.image,run.fallbackImage);if(im)contain(ctx,im,x,y-size+1,size+2,size+2);else{ctx.fillStyle='#999';ctx.font='14px '+font;ctx.fillText('◇',x,y);}}else{ctx.fillStyle=run.color||'#252b32';ctx.font=size+'px '+font;ctx.fillText(run.text,x,y);}}
    else if(op.kind==='empty'){ctx.fillStyle='#777';ctx.font='18px '+font;ctx.fillText('暂无已保存的复盘记录',20,op.y+48);}
   }
  }
  let blob;try{blob=await new Promise((resolve,reject)=>{try{canvas.toBlob(value=>value?resolve(value):reject(Error('图片生成失败，请重试')),'image/png');}catch{reject(Error('部分图标无法用于导出，请换用本地图标后重试'));}});}finally{canvas.width=canvas.height=0;}return cancelled()?null:{blob,failed,width,height};
 }
 function show(data,{open,isPublic,node,button,field,hint,layoutFactory=plan,sequence=false}){
  if(isPublic())return;let disposed=false,url='',version=0,layout=null;
  open(sequence?'导出逐阶段长图':'导出复盘图片',host=>{
   const wrap=node('div',undefined,'g-review-export'),tools=node('div',undefined,'g-review-export-options'),table=node('input'),names=node('input'),history=node('input'),summaries=node('input'),density=node('select'),generate=button('生成预览',generatePreview),status=node('p','','g-hint'),estimate=node('p','','g-hint'),scopeHint=hint(''),preview=node('img',undefined,'g-review-export-preview'),download=button('保存图片',save,'primary');
   wrap.id='gReviewExportView';table.type=names.type=history.type=summaries.type='checkbox';table.checked=names.checked=history.checked=summaries.checked=true;
   for(const [control,id]of [[history,'History'],[table,'Table'],[names,'Names'],[summaries,'Summary'],[density,'Density'],[generate,'Generate'],[status,'Status'],[estimate,'Estimate'],[preview,'Preview'],[download,'Download']])control.id='gReviewExport'+id;
   for(const [value,label]of [['comfortable','舒适阅读'],['compact','紧凑长图']]){const option=node('option',label);option.value=value;density.append(option);}density.value='comfortable';
   status.setAttribute('role','status');estimate.setAttribute('role','status');preview.alt='所选阶段的复盘长图预览';preview.hidden=true;download.disabled=true;
   const historyField=field('身份变化对照',history);historyField.hidden=sequence;
   tools.append(field(sequence?'包含各阶段魔典':'包含导出时魔典',table),field('围桌／对照中的姓名',names),historyField,field('阶段变化摘要',summaries),field('排版',density),generate);
   const phases=node('fieldset',undefined,'g-review-export-phases'),legend=node('legend','选择导出阶段'),phaseTools=node('div',undefined,'g-review-export-phase-tools'),phaseList=node('div',undefined,'g-review-export-phase-list'),checks=[];
   phases.id='gReviewExportPhases';const all=button('全选',()=>setSelection(true),'subtle'),none=button('清空选择',()=>setSelection(false),'subtle');all.id='gReviewExportAll';none.id='gReviewExportNone';phaseTools.append(all,none);
   data.stages.forEach((stage,index)=>{const check=node('input');check.type='checkbox';check.checked=true;check.value=String(index);check.dataset.exportStage=String(index);check.onchange=invalidate;checks.push(check);phaseList.append(field(phaseLabel(stage)+' · '+stage.entries.length+' 条记录',check));});
   phases.append(legend,phaseTools,phaseList);if(!checks.length)phases.hidden=true;
   const saveBar=node('div',undefined,'g-review-export-save');saveBar.append(download);wrap.append(tools,phases,scopeHint,estimate,hint('完整身份复盘，含角色与标记信息；不含私人笔记。一张长图建议发送原图。记录与摘要中的姓名保留原文。'),status,saveBar,preview);host.append(wrap);
   const dialog=host.closest('dialog'),onClose=()=>{if(!dialog.open)dispose();},observer=new MutationObserver(()=>{if(!wrap.isConnected||isPublic()||dialog&&!dialog.open)dispose();});observer.observe(host,{childList:true});if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});dialog?.addEventListener('close',onClose);
   let historyPreference=history.checked;
   const selected=()=>checks.flatMap((c,i)=>c.checked?[i]:[]);
   function clear(){preview.hidden=true;preview.removeAttribute('src');if(url){URL.revokeObjectURL(url);url='';}}
   function dispose(){if(disposed)return;disposed=true;version++;clear();wrap.replaceChildren();observer.disconnect();dialog?.removeEventListener('close',onClose);}
   function cancelled(v){return disposed||version!==v||isPublic()||!wrap.isConnected;}
   function setSelection(value){for(const check of checks)check.checked=value;invalidate();}
   function prepare(){
    const indices=selected(),empty=checks.length&&!indices.length,partial=indices.length!==checks.length;history.disabled=sequence||partial;history.checked=historyPreference&&!history.disabled;generate.disabled=!!empty;
    scopeHint.textContent=sequence?'按勾选顺序对应的实际昼夜排列，每个魔典使用该阶段结束／最新快照。':(partial?'只导出勾选阶段，不附加全局身份对照。':'身份对照使用全局历史。')+(table.checked?'顶部魔典显示导出时的当前状态。':'')+' 阶段摘要只比较可靠快照。';
    if(empty){layout=null;estimate.textContent='请选择至少一个阶段后生成预览。';return null;}
    const ctx=document.createElement('canvas').getContext('2d');if(!ctx)throw Error('此浏览器暂不支持生成图片');
    const indicesOption=checks.length?indices:undefined;layout=layoutFactory(data,ctx,{includeTable:table.checked,showNames:names.checked,includeHistory:history.checked&&!history.disabled,includeSummary:summaries.checked,includeInfo:true,density:density.value,stageIndices:indicesOption});
    const metrics=imageMetrics(layout.pages[0]),records=indices.reduce((n,i)=>n+data.stages[i].entries.length,0);
    estimate.textContent=indices.length+' 个阶段 · '+records+' 条记录 · 预计 '+metrics.width+' × '+metrics.height+' 像素 · '+qualityText(metrics);estimate.classList.toggle('is-warning',metrics.reduced);return metrics;
   }
   function invalidate(){if(disposed||isPublic())return;version++;clear();download.disabled=true;status.textContent='选项已更改，请生成新预览后保存。';try{prepare();}catch(e){layout=null;generate.disabled=true;estimate.textContent=e.message;}}
   async function generatePreview(){
    if(disposed||isPublic())return;const v=++version;clear();download.disabled=true;
    try{const metrics=prepare();if(!metrics)return;generate.disabled=true;status.textContent='正在生成所选阶段的完整长图…';
     const result=await render(layout.pages[0],{cancelled:()=>cancelled(v)});if(cancelled(v)||!result)return;url=URL.createObjectURL(result.blob);preview.src=url;preview.hidden=false;
     const size=result.blob.size>1048576?(result.blob.size/1048576).toFixed(1)+' MB':Math.max(1,Math.ceil(result.blob.size/1024))+' KB';
     status.textContent=result.width+' × '+result.height+' 像素 · PNG '+size+' · '+qualityText(metrics)+(result.failed?' '+result.failed+' 个图片资源未能载入，已保留文字或占位，请检查预览。':' 图片资源已载入。');generate.disabled=false;download.disabled=false;
    }catch(e){if(cancelled(v))return;clear();status.textContent=e.message;generate.disabled=false;download.disabled=true;}
   }
   function save(){if(!url||isPublic()||disposed||download.disabled)return;const a=node('a');a.href=url;a.download=filename(data.name+(sequence?'-逐阶段长图':''));a.textContent='保存复盘图片';host.append(a);a.click();a.remove();}
   history.onchange=()=>{historyPreference=history.checked;generatePreview();};table.onchange=names.onchange=summaries.onchange=density.onchange=generatePreview;generatePreview();
  });
 }
 async function embedImage(src,{cancelled=()=>false,fallback='',maxEdge=0}={}){
  const url=safeImage(src);if(!url||cancelled())return '';const compact=Number.isFinite(maxEdge)&&maxEdge>0;
  if(url.startsWith('data:')&&!compact)return url;
  const bundled=url.startsWith('data:')?url:(await bundledAssets()).get(assetKey(url));if(bundled&&!compact)return bundled;
  if(compact&&/^data:image\/gif;/i.test(bundled||''))return bundled;
  const im=await loadImage(bundled||url,cancelled,fallback);if(!im||cancelled())return cancelled()?'':bundled||'';
  const canvas=document.createElement('canvas'),width=im.naturalWidth||im.width,height=im.naturalHeight||im.height,scale=compact?Math.min(1,maxEdge/Math.max(width,height)):1;canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  try{const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,canvas.width,canvas.height);const result=canvas.toDataURL(compact?'image/webp':'image/png',.82);return compact&&bundled&&bundled.length<result.length?bundled:result;}catch{return bundled||'';}finally{canvas.width=canvas.height=0;}
 }
 const api={fragments,snapshot,identityHistory,captureBoard,lines,selectedStages,rangeLabel,information,summaryRuns,imageMetrics,qualityText,plan,render,show,filename,embedImage};root.GrimoireReviewExport=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
