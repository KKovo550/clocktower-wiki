/* Private, chronological game review. Rules and ability effects remain Storyteller decisions. */
(function(root){
 'use strict';
 function create({getState,isPublic,isDirty,apply,sidePanel,history,node,button,field,hint,image,contentArrive}){
  let draft=null;
  const label=p=>p.number+'号'+(p.name?' '+p.name:'')+(p.roleName?'（'+p.roleName+'）':''),stageLabel=s=>'第 '+s.round+(s.phase==='night'?' 夜':' 天');
  function playerLabel(p){
   const wrap=node('strong',undefined,'g-review-player '+(p.team||'unknown'));wrap.append(document.createTextNode(p.number+'号'+(p.name?' '+p.name:'')));
   if(p.roleName){
    const role=getState().script.roles.find(r=>r.id===p.roleId&&r.name===p.roleName&&r.team===p.team),identity=node('span',undefined,'g-review-player-role');identity.append(document.createTextNode('（'));
    if(role){const icon=node('span',undefined,'g-review-role-icon');icon.setAttribute('aria-hidden','true');icon.append(image(role));identity.append(icon);}identity.append(document.createTextNode(p.roleName+'）'));wrap.append(identity);
   }return wrap;
  }
  function toggle(){
   if(isPublic())return;const view=sidePanel('review','对局复盘');if(!view)return;const host=view.body;
   view.onClear=()=>{draft=null;};
   const focus=id=>document.getElementById(id)?.focus({preventScroll:true});
   const start=(stageIndex,entry)=>{
    if(isPublic())return;
    if(draft&&!confirm('放弃正在编辑的复盘内容？'))return;
    draft={stageIndex,entryId:entry?.id,kind:entry?.kind||'action',actorSeatId:entry?.actor?.seatId||'',action:entry?.action||'选择了',targetSeatIds:entry?.targets?.map(p=>p.seatId)||[],result:entry?.result||'',text:entry?.text||''};view.refresh();contentArrive(host.querySelector('.g-review-editor'));focus(draft.kind==='text'?'gReviewText':'gReviewActor');host.querySelector('.g-review-editor')?.scrollIntoView?.({block:'nearest'});
   };
   function editor(stage,index){
    const form=node('form',undefined,'g-review-editor'),title=node('h4',draft.entryId===undefined?'添加'+(draft.kind==='text'?'自定义文字':'玩家行动'):'编辑记录');form.append(title);
    if(draft.kind==='text'){
     const input=node('textarea');input.id='gReviewText';input.maxLength=2000;input.rows=4;input.required=true;input.placeholder='例如：今天 5 号公开了自己的信息，3 号提名了 7 号。';input.value=draft.text;input.oninput=()=>{draft.text=input.value;sync();};form.append(field('记录内容',input));
    }else{
     const state=getState(),actor=node('select'),action=node('input'),result=node('textarea'),grid=node('div',undefined,'g-review-fields'),choices=node('select'),actionControl=node('div',undefined,'g-review-action-control'),targets=node('details',undefined,'g-review-targets'),summary=node('summary'),targetGrid=node('div',undefined,'g-review-target-grid');
     const previous=stage.entries.find(e=>e.id===draft.entryId),current=state.seats.map((p,i)=>{const r=state.script.roles.find(r=>r.id===p.roleId);return {seatId:p.id,number:i+1,name:p.name,roleId:p.roleId,roleName:r?.name||'',team:r?.team||'unknown'};});
     const actors=new Map(current.map(p=>[p.seatId,p])),participants=new Map(actors);if(previous?.actor)actors.set(previous.actor.seatId,previous.actor);for(const p of previous?.targets||[])participants.set(p.seatId,p);
     const removed=id=>({seatId:id,number:'?',name:'玩家已移除，请重新选择',roleName:''});if(draft.actorSeatId&&!actors.has(draft.actorSeatId))actors.set(draft.actorSeatId,removed(draft.actorSeatId));for(const id of draft.targetSeatIds)if(!participants.has(id))participants.set(id,removed(id));
     const actorPreview=node('div',undefined,'g-review-actor-preview'),preview=()=>{const p=actors.get(actor.value);actorPreview.replaceChildren(p?playerLabel(p):node('span','说书人','g-review-storyteller'));};actorPreview.id='gReviewActorPreview';actor.id='gReviewActor';const storyteller=node('option','说书人');storyteller.value='';actor.append(storyteller);for(const p of actors.values()){const o=node('option',label(p));o.value=p.seatId;actor.append(o);}actor.value=draft.actorSeatId;actor.onchange=()=>{draft.actorSeatId=actor.value;preview();};preview();
     const presets=['选择了','提名了','中毒了','死亡了','被处决了','保护了','毒害了','投票给','处决了','杀死了','获得信息','声称角色','使用能力','复活了','放逐了'];
     action.id='gReviewAction';action.maxLength=100;action.required=true;action.autocomplete='off';action.value=draft.action;action.oninput=()=>{draft.action=action.value;choices.value=presets.includes(action.value)?action.value:'';sync();};
     choices.id='gReviewActionPreset';choices.className='g-review-action-picker';choices.setAttribute('aria-label','选择预设行动');const placeholder=node('option','选择预设行动');placeholder.value='';placeholder.disabled=true;choices.append(placeholder);for(const text of presets){const option=node('option',text);option.value=text;choices.append(option);}choices.value=presets.includes(draft.action)?draft.action:'';choices.onchange=()=>{action.value=choices.value;draft.action=action.value;sync();};
     actionControl.append(action,choices);const actorField=field('行动人',actor),actionField=field('行动（可自行填写）',actionControl);actionField.htmlFor=action.id;grid.append(actorField,actorPreview,actionField);
     const targetSummary=()=>{summary.textContent='目标玩家'+(draft.targetSeatIds.length?' · 已选 '+draft.targetSeatIds.length:' · 可选，可多选');};targetSummary();
     for(const p of participants.values()){const check=node('input');check.type='checkbox';check.value=p.seatId;check.checked=draft.targetSeatIds.includes(p.seatId);check.onchange=()=>{draft.targetSeatIds=draft.targetSeatIds.filter(id=>id!==p.seatId);if(check.checked)draft.targetSeatIds.push(p.seatId);targetSummary();};const choice=node('label');choice.append(check,playerLabel(p));targetGrid.append(choice);}targets.append(summary,targetGrid);
     result.id='gReviewResult';result.maxLength=2000;result.rows=3;result.placeholder='记录收到的信息、行动结果或补充说明…';result.value=draft.result;result.oninput=()=>{draft.result=result.value;};form.append(grid,targets,field('结果／补充（可选）',result));
    }
    const tools=node('div',undefined,'g-review-editor-tools'),cancel=button('取消',()=>{const id=draft.entryId;draft=null;view.refresh();focus(id?'gReviewEdit_'+id:'gReviewAdd_'+index);},'subtle'),save=button('保存记录',null,'primary');save.id='gReviewSave';save.type='submit';tools.append(cancel,save);form.append(tools,hint('仅保存复盘文字，不会自动改变角色、生命或提示标记。'));
    function sync(){save.disabled=!(draft.kind==='text'?draft.text:draft.action).trim();}sync();
    form.onsubmit=e=>{e.preventDefault();if(isPublic()||save.disabled)return;const pending=draft;draft=null;const ok=apply({type:'reviewSave',...pending});if(!ok){draft=pending;view.refresh();return;}const saved=getState().review.stages[index]?.entries,id=pending.entryId??saved?.at(-1)?.id;contentArrive(document.getElementById('gReviewEntry_'+id));focus('gReviewEdit_'+id);};return form;
   }
   view.refresh=()=>{
    if(isPublic()){draft=null;host.replaceChildren();return;}const state=getState(),stages=state.review.stages,top=host.scrollTop;
    if(draft&&(draft.stageIndex>=stages.length||draft.entryId!==undefined&&!stages[draft.stageIndex].entries.some(e=>e.id===draft.entryId)))draft=null;
    host.replaceChildren();const toolbar=node('div',undefined,'g-review-toolbar'),status=node('span',isDirty()?'未保存，请备份当前对局':'已保存在此设备','g-review-status'),logs=button('操作历史',history,'subtle');logs.id='gReviewHistory';status.setAttribute('role','status');toolbar.append(status,logs);host.append(toolbar);
    stages.forEach((stage,index)=>{
     const section=node('section',undefined,'g-review-stage'+(stage.phase===state.phase&&stage.round===state.round?' is-current':'')),heading=node('div',undefined,'g-review-heading'),symbol=node('span',stage.phase==='night'?'☾':'☀','g-review-symbol'),title=node('h3',stageLabel(stage)),en=node('span',(stage.phase==='night'?'Night ':'Day ')+stage.round,'g-review-phase-en');symbol.setAttribute('aria-hidden','true');heading.append(symbol,title,en);section.dataset.stageIndex=String(index);section.append(heading);
     if(stage.phase===state.phase&&stage.round===state.round)heading.append(node('small','当前阶段','g-review-current'));
     const list=node('ol',undefined,'g-review-entries');for(const entry of stage.entries){
      const item=node('li',undefined,'g-review-entry'),copy=node('div',undefined,'g-review-copy');item.id='gReviewEntry_'+entry.id;
      if(entry.kind==='text')copy.append(node('p',entry.text));else{
       const p=node('p');p.append(entry.actor?playerLabel(entry.actor):node('strong','说书人','g-review-storyteller'),document.createTextNode(' '+entry.action));entry.targets.forEach((target,i)=>p.append(document.createTextNode(i?'、':' '),playerLabel(target)));if(entry.result)p.append(document.createTextNode('：'),node('span',entry.result,'g-review-result'));copy.append(p);
      }
      const actions=node('div',undefined,'g-review-entry-tools'),edit=button('编辑',()=>start(index,entry),'subtle'),remove=button('删除',()=>{if(!confirm('删除这条复盘记录？可在菜单中撤销。'))return;if(draft?.entryId===entry.id)draft=null;apply({type:'reviewRemove',stageIndex:index,entryId:entry.id});focus('gReviewAdd_'+index);},'subtle');edit.id='gReviewEdit_'+entry.id;remove.setAttribute('aria-label','删除复盘记录 '+entry.id);actions.append(edit,remove);item.append(copy,actions);list.append(item);
     }section.append(list);
     if(!stage.entries.length)section.append(node('p','尚未记录玩家行动','g-review-empty'));
     const tools=node('div',undefined,'g-review-stage-tools'),add=button('+ 添加记录',()=>start(index), 'subtle'),text=button('+ 自定义文字',()=>start(index,{kind:'text'}),'subtle');add.id='gReviewAdd_'+index;text.dataset.reviewText=String(index);tools.append(add,text);
     if(index===stages.length-1&&index>0){const remove=button('删除本阶段',()=>{if(!confirm('删除'+stageLabel(stage)+'及其全部复盘记录？不会回退实际对局。'))return;if(draft?.stageIndex===index)draft=null;apply({type:'reviewStageRemove',force:true});focus('gReviewAddStage');},'subtle g-review-delete-stage');remove.id='gReviewRemoveStage';tools.append(remove);}section.append(tools);if(draft?.stageIndex===index)section.append(editor(stage,index));host.append(section);
    });
    const next=stages.length,add=button('+ 添加游戏阶段 · 第 '+(Math.floor(next/2)+1)+(next%2?' 天':' 夜'),()=>{if(apply({type:'reviewStageAdd'})){contentArrive(host.querySelector('.g-review-stage:last-of-type'));focus('gReviewAdd_'+(getState().review.stages.length-1));}},'g-review-add-stage');add.id='gReviewAddStage';add.disabled=next>=198||!!draft;host.append(add,hint('仅说书人可见 · 随对局备份保存 · 添加阶段不会推进游戏'));host.scrollTop=top;
   };
   view.refresh();
  }
  return {toggle};
 }
 root.GrimoireReview={create};
})(globalThis);
