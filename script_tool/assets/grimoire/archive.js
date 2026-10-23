/* Local game library. Write a complete replacement before changing in-memory state. */
(function(root){
 'use strict';
 const key='botc_grimoire_library_v1',G=root.ClocktowerGrimoire||(typeof require==='function'?require('./core.js'):null);
 function open(storage){
  let previous=storage.getItem(key),data=read(previous);
  function read(raw){
   if(!raw)return {version:1,games:[]};const value=JSON.parse(raw);
   if(value?.version!==1||!Array.isArray(value.games)||value.games.length>30)throw Error('对局库格式不受支持，原资料已保留');
   const ids=new Set();return {version:1,games:value.games.map(item=>{
    if(!item||!['ongoing','archived'].includes(item.status)||!Number.isFinite(item.savedAt)||item.savedAt<0)throw Error('对局库条目损坏，原资料已保留');
    const game=G.validate(item.game);if(ids.has(game.gameId))throw Error('对局库标识重复');ids.add(game.gameId);
    return {game:G.packImages(game),status:item.status,savedAt:item.savedAt};
   })};
  }
  function commit(next){
   if(storage.getItem(key)!==previous)throw Error('另一页面已更新对局库，请关闭并重新打开对局列表');
   const raw=JSON.stringify(next);if(raw.length>24*1024*1024)throw Error('对局库已较大，请先导出备份并清理已归档对局');
   storage.setItem(key,raw);previous=raw;data=next;
  }
  return {
   list(){return data.games.map(item=>{const s=G.validate(item.game);return {id:s.gameId,name:s.script.name,author:s.script.author,count:s.seats.length,phase:s.phase,round:s.round,updatedAt:s.updatedAt,status:item.status,savedAt:item.savedAt,revision:s.revision};}).sort((a,b)=>b.savedAt-a.savedAt);},
   get(id){const item=data.games.find(item=>item.game.gameId===id);if(!item)throw Error('对局已不存在');return G.validate(item.game);},
   save(game,status='ongoing'){
    if(!['ongoing','archived'].includes(status))throw Error('归档状态无效');const valid=G.validate(game),games=data.games.filter(item=>item.game.gameId!==valid.gameId);
    if(games.length>=30)throw Error('最多保留 30 个对局，请先备份并清理旧对局');
    games.push({game:G.packImages(valid),status,savedAt:Date.now()});commit({version:1,games});
   },
   remove(id){if(!data.games.some(item=>item.game.gameId===id))throw Error('对局已不存在');commit({version:1,games:data.games.filter(item=>item.game.gameId!==id)});}
  };
 }
 const api={key,open};root.GrimoireArchive=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
