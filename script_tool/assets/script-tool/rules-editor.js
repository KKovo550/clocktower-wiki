/* Author rules belong to the script: drafts, JSON and artwork share SCRIPT_RULES. */
(function(root){
  'use strict';
  var editing=null,override=null,kind='jinx',preferredRole='';
  var labels={jinx:'双角色相克',role:'单角色特殊规则',special:'全局特殊规则'};
  function el(id){return document.getElementById(id);}
  function classification(rule){return rule.ruleKind||(Array.isArray(rule.roleIds)&&rule.roleIds.length===2||ScriptCore.matchJinx(sel,[rule]).length||ScriptCore.matchJinx(allChars(),[rule]).length?'jinx':'special');}
  function notify(text){el('ruleNotice').textContent=text;}
  function commit(next){
    if(storageBlocked||root.ScriptDrafts&&!root.ScriptDraftUI)throw Error('当前草稿存储不可用，请先导出 JSON 备份。');
    var snapshot=captureDraft();snapshot.rules=next;ScriptCore.restoreDraft(snapshot,CHARS);
    // Write the draft before changing the live editor, just like JSON import.
    if(root.ScriptDraftUI)root.ScriptDraftUI.prepareSave(snapshot);
    else localStorage.setItem(saveKey,JSON.stringify(snapshot));
    SCRIPT_RULES=next;renderAll();
  }
  function roleOptions(selected){
    var roles=sel.slice();
    (selected||[]).forEach(function(id){if(!roles.some(function(r){return r.id===id;})){var c=allChars().find(function(r){return ScriptCore.identity(r.id)===ScriptCore.identity(id);});roles.push(c?Object.assign({},c,{id:id}):{id:id,n:id});}});
    return roles.map(function(r){return '<option value="'+esc(r.id)+'">'+esc(r.n)+(sel.filter(function(c){return c.n===r.n;}).length>1?'（'+esc(r.id)+'）':'')+'</option>';}).join('');
  }
  function reset(rule,match){
    editing=rule||null;override=match||null;
    el('ruleFormHeading').textContent=rule?'编辑'+labels[kind]:match?'修改当前剧本的相克':'添加'+labels[kind];
    el('ruleName').value=rule?rule.name:'';
    el('ruleAbility').value=rule?rule.ability:match?match.text:'';
    var ids=rule&&Array.isArray(rule.roleIds)?rule.roleIds:match?match.roles.map(function(r){return r.id;}):[];
    if(!ids.length&&rule){var legacy=ScriptCore.matchJinx(allChars(),[rule])[0];if(legacy)ids=legacy.roles.map(function(r){return r.id;});}
    ['ruleRoleA','ruleRoleB','ruleSingleRole'].forEach(function(id,index){el(id).innerHTML=roleOptions(ids);if(ids[index===2?0:index])el(id).value=ids[index===2?0:index];else if(index===1&&el(id).options.length>1)el(id).selectedIndex=1;});
    if(!rule&&!match&&preferredRole){
      ['ruleRoleA','ruleSingleRole'].forEach(function(id){if(Array.from(el(id).options).some(function(option){return option.value===preferredRole;}))el(id).value=preferredRole;});
      if(el('ruleRoleB').value===el('ruleRoleA').value){var other=Array.from(el('ruleRoleB').options).find(function(option){return ScriptCore.identity(option.value)!==ScriptCore.identity(preferredRole);});if(other)el('ruleRoleB').value=other.value;}
    }
    el('rulePairFields').hidden=kind!=='jinx';el('ruleNameField').hidden=kind==='jinx';
    el('ruleSingleField').hidden=kind!=='role';
    el('ruleScopeHelp').textContent=kind==='jinx'?'选择两个不同角色，说明它们之间的互动。':kind==='role'?'只需选择一个角色，规则会显示在该角色的图片说明下。':'无需选择角色。可添加私货商人的玩法、特殊开局或全局胜利条件。';
    // A copied catalog rule keeps its pair so the override cannot affect another pair.
    el('ruleRoleA').disabled=el('ruleRoleB').disabled=Boolean(match||rule&&rule.replaces);
    el('ruleSave').textContent=rule?'保存修改':match?'保存剧本版本':'添加规则';
    el('ruleOverrideNote').hidden=!(match||rule&&rule.replaces);
    notify('');
  }
  function card(name,text,label,actions,rule){
    var row=document.createElement('article');row.className='rule-card';
    var title=document.createElement('strong');title.className='rule-card-title';
    if(rule){title.innerHTML=ScriptRuleDisplay.titleHTML(rule,sel.concat(allChars()));ScriptRuleDisplay.bindIcons(title);}else title.textContent=name;
    var badge=document.createElement('span');badge.className='rule-origin';badge.textContent=label;
    var body=document.createElement('p');body.textContent=text;
    var buttons=document.createElement('div');buttons.className='rule-card-actions';
    actions.forEach(function(action){var button=document.createElement('button');button.type='button';button.className='btn';button.textContent=action.label;button.onclick=action.run;buttons.appendChild(button);});
    row.append(title,badge,body,buttons);return row;
  }
  function renderList(){
    var list=el('ruleList');list.replaceChildren();
    var own=SCRIPT_RULES.filter(function(r){return classification(r)===kind;});
    own.forEach(function(rule){
      var active=kind==='role'?ScriptCore.matchRoleRules(sel,[rule]).length:kind==='jinx'&&ScriptCore.matchJinx(sel,[rule]).length;
      var label=kind==='special'?'全局':kind==='role'?'单角色'+(active?'':' · 未加入剧本'):rule.replaces?'剧本版本':active?'当前剧本':'关联角色未全部加入';
      list.appendChild(card(ScriptCore.ruleTitle(rule,sel.concat(allChars())),rule.ability,label,[{label:'编辑',run:function(){reset(rule);el('ruleAbility').focus();}},{label:rule.replaces?'恢复收录规则':'删除',run:function(){
        try{commit(SCRIPT_RULES.filter(function(r){return r!==rule;}));reset();renderList();notify(rule.replaces?'已恢复收录的相克规则。':'已删除规则。');}catch(error){notify(error.message);}
      }}],rule));
    });
    if(kind==='jinx'){
      var replacements=new Set(own.map(function(r){return r.replaces;}).filter(Boolean));
      var catalog=ScriptCore.matchJinx(sel,JINX).filter(function(m){return !replacements.has(m.key);});
      if(catalog.length){var heading=document.createElement('h4');heading.textContent='已收录相克 · '+catalog.length;list.appendChild(heading);}
      catalog.forEach(function(match){list.appendChild(card(match.roles.map(function(r){return r.n;}).join(' × '),match.text,'已收录',[{label:'修改剧本版本',run:function(){reset(null,match);el('ruleAbility').focus();}}],match.rule));});
    }
    if(!list.childNodes.length){var empty=document.createElement('p');empty.className='rule-empty';empty.textContent='暂无'+labels[kind]+'。';list.appendChild(empty);}
    ['Jinx','Role','Special'].forEach(function(label){el('ruleTab'+label).setAttribute('aria-pressed',String(kind===({Jinx:'jinx',Role:'role',Special:'special'})[label]));});
  }
  function newId(){
    var used=new Set(sel.map(function(r){return ScriptCore.identity(r.id);}).concat(SCRIPT_RULES.map(function(r){return ScriptCore.identity(r.id);}))),id;
    do{id='script_rule_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}while(used.has(id));return id;
  }
  function submit(event){
    event.preventDefault();
    try{
      var text=el('ruleAbility').value.trim(),rule=Object.assign({},editing||{id:newId(),team:'a jinxed'},{ruleKind:kind,ability:text});
      if(kind==='jinx'){
        var a=el('ruleRoleA').value,b=el('ruleRoleB').value;
        if(!a||!b||ScriptCore.identity(a)===ScriptCore.identity(b))throw Error('请选择两个不同的角色。');
        var names=[a,b].map(function(id){return sel.concat(allChars()).find(function(r){return ScriptCore.identity(r.id)===ScriptCore.identity(id);})?.n||id;});
        rule.roleIds=[a,b];rule.name=names.join(' & ');
        if(override)rule.replaces=override.key;
        var key=JSON.stringify([rule.roleIds.map(ScriptCore.identity).sort(),text]);
        if(SCRIPT_RULES.some(function(r){return r!==editing&&classification(r)==='jinx'&&Array.isArray(r.roleIds)&&JSON.stringify([r.roleIds.map(ScriptCore.identity).sort(),r.ability.trim()])===key;}))throw Error('这条相克规则已存在。');
      }else{
        rule.name=el('ruleName').value.trim();delete rule.roleIds;delete rule.replaces;
        if(kind==='role'){
          var owner=el('ruleSingleRole').value;if(!owner)throw Error('请选择一个角色。');rule.roleIds=[owner];
          if(!rule.name)rule.name=(sel.concat(allChars()).find(function(r){return ScriptCore.identity(r.id)===ScriptCore.identity(owner);})?.n||owner)+'的特殊规则';
        }
      }
      rule=ScriptCore.normalizeRule(rule);
      if(!editing&&sel.length+SCRIPT_RULES.length>=1000)throw Error('角色和规则总数不能超过 1000 项。');
      var next=SCRIPT_RULES.slice(),index=next.indexOf(editing);if(index>=0)next[index]=rule;else next.push(rule);
      commit(next);reset();renderList();notify('已保存到当前剧本，导出 JSON 和生成图片会带上这些规则。');
    }catch(error){notify(error.message);}
  }
  function open(selectedKind,roleId){
    preferredRole=typeof roleId==='string'?roleId:'';
    kind=selectedKind||'jinx';
    openDlg('<div class="rules-editor"><header><h3 id="rulesEditorTitle">剧本规则编辑</h3><p>规则保存在当前草稿，随 JSON 导入导出，并用于生成图片。</p><div class="rule-tabs" role="group" aria-label="规则类型"><button type="button" class="btn" id="ruleTabJinx">双角色相克</button><button type="button" class="btn" id="ruleTabRole">单角色规则</button><button type="button" class="btn" id="ruleTabSpecial">全局特殊规则</button></div></header>'+
      '<div class="rules-editor-body"><form id="ruleForm"><h4 id="ruleFormHeading"></h4><p id="ruleScopeHelp" class="tip"></p><div id="rulePairFields" class="rule-pair"><label>角色一<select id="ruleRoleA" aria-label="相克角色一"></select></label><label>角色二<select id="ruleRoleB" aria-label="相克角色二"></select></label></div><label id="ruleSingleField">关联角色<select id="ruleSingleRole" aria-label="特殊规则关联角色"></select></label><label id="ruleNameField">规则名称<input type="text" id="ruleName" maxlength="200" placeholder="例如：杀戮决斗"></label><label>规则说明<textarea id="ruleAbility" maxlength="20000" required placeholder="填写完整规则说明"></textarea></label><p id="ruleOverrideNote" hidden>此版本仅用于当前剧本；恢复后会重新使用收录规则。</p><div class="rule-form-actions"><button type="submit" class="btn pri" id="ruleSave">添加规则</button><button type="button" class="btn" id="ruleCancel">重置</button></div><p id="ruleNotice" role="status" aria-live="polite"></p></form><section id="ruleList" aria-label="规则列表"></section></div><footer><button type="button" class="btn" id="ruleDone">完成</button></footer></div>');
    el('dlg').setAttribute('aria-labelledby','rulesEditorTitle');
    el('ruleTabJinx').onclick=function(){kind='jinx';reset();renderList();};el('ruleTabSpecial').onclick=function(){kind='special';reset();renderList();};
    el('ruleTabRole').onclick=function(){kind='role';reset();renderList();};
    el('ruleCancel').onclick=function(){reset();};el('ruleDone').onclick=closeDlg;el('ruleForm').onsubmit=submit;
    reset();renderList();
  }
  if(el('bRules'))el('bRules').onclick=function(){open('jinx');};
  root.ScriptRuleEditor={open:open};
})(window);
