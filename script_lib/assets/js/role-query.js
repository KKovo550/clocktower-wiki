function roleKey(value){return String(value).normalize('NFKC').trim().toLowerCase();}
function roleTerms(value){return Array.from(new Set(String(value).split(/[、,，;；\n]+/).map(roleKey).filter(Boolean)));}
function canonicalRoleKey(value){
 var key=roleKey(value),names=(window.LIBRARY_ROLE_DETAILS||{}).names||{};
 return roleKey(Object.prototype.hasOwnProperty.call(names,key)?names[key].n:key);
}
function libraryRoleMatches(script){
 var names=new Set();script[5].forEach(function(i){var c=CHARS[i];if(!c||isLibraryRuleTeam(c[1]))return;
  names.add(roleKey(c[0]));var role=libraryRole(c);if(role)names.add(roleKey(role.n));
 });
 function contains(n){return names.has(n)||names.has(canonicalRoleKey(n));}
 return roleTerms(document.getElementById('includeRoles').value).every(contains)&&!roleTerms(document.getElementById('excludeRoles').value).some(contains);
}
function applyRoleQuery(){
 var params=new URLSearchParams(location.search);
 if(params.has('include')||params.has('exclude')){
  filterIds.forEach(function(id){var el=document.getElementById(id);if(id==='onlypic')el.checked=false;else el.value=id==='sort'?'name':'';});
  document.getElementById('includeRoles').value=params.getAll('include').join('、');
  document.getElementById('excludeRoles').value=params.getAll('exclude').join('、');currentPage=1;
 }
 var list=document.getElementById('library-role-options');
 Array.from(new Set(CHARS.filter(function(c){return !isLibraryRuleTeam(c[1]);}).flatMap(function(c){var role=libraryRole(c);return role?[c[0],role.n]:[c[0]];}))).sort(function(a,b){return a.localeCompare(b,'zh');}).forEach(function(name){var option=document.createElement('option');option.value=name;list.appendChild(option);});
}
