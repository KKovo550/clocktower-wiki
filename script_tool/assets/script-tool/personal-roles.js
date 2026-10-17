/* Shared personal library UI. Updating a definition never silently updates scripts. */
(function(root){
  'use strict';
  var dialog,store,records=[],entry=null,version=null,session=0,busy=false,options={},returnRole=null;
  var model=root.ScriptPersonalRoleStore;
  var labels={name:'角色名称',team:'角色类型',ability:'能力描述',image:'角色图标',firstNight:'首夜顺序',otherNight:'其他夜晚顺序',firstNightReminder:'首夜提示',otherNightReminder:'其他夜晚提示',reminders:'提醒标记',remindersGlobal:'全局提醒',setup:'设置调整',flavor:'背景文字',edition:'版本来源',id:'角色 ID'};
  function $(id){return document.getElementById(id);}
  function library(){if(!store)store=model.open();return store;}
  function esc(value){return root.esc(value);}
  function time(at){return new Date(at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  function notice(text,bad){$('personalNotice').textContent=text;$('personalNotice').classList.toggle('is-error',!!bad);}
  function setBusy(value){busy=value;dialog.setAttribute('aria-busy',String(value));dialog.querySelectorAll('[data-personal-action]').forEach(function(button){button.disabled=value||button.dataset.unavailable==='true';});$('personalImport').disabled=value;$('personalLibraryBody').inert=value;}
  async function run(operation){if(busy)return;var token=session,active=function(){return token===session&&dialog.open;};setBusy(true);try{await operation(active);}catch(error){if(active())notice(error.message||'操作失败，原资料已保留',true);}finally{if(active())setBusy(false);}}
  async function reload(preferred,active){
    var next=await library().list();if(active&&!active())return;records=next.filter(function(r){return !root.ScriptCore.catalogRole(root.ScriptCore.normalize(r.latest.raw),root.CHARS);});records.sort(function(a,b){return b.latest.at-a.latest.at;});renderList();
    var id=preferred||entry&&entry.key||records[0]&&records[0].key;
    if(id&&records.some(function(r){return r.key===id;}))await select(id,active);else{entry=null;version=null;renderDetail();}
  }
  function renderList(){
    var query=$('personalSearch').value.trim().toLowerCase(),type=$('personalType').value,list=records.filter(function(r){var c=root.ScriptCore.normalize(r.latest.raw);return (!type||c.t===type)&&root.matchChar(c,query);});
    $('personalCount').textContent=list.length+' / '+records.length;
    $('personalRoleList').innerHTML=list.length?list.map(function(r){var c=root.ScriptCore.normalize(r.latest.raw);return '<button type="button" class="personal-role-row'+(entry&&entry.key===r.key?' is-current':'')+'" data-personal-key="'+esc(r.key)+'" aria-pressed="'+!!(entry&&entry.key===r.key)+'">'+(c.im?'<img src="'+esc(c.im)+'" alt="" loading="lazy">':'')+'<strong>'+esc(c.n)+'</strong><span>'+esc(root.TEAMCN[c.t]||c.t)+' · v'+r.revision+'</span><small>'+esc(c.id)+'</small></button>';}).join(''):'<p class="personal-empty">'+(query||type?'没有匹配的角色。':'角色保存后会自动收录。也可以从已有草稿收录角色。')+'</p>';
  }
  async function select(id,active){var selected=await library().read(id);if(active&&!active())return;if(!selected)throw Error('此角色已移出个人库，请刷新列表');entry=selected;version=entry.versions[entry.versions.length-1];renderList();renderDetail();dialog.querySelector('.personal-content').scrollTop=0;if(root.matchMedia&&root.matchMedia('(max-width:760px)').matches){dialog.classList.remove('personal-list-open');$('personalToggleList').setAttribute('aria-expanded','false');$('personalToggleList').textContent='展开列表';dialog.querySelector('.personal-workspace').scrollTop=0;}}
  function valueText(value,key){if(value===null||value===undefined)return '未填写';if(key==='team')return root.TEAMCN[value]||String(value);if(typeof value==='boolean')return value?'是':'否';if(typeof value==='string')return value||'未填写';return Array.isArray(value)?value.map(function(v){return typeof v==='string'?v:JSON.stringify(v);}).join('\n')||'无':JSON.stringify(value,null,2);}
  function imageCell(cell,value){var images=Array.isArray(value)?value:[value];images.filter(Boolean).slice(0,4).forEach(function(url){var img=document.createElement('img');img.src=url;img.alt='版本图标';img.onerror=function(){img.replaceWith(document.createTextNode('图标无法加载'));};cell.appendChild(img);});if(!cell.childNodes.length)cell.textContent='无图标';}
  function compare(){
    var previous=entry.versions.find(function(v){return String(v.version)===$('personalCompareVersion').value;})||version,diff=model.changes(previous.raw,version.raw),container=$('personalDifferences');container.replaceChildren();
    var title=document.createElement('p');title.className='personal-help';title.textContent='v'+previous.version+' → v'+version.version+' · '+diff.length+' 项不同';container.appendChild(title);
    diff.forEach(function(change){var row=document.createElement('article');row.className='personal-difference';var heading=document.createElement('strong');heading.textContent=labels[change.key]||'附加资料：'+change.key;row.appendChild(heading);var columns=document.createElement('div');columns.className='personal-diff-columns';
      ['before','after'].forEach(function(side){var cell=document.createElement('div');var label=document.createElement('small');label.textContent='v'+(side==='before'?previous.version:version.version);cell.appendChild(label);var content=document.createElement('div');if(change.key==='image')imageCell(content,change[side]);else content.textContent=valueText(change[side],change.key);cell.appendChild(content);columns.appendChild(cell);});row.appendChild(columns);container.appendChild(row);
    });
    if(!diff.length){var same=document.createElement('p');same.textContent='两个版本内容一致。';container.appendChild(same);}
  }
  function targetSelection(){
    var available=Array.from(dialog.querySelectorAll('[data-target-draft]:not(:disabled)')),selected=available.filter(function(input){return input.checked;}).length;
    $('personalSelection').textContent=available.length?'已选 '+selected+' / '+available.length+' 份待更新剧本':'所有剧本均已一致，或尚未使用这个角色';
    $('personalUpdate').textContent=selected?'将 v'+version.version+' 更新到 '+selected+' 份剧本':'请选择要更新的剧本';
    [['personalUpdate',!selected],['personalSelectChanged',!available.length],['personalClearSelection',!selected]].forEach(function(pair){$(pair[0]).dataset.unavailable=String(pair[1]);$(pair[0]).disabled=busy||pair[1];});
  }
  function targets(){
    var list=$('personalTargets');list.replaceChildren();if(!root.ScriptDraftUI||!root.ScriptDraftUI.listDrafts){list.textContent='草稿存储暂不可用，仍可导出角色 JSON。';targetSelection();return;}
    var drafts=root.ScriptDraftUI.listDrafts().filter(function(d){return d.state.custom.some(function(c){return root.ScriptCore.identity(c.id)===entry.key;});});
    drafts.forEach(function(d){var row=document.createElement('label');row.className='personal-target';var checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.targetDraft=d.id;checkbox.setAttribute('aria-label','更新剧本 '+(d.state.n||'未命名剧本'));var text=document.createElement('span');text.textContent=(d.state.n||'未命名剧本')+(d.id===root.CURRENT_DRAFT_ID?'（正在编辑）':'');var hint=document.createElement('small'),old=d.state.custom.find(function(c){return root.ScriptCore.identity(c.id)===entry.key;}),diff=model.changes(model.raw(old),version.raw);checkbox.disabled=!diff.length;row.classList.toggle('is-consistent',!diff.length);hint.textContent=diff.length?'将更新 '+diff.length+' 项资料：'+diff.slice(0,3).map(function(change){return labels[change.key]||change.key;}).join('、')+(diff.length>3?'等':''):'内容已一致，无需更新';text.appendChild(hint);row.append(checkbox,text);list.appendChild(row);});
    if(!drafts.length)list.textContent='尚无剧本使用这个自制角色，可以先加入当前剧本。';
    targetSelection();
  }
  function renderDetail(){
    $('personalDetail').hidden=!entry;$('personalEmpty').hidden=!!entry;dialog.classList.toggle('personal-has-detail',!!entry);if(!entry)return;
    var role=root.ScriptCore.normalize(version.raw);$('personalName').textContent=role.n;$('personalIdentity').textContent=role.id;
    $('personalMeta').textContent=(root.TEAMCN[role.t]||role.t)+' · 查看 v'+version.version+' · '+time(version.at)+(version.reason==='restore'?' · 从旧版恢复':'');
    $('personalAbility').textContent=role.ab||'尚未填写能力';$('personalIcon').removeAttribute('src');$('personalIcon').hidden=!role.im;if(role.im)$('personalIcon').src=role.im;
    var choices=entry.versions.slice().reverse().map(function(v){return '<option value="'+v.version+'">v'+v.version+' · '+time(v.at)+(v.reason==='restore'?' · 恢复版本':'')+'</option>';}).join('');
    $('personalViewVersion').innerHTML=choices;$('personalViewVersion').value=String(version.version);$('personalCompareVersion').innerHTML=choices;var index=entry.versions.indexOf(version);$('personalCompareVersion').value=String(entry.versions[Math.max(0,index-1)].version);
    $('personalRestore').dataset.unavailable=String(version.version===entry.revision);$('personalRestore').disabled=busy||version.version===entry.revision;
    var current=root.allChars().find(function(c){return root.ScriptCore.identity(c.id)===entry.key;}),different=current&&model.changes(model.raw(current),version.raw).length;
    var custom=root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===entry.key;});
    $('personalRecordCurrent').dataset.unavailable=String(!custom||!model.changes(model.raw(custom),entry.versions[entry.versions.length-1].raw).length);$('personalRecordCurrent').disabled=busy||$('personalRecordCurrent').dataset.unavailable==='true';
    $('personalUseHelp').textContent=different?'当前剧本中的同 ID 角色资料不同。使用此版本会替换该角色资料，保留规则与手动夜序。':'加入的是此版本的独立副本；个人库更新时，剧本会保留自己的版本。';
    var included=root.sel.some(function(c){return root.ScriptCore.identity(c.id)===entry.key;});
    $('personalUse').textContent=different?'替换当前剧本角色':included?'当前剧本已加入':'加入当前剧本';
    $('personalUse').dataset.unavailable=String(included&&!different);$('personalUse').disabled=busy||included&&!different;
    $('personalCurrentStatus').textContent=different?'本剧本资料与查看版本不同':included?'当前剧本已加入，资料一致':custom?'已在本剧本角色库中，尚未加入':'当前剧本尚未使用';
    compare();targets();
  }
  function ensure(){
    if(dialog)return;dialog=document.createElement('dialog');dialog.id='personalRoleDialog';dialog.setAttribute('aria-labelledby','personalRoleTitle');
    var types=root.TEAMORD.map(function(t){return '<option value="'+t+'">'+esc(root.TEAMCN[t])+'</option>';}).join('');
    dialog.innerHTML='<header class="personal-heading"><div><h2 id="personalRoleTitle">我的自制角色库</h2><p>跨剧本复用角色 · 每个角色保留最近 20 个版本 · 保存在当前浏览器</p></div><button type="button" class="btn" id="personalDone">关闭</button></header>'+
      '<div id="personalLibraryBody" class="personal-workspace"><aside class="personal-sidebar"><div class="personal-list-title"><strong>个人角色</strong><span id="personalCount"></span><button type="button" class="btn" id="personalToggleList" aria-expanded="false" aria-controls="personalSidebarBody">展开列表</button></div><div id="personalSidebarBody"><input type="search" id="personalSearch" aria-label="搜索个人角色库" placeholder="名称、拼音、ID 或能力"><select id="personalType" aria-label="个人角色类型筛选"><option value="">全部类型</option>'+types+'</select><div id="personalRoleList"></div></div></aside>'+
      '<main class="personal-content"><p id="personalEmpty" class="personal-empty">正在读取角色库…</p><section id="personalDetail" hidden><div class="personal-role-preview"><img id="personalIcon" alt="角色图标" hidden><div><h3 id="personalName"></h3><p id="personalMeta"></p><code id="personalIdentity"></code></div></div><p id="personalCurrentStatus" class="personal-current-status"></p><p id="personalAbility"></p><div class="personal-version-fields"><label>查看版本<select id="personalViewVersion" aria-label="查看角色版本"></select></label><label>对比版本<select id="personalCompareVersion" aria-label="对比角色版本"></select></label></div><div class="personal-actions"><button type="button" class="btn" id="personalUse" data-personal-action>加入当前剧本</button><button type="button" class="btn" id="personalEdit" data-personal-action>使用并编辑</button><button type="button" class="btn" id="personalRestore" data-personal-action>恢复为最新版</button><button type="button" class="btn" id="personalExportRole" data-personal-action>导出此版本 JSON</button><button type="button" class="btn" id="personalRecordCurrent" data-personal-action>收录本剧本版本</button></div><p id="personalUseHelp" class="personal-help"></p><details open><summary>版本内容对比</summary><div id="personalDifferences"></div></details><details class="personal-update-section" open><summary>选择要更新的剧本</summary><p class="personal-help">仅更新勾选的草稿。角色 ID、规则和手动夜序保留；每份剧本会先保留恢复点。</p><div class="personal-target-tools"><button type="button" class="btn" id="personalSelectChanged" data-personal-action>选择全部待更新</button><button type="button" class="btn" id="personalClearSelection" data-personal-action>清空选择</button><span id="personalSelection" role="status" aria-live="polite"></span></div><div id="personalTargets"></div><button type="button" class="btn pri" id="personalUpdate" data-personal-action>将此版本更新到所选剧本</button></details><details><summary>角色库维护</summary><button type="button" class="btn warn" id="personalRemove" data-personal-action>移出个人角色库</button><p class="personal-help">仅移出个人库及其版本，已经加入各剧本的副本仍保留。</p></details></section></main></div>'+
      '<footer class="personal-footer"><p id="personalNotice" role="status" aria-live="polite"></p><div class="personal-actions"><button type="button" class="btn" id="personalRefresh" data-personal-action>刷新角色库</button><button type="button" class="btn" id="personalCollect" data-personal-action>收录已有草稿角色</button><button type="button" class="btn" id="personalBackup" data-personal-action>导出角色库备份</button><label class="btn personal-upload">导入角色库备份<input type="file" id="personalImport" accept=".json,application/json"></label></div></footer>';
    document.body.appendChild(dialog);
    dialog.addEventListener('error',function(event){if(event.target.tagName==='IMG'&&!event.target.onerror)event.target.hidden=true;},true);
    $('personalDone').onclick=function(){dialog.close();};dialog.addEventListener('close',function(){if(dialog.open)return;session++;if(options.onDone)options.onDone(returnRole);});
    $('personalTargets').onchange=targetSelection;
    $('personalSelectChanged').onclick=function(){dialog.querySelectorAll('[data-target-draft]:not(:disabled)').forEach(function(input){input.checked=true;});targetSelection();};
    $('personalClearSelection').onclick=function(){dialog.querySelectorAll('[data-target-draft]').forEach(function(input){input.checked=false;});targetSelection();};
    $('personalRefresh').onclick=function(){run(async function(active){await reload(undefined,active);if(active()){$('personalEmpty').textContent='角色保存后会自动收录，也可以从已有草稿收录。';notice('已刷新角色库，请重新选择需要更新的剧本。');}});};
    $('personalSearch').oninput=renderList;$('personalType').onchange=renderList;
    $('personalToggleList').onclick=function(){var expanded=dialog.classList.toggle('personal-list-open');this.setAttribute('aria-expanded',String(expanded));this.textContent=expanded?'收起列表':'展开列表';};
    $('personalRoleList').onclick=function(event){var button=event.target.closest('[data-personal-key]');if(button)run(function(active){return select(button.dataset.personalKey,active);});};
    $('personalViewVersion').onchange=function(){version=entry.versions.find(function(v){return String(v.version)===this.value;},this);renderDetail();};$('personalCompareVersion').onchange=compare;
    $('personalIcon').onerror=function(){this.hidden=true;};
    function use(edit){return run(async function(){if(!root.ScriptCustomRoles||!root.ScriptCustomRoles.usePersonalRole)throw Error('当前页面未加载剧本工具');var role=root.ScriptCustomRoles.usePersonalRole(version.raw);returnRole=role;if(edit){dialog.close();if(!options.onDone)root.ScriptCustomRoles.open(role);}else{renderDetail();notice('已使用 v'+version.version+' 加入当前剧本，其他剧本保持原样。');}});}
    $('personalUse').onclick=function(){use(false);};$('personalEdit').onclick=function(){use(true);};
    $('personalRestore').onclick=function(){run(async function(active){var original=version.version,updated=await library().restore(entry.key,original,entry.revision);if(!active())return;await reload(updated.key,active);if(active())notice('已从 v'+original+' 创建最新版 v'+updated.revision+'，各剧本尚未更新；可在下方勾选要更新的剧本。');});};
    $('personalExportRole').onclick=function(){if(entry)root.download(version.raw.name+'-v'+version.version+'-角色.json',JSON.stringify([version.raw],null,2));};
    $('personalRecordCurrent').onclick=function(){run(async function(active){var current=root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===entry.key;});if(!current)throw Error('当前剧本没有这个自制角色');root.ScriptCustomRoles.checkPersonalEdit(entry.key);var updated=await library().save(model.raw(current),'save',entry.revision);if(!active())return;await reload(updated.key,active);if(active())notice('本剧本版本已收录为 v'+updated.revision+'，其他剧本保持原样。');});};
    $('personalUpdate').onclick=function(){run(async function(active){
      var ids=Array.from(dialog.querySelectorAll('[data-target-draft]:checked:not(:disabled)')).map(function(input){return input.dataset.targetDraft;});if(!ids.length)throw Error('请先勾选要更新的剧本。');
      if(ids.includes(root.CURRENT_DRAFT_ID)&&root.ScriptCustomRoles.checkPersonalEdit)root.ScriptCustomRoles.checkPersonalEdit(entry.key);
      var latest=await library().read(entry.key);if(!active())return;if(!latest||latest.revision!==entry.revision)throw Error('角色库已在其他页面更新，请重新加载后比较。');
      var drafts=root.ScriptDraftUI.listDrafts(),updates=ids.map(function(id){var draft=drafts.find(function(d){return d.id===id;});if(!draft)throw Error('剧本已被移除，请重新加载');var old=draft.state.custom.find(function(c){return root.ScriptCore.identity(c.id)===entry.key;});if(old&&!model.changes(model.raw(old),version.raw).length)return null;return {id:id,state:model.replaceDraft(draft.state,version.raw,root.CHARS)};}).filter(Boolean);
      if(!updates.length){renderDetail();notice('所选剧本的资料已经一致，无需更新。');return;}
      root.ScriptDraftUI.applyStates(updates);renderDetail();notice('已将 v'+version.version+' 更新到 '+updates.length+' 份剧本；未勾选的剧本保持原样。');
    });};
    $('personalRemove').onclick=function(){if(!root.confirm('移出个人库并删除该角色的版本历史？已加入剧本的副本会保留，建议先导出角色库备份。'))return;run(async function(active){await library().remove(entry.key,entry.revision);if(!active())return;entry=null;await reload(undefined,active);if(active())notice('已移出个人角色库，各剧本副本仍保留。');});};
    $('personalCollect').onclick=function(){run(async function(active){if(!root.ScriptDraftUI)throw Error('草稿存储暂不可用');var drafts=root.ScriptDraftUI.listDrafts().sort(function(a,b){return a.updatedAt-b.updatedAt;}),items=[];drafts.forEach(function(d){d.state.custom.forEach(function(c){if(!root.ScriptCore.catalogRole(c,root.CHARS))items.push({raw:model.raw(c),at:d.updatedAt});});});var count=await library().collect(items);if(!active())return;await reload(undefined,active);if(active())notice('已收录 '+count+' 个新角色；个人库已有的角色及版本保持原样。');});};
    $('personalBackup').onclick=function(){run(async function(active){var bundle=await library().backup();if(!active())return;root.download('我的自制角色库-备份.json',JSON.stringify(bundle,null,2));notice('已导出个人角色库及版本历史。');});};
    $('personalImport').onchange=function(){var file=this.files[0];if(!file)return;if(file.size>24*1024*1024){notice('备份文件超过 24 MB，请使用较小的备份。',true);this.value='';return;}run(async function(active){try{var bundle=JSON.parse(await file.text());if(!active())return;var count=await library().importBackup(bundle);if(!active())return;await reload(undefined,active);if(active())notice('已导入 '+count+' 个角色及版本；同 ID 的已有角色未被覆盖。');}finally{if(active())$('personalImport').value='';}});};
  }
  async function open(settings){
    ensure();if(dialog.open)return;options=settings||{};returnRole=null;entry=null;version=null;records=[];$('personalSearch').value='';$('personalType').value='';$('personalEmpty').textContent='正在读取角色库…';$('personalDetail').hidden=true;$('personalEmpty').hidden=false;notice('');dialog.showModal();var token=++session;
    var active=function(){return token===session&&dialog.open;};
    setBusy(true);try{if(options.roleId){var candidate=root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(options.roleId);});if(candidate)await library().collect([{raw:model.raw(candidate)}]);}if(!active())return;await reload(options.roleId,active);}catch(error){if(active()){$('personalEmpty').textContent='角色库暂不可用，剧本中的角色仍保留。';notice(error.message,true);}}finally{if(active())setBusy(false);}
  }
  root.ScriptPersonalRoles={open:open,recordRole:function(role){return library().save(model.raw(role));},getStore:library};
  var button=$('bPersonalRoles');if(button)button.onclick=function(){open();};
})(window);
