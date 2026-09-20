// 分类是目录层级，不把以 # 开头的单剧本目录当作新的分类。
function categoryParts(value){
  var parts=String(value||'').split(' / ').map(function(part){return part.trim();}).filter(Boolean);
  var leaf=parts.findIndex(function(part){return part.charAt(0)==='#';});
  return leaf<0?parts:parts.slice(0,leaf);
}
function categoryMatches(category,selected){
  var actual=categoryParts(category),wanted=categoryParts(selected);
  if(!actual.length)actual=['未分类'];
  return wanted.every(function(part,index){return actual[index]===part;});
}
function buildCategoryTree(scripts){
  var root={label:'全部分类',path:'',count:0,children:new Map()};
  scripts.forEach(function(script){
    var node=root;node.count++;
    var parts=categoryParts(script[2]);
    if(!parts.length)parts=['未分类'];
    parts.forEach(function(label){
      if(!node.children.has(label))node.children.set(label,{label:label,path:node.path?node.path+' / '+label:label,count:0,children:new Map()});
      node=node.children.get(label);node.count++;
    });
  });
  return root;
}
var categoryTree=buildCategoryTree(SCRIPTS),categoryRendered=null;
function validCategory(value){
  var node=categoryTree;
  for(var part of categoryParts(value)){
    if(!node.children.has(part))break;
    node=node.children.get(part);
  }
  return node.path;
}
function renderCategorySelectors(){
  var input=document.getElementById('cat');
  input.value=validCategory(input.value);
  if(categoryRendered===input.value)return;
  categoryRendered=input.value;
  var selected=categoryParts(input.value),node=categoryTree,html='',level=0;
  while(node.children.size){
    html+='<label class="category-level"><span>'+(level===0?'大类':'第 '+(level+1)+' 级')+'</span>'+
      '<select data-category-level="'+level+'" aria-label="'+(level===0?'剧本大类':'第 '+(level+1)+' 级子分类')+'">'+
      '<option value="'+esc(node.path)+'">'+(level===0?'全部分类':'全部子类')+'（'+node.count+'）</option>';
    Array.from(node.children.values()).sort(function(a,b){return a.label.localeCompare(b.label,'zh',{numeric:true});}).forEach(function(child){
      html+='<option value="'+esc(child.path)+'"'+(child.label===selected[level]?' selected':'')+'>'+esc(child.label)+'（'+child.count+'）</option>';
    });
    html+='</select></label>';
    if(!selected[level]||!node.children.has(selected[level]))break;
    node=node.children.get(selected[level]);level++;
  }
  document.getElementById('categoryControls').innerHTML=html;
  document.getElementById('categoryPath').textContent=input.value?input.value+' · 包含下级，共 '+node.count+' 个剧本':'全部分类 · '+categoryTree.count+' 个剧本';
}
document.getElementById('categoryControls').addEventListener('change',function(event){
  var select=event.target.closest('select[data-category-level]');if(!select)return;
  var level=select.getAttribute('data-category-level');
  document.getElementById('cat').value=select.value;
  render();
  var replacement=document.getElementById('categoryControls').querySelector('select[data-category-level="'+level+'"]');
  if(replacement)replacement.focus();
});
