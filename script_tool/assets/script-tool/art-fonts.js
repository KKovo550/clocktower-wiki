(function(root){
  'use strict';
  var promise,offlinePromise;
  var fonts=[
    {family:'ScriptArt SimHei',file:'simhei.woff2'},
    {family:'ScriptArt Sarasa UI SC',file:'SarasaUiSC-Regular.woff2'}
  ];
  function offlineFonts(){
    if(root.SCRIPT_ART_FONT_DATA)return Promise.resolve(root.SCRIPT_ART_FONT_DATA);
    if(offlinePromise)return offlinePromise;
    offlinePromise=new Promise(function(resolve,reject){
      var script=document.createElement('script');
      var timeout=setTimeout(function(){script.remove();offlinePromise=null;reject(new Error('离线制图字体加载超时，请关闭后重试。'));},15000);
      script.src='assets/script-tool/art-font-data.js';
      script.onload=function(){
        clearTimeout(timeout);
        if(root.SCRIPT_ART_FONT_DATA)resolve(root.SCRIPT_ART_FONT_DATA);
        else{offlinePromise=null;reject(new Error('离线制图字体不可用。'));}
      };
      script.onerror=function(){clearTimeout(timeout);script.remove();offlinePromise=null;reject(new Error('离线制图字体加载失败，请关闭后重试。'));};
      document.head.appendChild(script);
    });return offlinePromise;
  }
  function load(){
    if(promise)return promise;
    var dataSource=root.location.protocol==='file:'?offlineFonts():Promise.resolve(null);
    promise=dataSource.then(function(embedded){return Promise.all(fonts.map(async function(font,index){
      var data;
      if(embedded){
        var item=embedded[index];
        if(!item||item.family!==font.family||!/^data:font\/woff2;base64,[A-Za-z0-9+/=]+$/.test(item.data||''))throw new Error('离线制图字体资源不完整。');
        data=item.data;
      }else{
        var response=await fetch('assets/script-tool/fonts/'+font.file);
        if(!response.ok)throw new Error('制图字体加载失败，请关闭后重试。');
        var blob=await response.blob();
        data=await new Promise(function(resolve,reject){
          var reader=new FileReader();reader.onload=function(){resolve(reader.result);};reader.onerror=reject;reader.readAsDataURL(blob);
        });
      }
      var face=new FontFace(font.family,'url("'+data+'") format("woff2")');
      await face.load();return {family:font.family,data:data,face:face};
    }));}).then(function(loaded){
      loaded.forEach(function(font){document.fonts.add(font.face);});
      root.ScriptArtFonts.faces=loaded.map(function(font){return {family:font.family,data:font.data};});
    }).catch(function(error){promise=null;throw error;});
    return promise;
  }
  root.ScriptArtFonts={load:load,faces:[]};
})(window);
