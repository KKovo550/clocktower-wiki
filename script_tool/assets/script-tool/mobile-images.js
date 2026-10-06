(function(root){
  'use strict';
  function validate(file){
    if(!file||file.size>20*1024*1024)throw new Error('请选择不超过 20 MB 的图片');
    if(!/^image\/(png|jpeg|webp|heic|heif)$/.test(file.type||'')&&!(!file.type&&/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name||'')))throw new Error('请选择 PNG、JPEG、WebP、HEIC 或 HEIF 图片');
  }
  function dimensions(width,height,maxPixels){
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width*height>(maxPixels||32000000))throw new Error('图片尺寸过大或无效，请缩小至 '+((maxPixels||32000000)/10000)+' 万像素以内');
  }
  function timed(start,label,late){
    return new Promise(function(resolve,reject){
      var done=false,timer=root.setTimeout(function(){var error=new Error(label+'超时，请缩小图片后重试');error.name='TimeoutError';finish(error);},30000);
      function finish(error,value){if(done){if(!error&&late)late(value);return;}done=true;root.clearTimeout(timer);if(error)reject(error);else resolve(value);}
      try{start(function(value){finish(null,value);},function(error){finish(error);});}catch(error){finish(error);}
    });
  }
  // Inspect a bounded header before native decoding; compressed size alone does not bound memory.
  async function inspect(file,maxPixels){
    if(!file.slice)return;
    var part=file.slice(0,256*1024),buffer;
    if(part.arrayBuffer)buffer=await timed(function(resolve,reject){part.arrayBuffer().then(resolve,reject);},'读取图片');
    else buffer=await timed(function(resolve,reject){var reader=new root.FileReader();reader.onload=function(){resolve(reader.result);};reader.onerror=function(){reject(new Error('图片无法读取'));};reader.readAsArrayBuffer(part);},'读取图片');
    var bytes=new Uint8Array(buffer),view=new DataView(buffer),width,height;
    function tag(offset){return String.fromCharCode.apply(null,bytes.subarray(offset,offset+4));}
    if(bytes.length>=24&&bytes[0]===137&&tag(1)==='PNG\r'&&tag(12)==='IHDR'){
      width=view.getUint32(16);height=view.getUint32(20);
    }else if(bytes.length>=12&&bytes[0]===255&&bytes[1]===216){
      var offset=2;
      while(offset+4<=bytes.length){
        if(bytes[offset++]!==255)break;while(bytes[offset]===255)offset++;
        var marker=bytes[offset++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;
        if(offset+2>bytes.length)break;var length=view.getUint16(offset);if(length<2||offset+length>bytes.length)break;
        if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&length>=8){height=view.getUint16(offset+3);width=view.getUint16(offset+5);break;}offset+=length;
      }
    }else if(bytes.length>=30&&tag(0)==='RIFF'&&tag(8)==='WEBP'){
      if(tag(12)==='VP8X'){width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
      else if(tag(12)==='VP8L'&&bytes[20]===47){width=1+bytes[21]+((bytes[22]&63)<<8);height=1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10);}
      else if(tag(12)==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42){width=view.getUint16(26,true)&16383;height=view.getUint16(28,true)&16383;}
    }
    if(width!==undefined)dimensions(width,height,maxPixels);
  }
  function geometry(width,height,options){
    dimensions(width,height,Number.MAX_VALUE);
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
    if(root.createImageBitmap){try{return await timed(function(resolve,reject){root.createImageBitmap(file,{imageOrientation:'from-image'}).then(resolve,reject);},'图片解码',function(bitmap){bitmap.close();});}catch(error){if(error.name==='TimeoutError')throw error;} }
    var url=URL.createObjectURL(file),image=new Image();
    try{await timed(function(resolve,reject){image.onload=resolve;image.onerror=function(){reject(new Error(/heic|heif/i.test(file.type+' '+file.name)?'此浏览器无法读取 HEIC/HEIF，请在相册中转换为 JPEG/PNG 后再导入':'图片无法读取，请重新从相册选择或换用 JPEG/PNG'));};image.src=url;},'图片解码');return image;}
    catch(error){if(image.removeAttribute)image.removeAttribute('src');throw error;}
    finally{image.onload=image.onerror=null;URL.revokeObjectURL(url);}
  }
  async function prepare(file,options){
    validate(file);await inspect(file);var image=await decode(file),canvas;
    try{
      var width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
      dimensions(width,height);
      var box=geometry(width,height,options);canvas=document.createElement('canvas');canvas.width=box.width;canvas.height=box.height;
      var context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法处理图片');
      context.translate(box.width/2,box.height/2);context.rotate(box.rotation*Math.PI/180);
      context.drawImage(image,box.x,box.y,box.sw,box.sh,-box.sw*box.scale/2,-box.sh*box.scale/2,box.sw*box.scale,box.sh*box.scale);
      var blob=await timed(function(resolve){canvas.toBlob(resolve,'image/png');},'图片转换');
      if(!blob)throw new Error('图片转换失败，请缩小图片后重试');
      return {blob:blob,width:box.width,height:box.height};
    }finally{if(image.close)image.close();else if(image.removeAttribute)image.removeAttribute('src');if(canvas){canvas.width=0;canvas.height=0;}}
  }
  function share(blob,name){
    if(!root.navigator||!root.navigator.share||!root.navigator.canShare||!root.File)return Promise.resolve(false);
    var file=new root.File([blob],name,{type:blob.type});
    if(!root.navigator.canShare({files:[file]}))return Promise.resolve(false);
    return root.navigator.share({files:[file],title:name}).then(function(){return true;});
  }
  root.ScriptMobileImages={validate:validate,inspect:inspect,geometry:geometry,prepare:prepare,share:share};
})(typeof window==='undefined'?globalThis:window);
