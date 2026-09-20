(function(root){
 'use strict';
 function analyze(roles,spec,jinx){
  var errors=[],suggestions=[],interactions=[],setup=[],seen=new Set(),names=new Set(roles.map(function(c){return c.n.toLowerCase();})),counts={};
  roles.forEach(function(c){
   counts[c.t]=(counts[c.t]||0)+1;
   if(!c.id||!c.n)errors.push('角色缺少名称或 ID');
   if(seen.has(c.id))errors.push('重复角色 ID：'+c.id);seen.add(c.id);
   if(!['townsfolk','outsider','minion','demon','traveller','fabled','loric'].includes(c.t))errors.push(c.n+'：阵营无法导出为标准角色');
   if(!String(c.ab||'').trim())suggestions.push(c.n+'：未填写能力描述，请核对');
   if(c.nightUnverified)suggestions.push(c.n+'：原文未提供可用的角色 JSON，夜序、提醒标记和设置调整需要手动核对。');
   var brackets=String(c.ab||'').match(/\[[^\]]+\]|【[^】]+】/g)||[];
   if(c.s||brackets.length)setup.push({name:c.n,text:brackets.join('；')||'此角色标记为影响设置，请查看角色规则。'});
  });
  if(!roles.length)suggestions.push('尚未选择角色');
  else if(!counts.demon)suggestions.push('未包含恶魔，请核对是否为特殊规则剧本');
  if(spec==='teensy'){
   if(roles.filter(function(c){return ['townsfolk','outsider','minion','demon'].includes(c.t);}).length>9)suggestions.push('角色池较大，请核对汀西维尔规格；这不是开局人数判定。');
  }
  if(spec==='ravenswood'&&(counts.townsfolk||0)<9)suggestions.push('镇民选择少于 9 个，建议检查标准剧本的选择空间');
  jinx.forEach(function(j){var pair=j.name.split(/&|与/).map(function(x){return x.trim();});if(pair.length>1&&pair.every(function(n){return names.has(n.toLowerCase());}))interactions.push({name:pair.join(' & '),text:j.ability});});
  return {errors:errors,suggestions:suggestions,interactions:interactions,setup:setup,counts:counts};
 }
 root.ScriptChecks={analyze:analyze};
})(globalThis);
function renderScriptChecks(){
 var box=document.getElementById('script-checks');if(!box)return;
 var result=ScriptChecks.analyze(sel,document.getElementById('spec').value,JINX),links=window.WORKFLOW_ROLE_LINKS||{};
 function roleLink(name){return links[name]?'<a href="'+esc(links[name])+'" target="_blank" rel="noopener">'+esc(name)+' ↗</a>':esc(name);}
 function section(title,items){return '<h4>'+title+' · '+items.length+'</h4>'+(items.length?'<ul>'+items.map(function(item){return '<li>'+(typeof item==='string'?esc(item):item.name.split(' & ').map(roleLink).join(' & ')+'：'+esc(item.text))+'</li>';}).join('')+'</ul>':'<p class="check-muted">未发现</p>');}
 box.innerHTML='<summary>搭配检查 <span>'+result.errors.length+' 个明确问题 · '+result.suggestions.length+' 条建议 · '+result.interactions.length+' 条相克</span></summary><div class="check-body"><p>统计的是可选角色池，不是开局玩家配比。相克与设置调整不代表剧本无效。</p>'+section('明确问题',result.errors)+section('搭配建议',result.suggestions)+section('相克提醒',result.interactions)+section('设置调整',result.setup)+'<p><a href="../pages/相克规则.html" target="_blank" rel="noopener">相克规则</a> · <a href="../pages/设置调整.html" target="_blank" rel="noopener">设置调整说明</a></p></div>';
}
