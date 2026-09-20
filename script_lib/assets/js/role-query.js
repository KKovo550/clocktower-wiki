function roleKey(value){return String(value).normalize('NFKC').trim().toLowerCase();}
function roleTerms(value){return Array.from(new Set(String(value).split(/[、,，;；\n]+/).map(roleKey).filter(Boolean)));}
function libraryRoleMatches(script){
 var names=new Set(script[5].map(function(i){return roleKey(CHARS[i][0]);}));
 return roleTerms(document.getElementById('includeRoles').value).every(function(n){return names.has(n);})&&roleTerms(document.getElementById('excludeRoles').value).every(function(n){return !names.has(n);});
}
function applyRoleQuery(){
 var params=new URLSearchParams(location.search);
 if(params.has('include')||params.has('exclude')){
  filterIds.forEach(function(id){var el=document.getElementById(id);if(id==='onlypic')el.checked=false;else el.value=id==='sort'?'name':'';});
  document.getElementById('includeRoles').value=params.getAll('include').join('、');
  document.getElementById('excludeRoles').value=params.getAll('exclude').join('、');currentPage=1;
 }
 var list=document.getElementById('library-role-options');
 Array.from(new Set(CHARS.map(function(c){return c[0];}))).sort(function(a,b){return a.localeCompare(b,'zh');}).forEach(function(name){var option=document.createElement('option');option.value=name;list.appendChild(option);});
}
