// 浏览器保存失败时仍保留本次会话状态；修正以源路径为键，避免目录重排后错位。
function readPreference(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(e){return fallback;}}
function writePreference(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
var pictureOverrides=readPreference('scriptlib-picture-roles',{});
function pictureRoles(script){
  var saved=Object.prototype.hasOwnProperty.call(pictureOverrides,script[3])?pictureOverrides[script[3]]:null;
  return saved&&saved.imageDir===script[9]?saved.roles:(script[11]||{});
}
function roleEditor(script){
  if(!scriptPictures(script).total)return '';
  var roles=pictureRoles(script),files=scriptPictures(script);
  var all=files.primary.concat(files.remaining);
  return '<details class="role-editor"><summary>修正图片分类</summary>'+['front','back','logo'].map(function(role,i){
    return '<label>'+['正面','背面','Logo'][i]+' <select data-role="'+role+'"><option value="">不指定</option>'+
      all.map(function(p){return '<option value="'+esc(p.file)+'"'+(roles[role]===p.file?' selected':'')+'>'+esc(p.file)+'</option>';}).join('')+'</select></label>';
  }).join('')+'<button class="btn" type="button" data-role-action="save">保存修正</button>'+
    '<button class="btn" type="button" data-role-action="reset">恢复原分类</button>'+
    '<button class="btn" type="button" data-role-action="download">下载全部修正</button>'+ 
    '<p class="role-status" role="status"></p></details>';
}
document.getElementById('detail').addEventListener('click',function(event){
  var button=event.target.closest('[data-role-action]');if(!button)return;
  var editor=button.closest('.role-editor'),gallery=editor.closest('.script-gallery');
  var index=Number(gallery.getAttribute('data-script')),script=SCRIPTS[index];if(!script)return;
  var action=button.getAttribute('data-role-action'),status=editor.querySelector('.role-status');
  if(action==='download'){jsonSave(JSON.stringify(pictureOverrides,null,2),'picture-roles.json');return;}
  if(action==='reset')delete pictureOverrides[script[3]];
  else {
    var roles={},used=new Set();
    for(var select of editor.querySelectorAll('select[data-role]')){
      if(!select.value)continue;
      if(used.has(select.value)){status.textContent='同一张图不能同时指定为多个分类。';return;}
      used.add(select.value);roles[select.getAttribute('data-role')]=select.value;
    }
    pictureOverrides[script[3]]={imageDir:script[9],roles:roles};
  }
  var saved=writePreference('scriptlib-picture-roles',pictureOverrides);
  show(index);
  var next=document.getElementById('detail').querySelector('.role-editor');next.open=true;
  next.querySelector('.role-status').textContent=saved?'已保存，预览和导出均已采用此分类。':'浏览器未允许保存，仅本次会话有效；请下载修正文件备份。';
});
