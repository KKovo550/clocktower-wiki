/* Keep compact workspace controls connected to the editor's current state. */
(function(root){
  'use strict';
  var hint=document.getElementById('editorStepStatus'),countLabel=document.getElementById('editorRoleCount');
  if(!hint)return;
  function update(count){
    hint.textContent=count?'当前已选 '+count+' 个角色':'选择预设，或从角色库自由添加角色。';
    if(countLabel)countLabel.textContent=count;
  }
  root.ScriptEditorEntry={update:update};
  document.getElementById('editorChooseRoles').addEventListener('click',function(event){
    var heading=document.getElementById('library-title');
    if(!heading)return;
    event.preventDefault();heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});
  });
  var menu=document.getElementById('scriptActionsMenu');
  if(menu){
    document.addEventListener('click',function(event){if(!menu.contains(event.target)||event.target.closest('button'))menu.open=false;});
    menu.addEventListener('keydown',function(event){if(event.key==='Escape'&&menu.open){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}});
  }
  update(root.sel.length);
})(window);
