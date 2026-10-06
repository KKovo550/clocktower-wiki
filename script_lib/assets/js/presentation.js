// Presentation only. Search criteria, storage keys, source data and exports stay in their existing modules.
var LibraryView=(function(){
 'use strict';
 var list=document.getElementById('list'),advanced=document.getElementById('libraryAdvanced');
 var criteria=['includeRoles','excludeRoles','team','minc','maxc','onlypic','cat','completionFilter','personalFilter','sort'];
 function filters(openActive){
  var count=criteria.reduce(function(total,id){var field=document.getElementById(id);return total+(field&&!(id==='sort'&&field.value==='name')&&(field.type==='checkbox'?field.checked:String(field.value||'').trim())?1:0);},0);
  var summary=document.getElementById('libraryFilterSummary');
  if(summary){summary.textContent=count?count+' 项已启用':'角色、分类、人数';summary.classList.toggle('has-filters',count>0);}
  if(openActive&&count&&advanced)advanced.open=true;
 }
 function selected(index){
  if(!list)return;
  list.querySelectorAll('.row').forEach(function(row){var active=Number(row.dataset.i)===index;row.classList.toggle('sel',active);row.setAttribute('aria-pressed',String(active));});
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
 return {filters:filters,selected:selected,focusDetails:focusDetails};
})();
