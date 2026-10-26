/* Durable recovery checkpoints. A completed strict transaction is the acknowledgement. */
(function(root){
 'use strict';
 function open(){return new Promise((resolve,reject)=>{
  if(!root.indexedDB){reject(Error('此浏览器不支持增强恢复'));return;}
  const request=root.indexedDB.open('clocktower_grimoire_recovery',1);let ended=false;
  const timer=setTimeout(()=>{ended=true;reject(Error('增强恢复数据库打开超时'));},5000);
  request.onupgradeneeded=()=>request.result.createObjectStore('checkpoints',{keyPath:'key'});
  request.onerror=()=>{clearTimeout(timer);reject(request.error);};
  request.onsuccess=()=>{clearTimeout(timer);const db=request.result;if(ended){db.close();return;}db.onversionchange=()=>db.close();
   const records=new Map(),failures=new Map(),tx=db.transaction('checkpoints','readonly'),read=tx.objectStore('checkpoints').getAll();let tail=Promise.resolve(),pending=0;
   read.onsuccess=()=>{for(const record of read.result){if(record.version!==1||!Number.isInteger(record.sequence)||record.sequence<1)throw Error('增强恢复资料版本无效');records.set(record.key,record);}};
   tx.onabort=tx.onerror=()=>reject(tx.error||Error('增强恢复资料无法读取'));
   tx.oncomplete=()=>resolve({records,get pending(){return pending>0;},get failed(){return failures.size>0;},retry(){return Promise.all([...failures].map(([key,entry])=>this.write(key,entry.value)));},flush(){return tail.then(()=>{if(failures.size)throw [...failures.values()][0].error;});},write(key,value){pending++;const task=tail.then(()=>new Promise((yes,no)=>{
    let write;try{write=db.transaction('checkpoints','readwrite',{durability:'strict'});}catch(error){no(Error('此浏览器无法启用严格恢复写入：'+error.message));return;}
    const store=write.objectStore('checkpoints'),get=store.get(key),expected=records.get(key)?.sequence||0;let problem,next;
    get.onsuccess=()=>{if(get.result&&get.result.value===value){next=get.result;return;}if((get.result?.sequence||0)!==expected){problem=Error('另一页面已更新恢复副本，请重新加载后继续');write.abort();return;}
     next={version:1,key,value,sequence:expected+1,updatedAt:Date.now()};store.put(next);};
    write.oncomplete=()=>{records.set(key,next);yes(next);};write.onabort=write.onerror=()=>no(problem||write.error||Error('恢复副本提交失败'));
   }));tail=task.then(()=>{pending--;failures.delete(key);},error=>{pending--;failures.set(key,{error,value});});return task;}});
  };
 });}
 root.GrimoireRecovery={open};
})(globalThis);
