(function(){
  'use strict';
  const form=document.getElementById('jinx-filters');
  if(!form)return;
  const query=document.getElementById('jinx-query'),group=document.getElementById('jinx-group');
  const sections=Array.from(document.querySelectorAll('.jinx-section'));
  const norm=value=>value.normalize('NFKC').toLowerCase().trim();
  const cards=Array.from(document.querySelectorAll('.jinx-card'));
  const texts=new Map(cards.map(card=>[card,norm(card.textContent)]));
  const groups=sections.map(section=>({section,cards:Array.from(section.querySelectorAll('.jinx-card'))}));
  const motion=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let timer=0,composing=false,animations=[];
  function cancelMotion(){animations.forEach(animation=>animation.cancel());animations=[];}
  function animate(element,frames,options){
    if(element.animate){const animation=element.animate(frames,options);animations.push(animation);}
  }
  function render(withMotion=true){
    clearTimeout(timer);cancelMotion();
    const enabled=withMotion&&motion&&!motion.matches;
    const visibleInViewport=card=>{const rect=card.getBoundingClientRect();return rect.bottom>0&&rect.top<window.innerHeight;};
    const previous=new Map();
    if(enabled)cards.filter(card=>!card.hidden&&visibleInViewport(card)).slice(0,12).forEach(card=>previous.set(card,card.getBoundingClientRect()));
    const words=norm(query.value).split(/\s+/).filter(Boolean);let count=0;
    groups.forEach(({section,cards:groupCards})=>{
      let shown=0;
      groupCards.forEach(card=>{
        card.hidden=!!(group.value&&group.value!==section.dataset.group)||!words.every(word=>texts.get(card).includes(word));
        if(!card.hidden)shown++;
      });
      section.hidden=shown===0;count+=shown;
    });
    const counter=document.getElementById('jinx-count'),empty=document.getElementById('jinx-empty');
    const label=`显示 ${count} / ${cards.length} 条组合`,changed=counter.textContent!==label;
    counter.textContent=label;empty.hidden=count!==0;
    if(enabled){
      cards.filter(card=>!card.hidden&&visibleInViewport(card)).slice(0,12).forEach((card,i)=>{
        const before=previous.get(card),after=card.getBoundingClientRect();
        if(before){
          const x=before.left-after.left,y=before.top-after.top;
          if(x||y)animate(card,[{transform:`translate(${Math.max(-32,Math.min(32,x))}px,${Math.max(-24,Math.min(24,y))}px)`},{transform:'translate(0,0)'}],{duration:210,easing:'cubic-bezier(.2,.7,.2,1)'});
        }else animate(card,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,delay:Math.min(i*18,90),fill:'backwards',easing:'ease-out'});
      });
      if(changed)animate(counter,[{opacity:.45},{opacity:1}],{duration:180});
      if(!count)animate(empty,[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
    }
  }
  function schedule(){clearTimeout(timer);if(!composing)timer=setTimeout(()=>render(),120);}
  form.addEventListener('submit',event=>{event.preventDefault();if(!composing)render();});
  query.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);cancelMotion();});
  query.addEventListener('compositionend',()=>{composing=false;schedule();});
  query.addEventListener('input',event=>{if(!event.isComposing)schedule();});
  group.addEventListener('change',()=>render());
  form.addEventListener('reset',()=>{clearTimeout(timer);composing=false;setTimeout(()=>render(),0);});
  if(motion&&motion.addEventListener)motion.addEventListener('change',()=>{if(motion.matches)cancelMotion();});
  document.querySelectorAll('.toc a').forEach(link=>link.addEventListener('click',()=>{
    clearTimeout(timer);query.value='';group.value='';render(false);
  }));
  render(false);
}());
