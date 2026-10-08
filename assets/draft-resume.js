(function(){
  'use strict';
  var panel=document.getElementById('homeDraftResume');if(!panel)return;
  function refresh(){
    panel.hidden=true;
    try{
      var raw=localStorage.getItem('botc_script_resume_v1'),state=raw?JSON.parse(raw):null;
      if(!raw){
        raw=localStorage.getItem('botc_script_tool_v1');
        var legacy=raw?JSON.parse(raw):null;
        if(legacy&&typeof legacy.n==='string'&&Array.isArray(legacy.sel))state={name:legacy.n,roles:legacy.sel.length,hasContent:!!(legacy.n||legacy.sel.length)};
      }
      if(!state||!state.hasContent||typeof state.name!=='string'||!Number.isInteger(state.roles)||state.roles<0)return;
      panel.querySelector('a').textContent='继续上次编辑：'+(state.name||'未命名剧本')+' · '+state.roles+' 个角色';
      panel.hidden=false;
    }catch(ignore){/* Storage unavailable or damaged: keep ordinary navigation usable. */}
  }
  refresh();window.addEventListener('storage',function(event){if(!event.key||event.key==='botc_script_resume_v1'||event.key==='botc_script_tool_v1')refresh();});
})();
