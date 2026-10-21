/* Private reminder tokens. Text remains compatible with existing version-1 backups. */
(function(root){
 'use strict';
 function create(ui){
  const {C,node,button,hint,open,close,apply,image,dialog,getState,isPlayer}=ui;
  const common=[['poison','中毒'],['drunk','醉酒'],['good','善良'],['evil','邪恶']];let presentOnly=false;
  function describe(text,detail){const kind=detail?.kind||common.find(x=>x[1]===text)?.[0]||'custom',role=kind==='role'?getState().script.roles.find(r=>r.id===detail.roleId):C.reminderIcon(kind);return {text,kind,role,source:kind==='role'?role?.name||'角色标记':kind==='custom'?'自定义':'通用'};}
  function token(text,detail,click){
   const d=describe(text,detail),b=button('',click,'g-reminder-token kind-'+d.kind);b.title=d.source+'：'+text;b.setAttribute('aria-label',d.source+'：'+text);const art=node('span',undefined,'g-reminder-art');if(d.role)art.append(image(d.role));else art.append(node('span','✦','g-reminder-symbol'));b.append(art,node('span',text,'g-reminder-caption'));return b;
  }
  function seatControls(id){
   const fragment=document.createDocumentFragment();if(isPlayer())return fragment;const state=getState(),seat=state.seats.find(s=>s.id===id);if(!seat)return fragment;
   const strip=node('div',undefined,'g-reminders g-reminder-tokens');seat.reminders.forEach((text,index)=>{const b=token(text,seat.reminderDetails?.[index],()=>{if(isPlayer())return;if(apply({type:'reminderRemove',seatId:id,index}))document.getElementById('gReminderAdd_'+id)?.focus({preventScroll:true});});b.id='gReminder_'+id+'_'+index;b.dataset.reminderIndex=String(index);b.title+=' · 单击移除';b.setAttribute('aria-label','移除 '+b.getAttribute('aria-label'));strip.append(b);});
   const add=button('',()=>{add.focus({preventScroll:true});picker(id);},'g-reminder-add');add.id='gReminderAdd_'+id;add.title='添加提示标记';add.setAttribute('aria-label','为 '+(state.seats.indexOf(seat)+1)+' 号'+(seat.name?' '+seat.name:'')+' 添加提示标记');add.disabled=seat.reminders.length>=20;strip.append(add);fragment.append(strip);
   if(seat.reminders.length>2){const more=button('⋯',()=>picker(id),'g-reminder-more');more.title='管理全部 '+seat.reminders.length+' 个提示标记';more.setAttribute('aria-label','管理此玩家全部 '+seat.reminders.length+' 个提示标记');fragment.append(more);}return fragment;
  }
  function picker(id){
   if(isPlayer())return;const current=getState(),seat=current.seats.find(s=>s.id===id);if(!seat)return;
   open('添加提示标记 · '+(current.seats.indexOf(seat)+1)+'号',host=>{
    const toolbar=node('div',undefined,'g-reminder-search-row'),search=node('input'),scope=button('只看在场',()=>{presentOnly=!presentOnly;draw();},'subtle');search.id='gReminderSearch';search.type='search';search.placeholder='搜索标记或角色名…';search.setAttribute('aria-label','搜索标记或角色名');scope.id='gReminderPresent';toolbar.append(search,scope);
    const form=node('form',undefined,'g-reminder-search-row'),custom=node('input'),add=button('添加',undefined,'primary');custom.id='gCustomReminderText';custom.placeholder='或自定义一个标记…';custom.maxLength=100;custom.setAttribute('aria-label','自定义提示标记');add.id='gCustomReminderAdd';add.type='submit';form.append(custom,add);const selected=node('div',undefined,'g-reminder-selected'),results=node('div',undefined,'g-reminder-results'),status=node('p',undefined,'g-hint');status.id='gReminderStatus';status.setAttribute('role','status');
    const addMarker=(text,detail)=>{if(apply({type:'reminderAdd',seatId:id,text,detail}))close();};form.onsubmit=e=>{e.preventDefault();if(custom.value.trim())addMarker(custom.value.trim(),{kind:'custom'});};custom.oninput=()=>{add.disabled=!custom.value.trim()||getState().seats.find(s=>s.id===id).reminders.length>=20;};
    function draw(){
     const state=getState(),target=state.seats.find(s=>s.id===id);if(!target){close();return;}const full=target.reminders.length>=20,terms=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),matches=value=>terms.every(q=>value.toLocaleLowerCase().includes(q)),present=new Set(state.seats.map(s=>s.roleId).filter(Boolean));scope.setAttribute('aria-pressed',String(presentOnly));add.disabled=full||!custom.value.trim();selected.replaceChildren();results.replaceChildren();
     if(target.reminders.length){selected.append(node('p','已添加 '+target.reminders.length+' / 20 · 点 × 移除','g-reminder-section-label'));const chips=node('div',undefined,'g-reminder-chips');target.reminders.forEach((text,index)=>{const d=describe(text,target.reminderDetails?.[index]),remove=button(text+' ×',()=>{if(apply({type:'reminderRemove',seatId:id,index}))draw();},'subtle');remove.dataset.removeReminder=String(index);remove.setAttribute('aria-label','移除 '+d.source+'：'+text);chips.append(remove);});selected.append(chips);}
     let count=0;const general=common.filter(([,text])=>matches('通用 '+text));if(general.length){results.append(node('h3','通用标记','g-reminder-section-label'));const grid=node('div',undefined,'g-reminder-grid');general.forEach(([kind,text])=>{const b=token(text,{kind},()=>addMarker(text,{kind}));b.dataset.reminderKind=kind;b.disabled=full;grid.append(b);});results.append(grid);count+=general.length;}
     const roles=state.script.roles.filter(r=>!presentOnly||present.has(r.id)),items=[],seen=new Set();for(const role of roles)for(const raw of role.reminders||[]){const text=raw.trim(),key=JSON.stringify([role.id,text]);if(!text||seen.has(key)||!matches(text+' '+role.name))continue;seen.add(key);items.push({role,text});}if(items.length){results.append(node('h3','角色提示标记','g-reminder-section-label'));const grid=node('div',undefined,'g-reminder-grid');items.forEach(({role,text})=>{const detail={kind:'role',roleId:role.id},b=token(text,detail,()=>addMarker(text,detail));b.dataset.sourceRole=role.id;b.dataset.reminderText=text;b.disabled=full||text.length>100;if(text.length>100)b.title='标记超过 100 字，可自定义一个较短的标记';grid.append(b);});results.append(grid);count+=items.length;}
     status.textContent=full?'此玩家已达到 20 个标记，请先移除再添加。':count?'共 '+count+' 个候选标记':'没有匹配的标记，可以调整搜索、在场筛选或填写自定义文字。';
    }
    search.oninput=draw;host.append(toolbar,form,selected,results,status,hint('标记仅作说书人提醒，不会自动改变生死、阵营或执行角色能力。'));draw();
   });dialog.classList.add('g-reminder-dialog');
  }
  return {seatControls,picker};
 }
 root.GrimoireReminders={create};
})(globalThis);
