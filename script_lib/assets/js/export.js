function imageOnlyExport(){return document.getElementById('expOnlyImages').checked===true;}
function expExportItems(){return expItems(pickedIdxs(),imageOnlyExport());}
// 每个文件是独立任务；成功项不重试，失败项保留名称和目标句柄。
var exportBusy=false,exportCancelled=false,exportJobs=[],exportSession=null;
var exportControlState=null;
function exportImageMode(){return document.getElementById('expImageMode').value||'roles';}
function exportPreview(){
  if(exportBusy)return;
  var selected=pickedIdxs(),items=expItems(selected,imageOnlyExport());
  var count=(imageOnlyExport()||document.getElementById('expImg').checked)?expImgCount(items):0;
  document.getElementById('expPreview').textContent='选择 '+selected.length+' 个剧本，可导出 '+(imageOnlyExport()?0:items.length)+
    ' 份 JSON + '+count+' 张图片；跳过 '+(selected.length-items.length)+(imageOnlyExport()?' 个无图片条目。':' 个无原文条目。')+
    (document.getElementById('expFolders').checked?'每个剧本一个文件夹。':'全部文件放入所选目录。');
}
function safeExportName(name){
  var clean=String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,120).replace(/[. ]+$/g,'');
  if(!clean||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(clean))clean='剧本_'+clean;
  return clean;
}
function reserveExportName(name,used){
  var ext=(name.match(/\.[^.]+$/)||[''])[0],base=ext?name.slice(0,-ext.length):name;
  var result=name,n=2;
  while(used.has(result.toLowerCase()))result=base+' ('+(n++)+')'+ext;
  used.add(result.toLowerCase());return result;
}
async function exportNames(directory){
  if(!exportSession.names.has(directory)){
    var names=new Set();
    for await(var entry of directory.values())names.add(entry.name.toLowerCase());
    exportSession.names.set(directory,names);
  }
  return exportSession.names.get(directory);
}
async function exportWrite(directory,name,data){
  var file=await directory.getFileHandle(name,{create:true}),stream=await file.createWritable();
  try{await stream.write(data);await stream.close();}
  catch(error){try{await stream.abort();}catch(ignored){}throw error;}
}
function exportLock(busy){
  var controls=['expOnlyImages','expGo','expDl','expFolders','expImg','expImageMode','expForget'].map(function(id){return document.getElementById(id);})
    .concat(Array.from(document.querySelectorAll('#expOpts input')));
  if(busy&&!exportControlState)exportControlState=controls.map(function(el){return [el,el.disabled];});
  if(busy)controls.forEach(function(el){el.disabled=true;});
  else if(exportControlState){exportControlState.forEach(function(pair){pair[0].disabled=pair[1];});exportControlState=null;}
  exportBusy=busy;
  document.getElementById('expStop').disabled=!busy;
  document.getElementById('expReport').disabled=busy||!exportJobs.length;
  document.getElementById('expRetry').disabled=busy||!exportJobs.some(function(job){return job.state!=='done';});
}
function exportProgress(){
  var done=exportJobs.filter(function(job){return job.state==='done';}).length;
  var failed=exportJobs.filter(function(job){return job.state==='failed';});
  var pending=exportJobs.length-done-failed.length;
  var active=exportJobs.find(function(job){return job.state==='running';});
  var bar=document.getElementById('expProgress');bar.max=Math.max(1,exportJobs.length);bar.value=done+failed.length;
  document.getElementById('expStat').textContent=(exportBusy?'处理中：':exportCancelled?'已停止：':'已结束：')+
    (exportSession&&exportSession.download?'已触发下载 ':'已写入 ')+done+' / '+exportJobs.length+' 个文件，失败 '+failed.length+'，未完成 '+pending+
    (exportSession&&exportSession.download?'。下载是否保存成功请查看浏览器下载记录。':'。同名文件自动加序号。')+
    (active?' 当前：'+active.label:'');
  document.getElementById('expErrors').textContent=exportJobs.filter(function(job){return job.state==='failed'||job.state==='blocked';}).map(function(job){return job.label+'：'+job.error;}).join('\n');
}
async function runExportJobs(jobs,cancelled,onProgress){
  for(var job of jobs){
    if(cancelled())break;
    if(job.state==='done')continue;
    if(job.dependsOn&&job.dependsOn.state!=='done'){
      job.state='blocked';job.error='等待该剧本 JSON 成功写入';onProgress();continue;
    }
    job.state='running';onProgress();
    try{await job.run();job.state='done';job.error='';}
    catch(error){job.state='failed';job.error=error.message||String(error);}
    onProgress();
  }
}
async function exportRun(){
  exportCancelled=false;exportLock(true);exportProgress();
  try{await runExportJobs(exportJobs,function(){return exportCancelled;},exportProgress);}
  finally{exportLock(false);exportProgress();}
}
function makeExportJobs(items,folders,wantImages){
  var session=exportSession;
  return items.flatMap(function(item){
    var target={directory:null,name:null};
    async function destination(){
      if(target.directory)return target.directory;
      if(!folders)return session.root;
      if(!target.name)target.name=reserveExportName(item.dir,await exportNames(session.root));
      target.directory=await session.root.getDirectoryHandle(target.name,{create:true});
      return target.directory;
    }
    function task(name,image,content){
      var assigned=null;
      var job={label:item.dir+'/'+name,state:'pending',image:!!image,run:async function(){
        var directory=await destination();
        if(!assigned)assigned=reserveExportName(name,await exportNames(directory));
        job.destination=(folders?target.name+'/':'')+assigned;
        var data=content===undefined?item.text:content;
        if(image){
          var source=session.imgRoot;
          for(var part of item.imgDir.split(/[\\/]/).filter(Boolean))source=await source.getDirectoryHandle(part);
          data=await (await source.getFileHandle(image)).getFile();
        }
        await exportWrite(directory,assigned,data);
      }};return job;
    }
    var primary=item.text==null?null:task(item.name,null);
    var jobs=primary?[primary]:[];
    if(item.source)jobs.push(task(item.dir+'-来源.txt',null,item.source));
    if(wantImages)item.imgs.forEach(function(image){
      var ext=(image[1].match(/\.[a-z0-9]+$/i)||['.png'])[0];
      var imageJob=task(item.dir+'-'+image[0]+ext,image[1]);imageJob.dependsOn=primary;jobs.push(imageJob);
    });
    return jobs;
  });
}
async function expWriteDir(){
  if(exportBusy)return;
  var items=expExportItems();
  if(!items.length){document.getElementById('expStat').textContent='没有可导出的剧本。';return;}
  if(!expWritableSupported()){document.getElementById('expStat').textContent='此浏览器不支持选择文件夹，请使用下载按钮。';return;}
  var folders=document.getElementById('expFolders').checked;
  var images=(imageOnlyExport()||document.getElementById('expImg').checked)&&expNeedsImages(items);
  exportCancelled=false;exportLock(true);
  try{
    var root=await expUsable(expDirHandle,'readwrite')||await expPick('readwrite','scriptlib-out','选择导出目标文件夹…');
    if(exportCancelled)return;
    var imgRoot=images?(await expUsable(expImgHandle,'read')||await expPick('read','scriptlib-img','选择本剧本库中的 library/images 文件夹…')):null;
    if(exportCancelled)return;
    exportSession={root:root,imgRoot:imgRoot,names:new Map(),download:false};
    exportJobs=makeExportJobs(items,folders,images);
    await exportRun();
  }catch(error){document.getElementById('expStat').textContent=error.name==='AbortError'?'已取消选择，未启动导出。':'无法开始导出：'+error.message;}
  finally{exportLock(false);}
}
async function expDownloadAll(){
  if(exportBusy)return;
  var items=expExportItems();if(!items.length)return;
  var fileCount=imageOnlyExport()?items.reduce(function(n,item){return n+item.imgs.length+(item.source?1:0);},0):items.length;
  if(fileCount>15&&!confirm('即将触发 '+fileCount+' 个文件下载，浏览器可能拦截。继续？'))return;
  if(imageOnlyExport()){
    exportSession={download:true};
    exportJobs=items.flatMap(function(item){
      var jobs=item.imgs.map(function(pic){return {label:item.dir+'/'+pic[1],state:'pending',run:async function(){
        var a=document.createElement('a');a.href=IMGBASE+'/'+item.imgDir.split(/[\\/]/).map(encodeURIComponent).join('/')+'/'+encodeURIComponent(pic[1]);a.download=item.dir+'-'+pic[0]+(pic[1].match(/\.[^.]+$/)||[''])[0];document.body.appendChild(a);a.click();a.remove();await new Promise(function(r){setTimeout(r,220);});
      }};});
      if(item.source)jobs.push({label:item.dir+'-来源.txt',state:'pending',run:async function(){jsonSave(item.source,item.dir+'-来源.txt');}});return jobs;
    });await exportRun();return;
  }
  await startDownloadExport(items);
}
async function startDownloadExport(items){
  if(exportBusy)return;
  exportSession={download:true};
  exportJobs=items.map(function(item){return {label:item.name,state:'pending',run:async function(){
    jsonSave(item.text,item.name);await new Promise(function(resolve){setTimeout(resolve,220);});
  }};});
  await exportRun();
}
document.getElementById('expStop').onclick=function(){exportCancelled=true;document.getElementById('expStat').textContent='正在停止；当前文件完成后不再开始下一项。';};
document.getElementById('expRetry').onclick=async function(){
  if(exportBusy||!exportSession)return;
  exportCancelled=false;
  exportLock(true);
  try{
    if(!exportSession.download){
      if(!await expUsable(exportSession.root,'readwrite'))throw new Error('目标文件夹权限失效，请重新选择文件夹并导出。');
      if(exportJobs.some(function(job){return job.image&&job.state!=='done';})){
        exportSession.imgRoot=await expUsable(expImgHandle,'read')||await expPick('read','scriptlib-img','选择本剧本库中的 library/images，重试未完成的图片…');
      }
    }
    if(exportCancelled)return;
    await exportRun();
  }catch(error){document.getElementById('expStat').textContent='重试未启动：'+error.message;}
  finally{exportLock(false);}
};
document.getElementById('expImageMode').onchange=function(){expUpdateImgHint();};
document.getElementById('expImg').onchange=exportPreview;
document.getElementById('expFolders').onchange=exportPreview;
document.getElementById('expReport').onclick=function(){
  if(exportBusy||!exportJobs.length)return;
  jsonSave(JSON.stringify({time:new Date().toISOString(),mode:exportSession.download?'browser-download':'directory',
    target:exportSession.root?exportSession.root.name:'浏览器下载目录',
    note:exportSession.download?'done 仅表示已触发下载，实际保存情况请查看浏览器。':'done 表示写入并关闭文件流成功。',
    files:exportJobs.map(function(job){return {file:job.label,destination:job.destination||null,state:job.state,error:job.error||''};})},null,2),'导出结果.json');
};

document.getElementById('expOnlyImages').onchange=function(){if(imageOnlyExport()){document.getElementById('expImg').checked=true;document.getElementById('expImageMode').value='all';}document.getElementById('expDl').textContent=imageOnlyExport()?'逐个下载图片及来源':'只下载 JSON';expUpdateImgHint();};
