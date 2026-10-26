/* Explicit, one-shot script handoffs. Never transfer player or review state. */
(function(root){
  'use strict';
  const prefix='botc_tool_transfer_v1_',ttl=15*60*1000,max=2*1024*1024;
  const pages={editor:'剧本工具.html',grimoire:'在线魔典.html',night:'夜序查看器.html'};
  function validate(value,target){
    if(!value||value.version!==1||value.target!==target||!pages[target]||!Number.isFinite(value.at)||Date.now()-value.at>ttl||value.at>Date.now()+60000||!Array.isArray(value.script)||!value.script.length)throw Error('传送的剧本已过期或格式无效，请回到原工具重新发送');
    if(new Blob([JSON.stringify(value)]).size>max)throw Error('剧本超过 2 MB，请使用 JSON 文件导入');
    return value;
  }
  function send(target,script){
    const value=validate({version:1,target,at:Date.now(),script},target),storage=root.localStorage;
    // Remove only expired handoffs, never tool saves.
    for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(!key.startsWith(prefix))continue;try{const old=JSON.parse(storage.getItem(key));if(!old||!Number.isFinite(old.at)||Date.now()-old.at>ttl)storage.removeItem(key);}catch{storage.removeItem(key);}}
    const token=Array.from(root.crypto.getRandomValues(new Uint32Array(4)),x=>x.toString(16).padStart(8,'0')).join(''),key=prefix+token;
    storage.setItem(key,JSON.stringify(value));
    const tab=root.open(pages[target]+'#tool-transfer='+token,'_blank');
    if(!tab){storage.removeItem(key);throw Error('浏览器阻止了新页面，请允许弹出窗口后重试');}
    tab.opener=null;
  }
  function receive(target,show,onError){
    const token=new URLSearchParams(root.location.hash.slice(1)).get('tool-transfer');if(!token)return;
    try{
      if(!/^[a-f0-9]{32}$/.test(token))throw Error('传送链接无效');
      const key=prefix+token,raw=root.localStorage.getItem(key);
      if(!raw||raw.length>max)throw Error('未找到待接收剧本，请在同一浏览器从原工具重新发送');
      const value=validate(JSON.parse(raw),target),meta=value.script.find(x=>x&&x.id==='_meta');
      show(value.script,String(meta?.name||'未命名剧本'),()=>{root.localStorage.removeItem(key);root.history.replaceState(null,'',root.location.pathname+root.location.search);});
    }catch(error){onError(error.message);}
  }
  function fromGrimoire(script){
    const data=[{id:'_meta',name:script.name,author:script.author,logo:script.logo},...script.roles.map(r=>JSON.parse(JSON.stringify(r)))];
    if(script.rules)data.push({id:'grimoire_rules',team:'a jinxed',name:'本局规则说明',ability:script.rules,ruleKind:'special',roleIds:[]});
    return data;
  }
  root.ToolTransfer={send,receive,fromGrimoire};
})(window);
