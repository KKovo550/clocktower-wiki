/* Personal role editing is separate from poster appearance and catalog data. */
(function(root){
  'use strict';
  var dialog,base=null,dirty=false,cleanValues='',uploadVersion=0,storageKey='botc_custom_role_form_v1';
  var mobileView='edit',mobileScroll={edit:0,preview:0};
  var libraryGeneration=0,libraryJob=Promise.resolve();
  var fields=['cn','ci','ct','ca','cm','cf','co','cfr','cor','cr','crg','cfl'];
  var labels={cn:'角色名称',ci:'角色 ID',ct:'角色类型',ca:'能力描述',cm:'图标地址',cf:'首夜顺序',co:'其他夜晚顺序',cfr:'首夜行动提示',cor:'其他夜晚行动提示',cr:'提醒标记',crg:'全局提醒标记',cfl:'背景文字'};
  function $(id){return document.getElementById(id);}
  function html(value){return root.esc(value);}
  function freshId(){return 'custom_'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID().replace(/-/g,''):Date.now().toString(36)+Math.random().toString(36).slice(2));}
  function reminders(value){return String(value||'').split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean);}
  function formValues(){var result={};fields.forEach(function(id){result[id]=$(id).value;});result.cs=$('cs').checked;result.add=$('customAdd').checked;return result;}
  function rawRole(role){return Object.assign({},role.raw||{},{id:role.id,name:role.n,team:role.t,ability:role.ab,image:role.images||role.iu||role.im||'',firstNight:role.f,otherNight:role.o,firstNightReminder:role.fr,otherNightReminder:role.or,reminders:role.r,remindersGlobal:role.rg,setup:!!role.s,flavor:role.fl});}
  function build(values,previous){
    var raw=previous?rawRole(previous):{edition:'custom'};
    Object.assign(raw,{id:previous?previous.id:values.ci.trim(),name:values.cn.trim(),team:values.ct,ability:values.ca.trim(),
      firstNight:values.cf.trim(),otherNight:values.co.trim(),firstNightReminder:values.cfr.trim(),otherNightReminder:values.cor.trim(),
      reminders:reminders(values.cr),remindersGlobal:reminders(values.crg),setup:!!values.cs,flavor:values.cfl.trim()});
    if(!previous||values.cm.trim()!==(previous.iu||previous.im||''))raw.image=values.cm.trim();
    return root.ScriptCore.normalize(raw);
  }
  function fingerprint(role){return role?JSON.stringify(rawRole(role)):'';}
  function context(){return String(root.CURRENT_DRAFT_ID||'current');}
  function recordLibrary(role,previous){
    if(!root.ScriptPersonalRoles)return;
    if(previous&&!root.ScriptPersonalRoleStore.changes(rawRole(previous),rawRole(role)).length)return;
    var token=++libraryGeneration;$('customLibraryStatus').textContent='正在收录「'+role.n+'」…';$('customLibraryStatus').classList.remove('is-error');
    libraryJob=root.ScriptPersonalRoles.recordRole(role).then(function(entry){if(token===libraryGeneration)$('customLibraryStatus').textContent='「'+role.n+'」已收录个人库 · v'+entry.revision+'；其他剧本未更新。';return entry;}).catch(function(error){if(token===libraryGeneration){$('customLibraryStatus').textContent='剧本已保存，个人库收录失败：'+error.message+'。可打开个人库重试。';$('customLibraryStatus').classList.add('is-error');}return null;});
  }
  function usePersonalRole(value){
    var role=root.ScriptCore.normalize(value),id=root.ScriptCore.identity(role.id),current=root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===id;});
    checkPersonalEdit(id);
    if(root.SCRIPT_RULES.some(function(rule){return root.ScriptCore.identity(rule.id)===id;}))throw Error('这个角色 ID 与当前剧本规则冲突，请先处理规则 ID');
    var selectedRole=root.sel.find(function(c){return root.ScriptCore.identity(c.id)===id;});
    if(current||selectedRole)role=root.ScriptCore.normalize(Object.assign({},value,{id:(current||selectedRole).id}));
    var custom=current?root.CUSTOM.map(function(c){return c===current?role:c;}):root.CUSTOM.concat(role),selected=root.sel.map(function(c){return root.ScriptCore.identity(c.id)===id?role:c;});
    if(!selectedRole)selected.push(role);applyRoles(custom,selected);return role;
  }
  function checkPersonalEdit(id){
    var pending;try{pending=JSON.parse(root.localStorage.getItem(storageKey));}catch(error){return;}
    if(pending&&pending.version===1&&pending.context===context()&&(root.ScriptCore.identity(pending.baseId)===root.ScriptCore.identity(id)||pending.values&&root.ScriptCore.identity(pending.values.ci)===root.ScriptCore.identity(id)))throw Error('此角色还有未保存的编辑，请先回到自制角色工作台保存或撤销，再使用库中版本。');
  }
  function applyRoles(custom,selected,overrides){
    if(root.storageBlocked||root.ScriptDrafts&&!root.ScriptDraftUI)throw new Error('当前草稿存储不可用，请先导出 JSON 备份。');
    var snapshot=root.captureDraft(),definitions=custom.concat(root.CATALOG_OVERRIDES||[]);snapshot.custom=definitions;snapshot.sel=selected.map(function(c){return {id:c.id,name:c.n,custom:definitions.indexOf(c)>=0};});
    if(overrides)snapshot.nightOverrides=overrides;
    root.ScriptCore.restoreDraft(snapshot,root.CHARS);
    // Store a validated candidate before changing either role list.
    if(root.ScriptDraftUI)root.ScriptDraftUI.prepareSave(snapshot);else root.localStorage.setItem(root.saveKey,JSON.stringify(snapshot));
    root.CUSTOM=custom;root.sel=selected;if(overrides)root.NIGHT_OVERRIDES=overrides;
    root.renderAll();
  }
  function refreshContext(){
    var name=$('mname').value.trim()||'未命名剧本',present=base&&root.inSel(base);
    $('customScriptContext').textContent='当前剧本：'+name+' · '+root.sel.length+' 个角色';
    $('customMembership').textContent=base?(present?$('customAdd').checked?'已加入当前剧本':'已在剧本，保存后移除':$('customAdd').checked?'尚未加入，保存后加入':'尚未加入当前剧本'):'新角色将在保存后'+($('customAdd').checked?'加入当前剧本':'保留到角色库');
    $('customToggleScript').disabled=!base;$('customToggleScript').textContent=present?'从剧本移除':'加入当前剧本';
    var related=base?(root.SCRIPT_RULES||[]).filter(function(rule){return Array.isArray(rule.roleIds)?rule.roleIds.some(function(id){return root.ScriptCore.identity(id)===root.ScriptCore.identity(base.id);}):root.ScriptCore.matchJinx(root.allChars(),[rule]).some(function(match){return match.roles.some(function(role){return root.ScriptCore.identity(role.id)===root.ScriptCore.identity(base.id);});});}).length:0;
    $('customRuleContext').textContent=base?'当前剧本关联规则：'+related+' 条':'保存后可添加相克或单角色规则。';
    var night=base?root.ScriptCore.nightOrder(base,root.SCRIPT_NIGHT_ORDER||{},root.NIGHT_OVERRIDES||{}):null;
    $('customNightContext').textContent=base&&present?'剧本实际夜序：首夜 '+(night.firstNight||'未列出')+' · 其他夜晚 '+(night.otherNight||'未列出')+((root.NIGHT_OVERRIDES||{})[base.id]?'（含手动调整）':''):base?'加入剧本后可调整实际夜序。':'';
  }
  function locateRole(role){
    root.curSource=root.roleSource?root.roleSource(role):'custom';root.curTab='all';root.q='';if(root.qEl)root.qEl.value='';root.renderTabs();root.renderGrid();
    var target=Array.from(document.querySelectorAll('#sel [data-script-role]')).find(function(row){return root.ScriptCore.identity(row.dataset.scriptRole)===root.ScriptCore.identity(role.id);});
    if(!target)target=Array.from(document.querySelectorAll('#grid .card')).find(function(card){var c=root.allChars()[Number(card.dataset.i)];return c&&root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id);});
    if(target){target.classList.add('custom-role-located');target.focus({preventScroll:true});if(target.scrollIntoView)target.scrollIntoView({block:'center',behavior:'smooth'});root.setTimeout(function(){target.classList.remove('custom-role-located');},2400);}
  }
  function leave(action){
    var unavailable=action==='art'&&(!$('bArt')||typeof $('bArt').onclick!=='function')||(action==='rules'||action==='jinx')&&!root.ScriptRuleEditor;
    if(unavailable){notice('当前页面未加载此功能，请刷新后再试。',true);return;}
    if((dirty||!base)&&!commit(false))return;
    var role=base,origin=context();
    if(action!=='return'&&!root.inSel(role)){notice('请先点击“加入当前剧本”，再设置规则、夜序或生成图片。',true);return;}
    if(action==='art'&&(role.t==='traveller'||role.t==='traveler')){notice('剧本海报不展示旅行者，可以在剧本中继续编辑或查看其夜序。',true);return;}
    dialog.close();
    if(action==='return'){locateRole(role);return;}
    if(action==='rules'||action==='jinx')root.ScriptRuleEditor.open(action==='rules'?'role':'jinx',role.id);
    else $(action==='art'?'bArt':'bNight').click();
    if(action!=='art'){
      var child=$('dlg');child.addEventListener('close',function back(){if(context()!==origin)return;var current=root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id);});if(current)open(current);},{once:true});
    }
  }
  function cancelUpload(){uploadVersion++;$('customCommit').disabled=false;$('customSaveNew').disabled=false;}
  function view(mode,reset){
    var workspace=dialog.querySelector('.custom-workspace');
    if(!reset)mobileScroll[mobileView]=workspace.scrollTop;
    else mobileScroll={edit:0,preview:0};
    mobileView=mode;dialog.classList.toggle('custom-mobile-preview',mode==='preview');
    $('customViewEdit').setAttribute('aria-pressed',String(mode==='edit'));$('customViewPreview').setAttribute('aria-pressed',String(mode==='preview'));
    if(root.matchMedia&&root.matchMedia('(max-width:760px)').matches)workspace.scrollTop=mobileScroll[mode];
  }
  function clearError(id){
    $(id).removeAttribute('aria-invalid');var error=$(id+'Error');if(error)error.remove();
    var described=($(id).getAttribute('aria-describedby')||'').split(' ').filter(function(key){return key&&key!==id+'Error';}).join(' ');
    if(described)$(id).setAttribute('aria-describedby',described);else $(id).removeAttribute('aria-describedby');
  }
  function fieldError(id,text){
    clearError(id);var input=$(id),error=document.createElement('p');error.id=id+'Error';error.className='custom-field-error';error.textContent=text;
    input.insertAdjacentElement('afterend',error);input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',((input.getAttribute('aria-describedby')||'')+' '+error.id).trim());
    var group=input.closest('details');if(group)group.open=true;
    if(id==='cm'&&input.hidden){input.hidden=false;$('customEmbeddedIcon').hidden=true;dialog.querySelector('label[for="cm"]').textContent='图标地址（可选）';}
    view('edit');input.focus();notice(text,true);
  }
  function changed(persist){
    dirty=!!dialog._copy||JSON.stringify(formValues())!==cleanValues;
    $('customEditState').textContent=dirty?'有修改待保存':base?'已保存':'新角色';
    $('customEditState').classList.toggle('is-dirty',dirty);$('customReset').disabled=!base||!dirty;
    refreshContext();
    if(persist!==false){if(dirty)remember();else forget();}
  }
  function notice(text,bad){$('customNotice').textContent=text;$('customNotice').classList.toggle('is-error',!!bad);}
  function remember(){
    if(!dirty)return;
    try{root.localStorage.setItem(storageKey,JSON.stringify({version:1,context:context(),baseId:base&&base.id,base:fingerprint(base),copyRaw:dialog._copy?rawRole(dialog._copy):null,values:formValues()}));$('customDraftStatus').textContent='未保存的填写内容已暂存';}
    catch(e){$('customDraftStatus').textContent='浏览器无法暂存，请及时保存角色';}
  }
  function forget(){try{root.localStorage.removeItem(storageKey);}catch(e){}$('customDraftStatus').textContent='';}
  function preview(){
    var values=formValues(),name=values.cn.trim()||'角色名称',type=root.TEAMCN[values.ct]||values.ct;
    $('customPreviewName').textContent=name;$('customPreviewType').textContent=type;
    $('customPreviewAbility').textContent=values.ca.trim()||'填写能力后，这里会实时显示效果。';
    $('customAbilityCount').textContent=values.ca.length+' 字';
    $('customPreview').dataset.team=values.ct;
    $('customPreviewNight').textContent='首夜：'+(Number(values.cf)>0?values.cf:'未列出行动')+' · 其他夜晚：'+(Number(values.co)>0?values.co:'未列出行动');
    $('customPreviewReminders').textContent=reminders(values.cr).join(' · ')||'暂无提醒标记';
    var image=$('customPreviewIcon'),url=values.cm.trim();
    if(url&&url.length<=20000&&/^(https?:\/\/|(?:\.\.\/)?icons\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(url)){
      if(image.getAttribute('src')!==url)image.src=url;image.hidden=false;$('customIconFallback').hidden=true;
    }else{image.removeAttribute('src');image.hidden=true;$('customIconFallback').hidden=false;}
    $('customIconFallback').textContent=name.charAt(0);
    var embedded=/^data:image\//i.test(url);$('cm').hidden=embedded;$('customEmbeddedIcon').hidden=!embedded;
    dialog.querySelector('label[for="cm"]').textContent=embedded?'当前图标':'图标地址（可选）';
  }
  function load(role,copy){
    uploadVersion++;libraryGeneration++;base=copy?null:role;dirty=false;
    $('customLibraryStatus').textContent='个人库中的角色可跨剧本复用，并查看版本历史。';$('customLibraryStatus').classList.remove('is-error');
    var values=role?{cn:role.n+(copy?'（副本）':''),ci:copy?freshId():role.id,ct:role.t,ca:role.ab,cm:role.iu||role.im||'',cf:String(role.f||0),co:String(role.o||0),cfr:role.fr||'',cor:role.or||'',cr:(role.r||[]).join('\n'),crg:(role.rg||[]).join('\n'),cfl:role.fl||''}:{cn:'',ci:freshId(),ct:'townsfolk',ca:'',cm:'',cf:'0',co:'0',cfr:'',cor:'',cr:'',crg:'',cfl:''};
    fields.forEach(function(id){$(id).value=values[id];});$('cs').checked=!!(role&&role.s);
    // Copies keep extension fields such as author/jinx/image variants too.
    dialog._copy=copy?role:null;
    $('ci').readOnly=!!base;$('customIdHelp').textContent=base?'编辑时保留 ID，已有相克规则和夜序仍关联此角色。':'已自动生成唯一 ID，也可以自行填写。';
    $('customFormTitle').textContent=base?'编辑「'+base.n+'」':copy?'复制角色':'新建角色';
    $('customCommit').textContent=base?'保存修改':'保存角色';
    $('customAdd').checked=role?root.inSel(role):true;
    $('customCommit').disabled=false;$('customSaveNew').disabled=false;$('customUpload').value='';$('customIconSearch').value='';$('customIconResults').innerHTML='';
    fields.forEach(clearError);notice('');$('customDraftStatus').textContent='';preview();renderList();
    cleanValues=JSON.stringify(formValues());changed(false);if(copy)remember();
  }
  function canSwitch(){return !dirty||root.confirm('当前填写内容尚未保存。放弃这些修改并切换角色？');}
  function renderList(){
    var query=$('customSearch').value.trim().toLowerCase(),type=$('customTypeFilter').value,list=root.CUSTOM.filter(function(c){return (!type||c.t===type)&&root.matchChar(c,query);});
    $('customRoleCount').textContent=(query||type?list.length+' / ':'')+root.CUSTOM.length+' 个';
    $('customRoleList').innerHTML=list.length?list.map(function(c){
      var index=root.CUSTOM.indexOf(c);
      return '<button type="button" class="custom-role-row'+(base===c?' is-current':'')+'" data-role-index="'+index+'" aria-pressed="'+(base===c)+'">'+(c.im?'<img class="custom-list-icon" src="'+html(c.im)+'" alt="" loading="lazy">':'')+'<strong>'+html(c.n)+'</strong><span>'+html(root.TEAMCN[c.t]||c.t)+' · '+(root.inSel(c)?'已在剧本':'未加入剧本')+'</span><p>'+html(c.ab||'尚未填写能力')+'</p></button>';
    }).join(''):'<p class="custom-empty">'+(query?'没有匹配的自制角色。':'还没有自制角色，右侧填写后即可保存。')+'</p>';
    $('customCopy').disabled=!base;$('customDelete').disabled=!base;$('customExport').disabled=!base;
  }
  function serializeForm(){
    var role=build(formValues(),base);
    if(dialog._copy){var raw=Object.assign({},rawRole(dialog._copy),role.raw);if(formValues().cm.trim()===(dialog._copy.iu||dialog._copy.im||''))raw.image=dialog._copy.images||dialog._copy.iu||dialog._copy.im||'';role=root.ScriptCore.normalize(raw);}
    return role;
  }
  function commit(next){
    if($('customCommit').disabled){notice('图标仍在处理中，请稍候。',true);return false;}
    notice('');
    var invalid=fields.map($).find(function(input){return !input.checkValidity();});
    if(invalid){fieldError(invalid.id,'请检查'+labels[invalid.id]+'。');return false;}
    if(!$('cn').value.trim()){fieldError('cn','请填写角色名称。');return false;}
    if(!$('ca').value.trim()){fieldError('ca','请填写能力描述。');return false;}
    var role,previous=base;
    try{
      role=serializeForm();
      if(root.allChars().some(function(c){return c!==base&&root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id);}))throw new Error('角色 ID 已存在，请填写不同的 ID。');
    }catch(e){fieldError(/图标/.test(e.message)?'cm':/首夜/.test(e.message)?'cf':/其他夜/.test(e.message)?'co':'ci',e.message);return false;}
    var custom=root.CUSTOM.slice(),selected=root.sel.slice();
    if(base){
      var index=custom.indexOf(base);if(index<0){notice('原角色已变更，请重新打开工具。',true);return false;}
      custom[index]=role;selected=selected.map(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(base.id)?role:c;});
    }else custom.push(role);
    var selectedIndex=selected.findIndex(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id);});
    if($('customAdd').checked&&selectedIndex<0)selected.push(role);
    if(!$('customAdd').checked&&selectedIndex>=0)selected.splice(selectedIndex,1);
    try{applyRoles(custom,selected);}catch(error){notice('保存失败：'+error.message+'。当前剧本未更改，填写内容仍保留。',true);remember();return false;}
    dirty=false;forget();load(role,false);
    if(next){load(null,false);$('ct').value=role.t;cleanValues=JSON.stringify(formValues());preview();view('edit',true);dialog.querySelector('.custom-form').scrollTop=0;$('cn').focus();}
    notice('已保存「'+role.n+'」'+(next?'，可继续创建下一个角色。':root.inSel(role)?'，并更新到当前剧本。':'，可从角色库再次加入。'));
    recordLibrary(role,previous);
    return true;
  }
  function inputField(id,label,type,extra){return '<label for="'+id+'">'+label+'</label><input id="'+id+'" type="'+(type||'text')+'" '+(extra||'maxlength="20000"')+'>';}
  function area(id,label,extra){return '<label for="'+id+'">'+label+'</label><textarea id="'+id+'" maxlength="20000" '+(extra||'')+'></textarea>';}
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='customRoleDialog';dialog.setAttribute('aria-labelledby','customRoleTitle');
    var types=root.TEAMORD.map(function(type){return '<option value="'+type+'">'+html(root.TEAMCN[type])+'</option>';}).join('');
    dialog.innerHTML='<header class="custom-heading"><div><h2 id="customRoleTitle">自制角色工作台</h2><p id="customScriptContext"></p><p id="customLibraryStatus" role="status" aria-live="polite"></p></div><div class="custom-heading-actions"><button type="button" class="btn" id="customPersonalLibrary">个人角色库／版本</button><button type="button" class="btn" id="customClose">关闭</button></div></header>'+
      '<nav class="custom-view-tabs" aria-label="自制角色视图"><button type="button" id="customViewEdit" aria-pressed="true">编辑资料</button><button type="button" id="customViewPreview" aria-pressed="false">查看预览</button></nav>'+
      '<div class="custom-workspace"><aside class="custom-library"><div class="custom-list-heading"><strong>我的自制角色</strong><span id="customRoleCount"></span><button type="button" class="btn" id="customShowLibrary" aria-expanded="false" aria-controls="customLibraryBody">展开列表</button></div><div id="customLibraryBody"><input type="search" id="customSearch" aria-label="搜索自制角色" placeholder="搜索名称、ID 或能力"><select id="customTypeFilter" aria-label="筛选自制角色类型"><option value="">全部类型</option>'+types+'</select><button type="button" class="btn" id="customNew">＋ 新建角色</button><div id="customRoleList"></div></div></aside>'+
      '<form id="customRoleForm" class="custom-form" novalidate><div class="custom-form-heading"><h3 id="customFormTitle">新建角色</h3><span id="customEditState"></span></div><div class="custom-two"><div>'+inputField('cn','角色名称 *','text','required maxlength="200" placeholder="例如：观星人"')+'</div><div><label for="ct">角色类型</label><select id="ct">'+types+'</select></div></div>'+
      area('ca','能力描述 *','required placeholder="描述这个角色的能力与触发条件"')+'<div class="custom-count" id="customAbilityCount"></div>'+
      '<details open><summary>角色图标</summary>'+inputField('cm','图标地址（可选）','url','maxlength="20000" placeholder="https://…，或通过下方上传"')+'<div id="customEmbeddedIcon" hidden><p class="custom-help">已使用上传的图标，会随角色一起保存。</p><button type="button" class="btn" id="customUseUrl">改用图标地址</button></div><div class="custom-icon-actions"><label class="btn custom-upload" for="customUpload">上传图标<input id="customUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><button type="button" class="btn" id="customIconClear">清除图标</button></div><p class="custom-help">支持 PNG、JPG、WebP、GIF，上传后缩为便携图标并嵌入 JSON。</p><input type="search" id="customIconSearch" aria-label="查找现有角色图标" placeholder="输入角色名称，借用现有图标"><div id="customIconResults"></div></details>'+
      '<details><summary>夜间行动与提醒</summary><div class="custom-two"><div>'+inputField('cf','首夜顺序','number','min="0" step="any" required')+area('cfr','首夜行动提示')+'</div><div>'+inputField('co','其他夜晚顺序','number','min="0" step="any" required')+area('cor','其他夜晚行动提示')+'</div></div><p class="custom-help">0 表示未列出该夜行动；有行动时填写大于 0 的顺序。当前剧本手动调整过的夜序仍优先生效。</p><div class="custom-two"><div>'+area('cr','提醒标记（每行一项）')+'</div><div>'+area('crg','全局提醒标记（每行一项）')+'</div></div><label class="custom-check"><input type="checkbox" id="cs">能力会调整游戏设置</label></details>'+
      '<details><summary>更多资料</summary>'+inputField('ci','角色 ID *','text','required maxlength="200"')+'<p class="custom-help" id="customIdHelp"></p>'+area('cfl','背景文字（可选）')+'</details></form>'+
      '<aside class="custom-preview-panel"><h3>实时预览</h3><div id="customPreview" class="custom-preview"><div class="custom-preview-top"><div class="custom-icon-frame"><img id="customPreviewIcon" alt="角色图标" hidden><span id="customIconFallback"></span></div><div><strong id="customPreviewName"></strong><span id="customPreviewType"></span></div></div><p id="customPreviewAbility"></p><p id="customPreviewNight" class="custom-help"></p><div id="customPreviewReminders"></div></div><section class="custom-script-bridge" aria-label="与当前剧本联动"><p id="customMembership"></p><button type="button" class="btn" id="customToggleScript">加入当前剧本</button><p id="customRuleContext" class="custom-help"></p><p id="customNightContext" class="custom-help"></p><button type="button" class="btn" id="customReturn">保存并返回剧本</button><div class="custom-bridge-actions"><button type="button" class="btn" id="customRoleRules">单角色规则</button><button type="button" class="btn" id="customRoleJinx">双角色相克</button><button type="button" class="btn" id="customRoleNight">调整剧本夜序</button><button type="button" class="btn" id="customRoleArt">生成剧本图片</button></div><p class="custom-help">进入规则、夜序或制图前会先保存修改；规则和夜序完成后返回此处。</p></section><div class="custom-role-actions"><button type="button" class="btn" id="customCopy">复制为新角色</button><button type="button" class="btn" id="customReset" disabled>恢复已保存内容</button><button type="button" class="btn" id="customExport">导出此角色 JSON</button><button type="button" class="btn warn" id="customDelete">删除此角色</button></div></aside></div>'+
      '<footer class="custom-footer"><div><p id="customNotice" role="status" aria-live="polite"></p><span id="customDraftStatus"></span><span class="custom-shortcut">Ctrl / ⌘ + S 保存</span></div><div class="custom-save-actions"><label class="custom-check"><input type="checkbox" id="customAdd" checked>保存时加入当前剧本</label><button type="button" class="btn" id="customSaveNew">保存并新建</button><button type="submit" form="customRoleForm" class="btn pri" id="customCommit">保存角色</button></div></footer>';
    document.body.appendChild(dialog);
    // Paths and embedded bitmap URLs are valid alongside HTTP(S), so use text validation.
    $('cm').type='text';
    $('customRoleForm').addEventListener('submit',function(event){event.preventDefault();commit(false);});
    $('customRoleForm').addEventListener('input',function(event){if(fields.indexOf(event.target.id)<0&&event.target.id!=='cs')return;if(event.target.id==='cm')cancelUpload();if(fields.indexOf(event.target.id)>=0)clearError(event.target.id);notice('');preview();changed();});
    $('customAdd').onchange=function(){changed();};
    $('customSaveNew').onclick=function(){commit(true);};
    $('customPersonalLibrary').onclick=function(){if(!root.ScriptPersonalRoles){notice('个人角色库尚未加载，请刷新后重试。',true);return;}if(dirty&&!commit(false))return;var role=base,origin=context();dialog.close();root.ScriptPersonalRoles.open({roleId:role&&role.id,onDone:function(chosen){if(context()!==origin)return;var current=chosen||role&&root.CUSTOM.find(function(c){return root.ScriptCore.identity(c.id)===root.ScriptCore.identity(role.id);});open(current||undefined);}});};
    $('customReturn').onclick=function(){leave('return');};$('customRoleRules').onclick=function(){leave('rules');};$('customRoleJinx').onclick=function(){leave('jinx');};$('customRoleNight').onclick=function(){leave('night');};$('customRoleArt').onclick=function(){leave('art');};
    $('customToggleScript').onclick=function(){
      if(!base)return;
      var present=root.inSel(base),selected=present?root.sel.filter(function(c){return root.ScriptCore.identity(c.id)!==root.ScriptCore.identity(base.id);}):root.sel.concat(base);
      try{applyRoles(root.CUSTOM.slice(),selected);}catch(error){notice('剧本未更改：'+error.message,true);return;}
      $('customAdd').checked=!present;var clean=JSON.parse(cleanValues);clean.add=!present;cleanValues=JSON.stringify(clean);renderList();changed();
      notice(present?'已从剧本移除，角色资料和关联规则仍保留。':'已加入当前剧本，填写中的其他修改仍需保存。');
    };
    $('customViewEdit').onclick=function(){view('edit');};$('customViewPreview').onclick=function(){view('preview');};
    dialog.addEventListener('keydown',function(event){if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!event.altKey){event.preventDefault();commit(false);}});
    $('customClose').onclick=function(){remember();dialog.close();};
    dialog.addEventListener('cancel',remember);
    dialog.addEventListener('close',function(){uploadVersion++;});
    root.addEventListener('pagehide',function(){if(dialog.open)remember();});
    $('customNew').onclick=function(){if(canSwitch()){forget();load(null,false);view('edit',true);$('cn').focus();}};
    $('customCopy').onclick=function(){if(base&&canSwitch()){var source=base;forget();load(source,true);view('edit',true);$('cn').focus();}};
    $('customReset').onclick=function(){if(base&&dirty&&root.confirm('放弃未保存修改，恢复这个角色上次保存的内容？')){forget();load(base,false);notice('已恢复上次保存的内容。');}};
    $('customSearch').oninput=renderList;
    $('customTypeFilter').onchange=renderList;
    $('customShowLibrary').onclick=function(){var expanded=dialog.classList.toggle('custom-library-is-open');this.setAttribute('aria-expanded',String(expanded));this.textContent=expanded?'收起列表':'展开列表';};
    $('customRoleList').onclick=function(event){var button=event.target.closest('[data-role-index]');if(!button||!canSwitch())return;forget();load(root.CUSTOM[Number(button.dataset.roleIndex)],false);view('edit',true);};
    $('customExport').onclick=function(){if(dirty){notice('请先保存修改，再导出当前角色。',true);return;}if(base)root.download(base.n+'-角色.json',JSON.stringify([rawRole(base)],null,2));};
    $('customDelete').onclick=function(){
      if(!base)return;
      var id=root.ScriptCore.identity(base.id),used=(root.SCRIPT_RULES||[]).some(function(rule){return (rule.roleIds||[]).some(function(value){return root.ScriptCore.identity(value)===id;})||String(rule.name||'').includes(base.n);})||root.allChars().some(function(role){return role!==base&&role.raw&&Array.isArray(role.raw.jinxes)&&role.raw.jinxes.some(function(jinx){return root.ScriptCore.identity(jinx.id)===id;});});
      if(used){notice('该角色仍关联特殊规则或相克规则，请先在规则编辑中处理这些规则。',true);return;}
      if(!root.confirm('删除「'+base.n+'」并从当前剧本移除？建议先导出角色 JSON 备份。'))return;
      var overrides=Object.assign({},root.NIGHT_OVERRIDES);delete overrides[base.id];
      try{applyRoles(root.CUSTOM.filter(function(c){return c!==base;}),root.sel.filter(function(c){return root.ScriptCore.identity(c.id)!==id;}),overrides);}catch(error){notice('角色未删除：'+error.message,true);return;}
      dirty=false;forget();load(null,false);notice('角色已删除。');
    };
    $('customPreviewIcon').onerror=function(){this.hidden=true;$('customIconFallback').hidden=false;notice('图标未能加载，请检查地址或直接上传图片。',true);};
    $('customIconClear').onclick=function(){cancelUpload();$('cm').value='';preview();changed();};
    $('customUseUrl').onclick=function(){$('customIconClear').click();$('cm').focus();};
    $('customIconSearch').oninput=function(){
      var query=this.value.trim().toLowerCase(),roles=query?root.CHARS.filter(function(c){return c.im&&root.matchChar(c,query);}).slice(0,16):[];
      $('customIconResults').innerHTML=roles.map(function(c){return '<button type="button" class="custom-icon-choice" data-icon-index="'+root.CHARS.indexOf(c)+'"><img src="'+html(c.im)+'" alt="" loading="lazy"><span>'+html(c.n)+'</span></button>';}).join('')+(query&&!roles.length?'<p class="custom-help">没有找到图标，可以直接上传。</p>':'');
    };
    $('customIconResults').onclick=function(event){var button=event.target.closest('[data-icon-index]');if(!button)return;cancelUpload();$('cm').value=root.CHARS[Number(button.dataset.iconIndex)].im;preview();changed();};
    $('customUpload').onchange=async function(){
      var file=this.files[0];cancelUpload();var version=uploadVersion;if(!file)return;
      if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>8*1024*1024){notice('请上传不超过 8 MB 的 PNG、JPG、WebP 或 GIF 图片。',true);return;}
      $('customCommit').disabled=true;$('customSaveNew').disabled=true;notice('正在处理图标…');
      try{var image=await bitmap(file);if(version!==uploadVersion||!dialog.open)return;$('cm').value=image;preview();changed();notice('图标已嵌入，保存角色后可随 JSON 一起导出。');}
      catch(e){if(version===uploadVersion)notice(e.message,true);}
      finally{if(version===uploadVersion){$('customCommit').disabled=false;$('customSaveNew').disabled=false;this.value='';}}
    };
  }
  async function bitmap(file){
    var url=root.URL.createObjectURL(file),image=new root.Image();
    try{
      await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error('无法读取这张图片，请换一张图标。'));};image.src=url;});
      var canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),result='';
      if(!ctx||!image.naturalWidth||!image.naturalHeight)throw new Error('当前浏览器无法处理图标。');
      for(var edge of [160,128,96,64]){
        var ratio=Math.min(1,edge/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));ctx.drawImage(image,0,0,canvas.width,canvas.height);result=canvas.toDataURL('image/webp',.9);
        if(result.length<=20000&&/^data:image\/(webp|png);base64,/.test(result))return result;
      }
      throw new Error('图标压缩后仍过大，请使用更简洁的图片。');
    }finally{root.URL.revokeObjectURL(url);}
  }
  function open(requested){
    ensure();
    if(dialog.open){if(requested&&requested!==base&&canSwitch()){forget();load(requested,false);view('edit',true);}return;}
    $('customSearch').value='';$('customTypeFilter').value='';load(null,false);var pending,restored=false;
    try{pending=JSON.parse(root.localStorage.getItem(storageKey));}catch(e){}
    if(pending&&pending.version===1&&pending.context===context()&&pending.values){
      var previous=pending.baseId?root.CUSTOM.find(function(c){return c.id===pending.baseId;}):null;
      if((!pending.baseId||previous)&&fingerprint(previous)===pending.base){
        load(previous,false);fields.forEach(function(id){if(typeof pending.values[id]==='string'&&pending.values[id].length<=20000)$(id).value=pending.values[id];});
        $('cs').checked=!!pending.values.cs;$('customAdd').checked=pending.values.add!==false;
        try{dialog._copy=pending.copyRaw?root.ScriptCore.normalize(pending.copyRaw):null;}catch(e){dialog._copy=null;}
        preview();changed(false);restored=true;notice('已恢复上次未保存的填写内容。');
      }
    }
    dialog.showModal();view('edit',true);
    if(requested&&requested!==base&&(!restored||canSwitch())){forget();load(requested,false);}
    $('cn').focus();
  }
  $('sel').addEventListener('click',function(event){var button=event.target.closest('[data-custom-edit]');if(!button)return;var role=root.CUSTOM[Number(button.dataset.customEdit)];if(role)open(role);});
  $('grid').addEventListener('click',function(event){var button=event.target.closest('[data-custom-edit]');if(!button)return;var role=root.CUSTOM[Number(button.dataset.customEdit)];if(role)open(role);});
  root.ScriptCustomRoles={open:open,build:build,bitmap:bitmap,usePersonalRole:usePersonalRole,checkPersonalEdit:checkPersonalEdit,whenLibrarySaved:function(){return libraryJob;}};
})(window);
