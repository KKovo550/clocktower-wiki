import {PaddleOCR} from '@paddleocr/paddleocr-js';
import * as ort from 'onnxruntime-web/webgpu';
ort.env.logLevel='error';
let engine,queue=Promise.resolve();
function bytes(base64){const raw=atob(base64),data=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);return data;}
async function initialize(assets,mode){
  const urls=[];
  const blob=(key,type)=>{const url=URL.createObjectURL(new Blob([bytes(assets[key])],{type}));urls.push(url);return url;};
  try{return await PaddleOCR.create({
    textDetectionModelName:'PP-OCRv5_mobile_det',textDetectionModelAsset:{url:blob('det','application/x-tar')},
    textRecognitionModelName:'PP-OCRv5_mobile_rec',textRecognitionModelAsset:{url:blob('rec','application/x-tar')},
    worker:false,ortOptions:{backend:mode==='cpu'?'wasm':'auto',numThreads:1,proxy:false,wasmPaths:{wasm:blob('wasm','application/wasm'),mjs:blob('module','text/javascript')}}
  });}finally{for(const url of urls)URL.revokeObjectURL(url);}
}
self.onmessage=event=>{
  const {id,file,assets,mode}=event.data;
  queue=queue.then(async()=>{
    try{
      if(!engine)engine=await initialize(assets,mode);
      const [result]=await engine.predict(file);
      self.postMessage({id,result:{items:result.items.map(item=>({text:item.text,poly:item.poly})),runtime:result.runtime}});
    }catch(error){self.postMessage({id,error:error.message||String(error)});}
  });
};
