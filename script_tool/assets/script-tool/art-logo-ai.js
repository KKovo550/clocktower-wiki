(function(root){
  'use strict';
  var styles=[{id:'dimensional',label:'立体复古文字（参考图）'},{id:'crimson',label:'古典暗红铭文'},{id:'clockwork',label:'蓝金钟楼徽记'}];
  function endpoint(){
    if(root.location.protocol!=='http:'||!['127.0.0.1','localhost'].includes(root.location.hostname))throw new Error('AI Logo 当前仅支持本机服务。请双击“启动 AI Logo 剧本工具.cmd”，使用它打开的地址。');
    return '/api/logo';
  }
  async function generate(input,signal){
    var response=await root.fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:signal,body:JSON.stringify(input)});
    if(!response.ok){
      var error;try{error=await response.json();}catch{}
      throw new Error(error&&typeof error.error==='string'?error.error:'本机生成服务不可用，请使用“启动 AI Logo 剧本工具.cmd”打开网站。');
    }
    if(!/^image\/png(?:;|$)/i.test(response.headers.get('content-type')||''))throw new Error('生成服务没有返回 PNG 图片。');
    var blob=await response.blob();if(!blob.size||blob.size>8*1024*1024)throw new Error('生成图片过大或无效，请重试。');return blob;
  }
  // Remove transparent canvas margins so a wide title is not scaled as a
  // landscape photograph. Preserve the original pixels and alpha channel.
  function crop(context,width,height){
    var data=context.getImageData(0,0,width,height).data,left=width,top=height,right=-1,bottom=-1,transparent=false;
    for(var y=0;y<height;y++)for(var x=0;x<width;x++){
      var alpha=data[(y*width+x)*4+3];
      if(alpha<=8){transparent=true;continue;}
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<0)throw new Error('生成图片中没有可见的 Logo，请重试。');
    if(!transparent)throw new Error('生成结果没有透明背景，请重新生成。');
    var pad=Math.max(2,Math.ceil(Math.max(right-left+1,bottom-top+1)*.015));
    left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(width-1,right+pad);bottom=Math.min(height-1,bottom+pad);
    return {x:left,y:top,width:right-left+1,height:bottom-top+1};
  }
  root.ScriptLogoAI={styles:styles,generate:generate,crop:crop};
})(typeof window==='undefined'?globalThis:window);
