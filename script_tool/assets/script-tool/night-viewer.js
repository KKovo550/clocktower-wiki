(function(root){
  'use strict';
  function build(data,chars,orders,source,players){
    var parsed=root.ScriptCore.parseImport(data,chars);
    if(!parsed.selected.length)throw new Error('剧本中没有角色。');
    var entries=parsed.entries;
    var rows=parsed.selected.map(function(role,index){
      var input=entries[index],night=root.ScriptCore.nightOrder(role,orders);
      if(source!=='wiki'&&input&&typeof input==='object'){
        if(input.firstNight!==undefined&&input.firstNight!=='')night.firstNight=role.f;
        if(input.otherNight!==undefined&&input.otherNight!=='')night.otherNight=role.o;
      }
      return {role:role,first:night.firstNight,other:night.otherNight,index:index};
    });
    var allRows=rows;
    if(players)rows=rows.filter(function(row){return players.some(function(player){return player.roleId===row.role.id;});});
    rows.forEach(function(row){row.players=(players||[]).filter(function(player){return player.roleId===row.role.id;}).map(function(player){return player.name;});});
    function list(field){return rows.filter(function(r){return r[field]>0;}).sort(function(a,b){return a[field]-b[field]||a.index-b.index;});}
    return {name:parsed.name||'未命名剧本',total:allRows.length,shown:rows.length,roles:allRows.map(function(row){return row.role;}),first:list('first'),other:list('other'),excluded:rows.filter(function(r){return !r.first&&!r.other;}).map(function(r){return r.role.n;})};
  }
  root.ScriptNightViewer={build:build};
  if(!root.document)return;
  var d=root.document,el=function(id){return d.getElementById(id);},current=null,view=null,revision=0,players=[];
  function status(text){el('nightStatus').textContent=text;}
  function render(data,reset){
    var next=build(data,root.CHARS,root.SCRIPT_NIGHT_ORDER,el('nightSource').value,reset?undefined:(el('nightPresentOnly').checked?players:undefined));
    if(reset){
      players=[];el('nightPresentOnly').checked=false;el('nightPlayerList').replaceChildren();
      el('nightPlayerRole').replaceChildren();el('nightPlayerName').value='';
      next.roles.forEach(function(role){var option=d.createElement('option');option.value=role.id;option.textContent=role.n;el('nightPlayerRole').append(option);});
    }
    el('nightPlayers').hidden=false;
    function fill(id,rows,reminder){
      var list=el(id);list.replaceChildren();
      rows.forEach(function(row){
        var item=d.createElement('li'),name=d.createElement('strong'),description=d.createElement('p');
        name.textContent=row.role.n+(row.players.length?'（'+row.players.join('、')+'）':'');description.textContent=root.ScriptCore.nightReminder(row.role,reminder,root.CHARS)||
          (row.role.ab?'未收录本夜的操作说明。角色能力：'+row.role.ab:'未收录本夜的操作说明，请查看角色规则。');
        item.append(name,description);list.append(item);
      });
      if(!rows.length){var empty=d.createElement('p');empty.textContent='没有已配置的角色行动。';list.append(empty);}
    }
    fill('nightFirst',next.first,'fr');fill('nightOther',next.other,'or');
    el('nightTitle').textContent=next.name;el('nightSummary').textContent='共 '+next.total+' 个角色'+(el('nightPresentOnly').checked?' · 在场 '+players.length+' 位玩家 / '+next.shown+' 种角色':'')+' · '+(el('nightSource').value==='wiki'?'本站夜序表':'JSON 优先');
    el('nightFirstTitle').textContent='首夜（'+next.first.length+'）';el('nightOtherTitle').textContent='其他夜晚（'+next.other.length+'）';
    el('nightExcluded').textContent=next.excluded.length?'未列入夜序：'+next.excluded.join('、')+'。这些角色的两个夜序均为 0 或缺少数据，不代表一定无需行动。':'';
    el('nightResult').hidden=false;current=data;view=next;status('已显示当前剧本的行动顺序。');
  }
  function load(text){try{render(root.ScriptCore.parseJSON(text),true);}catch(error){status('导入失败：'+error.message+'。原有结果未更改。');}}
  el('nightLoad').onclick=function(){revision++;load(el('nightJson').value);};
  el('nightFile').onchange=async function(){var file=this.files[0],token=++revision;if(!file)return;
    if(file.size>5*1024*1024){status('文件超过 5 MB，请选择剧本 JSON。');return;}
    status('正在读取…');try{var text=await file.text();if(token===revision)load(text);}catch(error){if(token===revision)status('无法读取文件：'+error.message);}finally{this.value='';}
  };
  function refreshPlayers(){
    el('nightPlayerList').replaceChildren();
    players.forEach(function(player,index){
      var item=d.createElement('li'),label=d.createElement('span'),remove=d.createElement('button');
      var role=view.roles.find(function(role){return role.id===player.roleId;});
      label.textContent=player.name+' · '+role.n;remove.type='button';remove.textContent='移除';remove.setAttribute('aria-label','移除 '+player.name);
      remove.onclick=function(){players.splice(index,1);refreshPlayers();render(current);};item.append(label,remove);el('nightPlayerList').append(item);
    });
  }
  el('nightPlayerForm').onsubmit=function(event){
    event.preventDefault();if(!current)return;
    var roleId=el('nightPlayerRole').value;if(!view.roles.some(function(role){return role.id===roleId;}))return;
    var name=el('nightPlayerName').value.trim()||'玩家 '+(players.length+1);
    players.push({name:name,roleId:roleId});el('nightPlayerName').value='';refreshPlayers();render(current);
  };
  el('nightPresentOnly').onchange=function(){if(current)render(current);};
  el('nightSource').onchange=function(){if(current)render(current);};
  el('nightCopy').onclick=async function(){if(!view)return;
    var text=view.name+'\n\n'+[['首夜',view.first,'fr'],['其他夜晚',view.other,'or']].map(function(group){return group[0]+'\n'+(group[1].map(function(row,i){var prompt=root.ScriptCore.nightReminder(row.role,group[2],root.CHARS);return (i+1) +'. '+row.role.n+(row.players.length?'（'+row.players.join('、')+'）':'')+(prompt?'：'+prompt:'');}).join('\n')||'没有已配置的角色行动。');}).join('\n\n');
    try{await root.navigator.clipboard.writeText(text);status('夜序已复制。');}catch(error){status('浏览器未允许复制，请选择页面文字手动复制。');}
  };
})(typeof window==='undefined'?globalThis:window);
