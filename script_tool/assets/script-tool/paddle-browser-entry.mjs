const results = new Map();
const workerSourceURL=new URL('./gpu-worker-source.js',document.currentScript.src).href;
let gpuSourceLoading=null,gpuDisabled=false,nextRequest=0;
const channels={cpu:{worker:null,requests:new Map()},gpu:{worker:null,requests:new Map()}};
window.ScriptPaddleBrowser={
  dispose(){stopWorker('cpu',aborted());stopWorker('gpu',aborted());results.clear();},
  recognizeTitle(file,options={}){return recognizeCached(file,'title',options);},
  recognize(file,options={}){return recognizeCached(file,'roles',options);}
};
function aborted(){const error=new Error('识别已取消');error.name='AbortError';return error;}
async function recognizeCached(file,purpose,options){
  const layout=options.layout==='poster'?'poster':'full',mode=options.gpu?'gpu':'cpu';
  const key=mode+':'+purpose+':'+(purpose==='title'?'full':layout);
  if(options.signal?.aborted)throw aborted();
  if(!results.has(key))results.set(key,new WeakMap());
  const cache=results.get(key);
  if(!cache.has(file))cache.set(file,(async()=>{
    const {input,width,height}=await prepareImage(file,purpose);
    if(options.signal?.aborted)throw aborted();
    let result;
    if(mode==='gpu'&&!gpuDisabled){
      try{result=await predictWorker(input,options.signal,'gpu');}catch(error){
        if(error.name==='AbortError')throw error;
        gpuDisabled=true;stopWorker('gpu',error);
        if(options.onFallback)options.onFallback(error.message);
      }
    }
    if(!result)result=await predictWorker(input,options.signal,'cpu');
    // Keep original image pixels for OCR accuracy; exclude sidebar text by position.
    if(purpose==='roles'&&layout==='poster')result={...result,items:result.items.filter(item=>{
      if(!Array.isArray(item.poly)||!item.poly.length)return true;
      const x=item.poly.reduce((sum,point)=>sum+point[0],0)/item.poly.length;
      const y=item.poly.reduce((sum,point)=>sum+point[1],0)/item.poly.length;
      return (!Number.isFinite(x)||!Number.isFinite(y))||(x>=width*0.07&&x<=width*0.93&&y>=height*0.09);
    })};
    return result;
  })());
  let onAbort;
  try{
    const pending=cache.get(file);
    const result=options.signal?await Promise.race([pending,new Promise((_,reject)=>{
      onAbort=()=>{const error=aborted();stopWorker(mode,error);if(mode==='gpu')stopWorker('cpu',error);reject(error);};
      options.signal.addEventListener('abort',onAbort,{once:true});
    })]):await pending;
    window.ScriptPaddleBrowser.lastRuntime=result.runtime;
    return result.items.map(item=>item.text).join('\n');
  }catch(error){cache.delete(file);throw error;}
  finally{if(onAbort)options.signal.removeEventListener('abort',onAbort);}
}
async function prepareImage(file,purpose){
    const image=await createImageBitmap(file);
    try{
      if(image.width*image.height>32000000)throw new Error('图片不能超过 3200 万像素');
      if(purpose==='roles')return {input:file,width:image.width,height:image.height};
      const width=image.width;
      const height=purpose==='title'?Math.ceil(image.height*0.14):image.height;
      const canvas=document.createElement('canvas');canvas.width=Math.round(width);canvas.height=height;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(image,0,0,width,height,0,0,canvas.width,canvas.height);
      const cropped=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!cropped)throw new Error('无法读取图片识别区域');
      return {input:cropped,width:image.width,height:image.height};
    }finally{image.close();}
}

function stopWorker(mode,error){
  const channel=channels[mode];
  if(channel.worker){channel.worker.terminate();channel.worker=null;}
  for(const request of channel.requests.values())request.reject(error);
  channel.requests.clear();
}
function loadGpuSource(){
  if(window.ScriptPaddleGPUWorkerSource)return Promise.resolve();
  if(!gpuSourceLoading)gpuSourceLoading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=workerSourceURL;
    script.onload=()=>window.ScriptPaddleGPUWorkerSource?resolve():reject(new Error('OCR Worker 初始化失败'));
    script.onerror=()=>{script.remove();reject(new Error('OCR Worker 资源加载失败'));};document.head.appendChild(script);
  }).catch(error=>{gpuSourceLoading=null;throw error;});
  return gpuSourceLoading;
}
function predictWorker(file,signal,mode){
  const channel=channels[mode],timeout=mode==='gpu'?45000:120000;
  return new Promise((resolve,reject)=>{
    let finished=false,id,onAbort;
    function finish(callback,value){if(finished)return;finished=true;clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);channel.requests.delete(id);callback(value);}
    const timer=setTimeout(()=>{
      const error=new Error(mode==='gpu'?'GPU 识别超过 45 秒，已回退 CPU':'CPU 识别超过 120 秒，已停止；请缩小图片后重试');
      if(mode==='gpu')gpuDisabled=true;stopWorker(mode,error);finish(reject,error);
    },timeout);
    if(signal){
      onAbort=()=>{const error=aborted();stopWorker(mode,error);finish(reject,error);};
      if(signal.aborted){onAbort();return;}
      signal.addEventListener('abort',onAbort,{once:true});
    }
    (async()=>{
      await loadGpuSource();if(finished)return;
      if(signal?.aborted)throw aborted();
      let assets;
      if(!channel.worker){
        const url=URL.createObjectURL(new Blob([window.ScriptPaddleGPUWorkerSource],{type:'text/javascript'}));
        try{channel.worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
        const worker=channel.worker;
        worker.onmessage=event=>{if(channel.worker!==worker)return;const request=channel.requests.get(event.data.id);if(request){if(event.data.error)request.reject(new Error(event.data.error));else request.resolve(event.data.result);}};
        worker.onerror=event=>{if(channel.worker===worker)stopWorker(mode,new Error(event.message||'OCR Worker 执行失败'));};
        assets=window.PaddleBrowserAssets;
      }
      id=++nextRequest;channel.requests.set(id,{resolve:value=>finish(resolve,value),reject:error=>finish(reject,error)});
      channel.worker.postMessage({id,file,assets,mode});
    })().catch(error=>finish(reject,error));
  });
}
