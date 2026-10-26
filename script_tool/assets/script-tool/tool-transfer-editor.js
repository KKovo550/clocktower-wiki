(function(root){
  'use strict';
  const transfer=root.ToolTransfer;if(!transfer)return;
  const anchor=document.getElementById('bNight');if(!anchor)return;
  for(const [target,label]of [['grimoire','用此剧本开魔典']]){
    const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=label;button.id='toolTo_'+target;
    button.onclick=()=>{try{if(!root.sel.length)throw Error('请先添加角色');if(root.save()===false)throw Error('请先处理草稿保存问题，再发送剧本');transfer.send(target,root.exportObj());}catch(error){root.alert(error.message);}};
    anchor.parentNode.append(button);
  }
  transfer.receive('editor',(data,name,done)=>{
    const parsed=root.ScriptCore.parseImport(data,root.CHARS),box=document.createElement('section');box.className='workflow-import';box.setAttribute('aria-label','接收工具剧本');
    const text=document.createElement('p');text.textContent='收到「'+name+'」 · '+parsed.selected.length+' 个角色。仅载入剧本定义，不包含对局身份、笔记或复盘；当前草稿会保留恢复点。';box.append(text);
    for(const [label,action]of [['确认载入',()=>{if(root.doImport(data)===false)return;done();box.remove();}],['保留当前草稿',()=>{done();box.remove();}]]){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.onclick=()=>{try{action();}catch(e){text.textContent=e.message;}};box.append(b);}
    document.querySelector('.script-editor').prepend(box);
  },message=>root.status(message));
})(window);
