// Presentation only. Search criteria, storage keys, source data and exports stay in their existing modules.
var LibraryView=(function(){
 'use strict';
 var list=document.getElementById('list'),advanced=document.getElementById('libraryAdvanced');
 var criteria=['includeRoles','excludeRoles','team','minc','maxc','onlypic','cat','completionFilter','personalFilter','sort','playerCount'];
 var active=document.getElementById('libraryActiveFilters'),quickPictures=document.getElementById('quickPictures'),lastChips='';
 function chips(){
  if(!active)return;
  var items=[],labels={q:'搜索',cat:'分类',team:'阵营',minc:'最少角色',maxc:'最多角色',completionFilter:'完整度',personalFilter:'个人状态',sort:'排序',playerCount:'人数初筛'};
  ['q'].concat(criteria).forEach(function(id){
   var field=document.getElementById(id);if(!field)return;
   var value=field.type==='checkbox'?(field.checked?'有图片':''):field.value.trim();
   if(!value||(id==='sort'&&value==='name'))return;
   if(id==='includeRoles'||id==='excludeRoles'){
    roleTerms(value).forEach(function(term){items.push({id:id,term:term,label:(id==='includeRoles'?'包含：':'排除：')+term});});return;
   }
   var text=field.tagName==='SELECT'?field.options[field.selectedIndex].textContent:value;
   items.push({id:id,label:id==='onlypic'?text:(labels[id]||id)+'：'+text});
  });
  var signature=JSON.stringify(items);if(signature===lastChips)return;lastChips=signature;
  active.replaceChildren();active.hidden=!items.length;
  if(!items.length)return;
  var title=document.createElement('span');title.textContent='已选条件';active.appendChild(title);
  items.forEach(function(item){var button=document.createElement('button');button.type='button';button.className='library-filter-chip';button.dataset.filter=item.id;
   if(item.term)button.dataset.term=item.term;
   button.textContent=item.label+' ×';button.setAttribute('aria-label','移除'+item.label);active.appendChild(button);
  });
  var reset=document.createElement('button');reset.type='button';reset.dataset.clear='true';reset.className='library-filter-clear';reset.textContent='清空全部';active.appendChild(reset);
 }
 if(active)active.addEventListener('click',function(event){
  var button=event.target.closest('button');if(!button)return;
  var index=Array.from(active.querySelectorAll('button')).indexOf(button);
  if(button.dataset.clear)document.getElementById('filterReset').click();
  else{var field=document.getElementById(button.dataset.filter);
   if(field.type==='checkbox')field.checked=false;
   else if(button.dataset.term)field.value=roleTerms(field.value).filter(function(term){return term!==button.dataset.term;}).join('、');
   else field.value=field.id==='sort'?'name':'';
   render();
  }
  var remaining=active.querySelectorAll('button');(remaining[Math.min(index,remaining.length-1)]||document.getElementById('q')).focus({preventScroll:true});
 });
 if(quickPictures)quickPictures.addEventListener('click',function(){var field=document.getElementById('onlypic');field.checked=!field.checked;render();});
 // A capacity check, not a recommendation: setup-changing abilities can change the actual counts.
 var playerSetups={7:[5,0,1,1],8:[5,1,1,1],9:[5,2,1,1],10:[7,0,2,1],11:[7,1,2,1],12:[7,2,2,1],13:[9,0,3,1],14:[9,1,3,1],15:[9,2,3,1]};
 function playerMatches(script){
  var field=document.getElementById('playerCount'),setup=field&&playerSetups[field.value];if(!setup)return true;
  var roster=counts(script[5]);return ['townsfolk','outsider','minion','demon'].every(function(team,i){return (roster[team]||0)>=setup[i];});
 }
 function filters(openActive){
  var count=criteria.reduce(function(total,id){var field=document.getElementById(id);return total+(field&&!(id==='sort'&&field.value==='name')&&(field.type==='checkbox'?field.checked:String(field.value||'').trim())?1:0);},0);
  var summary=document.getElementById('libraryFilterSummary');
  if(summary){summary.textContent=count?count+' 项已启用':'角色、分类、人数';summary.classList.toggle('has-filters',count>0);}
  if(openActive&&count&&advanced)advanced.open=true;
  if(quickPictures)quickPictures.setAttribute('aria-pressed',String(document.getElementById('onlypic').checked));
  chips();
 }
 function selected(index){
  if(!list)return;
  list.querySelectorAll('.row').forEach(function(row){var at=Number(row.dataset.i),active=at===index;
   if(typeof scriptFamilyKey==='function'&&typeof SCRIPTS!=='undefined'&&SCRIPTS[at]&&SCRIPTS[index])active=scriptFamilyKey(SCRIPTS[at])===scriptFamilyKey(SCRIPTS[index]);
   row.classList.toggle('sel',active);row.setAttribute('aria-pressed',String(active));
  });
 }
 function focusDetails(){
  var grid=document.querySelector('.library-content .layout2'),panel=document.querySelector('.library-detail-panel'),title=document.querySelector('#detail .dt');
  if(!grid||!panel||!title)return;
  // This also follows the container breakpoint on intermediate desktop widths.
  if(getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length!==1)return;
  title.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});
 }
 if(list)list.addEventListener('keydown',function(event){
  if(event.key!=='Enter'&&event.key!==' ')return;
  var row=event.target.closest('.row');if(!row||!list.contains(row))return;
  event.preventDefault();row.click();
 });
 var back=document.getElementById('libraryBackToList');
 if(back)back.addEventListener('click',function(){
  if(!list)return;
  var row=list.querySelector('.row.sel')||list.querySelector('.row');
  if(row){row.focus({preventScroll:true});row.scrollIntoView({block:'center',behavior:'auto'});}
  else{var title=document.getElementById('library-list-title');if(title)title.scrollIntoView({block:'start',behavior:'auto'});}
 });
 return {filters:filters,selected:selected,focusDetails:focusDetails,playerMatches:playerMatches};
})();
