// Share an immutable, public description of the selected source/version.
var LibraryShare=(function(){
 'use strict';
 var dialog=document.getElementById('libraryShare'),opener=null,oldOverflow='',session=0,busy=false,choices=null,current=null;
 var get=function(id){return document.getElementById(id);};
 var link=get('libraryShareLink'),text=get('libraryShareText'),status=get('libraryShareStatus'),versionSelect=get('libraryShareVersionSelect');
 var copyLink=get('libraryShareCopyLink'),copyText=get('libraryShareCopyText'),copyRoster=get('libraryShareCopyRoster'),nativeButton=get('libraryShareNative'),rosterText=get('libraryShareRosterText');
 var cover=get('libraryShareImage'),placeholder=get('librarySharePlaceholder'),imageOpen=get('libraryShareImageOpen'),imageDownload=get('libraryShareImageDownload'),imageView=get('libraryShareImageView');
 function rosterOf(script){
  var groups={},seen=new Set();
  script[5].forEach(function(index){var c=CHARS[index];if(!c||isLibraryRuleTeam(c[1]))return;
   var role=libraryRole(c),team=role?role.t:normalizeTeam(c[1]),name=role?role.n:c[0],key=team+'|'+(role&&role.wiki||String(name).normalize('NFKC').trim());
   if(seen.has(key))return;seen.add(key);if(TEAMORD.indexOf(team)<0)team='unknown';
   (groups[team]=groups[team]||[]).push(Object.freeze({name:name,icon:role&&role.im||''}));
  });
  return Object.freeze(TEAMORD.concat(['unknown']).filter(function(team){return groups[team];}).map(function(team){return Object.freeze({team:team,label:TEAMCN[team]||'其他角色',roles:Object.freeze(groups[team])});}));
 }
 function describe(i,latest){
  var s=latest?baseScripts[i]:SCRIPTS[i],version=latest?null:chosenVersions[i],name=s[0]||'(未命名)',author=s[1]||'佚名';
  var versionLabel='库内最新版本';
  if(version){var date=new Date(version.time);versionLabel='历史版本'+(Number.isNaN(date.getTime())?'':' · '+date.toLocaleDateString('zh-CN'))+' · '+String(version.id).slice(0,8);}
  var count=libraryCharacterCount(s[5]),url=LibraryJourney.shareURL(i,{latest:latest});
  var metadata='作者：'+author+' · '+count+' 个角色 · '+versionLabel;
  var roster=rosterOf(s),rosterLines=roster.map(function(group){return '【'+group.label+' · '+group.roles.length+'】'+group.roles.map(function(role){return role.name;}).join('、');}).join('\n');
  var groups=galleryPictures(s),pictures=groups.primary.filter(function(p){return p.role==='back';}),imageURL='';
  for(var p of pictures){imageURL=imgURLOf(s,p.file);if(imageURL)break;}
  var filename=String(baseScripts[i][3]||'').split(/[\\/]/).pop();
  return Object.freeze({title:'《'+name+'》',name:name,author:author,count:count,version:versionLabel,
   source:'收录来源：'+(baseScripts[i][2]||'未分类')+' · '+filename,url:url,image:imageURL,
   roster:roster,rosterText:'《'+name+'》\n'+rosterLines,summary:metadata+'\n'+rosterLines,text:'《'+name+'》\n'+metadata+'\n\n'+rosterLines+'\n\n'+url});
 }
 function payload(){return {title:current.title,text:current.summary,url:current.url};}
 function available(){
  if(typeof navigator.share!=='function')return false;
  try{return typeof navigator.canShare!=='function'||navigator.canShare(payload());}catch(error){return false;}
 }
 function controls(){
  copyLink.disabled=busy;copyText.disabled=busy;copyRoster.disabled=busy;nativeButton.disabled=busy;versionSelect.disabled=busy;
 }
 function renderRoster(){
  var box=get('libraryShareRoster');box.replaceChildren();
  current.roster.forEach(function(group){var section=document.createElement('section');section.className='share-roster-group t-'+group.team;
   var heading=document.createElement('h4');heading.textContent=group.label+' · '+group.roles.length;section.appendChild(heading);
   var names=document.createElement('div');names.className='share-roster-names';
   group.roles.forEach(function(role){var chip=document.createElement('span');chip.className='share-role-chip';
    if(role.icon){var icon=document.createElement('img');icon.src=role.icon;icon.alt='';icon.width=20;icon.height=20;icon.loading='lazy';icon.addEventListener('error',function(){this.remove();});chip.appendChild(icon);}
    chip.appendChild(document.createTextNode(role.name));names.appendChild(chip);
   });section.appendChild(names);box.appendChild(section);
  });
  if(!current.roster.length)box.textContent='此版本暂无可用角色名单，请查看角色表图片。';
 }
 function render(){
  get('libraryShareName').textContent=current.title;
  get('libraryShareAuthor').textContent='作者：'+current.author;get('libraryShareCount').textContent=current.count+' 个角色';
  get('libraryShareVersion').textContent=current.version;get('libraryShareSource').textContent=current.source;
  link.value=current.url;text.value=current.text;rosterText.value=current.rosterText;status.textContent='';renderRoster();
  cover.hidden=true;placeholder.hidden=false;
  placeholder.textContent=current.image?'正在加载角色表图片…':'暂无角色表图片，可先分享角色名单。';
  imageOpen.hidden=true;imageDownload.hidden=!current.image;imageView.hidden=!current.image;
  if(current.image){cover.src=current.image;imageOpen.href=current.image;imageDownload.href=current.image;imageView.href=current.image;
   var extension=(current.image.split(/[?#]/)[0].match(/\.(png|jpe?g|webp|gif)$/i)||[])[1]||'png';
   imageDownload.download=(current.name+'-'+current.version+'-角色表').replace(/[\\/:*?"<>|]/g,'_')+'.'+extension;
  }else{cover.removeAttribute('src');[imageOpen,imageDownload,imageView].forEach(function(a){a.removeAttribute('href');});}
  nativeButton.hidden=!available();controls();
 }
 cover.addEventListener('load',function(){if(dialog.open&&cover.naturalWidth){cover.hidden=false;imageOpen.hidden=false;placeholder.hidden=true;}});
 cover.addEventListener('error',function(){cover.hidden=true;imageOpen.hidden=true;placeholder.hidden=false;placeholder.textContent='角色表图片加载失败，仍可分享角色名单，或点击“查看大图”重试。';});
 function open(i,button){
  if(!SCRIPTS[i])return;
  if(typeof dialog.showModal!=='function'){copy(LibraryJourney.shareURL(i),button);return;}
  var wasOpen=dialog.open;session++;busy=false;opener=button;
  choices={current:describe(i,false),latest:describe(i,true)};current=choices.current;
  versionSelect.value='current';get('libraryShareVersionField').hidden=!chosenVersions[i];
  get('libraryShareText').closest('details').open=false;
  get('libraryShareRosterCopyField').hidden=true;
  render();if(!wasOpen){oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}dialog.scrollTop=0;copyRoster.focus({preventScroll:true});
 }
 versionSelect.addEventListener('change',function(){if(busy||!choices)return;current=versionSelect.value==='latest'?choices.latest:choices.current;render();});
 async function copyField(field,button,label){
  if(busy||!current)return false;
  var ticket=session,value=field.value;busy=true;button.textContent='正在复制…';controls();
  var copied=false;
  try{
   if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
    try{await navigator.clipboard.writeText(value);copied=true;}catch(error){}
   }
   if(ticket!==session)return copied;
   if(!copied){
    // Keep the fallback selection inside the active modal, including on file://.
    var details=field.closest('details');if(details)details.open=true;
    if(field===rosterText)get('libraryShareRosterCopyField').hidden=false;
    field.focus({preventScroll:true});field.select();
    try{copied=typeof document.execCommand==='function'&&!!document.execCommand('copy');}catch(error){}
   }
   status.textContent=copied?(label==='链接'?'链接已复制，可以发送给朋友。':label==='名单'?'角色名单已复制，已按角色类型分组。':'分享文案已复制，包含角色名单和剧本链接。'):'未能自动复制，已选中文本；请按 Ctrl+C，或长按选择复制。';
   return copied;
  }finally{if(ticket===session){busy=false;button.textContent=label==='链接'?'复制链接':label==='名单'?'复制角色名单':'复制分享文案';controls();}}
 }
 copyLink.onclick=function(){return copyField(link,this,'链接');};
 copyText.onclick=function(){return copyField(text,this,'文案');};
 copyRoster.onclick=function(){return copyField(rosterText,this,'名单');};
 nativeButton.onclick=async function(){
  if(busy||!current||!available())return;
  var ticket=session,data=payload();busy=true;controls();status.textContent='请选择分享方式…';
  try{await navigator.share(data);if(ticket===session)status.textContent='已完成系统分享。';}
  catch(error){if(ticket===session)status.textContent=error&&error.name==='AbortError'?'已取消分享。':'暂时无法打开系统分享，可以复制链接或文案后发送。';}
  finally{if(ticket===session){busy=false;controls();}}
 };
 [link,text,rosterText].forEach(function(field){field.addEventListener('click',function(){this.select();});});
 get('libraryShareClose').onclick=function(){dialog.close();};
 dialog.addEventListener('keydown',function(event){event.stopPropagation();});
 dialog.addEventListener('click',function(event){if(event.target!==dialog)return;var r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',function(){
  session++;busy=false;current=null;choices=null;cover.removeAttribute('src');link.value='';text.value='';rosterText.value='';status.textContent='';
  copyLink.textContent='复制链接';copyText.textContent='复制分享文案';copyRoster.textContent='复制角色名单';controls();document.body.style.overflow=oldOverflow;
  var target=opener&&opener.isConnected?opener:document.querySelector('#detail .dt');if(target)target.focus({preventScroll:true});opener=null;
 });
 return {open:open};
})();

