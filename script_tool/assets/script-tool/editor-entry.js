/* Guide the shortest editing path while keeping the existing commands authoritative. */
(function(root){
  'use strict';
  var button=document.getElementById('bStepArt'),hint=document.getElementById('editorStepStatus');
  if(!button||!hint)return;
  function update(count){
    button.disabled=!count;
    hint.textContent=count?'已选 '+count+' 个角色 · 可继续修改角色，或生成图片预览。':'先加载一个预设，或从角色库自由添加角色。';
    document.querySelectorAll('.editor-steps li')[2].classList.toggle('is-ready',count>0);
  }
  root.ScriptEditorEntry={update:update};
  button.addEventListener('click',function(){document.getElementById('bArt').click();});
  document.getElementById('editorChooseRoles').addEventListener('click',function(event){
    var heading=document.getElementById('library-title');
    if(!heading)return;
    event.preventDefault();heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});
  });
  update(root.sel.length);
})(window);
