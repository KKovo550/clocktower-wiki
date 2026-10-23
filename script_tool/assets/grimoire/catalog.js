/* Adapt the existing editor catalogs; imported explicit night values remain authoritative. */
(function(root){
 'use strict';
 function parse(input){
  const result=root.ScriptCore.parseImport(input,root.CHARS),roles=result.selected.map((r,i)=>{
   const entry=result.entries[i],order=root.ScriptCore.nightOrder(r,root.SCRIPT_NIGHT_ORDER);
   if(entry&&typeof entry==='object'){if(entry.firstNight!==undefined&&entry.firstNight!=='')order.firstNight=r.f;if(entry.otherNight!==undefined&&entry.otherNight!=='')order.otherNight=r.o;}
   return {id:r.id,name:r.n,team:r.t==='traveler'?'traveller':r.t,ability:r.ab,image:r.im||r.iu||'',firstNight:order.firstNight,otherNight:order.otherNight,firstNightReminder:root.ScriptCore.nightReminder(r,'fr',root.CHARS),otherNightReminder:root.ScriptCore.nightReminder(r,'or',root.CHARS),setup:!!r.s,reminders:(r.r||[]).concat(r.rg||[])};
  });
  const jinx=root.ScriptCore.matchJinx(result.selected,root.ScriptCore.effectiveJinx(result.selected,root.JINX,result.rules));
  const rules=result.rules.map(r=>r.name+'：'+r.ability).concat(jinx.map(r=>r.roles.map(x=>x.n).join(' / ')+'：'+r.text));
  const parsed={name:result.name||'未命名剧本',author:result.author||'',roles,rules:[...new Set(rules)].join('\n\n')},meta=Array.isArray(input)&&input.find(x=>x&&typeof x==='object'&&x.id==='_meta');if(typeof meta?.logo==='string'&&meta.logo.length<=10000)parsed.logo=meta.logo;return parsed;
 }
 function presetLogo(name){return root.GRIMOIRE_PRESET_LOGOS?.[name]||'';}
 function scriptLogo(s){if(s.logo!==undefined)return s.logo;const p=root.PRESETS.find(p=>p.name===s.name),ids=new Set(s.roles.map(r=>r.id));return p&&p.idxs.length===ids.size&&p.idxs.every(i=>ids.has(root.CHARS[i].id))?presetLogo(s.name):'';}
 function preset(index){const p=root.PRESETS[index];if(!p)throw Error('找不到这个预设');return parse([{id:'_meta',name:p.name,logo:presetLogo(p.name)},...p.idxs.map(i=>root.CHARS[i].id)]);}
 function draft(snapshot){
  const raw=snapshot?null:root.localStorage.getItem('botc_script_drafts_v1');let source=snapshot;
  if(raw){const library=root.ScriptDrafts.open(root.localStorage,value=>root.ScriptCore.restoreDraft(value,root.CHARS));if(library.active())source=library.get(library.active()).state;}
  if(!source){const old=root.localStorage.getItem('botc_script_tool_v1');if(old)source=JSON.parse(old);}
  if(!source)throw Error('当前浏览器还没有编辑器草稿');
  const d=root.ScriptCore.restoreDraft(source,root.CHARS);
  if(!d.selected.length)throw Error('编辑器当前草稿没有角色');
  const roles=d.selected.map(r=>{
   const n=root.ScriptCore.nightOrder(r,root.SCRIPT_NIGHT_ORDER,d.nightOverrides);
   return {id:r.id,name:r.n,team:r.t==='traveler'?'traveller':r.t,ability:r.ab,image:r.im||r.iu||'',firstNight:n.firstNight,otherNight:n.otherNight,firstNightReminder:root.ScriptCore.nightReminder(r,'fr',root.CHARS),otherNightReminder:root.ScriptCore.nightReminder(r,'or',root.CHARS),setup:!!r.s,reminders:(r.r||[]).concat(r.rg||[])};
  });
  const parsed=parse([{id:'_meta',name:d.name||'未命名剧本',author:d.author},...d.selected.map(r=>({id:r.id,name:r.n,team:r.t,ability:r.ab})),...d.rules]);
  return {...parsed,roles};
 }
 function players(){return root.CHARS.filter(r=>!['fabled','loric'].includes(r.t)).map(r=>{const order=root.ScriptCore.nightOrder(r,root.SCRIPT_NIGHT_ORDER);return {id:r.id,name:r.n,team:r.t==='traveler'?'traveller':r.t,ability:r.ab||'',image:r.im||r.iu||'',firstNight:order.firstNight,otherNight:order.otherNight,firstNightReminder:root.ScriptCore.nightReminder(r,'fr',root.CHARS),otherNightReminder:root.ScriptCore.nightReminder(r,'or',root.CHARS),setup:!!r.s,reminders:(r.r||[]).concat(r.rg||[])};});}
 function specials(){return root.CHARS.filter(r=>['fabled','loric'].includes(r.t)).map(r=>({id:r.id,name:r.n,team:r.t,ability:r.ab||'',image:r.im||r.iu||'',firstNight:0,otherNight:0,firstNightReminder:'',otherNightReminder:'',setup:!!r.s,reminders:(r.r||[]).concat(r.rg||[])}));}
 function reminderIcon(kind){if(kind==='good'||kind==='evil')return {id:'alignment-'+kind,name:kind==='good'?'善良':'邪恶',team:kind==='good'?'townsfolk':'demon',image:'theme/reminder-'+kind+'.png'};const id={poison:'poisoner',drunk:'drunk'}[kind];if(!id)return null;const r=root.CHARS.find(r=>r.id===id||r.id===id+'_gstone');return r?{id:r.id,name:r.n,team:r.t,image:r.im||r.iu||''}:null;}
 function tokenMarks(role){
  if(!role)return {count:0,first:false,other:false,setup:false};const known=role.setup===undefined?root.CHARS.find(r=>r.n===role.name&&r.id.replace(/_gstone$/,'')===role.id.replace(/_gstone$/,'')):null;
  return {count:(role.reminders||[]).filter(s=>s.trim()).length,first:role.firstNight>0,other:role.otherNight>0,setup:role.setup===undefined?!!known?.s:role.setup};
 }
 // Only catalog-owned page paths may be linked. External IDs do not define role identity.
 function wikiPage(role){
  if(!role)return '';const clean=v=>String(v||'').normalize('NFKC').trim(),ability=v=>clean(v).replace(/\s+/g,'').replace(/[，,。；;：:]/g,''),name=clean(role.name),chars=root.CHARS||[],page=c=>c?.page?.startsWith('../pages/')?c.page:'';
  const exact=chars.find(c=>c.id===role.id&&clean(c.n)===name);if(page(exact))return page(exact);
  const text=ability(role.ability);if(!name||!text)return '';const matches=chars.filter(c=>clean(c.n)===name&&ability(c.ab)===text);
  return matches.length===1?page(matches[0]):'';
 }
 function roleInfo(role){const entries=root.GRIMOIRE_ROLE_FILTERS?.entries,entry=entries&&Object.prototype.hasOwnProperty.call(entries,role.id)?entries[role.id]:null;return entry?.name===role.name?entry:{name:role.name,groups:['custom'],categories:[]};}
 function roleGroups(){return root.GRIMOIRE_ROLE_FILTERS?.groups||[['custom','本局自定义']];}
 root.GrimoireCatalog={parse,preset,presetLogo,scriptLogo,draft,players,specials,reminderIcon,tokenMarks,wikiPage,roleInfo,roleGroups};
})(globalThis);
