/* Tab-local reading state; role data and filtering remain owned by role-index.js. */
(function(root){
  'use strict';
  if(root.RoleIndexJourney||!document.getElementById('q')||typeof state==='undefined')return;
  var key='clocktower_role_reading_v1',timer,pending=false,restoring=false,interacted=false;
  var disclosureIds=['advancedRoleFilters','categoryGroup','skillGroup'];
  var sorts=['relevance','team','name','night','otherNight','len'],scopes=['all','name','ability'];
  var host=document.createElement('div');host.id='roleActiveFilters';host.className='role-active-filters';host.hidden=true;host.setAttribute('aria-label','当前筛选条件');
  var toolbar=document.querySelector('.role-index .search-toolbar');if(!toolbar)return;
  toolbar.parentNode.insertBefore(host,toolbar.nextSibling);
  function array(value,valid){return Array.isArray(value)?Array.from(new Set(value.filter(function(x){return typeof x==='string'&&x.length<=80&&valid(x);}))).slice(0,80):[];}
  function clean(value){
    value=value&&typeof value==='object'?value:{};
    return {teams:array(value.teams,function(x){return TEAMORD.indexOf(x)>=0;}),
      sources:array(value.sources,function(x){return ROLE_SOURCES.some(function(s){return s.id===x;});}),
      categories:array(value.categories,function(x){return x==='未归类'||ABILITY_CATEGORIES.some(function(c){return c.name===x;});}),
      tags:array(value.tags,function(x){return x.trim().length>0;}),q:typeof value.q==='string'?value.q.slice(0,200):'',
      sort:sorts.indexOf(value.sort)>=0?value.sort:'relevance',scope:scopes.indexOf(value.scope)>=0?value.scope:'all',all:value.all===true,wiki:value.wiki===true};
  }
  function conditions(){
    var items=[];
    [['sources','来源',sourceLabel],['teams','类型',function(x){return TEAMCN[x]||x;}],['categories','类别',String],['tags','关键词',String]].forEach(function(group){
      (state[group[0]]||[]).forEach(function(value){items.push({kind:group[0],value:value,label:group[1]+'：'+group[2](value)});});
    });
    if(state.q)items.push({kind:'q',value:state.q,label:'搜索：'+state.q});
    if(state.wiki)items.push({kind:'wiki',label:'仅有百科详情'});
    if(state.all)items.push({kind:'all',label:'全部关键词都满足'});
    if(state.scope!=='all')items.push({kind:'scope',label:'范围：'+(state.scope==='name'?'名称 / ID':'技能描述')});
    if(state.sort!=='relevance')items.push({kind:'sort',label:'排序：'+$('sort').selectedOptions[0].textContent});
    return items;
  }
  function reset(){ $('reset').click();$('q').focus({preventScroll:true}); }
  function draw(){
    var items=conditions();host.replaceChildren();host.hidden=!items.length;
    items.forEach(function(item,index){
      var button=document.createElement('button');button.type='button';button.className='role-condition';
      button.dataset.conditionKind=item.kind;if(item.value!==undefined)button.dataset.conditionValue=item.value;
      button.textContent=item.label+' ×';button.setAttribute('aria-label','取消'+item.label);
      button.addEventListener('click',function(){
        if(Array.isArray(state[item.kind]))state[item.kind]=state[item.kind].filter(function(x){return x!==item.value;});
        else if(item.kind==='q'){state.q='';$('q').value='';}
        else if(item.kind==='all'||item.kind==='wiki'){state[item.kind]=false;$(item.kind==='all'?'allMode':'wikiOnly').checked=false;}
        else{state[item.kind]=item.kind==='sort'?'relevance':'all';$(item.kind==='sort'?'sort':'searchScope').value=state[item.kind];}
        refresh();var next=host.querySelectorAll('.role-condition');(next[Math.min(index,next.length-1)]||$('q')).focus({preventScroll:true});
      });host.appendChild(button);
    });
    if(items.length){var clear=document.createElement('button');clear.type='button';clear.className='role-conditions-clear';clear.textContent='清空全部';clear.addEventListener('click',reset);host.appendChild(clear);}
    if($('n').textContent==='0'&&items.length){var empty=document.createElement('button');empty.type='button';empty.id='roleEmptyReset';empty.className='btn';empty.textContent='清空筛选，查看全部角色';empty.addEventListener('click',reset);$('grid').firstElementChild.appendChild(empty);}
  }
  function snapshot(){
    var open={};disclosureIds.forEach(function(id){open[id]=!!($(id)&&$(id).open);});
    return {version:1,filters:clean(state),expanded:Object.keys(expanded).filter(function(id){return expanded[id]===true;}).slice(0,80),open:open,y:Math.max(0,root.scrollY||0)};
  }
  function save(){
    clearTimeout(timer);timer=null;if(pending||restoring)return;
    try{root.sessionStorage.setItem(key,JSON.stringify(snapshot()));}catch(ignore){/* Reading works when storage is unavailable or full. */}
  }
  function schedule(){clearTimeout(timer);if(!pending&&!restoring)timer=setTimeout(save,150);}
  function changed(){draw();schedule();}
  root.RoleIndexJourney={changed:changed};
  var saved;
  try{saved=JSON.parse(root.sessionStorage.getItem(key)||'null');}catch(ignore){}
  if(saved&&saved.version===1&&saved.filters&&typeof saved.filters==='object'){
    restoring=true;state=clean(saved.filters);
    var knownIds=new Set(ROLES.map(function(r){return r.id;}));
    expanded=Object.create(null);array(saved.expanded,function(id){return knownIds.has(id);}).forEach(function(id){expanded[id]=true;});
    $('q').value=state.q;$('searchScope').value=state.scope;$('sort').value=state.sort;$('allMode').checked=state.all;$('wikiOnly').checked=state.wiki;
    disclosureIds.forEach(function(id){if($(id))$(id).open=!!(saved.open&&saved.open[id]===true);});
    refresh();restoring=false;
    pending=!root.location.hash&&Number.isFinite(saved.y)&&saved.y>0;
    if(pending){
      var frame=root.requestAnimationFrame||function(fn){return setTimeout(fn,0);};
      frame(function(){frame(function(){if(!pending)return;pending=false;if(!interacted)root.scrollTo({top:saved.y,behavior:'instant'});save();});});
    }
  }else draw();
  function intent(){interacted=true;pending=false;}
  ['pointerdown','wheel','keydown','touchstart'].forEach(function(type){document.addEventListener(type,intent,{capture:true,passive:true});});
  $('q').addEventListener('input',intent);
  disclosureIds.forEach(function(id){if($(id))$(id).addEventListener('toggle',schedule);});
  root.addEventListener('scroll',schedule,{passive:true});
  root.addEventListener('hashchange',intent);
  root.addEventListener('pagehide',function(){
    if(pending){pending=false;clearTimeout(timer);return;}
    save();
  });
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save();});
})(window);
