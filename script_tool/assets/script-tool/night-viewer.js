(function(root){
  'use strict';
  function build(data,chars,orders,source,players){
    var parsed=root.ScriptCore.parseImport(data,chars);
    if(!parsed.selected.length)throw new Error('剧本中没有角色。');
    var entries=parsed.entries;
    var rows=parsed.selected.map(function(role,index){
      var input=entries[index],night=root.ScriptCore.nightOrder(role,orders);
      if(source!=='wiki'&&input&&typeof input==='object'){
        if(input.firstNight!==undefined&&input.firstNight!=='')night.firstNight=role.f;
        if(input.otherNight!==undefined&&input.otherNight!=='')night.otherNight=role.o;
      }
      function unplaced(field,prompt){
        var explicit=source!=='wiki'&&input&&typeof input==='object'&&input[field]!==undefined&&input[field]!=='';
        var matching=Object.keys(orders||{}).filter(function(id){return root.ScriptCore.identity(id)===root.ScriptCore.identity(role.id)&&orders[id].n===role.n;});
        var known=matching.length===1?orders[matching[0]]:null,short=field==='firstNight'?'f':'o';
        return !night[field]&&!explicit&&(!known||known[short]===null)&&!!root.ScriptCore.nightReminder(role,prompt,chars);
      }
      return {role:role,first:night.firstNight,other:night.otherNight,index:index,pendingFirst:unplaced('firstNight','fr'),pendingOther:unplaced('otherNight','or')};
    });
    var allRows=rows;
    if(players)rows=rows.filter(function(row){return players.some(function(player){return player.roleId===row.role.id;});});
    rows.forEach(function(row){row.players=(players||[]).filter(function(player){return player.roleId===row.role.id;}).map(function(player){return player.name;});});
    function list(field){return rows.filter(function(r){return r[field]>0;}).sort(function(a,b){return a[field]-b[field]||a.index-b.index;});}
    return {name:parsed.name||'未命名剧本',total:allRows.length,shown:rows.length,roles:allRows.map(function(row){return row.role;}),first:list('first'),other:list('other'),pending:rows.filter(function(r){return r.pendingFirst||r.pendingOther;}),rules:parsed.rules,excluded:rows.filter(function(r){return !r.first&&!r.other;}).map(function(r){return r.role.n;})};
  }
  root.ScriptNightViewer={build:build};
  if(!root.document)return;
  var d=root.document,el=function(id){return d.getElementById(id);},model=root.ScriptNightSession;
  var session=null,view=null,revision=0,sequence=0,store=null;
  function status(text){el('nightStatus').textContent=text;}
  function node(tag,text,cls){var n=d.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,label,action){var b=node('button',text);b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=action;return b;}
  function validate(value){return model.validate(value,build,root.CHARS,root.SCRIPT_NIGHT_ORDER);}
  function save(){
    try{if(!store)throw Error('浏览器未允许保存');store.save(session);el('nightSaveStatus').textContent='已自动保存 · 刷新可恢复，备份可转移。';}
    catch(error){el('nightSaveStatus').textContent='自动保存未成功：'+error.message+'。请使用“备份对局”保存当前记录。';}
  }
  function reminder(row,field){return root.ScriptCore.nightReminder(row.role,field,root.CHARS)||
    (row.role.ab?'本夜操作说明尚未收录。角色能力：'+row.role.ab:'本夜操作说明尚未收录，请核对角色规则。');}
  function knownRole(role){var candidates=root.CHARS.filter(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id)&&c.n===role.n&&String(c.ab||'').replace(/\s/g,'')===String(role.ab||'').replace(/\s/g,'')&&String(c.t).replace('traveler','traveller')===String(role.t).replace('traveler','traveller');});return candidates.length===1?candidates[0]:null;}
  function card(row,field){
    var item=node('li',undefined,'night-card'),heading=node('div',undefined,'night-card-heading'),role=row.role,known=knownRole(role),image=role.im||role.iu;
    if(image&&/^(https?:\/\/|(?:\.\.\/)?icons\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(image)){
      var img=node('img');img.src=image;img.alt='';img.loading='lazy';img.width=36;img.height=36;img.onerror=function(){this.remove();};heading.append(img);
    }
    heading.append(node('strong',role.n+(row.players.length?'（'+row.players.join('、')+'）':'')));
    if(known&&known.page&&/^\.\.\/pages\//.test(known.page)){var link=node('a','角色规则 ↗','night-role-link');link.href=known.page;link.target='_blank';link.rel='noopener';heading.append(link);}
    var body=node('div',undefined,'night-card-body');body.append(node('p',reminder(row,field)));item.append(heading,body);
    var records=session.players.filter(function(p){return p.roleId===role.id;});
    if(records.length){var badges=node('div',undefined,'night-player-badges');records.forEach(function(p){var text=p.name+(p.alive?' · 存活':' · 已死亡')+(p.condition==='normal'?'':p.condition==='drunk'?' · 醉酒':' · 中毒');badges.append(node('span',text,p.alive?'':'is-dead'));});body.append(badges);
      records.filter(function(p){return p.note;}).forEach(function(p){body.append(node('p',p.name+'：'+p.note,'night-help'));});}
    if(role.ab){var details=node('details',undefined,'night-ability');details.append(node('summary','完整角色能力'),node('p',role.ab));body.append(details);}
    return item;
  }
  function fill(id,rows,field){var list=el(id);list.replaceChildren();rows.forEach(function(row){list.append(card(row,field));});var empty=list.parentElement.querySelector('.night-reference-empty');if(empty)empty.remove();if(!rows.length)list.after(node('p','没有已配置的角色行动。','night-empty night-reference-empty'));}
  function refresh(){
    if(!session)return;
    view=build(session.script,root.CHARS,root.SCRIPT_NIGHT_ORDER,session.source,session.presentOnly?session.players:undefined);
    [view.first,view.other,view.pending].forEach(function(rows){rows.forEach(function(row){row.players=session.players.filter(function(p){return p.roleId===row.role.id;}).map(function(p){return p.name;});});});
    el('nightTitle').textContent=view.name;el('nightSummary').textContent=view.total+' 个剧本角色 · '+session.players.length+' 位玩家'+(session.presentOnly?' · 显示 '+view.shown+' 种在场角色':' · 查看全部剧本角色')+' · '+(session.source==='wiki'?'本站夜序表':'JSON 优先');
    el('nightSource').value=session.source;el('nightPresentOnly').checked=session.presentOnly;
    el('nightRunMode').setAttribute('aria-pressed',session.mode==='run');el('nightReferenceMode').setAttribute('aria-pressed',session.mode==='reference');
    el('nightRun').hidden=session.mode!=='run';el('nightReference').hidden=session.mode!=='reference';el('nightCopy').textContent=session.mode==='run'?'复制本夜':'复制夜序';
    fill('nightFirst',view.first,'fr');fill('nightOther',view.other,'or');
    el('nightFirstTitle').textContent='首夜（'+view.first.length+'）';el('nightOtherTitle').textContent='其他夜晚（'+view.other.length+'）';
    el('nightExcluded').textContent=view.excluded.length?'未列入已排定夜序：'+view.excluded.join('、')+'。夜序为 0 或缺少位置不代表一定无需行动，请核对触发条件。':'';
    renderQueue();renderPending();renderRules();el('nightResult').hidden=false;el('nightPlayers').hidden=false;
  }
  function renderQueue(){
    var queue=model.queue(session,view),current=queue.findIndex(function(q){return q.status==='pending';}),done=queue.filter(function(q){return q.status==='done';}).length,skipped=queue.filter(function(q){return q.status==='skipped';}).length;
    el('nightNumber').textContent='第 '+session.night+' 夜 · '+(session.night===1?'首夜':'其他夜晚');el('nightPrevious').disabled=session.night===1;el('nightNext').disabled=session.night===99;
    el('nightProgress').textContent='完成 '+done+' / '+queue.length+(skipped?' · 跳过 '+skipped:'');el('nightProgressBar').max=queue.length||1;el('nightProgressBar').value=done+skipped;
    el('nightRunHelp').textContent=!session.players.length?'尚未登记玩家，当前显示整个剧本的角色行动。登记后可切换“只显示在场角色”。':session.presentOnly?'按在场角色执行；死亡、醉酒和中毒标记供说书人判断。':'当前显示整个剧本；可在玩家名单中切换为仅在场角色。';
    var list=el('nightQueue');list.replaceChildren();
    queue.forEach(function(q,i){
      var item=card(q.row,session.night===1?'fr':'or');item.classList.add('night-step',q.status==='pending'?'is-pending':q.status==='done'?'is-done':'is-skipped');
      if(i===current){item.classList.add('is-current');item.setAttribute('aria-current','step');}
      if(q.status!=='pending'){var folded=node('details',undefined,'night-completed-prompt'),body=item.querySelector('.night-card-body');folded.append(node('summary','查看操作提示'),body);item.append(folded);}
      item.prepend(node('span',String(i+1).padStart(2,'0')+' · '+(q.status==='done'?'已完成':q.status==='skipped'?'已跳过':i===current?'当前行动':'待执行'),'night-step-number'));
      var actions=node('div',undefined,'night-step-actions');
      if(q.status==='pending'){actions.append(button('完成','完成 '+q.row.role.n,function(){mark(q.row.role.id,'done');}),button('跳过','跳过 '+q.row.role.n,function(){mark(q.row.role.id,'skipped');}));}
      else actions.append(button('撤回','撤回 '+q.row.role.n+' 的记录',function(){mark(q.row.role.id,null);}));
      item.append(actions);list.append(item);
    });
    if(!queue.length)list.append(node('li','本夜没有已排定的角色行动；仍需核对特殊规则与待定位提示。','night-empty'));
    else if(current<0)list.append(node('li','本夜已记录完毕，可回看或进入下一夜。','night-empty'));
    el('nightAdvance').disabled=current<0;el('nightSkip').disabled=current<0;
  }
  function mark(id,state){model.mark(session,id,state);refresh();save();var active=d.querySelector('#nightQueue [aria-current="step"]');if(active&&active.scrollIntoView)active.scrollIntoView({block:'nearest',behavior:root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});el(active?'nightAdvance':'nightNext').focus({preventScroll:true});}
  function renderPending(){
    el('nightPending').hidden=!view.pending.length;el('nightPendingTitle').textContent='行动位置待核对 · '+view.pending.length+' 个角色';var body=el('nightPendingBody');body.replaceChildren();
    view.pending.forEach(function(row){body.append(node('h3',row.role.n));if(row.pendingFirst)body.append(node('p','首夜：'+reminder(row,'fr')));if(row.pendingOther)body.append(node('p','其他夜晚：'+reminder(row,'or')));});
  }
  function renderRules(){
    var body=el('nightRulesBody');body.replaceChildren();var roles=view.roles.filter(function(r){return !session.presentOnly||session.players.some(function(p){return p.roleId===r.id;});});
    var effective=root.ScriptCore.effectiveJinx(roles,root.JINX||[],view.rules),matched=root.ScriptCore.matchJinx(roles,effective);
    matched.forEach(function(rule){body.append(node('h3',rule.roles.map(function(r){return r.n;}).join(' & ')),node('p',rule.text));});
    view.rules.filter(function(rule){return !matched.some(function(m){return m.rule===rule;});}).forEach(function(rule){body.append(node('h3',root.ScriptCore.ruleTitle(rule,view.roles)),node('p',rule.ability));});
    el('nightRules').hidden=!body.childNodes.length;
  }
  function options(select,value){view.roles.forEach(function(role){var option=node('option',role.n+' · '+({townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveler:'旅行者',traveller:'旅行者',fabled:'传奇',loric:'奇遇'}[role.t]||role.t||'角色'));option.value=role.id;select.append(option);});select.value=value||view.roles[0].id;}
  function renderPlayers(){
    var selected=el('nightPlayerRole').value;el('nightPlayerRole').replaceChildren();options(el('nightPlayerRole'),selected);if(!el('nightPlayerRole').value)el('nightPlayerRole').selectedIndex=0;
    el('nightPlayerCount').textContent='· '+session.players.length+' 位 / 存活 '+session.players.filter(function(p){return p.alive;}).length+' 位';var list=el('nightPlayerList');list.replaceChildren();
    session.players.forEach(function(player,index){
      var item=node('li',undefined,'night-player'),name=node('input'),role=node('select'),life=node('select'),condition=node('select');
      name.value=player.name;name.maxLength=40;name.setAttribute('aria-label','玩家 '+(index+1)+' 的名字');name.onchange=function(){player.name=this.value.trim()||player.name;this.value=player.name;refresh();save();};
      role.setAttribute('aria-label',player.name+' 的角色');options(role,player.roleId);role.onchange=function(){var old=player.roleId;player.roleId=this.value;model.invalidate(session,[old,player.roleId]);refresh();save();};
      [['true','存活'],['false','已死亡']].forEach(function(v){var o=node('option',v[1]);o.value=v[0];life.append(o);});life.value=String(player.alive);life.setAttribute('aria-label',player.name+' 的生死状态');life.onchange=function(){player.alive=this.value==='true';refresh();el('nightPlayerCount').textContent='· '+session.players.length+' 位 / 存活 '+session.players.filter(function(p){return p.alive;}).length+' 位';save();};
      [['normal','正常'],['drunk','醉酒'],['poisoned','中毒']].forEach(function(v){var o=node('option',v[1]);o.value=v[0];condition.append(o);});condition.value=player.condition;condition.setAttribute('aria-label',player.name+' 的状态');condition.onchange=function(){player.condition=this.value;refresh();save();};
      var remove=button('移除','移除 '+player.name,function(){session.players.splice(index,1);model.invalidate(session,[player.roleId]);refresh();renderPlayers();save();});
      var details=node('details',undefined,'night-player-extra'),note=node('input');note.value=player.note;note.maxLength=500;note.setAttribute('aria-label',player.name+' 的备注');note.placeholder='本角色或玩家的提醒';note.oninput=function(){player.note=this.value;refresh();save();};details.append(node('summary','备注与座位'),note);
      var up=button('↑','将 '+player.name+' 向前移动',function(){var other=session.players[index-1];session.players[index-1]=player;session.players[index]=other;refresh();renderPlayers();save();});up.disabled=index===0;
      var down=button('↓','将 '+player.name+' 向后移动',function(){var other=session.players[index+1];session.players[index+1]=player;session.players[index]=other;refresh();renderPlayers();save();});down.disabled=index===session.players.length-1;details.append(up,down);
      item.append(node('span',String(index+1).padStart(2,'0'),'night-seat'),name,role,life,condition,remove,details);list.append(item);
    });
  }
  function commit(next){session=validate(next);refresh();renderPlayers();el('nightNotes').value=session.notes;el('nightPlayerName').value='';el('nightImport').open=false;el('nightCopyFallback').hidden=true;save();}
  function load(text){try{var raw=String(text).trim().replace(/^\uFEFF/,''),bytes=model.byteLength(raw);if(bytes>8*1024*1024)throw Error('对局备份不能超过 8 MB');var data=raw.charAt(0)==='{'?JSON.parse(raw):root.ScriptCore.parseJSON(raw);if(!data||data.kind!==model.kind){if(bytes>2*1024*1024)throw Error('剧本 JSON 不能超过 2 MB');data=model.fresh(data,el('nightSource').value);}commit(data);status('已载入 '+view.name+'。');}catch(error){status('导入失败：'+error.message+'。原有结果未更改。');}}
  el('nightLoad').onclick=function(){revision++;load(el('nightJson').value);};
  el('nightFile').onchange=async function(){var file=this.files[0],token=++revision;this.value='';if(!file)return;
    try{if(file.size>8*1024*1024)throw Error('文件超过 8 MB，请选择剧本 JSON 或对局备份');status('正在读取…');var text=await file.text();if(token===revision)load(text);}catch(error){if(token===revision)status('无法读取文件：'+error.message);}finally{if(token===revision)this.value='';}
  };
  el('nightPlayerForm').onsubmit=function(event){
    event.preventDefault();if(!session)return;if(session.players.length>=100){status('最多登记 100 位玩家。');return;}
    var roleId=el('nightPlayerRole').value;if(!view.roles.some(function(role){return role.id===roleId;}))return;
    var name=el('nightPlayerName').value.trim();if(!name){var number=1;while(session.players.some(function(p){return p.name==='玩家 '+number;}))number++;name='玩家 '+number;}
    session.players.push({id:'player_'+Date.now().toString(36)+'_'+(++sequence)+'_'+Math.random().toString(36).slice(2,7),name:name,roleId:roleId,alive:true,condition:'normal',note:''});model.invalidate(session,[roleId]);el('nightPlayerName').value='';refresh();renderPlayers();save();
  };
  el('nightPresentOnly').onchange=function(){if(session){session.presentOnly=this.checked;refresh();save();}};
  el('nightSource').onchange=function(){if(session){session.source=this.value;refresh();save();}};
  el('nightRunMode').onclick=function(){if(session){session.mode='run';refresh();save();}};
  el('nightReferenceMode').onclick=function(){if(session){session.mode='reference';refresh();save();}};
  function changeNight(delta){if(!session)return;session.night=Math.max(1,Math.min(99,session.night+delta));refresh();save();}
  el('nightPrevious').onclick=function(){changeNight(-1);};el('nightNext').onclick=function(){changeNight(1);};
  el('nightManagePlayers').onclick=function(){el('nightPlayers').open=true;el('nightPlayerName').focus();};
  el('nightReturnRun').onclick=function(){el('nightTitle').setAttribute('tabindex','-1');el('nightTitle').focus();};
  function advance(state){if(!session)return;var next=model.queue(session,view).find(function(q){return q.status==='pending';});if(next)mark(next.row.role.id,state);}
  el('nightAdvance').onclick=function(){advance('done');};el('nightSkip').onclick=function(){advance('skipped');};
  el('nightNotes').oninput=function(){if(session){session.notes=this.value;save();}};
  function copyText(){
    var groups=session.mode==='run'?[[session.night===1?'首夜':'其他夜晚',session.night===1?view.first:view.other,session.night===1?'fr':'or']]:[['首夜',view.first,'fr'],['其他夜晚',view.other,'or']];
    var text=view.name+(session.mode==='run'?' · 第 '+session.night+' 夜':'')+'\n\n'+groups.map(function(group){return group[0]+'\n'+(group[1].map(function(row,i){return (i+1)+'. '+row.role.n+(row.players.length?'（'+row.players.join('、')+'）':'')+'：'+reminder(row,group[2]);}).join('\n')||'没有已配置的角色行动。');}).join('\n\n');
    if(view.pending.length)text+='\n\n行动位置待核对：\n'+view.pending.map(function(r){return r.role.n+(r.pendingFirst?' · 首夜：'+reminder(r,'fr'):'')+(r.pendingOther?' · 其他夜晚：'+reminder(r,'or'):'');}).join('\n');return text;
  }
  el('nightCopy').onclick=async function(){if(!view)return;var text=copyText();
    try{await root.navigator.clipboard.writeText(text);status('夜序已复制。');}catch(error){el('nightCopyText').value=text;el('nightCopyFallback').hidden=false;el('nightCopyFallback').open=true;el('nightCopyText').focus();el('nightCopyText').select();status('浏览器未允许直接复制，已选中夜序文本，可手动复制。');}
  };
  el('nightBackup').onclick=function(){if(!session)return;var link=node('a'),url=root.URL.createObjectURL(new root.Blob([JSON.stringify(validate(session))],{type:'application/json;charset=utf-8'}));link.href=url;link.download=(view.name.replace(/[\\/:*?"<>|]/g,'_')||'对局')+'-第'+session.night+'夜-对局备份.json';d.body.append(link);link.click();root.setTimeout(function(){link.remove();root.URL.revokeObjectURL(url);},1000);status('对局备份已下载，恢复时从“导入剧本与对局”选择该文件。');};
  el('nightFromDraft').onclick=function(){revision++;try{
    var list=JSON.parse(root.localStorage.getItem('botc_script_drafts_v1')||'null'),state;
    if(list){if(list.version!==1||!Array.isArray(list.drafts))throw Error('剧本工具草稿列表格式无效');var active=list.drafts.find(function(r){return r.id===list.activeId;});if(!active)throw Error('剧本工具没有正在编辑的草稿');state=active.state;}
    else state=JSON.parse(root.localStorage.getItem('botc_script_tool_v1')||'null');
    if(!state)throw Error('此浏览器尚无剧本工具草稿，可直接选择 JSON');var draft=root.ScriptCore.restoreDraft(state,root.CHARS);
    var data=[Object.assign({},draft.meta,{id:'_meta',name:draft.name||'未命名剧本',author:draft.author})];
    draft.selected.forEach(function(role){var night=root.ScriptCore.nightOrder(role,root.SCRIPT_NIGHT_ORDER,draft.nightOverrides);data.push(Object.assign({},role.raw||{},{id:role.id,name:role.n,team:role.t,ability:role.ab,image:role.images||role.iu||role.im||'',firstNight:night.firstNight,otherNight:night.otherNight,firstNightReminder:root.ScriptCore.nightReminder(role,'fr',root.CHARS),otherNightReminder:root.ScriptCore.nightReminder(role,'or',root.CHARS)}));});
    data=data.concat(draft.rules);commit(model.fresh(data,'json'));status('已读取当前草稿，保留该草稿的手动夜序。');
  }catch(error){status('读取失败：'+error.message+'。原有对局未更改。');}};
  // Corrupt records and cross-tab conflicts are reported without clearing stored data.
  try{store=model.open(root.localStorage,validate);var restored=store.read();if(restored){session=restored;refresh();renderPlayers();el('nightNotes').value=session.notes;el('nightImport').open=false;status('已恢复 '+view.name+' 的第 '+session.night+' 夜。');el('nightSaveStatus').textContent='已恢复此浏览器保存的对局。';}}
  catch(error){el('nightSaveStatus').textContent='无法恢复自动存档：'+error.message+'。已有存档保留，可选择对局备份恢复。';}
})(typeof window==='undefined'?globalThis:window);
