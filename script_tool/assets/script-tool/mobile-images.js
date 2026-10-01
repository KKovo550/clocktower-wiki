(function(root){
  'use strict';
  function validate(file){
    if(!file||file.size>20*1024*1024)throw new Error('请选择不超过 20 MB 的图片');
    if(!/^image\/(png|jpeg|webp|heic|heif)$/.test(file.type||'')&&!(!file.type&&/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name||'')))throw new Error('请选择 PNG、JPEG、WebP、HEIC 或 HEIF 图片');
  }
  function geometry(width,height,options){
    options=options||{};
    var crop=options.crop||{},left=Number(crop.left||0),right=Number(crop.right||0),top=Number(crop.top||0),bottom=Number(crop.bottom||0);
    if([left,right,top,bottom].some(function(v){return !Number.isFinite(v)||v<0||v>40;}))throw new Error('裁剪比例应在 0–40% 之间');
    var rotation=((Number(options.rotation||0)%360)+360)%360;
    if(![0,90,180,270].includes(rotation))throw new Error('旋转角度必须是 90 度的倍数');
    var sw=width*(1-left/100-right/100),sh=height*(1-top/100-bottom/100);
    var rw=rotation%180?sh:sw,rh=rotation%180?sw:sh;
    var scale=Math.min(1,4096/Math.max(rw,rh),Math.sqrt(16000000/(rw*rh)));
    return {x:width*left/100,y:height*top/100,sw:sw,sh:sh,rotation:rotation,width:Math.max(1,Math.round(rw*scale)),height:Math.max(1,Math.round(rh*scale)),scale:scale};
  }
  async function decode(file){
    if(root.createImageBitmap){try{return await root.createImageBitmap(file,{imageOrientation:'from-image'});}catch(_){} }
    var url=URL.createObjectURL(file),image=new Image();
    try{await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error(/heic|heif/i.test(file.type+' '+file.name)?'此浏览器无法读取 HEIC/HEIF，请在相册中转换为 JPEG/PNG 后再导入':'图片无法读取，请重新从相册选择或换用 JPEG/PNG'));};image.src=url;});return image;}
    finally{URL.revokeObjectURL(url);}
  }
  async function prepare(file,options){
    validate(file);var image=await decode(file),canvas;
    try{
      var width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
      if(!width||!height||width*height>32000000)throw new Error('图片尺寸过大或无效，请缩小至 3200 万像素以内');
      var box=geometry(width,height,options);canvas=document.createElement('canvas');canvas.width=box.width;canvas.height=box.height;
      var context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法处理图片');
      context.translate(box.width/2,box.height/2);context.rotate(box.rotation*Math.PI/180);
      context.drawImage(image,box.x,box.y,box.sw,box.sh,-box.sw*box.scale/2,-box.sh*box.scale/2,box.sw*box.scale,box.sh*box.scale);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});
      if(!blob)throw new Error('图片转换失败，请缩小图片后重试');
      return {blob:blob,width:box.width,height:box.height};
    }finally{if(image.close)image.close();if(canvas){canvas.width=0;canvas.height=0;}}
  }
  function share(blob,name){
    if(!root.navigator||!root.navigator.share||!root.navigator.canShare||!root.File)return Promise.resolve(false);
    var file=new root.File([blob],name,{type:blob.type});
    if(!root.navigator.canShare({files:[file]}))return Promise.resolve(false);
    return root.navigator.share({files:[file],title:name}).then(function(){return true;});
  }
  root.ScriptMobileImages={validate:validate,geometry:geometry,prepare:prepare,share:share};
})(typeof window==='undefined'?globalThis:window);
