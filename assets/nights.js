(function(){
 'use strict';
 const form=document.getElementById('night-controls');if(!form)return;
 const query=document.getElementById('night-query'),scope=document.getElementById('night-scope');
 const tabs=Array.from(form.querySelectorAll('[data-night]')),sections=Array.from(document.querySelectorAll('.night-section'));
 const normalize=value=>value.normalize('NFKC').toLowerCase().trim();
 const groups=sections.map(section=>({section,rows:Array.from(section.querySelectorAll('.night-row')).map(row=>({row,name:normalize(row.dataset.name),text:normalize(row.textContent)}))}));
 let view='0',composing=false;
 function render(){
  const words=normalize(query.value).split(/\s+/).filter(Boolean);let shown=0,total=0;
  groups.forEach(({section,rows})=>{
   const active=view==='all'||section.dataset.night===view;section.hidden=!active;
   rows.forEach(({row,name,text})=>{row.hidden=!words.every(word=>(scope.value==='name'?name:text).includes(word));if(active){total++;if(!row.hidden)shown++;}});
  });
  tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.night===view)));
  document.querySelector('.night-columns').classList.toggle('is-comparing',view==='all');
  document.getElementById('night-count').textContent=`显示 ${shown} / ${total} 项行动`;
  document.getElementById('night-empty').hidden=shown!==0;
 }
 function fromHash(){let hash='';try{hash=decodeURIComponent(location.hash.slice(1))}catch(_){}const index=sections.findIndex(section=>Array.from(section.querySelectorAll('[id]')).some(el=>el.id===hash));if(index>=0)view=String(index);render();}
 tabs.forEach(tab=>tab.addEventListener('click',()=>{view=tab.dataset.night;render();}));
 query.addEventListener('compositionstart',()=>composing=true);query.addEventListener('compositionend',()=>{composing=false;render();});
 query.addEventListener('input',()=>{if(!composing)render();});scope.addEventListener('change',render);
 form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('reset',()=>setTimeout(render,0));
 window.addEventListener('hashchange',fromHash);fromHash();
}());
