(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form=$('cert-filters'), query=$('cert-query'), level=$('cert-level'), group=$('cert-group');
  const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const records=Array.from($('cert-rows').rows).map(row=>({row,text:normalize(row.textContent),level:row.dataset.level,group:row.dataset.group}));
  let page=0, composing=false;
  function update(reset=true){
    if(reset)page=0;
    const words=normalize(query.value).split(' ').filter(Boolean);
    const matches=records.filter(r=>(!level.value||r.level===level.value)&&(!group.value||r.group===group.value)&&words.every(w=>r.text.includes(w)));
    const pages=Math.max(1,Math.ceil(matches.length/50));page=Math.min(page,pages-1);
    records.forEach(r=>r.row.hidden=true);matches.slice(page*50,(page+1)*50).forEach(r=>r.row.hidden=false);
    $('cert-count').textContent=`找到 ${matches.length} 条 / 共 ${records.length} 条记录`;
    $('cert-empty').hidden=matches.length>0;
    $('cert-page').textContent=`第 ${page+1} / ${pages} 页`;
    $('cert-prev').disabled=page===0;$('cert-next').disabled=page>=pages-1;
    document.querySelector('.cert-pagination').hidden=matches.length===0;
  }
  form.addEventListener('submit',e=>e.preventDefault());
  query.addEventListener('compositionstart',()=>composing=true);
  query.addEventListener('compositionend',()=>{composing=false;update();});
  query.addEventListener('input',()=>{if(!composing)update();});
  function syncGroups(){
    Array.from(group.options).forEach(o=>{o.hidden=!!(o.value&&level.value&&o.dataset.level!==level.value);o.disabled=o.hidden;});
    if(group.selectedOptions[0]?.disabled)group.value='';
  }
  level.addEventListener('change',()=>{syncGroups();update();});
  group.addEventListener('change',()=>update());
  form.addEventListener('reset',()=>setTimeout(()=>{syncGroups();update();},0));
  $('cert-prev').addEventListener('click',()=>{page--;update(false);});
  $('cert-next').addEventListener('click',()=>{page++;update(false);});
  update();
})();
