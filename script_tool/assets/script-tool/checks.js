(function(root){
 'use strict';
 function analyze(roles,spec,jinx){
  var errors=[],suggestions=[],interactions=[],setup=[],seen=new Set(),counts={};
  roles.forEach(function(c){
   counts[c.t]=(counts[c.t]||0)+1;
   if(!c.id||!c.n)errors.push('角色缺少名称或 ID');
   if(seen.has(c.id))errors.push('重复角色 ID：'+c.id);seen.add(c.id);
   if(!['townsfolk','outsider','minion','demon','traveller','fabled','loric'].includes(c.t))errors.push(c.n+'：阵营无法导出为标准角色');
   if(!String(c.ab||'').trim())suggestions.push(c.n+'：未填写能力描述，请核对');
   if(c.nightUnverified)suggestions.push(c.n+'：原文未提供可用的角色 JSON，夜序、提醒标记和设置调整需要手动核对。');
   var brackets=String(c.ab||'').match(/\[[^\]]+\]|【[^】]+】/g)||[];
   if(c.s||brackets.length)setup.push({name:c.n,roles:[c],text:brackets.join('；')||'此角色标记为影响设置，请查看角色规则。'});
  });
  if(!roles.length)suggestions.push('尚未选择角色');
  else if(!counts.demon)suggestions.push('未包含恶魔，请核对是否为特殊规则剧本');
  if(spec==='teensy'){
   if(roles.filter(function(c){return ['townsfolk','outsider','minion','demon'].includes(c.t);}).length>9)suggestions.push('角色池较大，请核对汀西维尔规格；这不是开局人数判定。');
  }
  if(spec==='ravenswood'&&(counts.townsfolk||0)<9)suggestions.push('镇民选择少于 9 个，建议检查标准剧本的选择空间');
  interactions=root.ScriptCore.matchJinx(roles,jinx).map(function(match){return {name:match.roles.map(function(r){return r.n;}).join(' & '),text:match.text,roles:match.roles};});
  return {errors:errors,suggestions:suggestions,interactions:interactions,setup:setup,counts:counts};
 }
 root.ScriptChecks={analyze:analyze};
 // Share role identities and icons across the review panel and rule editor.
 var localIcons={};(typeof CHARS==='undefined'?[]:CHARS).forEach(function(role){if(role.im){localIcons[role.id]=role.im;localIcons[role.im]=role.im;}});
 function escape(text){return String(text==null?'':text).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function roleHTML(role,name){
  name=role?role.n:name;
  var chars=typeof CHARS==='undefined'?[]:CHARS;
  var image=role&&(role.im||role.iu||root.ScriptCore.catalogIcon(role,chars,localIcons))||'';
  if(!/^(https?:\/\/|(?:\.\.\/)?icons\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(image))image='';
  var initial=escape(String(name||'?').charAt(0));
  var icon=image?'<img class="rule-role-icon" src="'+escape(image)+'" data-initial="'+initial+'" loading="lazy" alt="">':'<span class="rule-role-icon rule-role-placeholder" aria-hidden="true" data-initial="'+initial+'"></span>';
  var links=root.WORKFLOW_ROLE_LINKS||{},url=role&&role.page||links[name];
  var label='<span class="rule-role-name">'+escape(name)+'</span>';
  return url&&/^(?:https?:\/\/|(?:\.\.\/)?pages\/)/i.test(url)?'<a class="rule-role" href="'+escape(url)+'" target="_blank" rel="noopener">'+icon+label+'</a>':'<span class="rule-role">'+icon+label+'</span>';
 }
 function titleHTML(rule,roles){
  var seen=new Set();roles=roles.filter(function(role){var id=root.ScriptCore.identity(role.id);if(seen.has(id))return false;seen.add(id);return true;});
  if(rule.ruleKind==='role'&&Array.isArray(rule.roleIds)&&rule.roleIds.length===1){
   var owner=roles.find(function(role){return root.ScriptCore.identity(role.id)===root.ScriptCore.identity(rule.roleIds[0]);});
   return roleHTML(owner,rule.roleIds[0])+'<span class="rule-separator" aria-hidden="true"> & </span><span>'+escape(rule.name)+'</span>';
  }
  var pair=root.ScriptCore.matchJinx(roles,[rule])[0];
  return pair?pair.roles.map(function(role){return roleHTML(role);}).join('<span class="rule-separator" aria-hidden="true"> & </span>'):escape(rule.name);
 }
 function bindIcons(container){
  container.querySelectorAll('img.rule-role-icon').forEach(function(image){image.addEventListener('error',function(){
   var placeholder=container.ownerDocument.createElement('span');placeholder.className='rule-role-icon rule-role-placeholder';placeholder.setAttribute('aria-hidden','true');placeholder.dataset.initial=image.dataset.initial;image.replaceWith(placeholder);
  },{once:true});});
 }
 root.ScriptRuleDisplay={roleHTML:roleHTML,titleHTML:titleHTML,bindIcons:bindIcons};
})(globalThis);
function renderScriptChecks(){
 var box=document.getElementById('script-checks');if(!box)return;
 var rules=typeof SCRIPT_RULES==='undefined'?[]:SCRIPT_RULES;
 var result=ScriptChecks.analyze(sel,document.getElementById('spec').value,ScriptCore.effectiveJinx(sel,JINX,rules));
 var roles=typeof allChars==='function'?allChars():typeof CHARS==='undefined'?sel:CHARS;
 // Matched authored pairs already appear in interactions; keep every other
 // author rule visible, including rules whose associated roles were removed.
 var extra=rules.filter(function(rule){return !ScriptCore.matchJinx(sel,[rule]).length;});
 var single=extra.filter(function(rule){return rule.ruleKind==='role';});
 var global=extra.filter(function(rule){return rule.ruleKind==='special'||!rule.ruleKind;});
 var pending=extra.filter(function(rule){return rule.ruleKind==='jinx';});
 function authorItems(items){return items.map(function(rule){return {heading:ScriptRuleDisplay.titleHTML(rule,sel.concat(roles)),text:rule.ability};});}
 function section(title,items,kind){
  if(!items.length)return '';
  return '<section class="check-section check-'+kind+'"><h4>'+title+' <span>'+items.length+'</span></h4><ul>'+items.map(function(item){
   return '<li>'+(typeof item==='string'?esc(item):'<strong class="check-roles">'+(item.heading||item.roles.map(function(role){return ScriptRuleDisplay.roleHTML(role);}).join('<span class="rule-separator" aria-hidden="true"> & </span>'))+'</strong><p>'+esc(item.text)+'</p>')+'</li>';
  }).join('')+'</ul></section>';
 }
 function badge(label,count,kind){return '<span class="check-badge check-'+kind+(count?' has-items':'')+'">'+label+' <b>'+count+'</b></span>';}
 box.innerHTML='<summary><span class="check-title">搭配检查与规则</span><span class="check-status">'+badge('问题',result.errors.length,'errors')+badge('建议',result.suggestions.length,'suggestions')+badge('相克',result.interactions.length,'interactions')+(extra.length?badge('规则',extra.length,'rules'):'')+badge('设置',result.setup.length,'setup')+'</span></summary><div class="check-body"><p class="check-intro">检查可选角色池；相克提醒与设置调整不代表剧本无效。</p>'+
  (!result.errors.length?'<p class="check-clear">未发现明确问题</p>':'')+section('明确问题',result.errors,'errors')+section('搭配建议',result.suggestions,'suggestions')+section('相克提醒',result.interactions,'interactions')+section('设置调整',result.setup,'setup')+
  '<div id="scriptRules"'+(!extra.length?' hidden':'')+'>'+section('单角色规则',authorItems(single),'role-rules')+section('全局规则',authorItems(global),'global-rules')+section('关联角色未全部加入',authorItems(pending),'pending-rules')+'</div>'+
  '<p class="check-links"><a href="../pages/相克规则.html" target="_blank" rel="noopener">相克规则</a><a href="../pages/设置调整.html" target="_blank" rel="noopener">设置调整说明</a></p></div>';
 ScriptRuleDisplay.bindIcons(box);
}
