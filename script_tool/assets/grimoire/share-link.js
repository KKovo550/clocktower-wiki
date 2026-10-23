/* Encrypted, immutable read-only links. No game storage or editing in the reader. */
(function(root){
 'use strict';
 const endpoint='https://clocktower-wiki-admin.clocktower-wiki.workers.dev/api/replays/',storeKey='botc_grimoire_share_links_v1',maxBytes=8*1024*1024,maxPlain=32*1024*1024;
 const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
 const un64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 const random=n=>b64(crypto.getRandomValues(new Uint8Array(n)));
 function available(){if(!root.crypto?.subtle)throw Error('请使用 HTTPS 网站或本机浏览器打开魔典后生成链接');}
 async function readLimited(stream,limit){const reader=stream.getReader(),parts=[];let size=0;try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>limit)throw Error('复盘内容过大，请减少分享阶段');parts.push(r.value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return all;}
 async function encrypt(data,keyText=random(32)){
  available();let bytes=new TextEncoder().encode(JSON.stringify(data));if(bytes.length>maxPlain)throw Error('复盘和图标超过 32 MiB，请减少阶段或使用互动文件');
  let compressed=0;if(root.CompressionStream){const zip=await readLimited(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),maxPlain);if(zip.length<bytes.length){bytes=zip;compressed=1;}}
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await crypto.subtle.importKey('raw',un64(keyText),'AES-GCM',false,['encrypt']),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes)),result=new Uint8Array(cipher.length+14);
  result.set([1,compressed]);result.set(iv,2);result.set(cipher,14);if(result.length>maxBytes)throw Error('加密快照超过 8 MiB，请减少阶段或使用互动文件');return {bytes:result,key:keyText};
 }
 async function decrypt(bytes,keyText){
  available();if(bytes.length>maxBytes||bytes.length<30||bytes[0]!==1||bytes[1]>1||!/^[A-Za-z0-9_-]{43}$/.test(keyText))throw Error('分享链接或快照格式无效');
  const key=await crypto.subtle.importKey('raw',un64(keyText),'AES-GCM',false,['decrypt']);let plain;
  try{plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(2,14)},key,bytes.slice(14)));}catch{throw Error('链接不完整或密钥不正确，请让分享者重新复制完整链接');}
  if(bytes[1]){if(!root.DecompressionStream)throw Error('浏览器版本过旧，请更新浏览器后查看');plain=await readLimited(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip')),maxPlain);}
  if(plain.length>maxPlain)throw Error('复盘内容超过阅读上限');return validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain)));
 }
 function validate(data){
  const fail=()=>{throw Error('复盘数据不完整或格式不受支持');},str=(v,n=20000)=>{if(typeof v!=='string'||v.length>n)fail();return v;},num=(v,max=10000)=>{if(!Number.isFinite(v)||Math.abs(v)>max)fail();return v;},arr=(v,max)=>{if(!Array.isArray(v)||v.length>max)fail();return v;},asset=v=>{str(v,20);if(v&&!Object.hasOwn(data.assets,v))fail();return v;};
  if(!data||data.version!==1)fail();str(data.name,1000);if(!data.assets||Array.isArray(data.assets)||typeof data.assets!=='object')fail();
  if(Object.keys(data.assets).length>3000)fail();for(const [id,uri]of Object.entries(data.assets)){str(id,20);if(typeof uri!=='string'||!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(uri))fail();}
  for(const key of ['token','shroud','reminder'])asset(data.skin?.[key]);let entries=0,runs=0;
  for(const stage of arr(data.stages,100)){
   if(!['night','day'].includes(stage.phase)||!Number.isInteger(stage.round)||stage.round<1||stage.round>100)fail();
   for(const point of ['start','end']){const f=stage.frames?.[point];if(!f||typeof f.complete!=='boolean')fail();if(num(f.height,4000)<100)fail();asset(f.background);asset(f.logo);
    for(const p of arr(f.players,64)){str(p.id,100);num(p.number,1000);str(p.name,1000);if(![true,false,null].includes(p.alive)||![true,false,null].includes(p.ghostVote))fail();if(!['good','evil','unknown'].includes(p.alignment))fail();num(p.x);num(p.y);if(num(p.size,1000)<0)fail();if(p.role){str(p.role.name,1000);str(p.role.team,30);asset(p.role.image);}
     for(const l of arr(p.leaves,20)){asset(l.image);if(l.angle!==undefined)num(l.angle,3600);}for(const r of arr(p.ranks,2)){if(!['first','other'].includes(r.kind))fail();num(r.value,1000);}for(const m of arr(p.reminders,100)){str(m.text);asset(m.image);num(m.x);num(m.y);num(m.size,1000);}
    }
   }
   for(const e of arr(stage.entries,5000)){if(++entries>20000)fail();for(const id of arr(e.ids,64))str(id,100);for(const r of arr(e.runs,1000)){if(++runs>100000)fail();if(r.image)asset(r.image);else str(r.text||'');if(r.color)str(r.color,20);}}
   if(stage.summary){if(typeof stage.summary.complete!=='boolean')fail();if(stage.summary.notice!==undefined)str(stage.summary.notice);for(const c of arr(stage.summary.changes,1000))str(c.text);}
  }
  if(!data.stages.length)fail();return data;
 }
 function readerUrl(){const current=new URL(root.location.href);return current.protocol==='https:'?new URL('assets/grimoire/share-reader.html',current).href:'https://kkovo550.github.io/clocktower-wiki/script_tool/assets/grimoire/share-reader.html';}
 function receipts(){const value=JSON.parse(root.localStorage.getItem(storeKey)||'{"version":1,"links":[]}');if(value.version!==1||!Array.isArray(value.links))throw Error('本机分享记录无法读取，请先备份浏览器数据');return value.links;}
 function remember(record){const links=receipts(),i=links.findIndex(x=>x.id===record.id);if(i<0){if(links.length>=100)throw Error('本机分享记录已满，请先清理已过期链接');links.push(record);}else links[i]=record;root.localStorage.setItem(storeKey,JSON.stringify({version:1,links}));}
 function forget(id){root.localStorage.setItem(storeKey,JSON.stringify({version:1,links:receipts().filter(x=>x.id!==id)}));}
 async function request(id,options={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);try{const response=await fetch(endpoint+id,{...options,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});if(!response.ok){let message='分享服务请求失败（'+response.status+'）';try{message=(await response.json()).error||message;}catch{}throw Error(message);}return response;}catch(e){if(e.name==='AbortError')throw Error('连接超时，请检查网络；可在本机分享记录中撤销未确认的链接');throw e;}finally{clearTimeout(timer);}
 }
 async function publish(data,days){
  if(![1,7,30].includes(days))throw Error('请选择有效期');const encrypted=await encrypt(data),id=random(16),token=random(32),url=readerUrl()+'#v1/'+id+'/'+encrypted.key,record={id,token,url,name:data.name,createdAt:Date.now(),expiresAt:Date.now()+days*86400000,status:'pending'};
  // Keep the revocation credential before any upload, even if its response is lost.
  remember(record);const response=await request(id,{method:'PUT',headers:{'Content-Type':'application/octet-stream','X-Replay-Days':String(days),Authorization:'Bearer '+token},body:encrypted.bytes}),result=await response.json();record.expiresAt=result.expiresAt;record.status='ready';remember(record);return record;
 }
 async function revoke(record){try{await request(record.id,{method:'DELETE',headers:{Authorization:'Bearer '+record.token}});}catch(e){if(!/链接已过期、已撤销或不存在/.test(e.message))throw e;}forget(record.id);}
 async function copy(value,input,status){try{await navigator.clipboard.writeText(value);status.textContent='链接已复制，可发送给朋友。';}catch{input.focus();input.select();status.textContent='请长按或全选上方链接后复制。';}}
 function show(data,{open,isPublic,node,button,field,hint}){
  const S=root.GrimoireReplayShare,E=root.GrimoireReviewExport;
  open('手机只读分享',host=>{
   const rootView=node('div',undefined,'g-share-link'),phases=node('fieldset'),legend=node('legend','选择分享阶段'),checks=[],preview=node('iframe'),status=hint('请选择阶段并预览，确认后再生成链接。'),days=node('select'),confirm=node('input'),generate=button('生成只读链接',upload,'primary'),previewButton=button('预览所选复盘',prepare,'primary'),output=node('textarea'),copyButton=button('复制链接',()=>copy(output.value,output,status),'primary'),list=node('div'),count=hint('');
   rootView.id='gShareLink';phases.id='gShareLinkPhases';preview.id='gShareLinkPreview';status.id='gShareLinkStatus';status.setAttribute('role','status');output.id='gShareLinkOutput';generate.id='gShareLinkGenerate';previewButton.id='gShareLinkPrepare';confirm.id='gShareLinkConfirm';days.id='gShareLinkDays';
   preview.title='所选复盘的只读预览';preview.setAttribute('sandbox','allow-scripts');preview.hidden=true;output.readOnly=true;output.rows=3;output.hidden=copyButton.hidden=true;confirm.type='checkbox';generate.disabled=true;let prepared=null,version=0,busy=false;
   const cancelled=()=>isPublic()||!rootView.isConnected;
   function invalidate(){version++;prepared=null;generate.disabled=true;confirm.checked=false;preview.hidden=true;preview.removeAttribute('srcdoc');output.hidden=copyButton.hidden=true;count.textContent='已选 '+checks.filter(c=>c.checked).length+' / '+data.stages.length+' 个阶段';}
   phases.append(legend);data.stages.forEach((s,i)=>{const check=node('input'),label=node('label');check.type='checkbox';check.checked=true;check.dataset.shareStage=String(i);check.onchange=invalidate;checks.push(check);label.append(check,document.createTextNode('第 '+s.round+(s.phase==='night'?' 夜':' 天')+' · '+s.entries.length+' 条记录'));phases.append(label);});
   for(const n of [1,7,30]){const option=node('option',n+' 天');option.value=String(n);days.append(option);}days.value='7';confirm.onchange=()=>generate.disabled=busy||!prepared||!confirm.checked;
   const confirmLabel=node('label');confirmLabel.append(confirm,document.createTextNode('我已检查预览，确认向持链接的人分享所选阶段的真实身份、夜间信息与提醒。'));
   rootView.append(hint('这是结局完整身份复盘，链接持有者无需登录即可阅读。不含私人笔记或草稿。每次生成固定快照，之后编辑对局不会改变它。'),phases,count,previewButton,preview,field('链接有效期',days),confirmLabel,generate,output,copyButton,status,node('h3','本机生成的分享'),hint('撤销凭据保存在本设备浏览器中，请保留本机数据。撤销不能收回他人已保存的内容。'),list);host.append(rootView);invalidate();drawList();
   const dialog=host.closest('dialog'),observer=new MutationObserver(()=>{if(cancelled()||dialog&&!dialog.open){version++;preview.removeAttribute('srcdoc');preview.hidden=true;output.value='';observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
   async function prepare(){if(busy||cancelled())return;let indices;try{indices=E.selectedStages(data,checks.flatMap((c,i)=>c.checked?[i]:[]));}catch{status.textContent='请至少选择一个阶段。';return;}invalidate();const mine=version;busy=true;previewButton.disabled=true;status.textContent='正在整理所选阶段和图标…';try{const selected={...data,stages:indices.map(i=>data.stages[i])},embedded=await S.embed(selected,()=>cancelled()||mine!==version);if(!embedded||cancelled()||mine!==version)return;validate(embedded.data);prepared=embedded.data;preview.srcdoc=S.html(prepared,{online:true});preview.hidden=false;status.textContent='预览已生成。请检查后勾选确认。'+(embedded.failed?' '+embedded.failed+' 个图片资源未能加载，文字仍保留。':'');}catch(e){if(!cancelled())status.textContent='预览失败：'+e.message;}finally{busy=false;previewButton.disabled=false;generate.disabled=!prepared||!confirm.checked;}}
   async function upload(){if(busy||!prepared||!confirm.checked||cancelled())return;const snapshot=prepared,mine=version;busy=true;generate.disabled=previewButton.disabled=true;phases.disabled=days.disabled=confirm.disabled=true;status.textContent='正在加密并生成链接…';try{const record=await publish(snapshot,Number(days.value));if(cancelled()||mine!==version)return;output.value=record.url;output.hidden=copyButton.hidden=false;status.textContent='链接已生成，有效至 '+new Date(record.expiresAt).toLocaleString()+'。';drawList();}catch(e){if(!cancelled()){status.textContent='生成未确认：'+e.message;drawList();}}finally{busy=false;if(!cancelled()){phases.disabled=days.disabled=confirm.disabled=false;previewButton.disabled=false;generate.disabled=!prepared||!confirm.checked;}}}
   function drawList(){list.replaceChildren();let links;try{links=receipts();}catch(e){list.append(hint(e.message));return;}for(const record of links.slice().reverse()){const row=node('article'),expired=record.expiresAt<=Date.now(),revokeButton=button(expired?'清理过期记录':'撤销链接',async()=>{revokeButton.disabled=true;try{if(expired)forget(record.id);else await revoke(record);if(output.value===record.url){output.value='';output.hidden=copyButton.hidden=true;}drawList();status.textContent=expired?'过期记录已清理。':'链接已撤销。';}catch(e){status.textContent=e.message;revokeButton.disabled=false;}},'subtle');row.append(node('strong',record.name),hint(new Date(record.createdAt).toLocaleString()+' · '+(expired?'已过期':record.status==='ready'?'有效至 '+new Date(record.expiresAt).toLocaleString():'生成结果未确认，可撤销后重新生成')));if(!expired&&record.status==='ready')row.append(button('复制链接',()=>{output.value=record.url;output.hidden=copyButton.hidden=false;copy(record.url,output,status);},'subtle'));row.append(revokeButton);list.append(row);}if(!links.length)list.append(hint('尚无本机分享记录。'));}
  });
 }
 let readerVersion=0;
 async function loadReader(){
  const status=document.getElementById('shareReaderStatus'),frame=document.getElementById('shareReaderFrame'),retry=document.getElementById('shareReaderRetry'),mine=++readerVersion;
  frame.hidden=true;frame.removeAttribute('srcdoc');retry.disabled=true;status.textContent='正在读取复盘…';document.title='只读复盘';
  try{const match=/^#v1\/([A-Za-z0-9_-]{22})\/([A-Za-z0-9_-]{43})$/.exec(root.location.hash);if(!match)throw Error('分享链接不完整，请让分享者重新复制完整链接。');const response=await request(match[1]),bytes=await readLimited(response.body,maxBytes),data=await decrypt(bytes,match[2]);if(mine!==readerVersion)return;frame.srcdoc=root.GrimoireReplayShare.html(data,{online:true});frame.hidden=false;status.textContent='只读复盘 · 包含完整身份 · 不会修改任何对局';document.title=data.name+' · 只读复盘';}catch(e){if(mine===readerVersion)status.textContent='无法打开复盘：'+e.message;}finally{if(mine===readerVersion)retry.disabled=false;}
 }
 root.GrimoireShareLink={encrypt,decrypt,validate,publish,revoke,receipts,show,loadReader};
 if(typeof document!=='undefined'&&document.getElementById('shareReaderFrame')){
  document.getElementById('shareReaderRetry').onclick=loadReader;root.addEventListener('hashchange',loadReader);root.addEventListener('pageshow',e=>{if(e.persisted)loadReader();});root.addEventListener('pagehide',()=>{readerVersion++;const f=document.getElementById('shareReaderFrame');f.hidden=true;f.removeAttribute('srcdoc');});loadReader();
 }
})(globalThis);
